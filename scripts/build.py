#!/usr/bin/env python3
"""Generate the per-harness files of this repository; scripts/install.sh calls it.

  build.py roles <out> [harness ...]     write <out>/<harness>/agents/ from roles/
  build.py unblock <file> <name>         remove the generated block <name> from <file>

Standard library only, Python 3.9.
"""

import json
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
# Loaded into Pi subagents, which load no extensions of their own in the foreground, so
# that they get the rules too.
PI_RULES_PACKAGE = "npm:@jordyvanvorselen/pi-claude-rules@0.1.4"

# The neutral tool groups of a role, per harness. `all` omits the tool list.
CLAUDE_TOOLS = {
    "read": ["Read"],
    "search": ["Grep", "Glob"],
    "commands": ["Bash"],
    "web": ["WebFetch", "WebSearch"],
    "edit": ["Edit", "Write"],
}
PI_TOOLS = {
    "read": ["read"],
    "search": ["grep", "find", "ls"],
    "commands": ["bash"],
    "web": ["web_search", "fetch_content", "get_search_content"],
    "edit": ["edit", "write"],
}
PI_DIR = Path(os.environ.get("PI_CODING_AGENT_DIR", Path.home() / ".pi/agent")).expanduser()
# Optional, git-ignored: {"<harness>": {"<tier>": "<model>"}}. A tier without an entry
# runs on the session's model.
MODELS_FILE = REPO / "models.local.json"


def pi_has_web_tools():
    try:
        settings = json.loads((PI_DIR / "settings.json").read_text())
    except (OSError, ValueError):
        return False
    return any("pi-web-access" in str(package) for package in settings.get("packages", []))


def split_front_matter(text):
    match = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    if not match:
        return {}, text
    front, body = match.groups()
    fields = {}
    key = None
    for line in front.splitlines():
        if line.startswith("  - ") and key:
            fields.setdefault(key, []).append(line[4:].strip().strip('"'))
        elif ":" in line:
            key, value = line.split(":", 1)
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] == '"':
                value = json.loads(value)
            fields[key.strip()] = value or []
    return fields, body


def load_roles():
    roles = []
    for path in sorted((REPO / "roles").glob("*.md")):
        fields, body = split_front_matter(path.read_text())
        tools = [tool.strip() for tool in fields["tools"].split(",")]
        roles.append({**fields, "tools": tools, "body": body.lstrip("\n"), "file": path.name})
    return roles


def quote(text):
    return json.dumps(text, ensure_ascii=False)


def claude_role(role, model):
    lines = ["---", f"name: {role['name']}", f"description: {quote(role['description'])}"]
    if role["tools"] != ["all"]:
        tools = [name for group in role["tools"] for name in CLAUDE_TOOLS[group]]
        lines.append(f"tools: {', '.join(tools)}")
    lines += [f"model: {model or 'inherit'}", f"effort: {role['effort']}", "---", "", role["body"]]
    return "\n".join(lines)


def pi_role(role, model):
    lines = ["---", f"name: {role['name']}", f"description: {quote(role['description'])}"]
    if role["tools"] != ["all"]:
        groups = list(role["tools"])
        if "web" in groups and not pi_has_web_tools():
            print(f"pi: {role['name']}: pi-web-access is not installed, so no web tools",
                  file=sys.stderr)
            groups.remove("web")
        if "web" in groups:
            # Only a background child loads the installed extensions, pi-web-access among them.
            lines.append("async: true")
        tools = [name for group in groups for name in PI_TOOLS[group]]
        lines.append(f"tools: {', '.join(tools)}")
    if model:
        lines.append(f"model: {model}")
    lines += [
        f"subagentOnlyExtensions: {PI_RULES_PACKAGE}",
        f"thinking: {role['effort']}",
        "inheritProjectContext: true",
        "inheritSkills: false",
        "---",
        "",
        role["body"],
    ]
    return "\n".join(lines)


def codex_role(role, model):
    body = role["body"]
    if "'''" in body:
        raise SystemExit(f"{role['file']}: ''' cannot go into a TOML literal string")
    if "edit" not in role["tools"] and role["tools"] != ["all"]:
        # Codex has no per-agent tool list; the sandbox is the parent's.
        body = "Change no file.\n\n" + body
    lines = [f"name = {quote(role['name'])}", f"description = {quote(role['description'])}"]
    if model:
        lines.append(f"model = {quote(model)}")
    lines += [
        f"model_reasoning_effort = {quote(role['effort'])}",
        f"developer_instructions = '''\n{body}'''",
        "",
    ]
    return "\n".join(lines)


HARNESSES = {
    "claude": (claude_role, ".md"),
    "codex": (codex_role, ".toml"),
    "pi": (pi_role, ".md"),
}


def build_roles(out, selected):
    models = json.loads(MODELS_FILE.read_text()) if MODELS_FILE.exists() else {}
    roles = load_roles()
    for harness, (render, suffix) in HARNESSES.items():
        if selected and harness not in selected:
            continue
        directory = Path(out) / harness / "agents"
        directory.mkdir(parents=True, exist_ok=True)
        for stale in directory.iterdir():
            stale.unlink()
        for role in roles:
            text = render(role, models.get(harness, {}).get(role["tier"]))
            (directory / (role["name"] + suffix)).write_text(text)


def remove_block(file, name):
    path = Path(file).expanduser()
    if not path.exists():
        return
    begin = f"<!-- BEGIN {name}: generated by ~/agents/scripts, do not edit -->"
    end = f"<!-- END {name} -->"
    text = path.read_text()
    pattern = re.compile(r"\n*" + re.escape(begin) + r".*?" + re.escape(end) + r"\n?", re.S)
    updated = pattern.sub("\n", text).strip("\n")
    updated = updated + "\n" if updated else ""
    if updated != text:
        path.write_text(updated)
        print(f"remove block {name} from {path}")


def main(argv):
    command, args = argv[0], argv[1:]
    if command == "roles":
        build_roles(args[0], args[1:])
    elif command == "unblock":
        remove_block(args[0], args[1])
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
