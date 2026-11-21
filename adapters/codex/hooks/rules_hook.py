#!/usr/bin/env python3
from __future__ import annotations

import fnmatch
import hashlib
import json
import os
import re
import sys
import traceback
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

_RULES_DIR = Path(os.environ.get("AGENTS_RULES_DIR", Path.home() / "agents" / "rules"))
_STATE_DIR = Path(os.environ.get("XDG_STATE_HOME", Path.home() / ".local" / "state")) / "agents-rules" / "codex"
_PATCH_HEADER = re.compile(r"^\*\*\* (?:Add|Update) File: (.+)$|^\*\*\* Move to: (.+)$", re.MULTILINE)
_WORD = re.compile(r"\"((?:[^\"\\]|\\.)*)\"|'([^']*)'|([^\s\"'|;&<>()]+)")
_REDIRECT_TARGET = re.compile(r"(?:^|[^<>&0-9])[0-9]*>{1,2}\|?\s*(\"[^\"]+\"|'[^']+'|[^\s|;&<>()]+)")
_URL = re.compile(r"[a-z]+://", re.IGNORECASE)


@dataclass(frozen=True)
class _Rule:
    file_path: Path
    globs: tuple[str, ...]
    body: str


def main() -> None:
    """Run the hook named by the first argument on the Codex event read from stdin.

    `session-start` gives the rules without `paths:`. `pre-tool-use` blocks the first
    `apply_patch` or shell command on a file that a rule's `paths:` matches, and gives
    that rule. Each rule is given once per session and subagent, and again after a
    compaction.
    """
    try:
        _run(sys.argv[1] if len(sys.argv) > 1 else "")
    # Any error lets the tool call through and is logged, so that a broken hook never
    # stops Codex.
    except Exception:  # noqa: BLE001
        _log_error(traceback.format_exc())


def _run(mode: str) -> None:
    event = json.loads(sys.stdin.buffer.read())
    # Subagents share the session id of their parent, so their own id or transcript keys
    # them apart where Codex sends one.
    agent = event.get("agent_id")
    key = "\0".join(
        _to_text(value)
        for value in (event.get("session_id"), agent if agent is not None else event.get("transcript_path"))
    )
    state_file = _STATE_DIR / f"{hashlib.sha256(key.encode()).hexdigest()[:32]}.json"

    if mode == "session-start":
        # A compacted or cleared session has lost the rules it was given.
        if event.get("source") in ("compact", "clear"):
            state_file.unlink(missing_ok=True)
        rules = [rule for rule in _load_rules() if not rule.globs]
        event_name = "SubagentStart" if event.get("hook_event_name") == "SubagentStart" else "SessionStart"
        _write_output({"hookSpecificOutput": {"hookEventName": event_name, "additionalContext": _format_rules(rules)}})
        return
    if mode != "pre-tool-use":
        return

    tool_input = event.get("tool_input")
    command = tool_input.get("command") if isinstance(tool_input, dict) else None
    if not isinstance(command, str):
        return
    root = os.path.abspath(event["cwd"])
    targets = (
        _find_patch_targets(command, root)
        if event.get("tool_name") == "apply_patch"
        else _find_shell_targets(command, root)
    )
    if not targets:
        return

    delivered = dict.fromkeys(_load_delivered(state_file))
    due = [
        rule
        for rule in _load_rules()
        if rule.globs
        and str(rule.file_path) not in delivered
        and any(_matches(target, root, glob) for target in targets for glob in rule.globs)
    ]
    if not due:
        return
    for rule in due:
        delivered[str(rule.file_path)] = None
    _STATE_DIR.mkdir(parents=True, exist_ok=True)
    state_file.write_text(json.dumps(list(delivered), separators=(",", ":")), encoding="utf-8")

    names = ", ".join(os.path.relpath(rule.file_path, _RULES_DIR) for rule in due)
    # The rules go in `additionalContext`, not in the reason, since Codex shortens a reason
    # above about 2,500 tokens, while hooks.json raises the limit for context.
    _write_output(
        {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": (
                    f"Not run: the rules for these files ({names}) are now in your context. "
                    "Follow them and run the same call again."
                ),
                "additionalContext": _format_rules(due),
            }
        }
    )


def _find_patch_targets(patch: str, root: str) -> list[str]:
    targets = []
    for match in _PATCH_HEADER.finditer(patch):
        header = match.group(1) if match.group(1) is not None else match.group(2)
        targets.append(_resolve(root, header.strip()))
    return targets


def _find_shell_targets(command: str, root: str) -> list[str]:
    """Find every word of `command` that names an existing file, and every redirection target.

    A redirection target may be a file the command creates. The command is not parsed, so
    a path built at run time (`$dir/a.py`) is missed.
    """
    targets: dict[str, None] = {}
    for match in _REDIRECT_TARGET.finditer(command):
        word = _unquote(match.group(1))
        if not word.startswith("&") and not word.startswith("/dev/"):
            targets[_resolve(root, word)] = None
    for match in _WORD.finditer(command):
        word = next((group for group in match.groups() if group is not None), "")
        if not word or word.startswith("-") or "$" in word or _URL.match(word):
            continue
        target = _resolve(root, word)
        if os.path.isfile(target):
            targets[target] = None
    return list(targets)


