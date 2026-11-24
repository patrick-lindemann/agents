from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from collections.abc import Mapping, Sequence
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryFile

_CLAUDE_EDIT_TOOLS = frozenset({"Edit", "MultiEdit", "Write"})
_PATCH_TARGET = re.compile(r"^\*\*\* (?:Update|Add) File: ([^\r\n]+)(?:\r?\n\*\*\* Move to: ([^\r\n]+))?", re.MULTILINE)
_PATCH_SUCCESS = re.compile(r"^Success\. Updated the following files:\r?$", re.MULTILINE)
_OUTPUT_LIMIT = 8000
_CHECK_TIMEOUT = 5
_PYTHON_SUFFIXES = frozenset({".py", ".pyi"})


@dataclass(frozen=True)
class _Checker:
    name: str
    suffixes: frozenset[str]
    config_names: tuple[str, ...]
    bin_dir: Path
    commands: tuple[tuple[str, ...], ...]
    table: re.Pattern[str] | None = None


_CHECKERS = (
    _Checker(
        "biome",
        frozenset({".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"}),
        ("biome.json", "biome.jsonc"),
        Path("node_modules/.bin"),
        (("check", "--colors=off", "--error-on-warnings", "--no-errors-on-unmatched"),),
    ),
    _Checker(
        "ruff",
        _PYTHON_SUFFIXES,
        ("ruff.toml", ".ruff.toml"),
        Path(".venv/bin"),
        (
            (
                "check",
                "--no-fix",
                "--no-fix-only",
                "--force-exclude",
                "--no-cache",
                "--output-format=concise",
            ),
            ("format", "--check", "--force-exclude", "--no-cache"),
        ),
        table=re.compile(r"^\s*\[\s*tool\.ruff\s*(?:\]|\.)", re.MULTILINE),
    ),
    _Checker(
        "ty",
        _PYTHON_SUFFIXES,
        ("ty.toml",),
        Path(".venv/bin"),
        (("check", "--force-exclude", "--error-on-warning", "--color=never", "--output-format=concise"),),
        table=re.compile(r"^\s*\[\s*tool\.ty\s*(?:\]|\.)", re.MULTILINE),
    ),
)


@dataclass(frozen=True)
class _Check:
    label: str
    command: tuple[str, ...]
    root: Path


class Arguments(argparse.Namespace):
    harness: str
    paths: list[str]


def get_args() -> Arguments:
    """Read the harness and, for Pi, the edited paths."""
    parser = argparse.ArgumentParser(description="Report project checks for edited files.")
    parser.add_argument("harness", choices=("claude", "codex", "pi"))
    parser.add_argument("paths", nargs="*", help="edited paths from Pi")
    return parser.parse_args(namespace=Arguments())


def main() -> None:
    """Send diagnostics in the selected harness's output format."""
    args = get_args()
    try:
        if args.harness == "pi":
            report = _check_files(Path.cwd(), args.paths, allow_project_binaries=True)
            if report:
                print(report)
        else:
            event = json.load(sys.stdin)
            if not isinstance(event, dict) or event.get("hook_event_name") != "PostToolUse":
                return
            cwd = event.get("cwd")
            paths = _get_hook_paths(event, args.harness)
            if not isinstance(cwd, str) or not paths:
                return
            report = _check_files(Path(cwd), paths)
            if report:
                print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": report}}))
    except (OSError, ValueError) as error:
        print(f"Cannot run post-edit checks: {error}.", file=sys.stderr)
        raise SystemExit(1) from None


def _get_hook_paths(event: Mapping[str, object], harness: str) -> list[str]:
    tool_input = event.get("tool_input")
    if not isinstance(tool_input, dict):
        return []
    tool = event.get("tool_name")
    if harness == "claude" and isinstance(tool, str) and tool in _CLAUDE_EDIT_TOOLS:
        file_path = tool_input.get("file_path")
        return [file_path] if isinstance(file_path, str) else []
    if harness == "codex" and tool == "apply_patch":
        patch = tool_input.get("command")
        response = event.get("tool_response")
        if isinstance(patch, str) and isinstance(response, str) and _PATCH_SUCCESS.search(response):
            # The success summary names the original path for a move.
            return [(destination or original).strip() for original, destination in _PATCH_TARGET.findall(patch)]
    return []


def _check_files(workspace: Path, paths: Sequence[str], allow_project_binaries: bool = False) -> str:
    workspace = workspace.resolve(strict=True)
    path_dirs = [Path(entry) for entry in os.get_exec_path() if Path(entry).is_absolute()]
    groups: dict[tuple[_Checker, Path], list[str]] = {}
    seen: set[Path] = set()
    for path in paths:
        checker_candidates = [checker for checker in _CHECKERS if Path(path).suffix in checker.suffixes]
        if not checker_candidates:
            continue
        file_path = (workspace / path).resolve()
        if file_path in seen or not file_path.is_relative_to(workspace) or not file_path.is_file():
            continue
        seen.add(file_path)
        for checker in checker_candidates:
            root = _find_config_root(workspace, file_path, checker)
            if root is not None:
                groups.setdefault((checker, root), []).append(str(file_path.relative_to(root)))

    diagnostics = []
    checks = []
    for (checker, root), files in groups.items():
        dirs = [root / checker.bin_dir, *path_dirs] if allow_project_binaries else path_dirs
        binary = next((found for directory in dirs if (found := shutil.which(str(directory / checker.name)))), None)
        if binary is None:
            diagnostics.append(f"Cannot find `{checker.name}` for `{root.relative_to(workspace)}`. Put it on PATH.")
            continue
        for args in checker.commands:
            label = f"{checker.name} {args[0]}{' --check' if '--check' in args else ''}"
            checks.append(_Check(label, (binary, *args, "--", *files), root))
    if checks:
        # Run the commands concurrently so that one slow checker does not delay the others.
        with ThreadPoolExecutor() as executor:
            diagnostics.extend(result for result in executor.map(_run_check, checks) if result)
    text = "\n\n".join(diagnostics)
    if len(text) > _OUTPUT_LIMIT:
        text = f"{text[:_OUTPUT_LIMIT]}\n[Diagnostics truncated.]"
    return f"Post-edit checks:\n{text}" if text else ""


def _find_config_root(workspace: Path, file_path: Path, checker: _Checker) -> Path | None:
    for root in file_path.parents:
        if any((root / name).is_file() for name in checker.config_names):
            return root
        pyproject = root / "pyproject.toml"
        if checker.table is not None and pyproject.is_file():
            text = pyproject.read_text(encoding="utf-8")
            if checker.table.search(text):
                return root
        if root == workspace:
            break
    return None


def _run_check(check: _Check) -> str:
    with TemporaryFile() as output:
        try:
            result = subprocess.run(
                check.command,
                cwd=check.root,
                env={**os.environ, "NO_COLOR": "1"},
                stdout=output,
                stderr=subprocess.STDOUT,
                timeout=_CHECK_TIMEOUT,
                check=False,
            )
            if result.returncode == 0:
                return ""
            status = f"exit {result.returncode}"
        except subprocess.TimeoutExpired:
            status = "timed out"
        except OSError as error:
            return f"Cannot run `{check.label}` in `{check.root}`: {error}."
        output.seek(0)
        data = output.read(_OUTPUT_LIMIT + 1)
    text = data[:_OUTPUT_LIMIT].decode("utf-8", errors="replace").strip()
    if len(data) > _OUTPUT_LIMIT:
        text = f"{text}\n[Diagnostics truncated.]"
    return f"{check.label} ({status}) in {check.root}:" + (f"\n{text}" if text else "")


if __name__ == "__main__":
    main()
