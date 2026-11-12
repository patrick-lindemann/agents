---
name: setup
description: "Bring a project's AGENTS.md, CLAUDE.md and tool settings in line with the shared rules; on a project already set up, bring them up to date."
argument-hint: ""
metadata:
  short-description: "Link the shared rules into a project, or update them"
disable-model-invocation: true
---

Set up the current project for the shared rules in `~/agents/rules/`. The rules need no
setup: every harness loads `shared/common.md` always and the other rules when a matching file
is read or edited. This skill checks the project files the rules rely on.

## Steps

1. **AGENTS.md.** Compare the project's `AGENTS.md` with
   `~/agents/skills/setup/templates/AGENTS.md`. The rules refer to its slots:
   commands, invariants, protected, off-limits, legacy and stable paths, whether the
   agent commits, and how the project releases. Propose what to fill in from the code, and
   move into "Project rules" what the shared rules do not cover; drop what they now say.
   Remove a `shared-rules` block and links in `.claude/rules/` into `~/agents` that an
   older setup left. Make `CLAUDE.md` contain only `@AGENTS.md`, after moving any other
   content of it into `AGENTS.md`, so that Claude Code reads the same file. Done when the
   user has agreed to the edits and they are applied, or there is no difference.

2. **Tool settings.** For a Python project, compare `pyproject.toml` with
   `~/agents/skills/setup/templates/pyproject-tools.toml`. The shared rules leave out
   what these settings enforce, so a missing ruff rule or type checker option drops a
   convention silently. Propose the missing settings, keeping the project's own where
   they are stricter, and run ruff and the type checker once to show what the change
   reports. Fix nothing it reports without the user's agreement. Done when the user has
   agreed to or rejected each setting, or there is no difference.

Report the edits made, and what was rejected or left open.