def _resolve(root: str, path: str) -> str:
    # Resolved lexically, without following symlinks, so that a path keeps the place under
    # the working directory that it was written with.
    return os.path.normpath(os.path.join(root, path))


def _matches(target: str, root: str, glob: str) -> bool:
    """Tell whether `glob` matches `target` relative to `root`, as Claude Code does for user-level rules."""
    relative = os.path.relpath(target, root)
    if relative == "." or relative.startswith("..") or os.path.isabs(relative):
        return False
    parts = relative.split("/")
    return any(_match_parts(parts, pattern.split("/")) for pattern in _expand_braces(glob))


def _match_parts(parts: Sequence[str], patterns: Sequence[str]) -> bool:
    if not patterns:
        return not parts
    if patterns[0] == "**":
        # A `**` skips no part that starts with a dot. A trailing one matches at least one
        # part, so that `docs/**` does not match `docs`.
        if len(patterns) == 1:
            return bool(parts) and not any(part.startswith(".") for part in parts)
        if _match_parts(parts, patterns[1:]):
            return True
        return bool(parts) and not parts[0].startswith(".") and _match_parts(parts[1:], patterns)
    return bool(parts) and _match_part(parts[0], patterns[0]) and _match_parts(parts[1:], patterns[1:])


def _match_part(part: str, pattern: str) -> bool:
    # A wildcard does not match a leading dot, as in a shell.
    if part.startswith(".") and not pattern.startswith("."):
        return False
    return fnmatch.fnmatchcase(part, pattern)


def _expand_braces(glob: str) -> list[str]:
    """Expand the first brace group of `glob` with a comma, recursively: `*.{py,pyi}`."""
    depth = 0
    start = 0
    for index, char in enumerate(glob):
        if char == "{":
            if depth == 0:
                start = index
            depth += 1
        elif char == "}" and depth > 0:
            depth -= 1
            options = _split_options(glob[start + 1 : index]) if depth == 0 else []
            if len(options) > 1:
                prefix, suffix = glob[:start], glob[index + 1 :]
                return [expanded for option in options for expanded in _expand_braces(prefix + option + suffix)]
    return [glob]


def _split_options(text: str) -> list[str]:
    options = []
    depth = 0
    start = 0
    for index, char in enumerate(text):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
        elif char == "," and depth == 0:
            options.append(text[start:index])
            start = index + 1
    options.append(text[start:])
    return options


def _load_rules() -> list[_Rule]:
    return [_load_rule(file_path) for file_path in _list_rule_files(_RULES_DIR, set())]


def _list_rule_files(directory: Path, seen: set[Path]) -> list[Path]:
    real_dir = directory.resolve()
    if real_dir in seen:
        return []
    seen.add(real_dir)
    files = []
    for name in sorted(os.listdir(directory)):
        path = directory / name
        if path.is_dir():
            files += _list_rule_files(path, seen)
        elif path.is_file() and name.endswith(".md"):
            files.append(path)
    return files


def _load_rule(file_path: Path) -> _Rule:
    """Read a rule and the `paths:` list of its frontmatter.

    It reads the two forms Claude Code accepts: a block list of quoted or bare globs, or
    one glob on the same line.
    """
    text = file_path.read_text(encoding="utf-8")
    match = re.match(r"---\n(.*?)\n---\n?", text, flags=re.DOTALL)
    if match is None:
        return _Rule(file_path, (), text)
    globs = []
    is_in_paths = False
    for line in match.group(1).split("\n"):
        key = re.fullmatch(r"([A-Za-z0-9_]+):\s*(.*)", line)
        if key:
            is_in_paths = key.group(1) == "paths"
            if is_in_paths and key.group(2):
                globs.append(_unquote(key.group(2)))
        elif is_in_paths and (item := re.match(r"\s+-\s+", line)):
            globs.append(_unquote(line[item.end() :]))
    body = re.sub(r"<!--.*?-->\n*", "", text[match.end() :], flags=re.DOTALL)
    return _Rule(file_path, tuple(globs), body)


def _format_rules(rules: Iterable[_Rule]) -> str:
    return "\n\n".join(f'<rule file="{rule.file_path}">\n{rule.body.strip()}\n</rule>' for rule in rules)


def _load_delivered(state_file: Path) -> list[str]:
    try:
        return json.loads(state_file.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []


def _unquote(value: str) -> str:
    stripped = value.strip()
    match = re.fullmatch(r"([\"'])(.*)\1", stripped)
    return match.group(2) if match else stripped


def _to_text(value: object) -> str:
    return "" if value is None else str(value)


def _write_output(output: dict[str, object]) -> None:
    sys.stdout.write(json.dumps(output, separators=(",", ":")))


def _log_error(text: str) -> None:
    timestamp = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    # Logging is best effort, since the hook must never fail.
    try:
        _STATE_DIR.mkdir(parents=True, exist_ok=True)
        with (_STATE_DIR / "errors.log").open("a", encoding="utf-8") as log:
            log.write(f"{timestamp} {text.rstrip()}\n")
    except OSError:
        pass


if __name__ == "__main__":
    main()
