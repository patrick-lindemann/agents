---
name: setup
description: "Link the shared rules into a project by kind, and bring its AGENTS.md, CLAUDE.md and tool settings in line; on a project already set up, bring it up to date."
argument-hint: "[module ...]"
disable-model-invocation: true
---

Set up the current project for the shared rules in `~/agents/rules/`: link the modules
that fit its kind into `.claude/rules/`, and check the project files the rules rely on.
The rules are linked, never copied, so that they follow every change in `~/agents`.

If `.claude/rules/` already holds links into `~/agents`, the project is set up: run in
update mode and propose only what changed since, such as new modules, new skills or
changed templates. Run it again to add or remove modules.

Arguments: the modules to link. Without them, propose modules from the project.

The scripts are in the repository that holds this skill, `"$(realpath
~/.claude/skills/setup)/../.."`: `scripts/install.sh` links the skills and agents, and
`scripts/link-rules.sh` links the modules. Its `--list` lists the modules. `core.md`
and `python.md` are always linked; the user-level rules are never linked here.

## Steps

1. **Skills.** Run `scripts/install.sh`, so that skills and agents added to
   `~/agents` since are linked. Done when it has run; report the links it added or
   removed.

2. **Modules.** Read `pyproject.toml`, the layout and `.claude/rules/`, and propose a
   module per kind of code the project has:

   | Module | When the project has |
   |---|---|
   | `tests` | a `tests/` folder or pytest |
   | `arrays` | NumPy or PyTorch arrays, jaxtyping |
   | `pytorch` | `torch` |
   | `numerics` | modules that implement mathematics: groups, solvers, integrators |
   | `library` | a package that other projects import |
   | `experiments` | config-driven runs that write data and results |
   | `cli` | `scripts/`, `[project.scripts]` or `__main__.py` |
   | `web` | a web framework: FastAPI, Flask, Django, aiohttp |

   In update mode, start from the linked modules and propose only the changes: a module
   in `--list` that fits but is not linked, and a link whose module no longer exists.
   Ask the user to confirm the list in one question, with each module's evidence; in
   update mode with no change, skip the question. Done when the user has confirmed the
   modules, or there is no change.

3. **Link.** Run `scripts/link-rules.sh` with the project root and the confirmed
   modules. It removes links to modules no longer given or no longer existing, and keeps
   the links out of git through `.git/info/exclude`. Done when its output lists every
   module and `git status` shows no `.claude/rules/` entries.

4. **AGENTS.md.** Compare the project's `AGENTS.md` with
   `~/.claude/skills/setup/templates/AGENTS.md`. The rules refer to its slots:
   commands, invariants, protected, off-limits, legacy and stable paths, whether the
   agent commits, and how the project releases. Propose what to fill in from the code, and move into "Project rules"
   what the shared rules do not cover; drop what they now say. Make `CLAUDE.md` contain
   only `@AGENTS.md`, after moving any other content of it into `AGENTS.md`. Done when
   the user has agreed to the edits and they are applied, or there is no difference.

5. **Tool settings.** Compare `pyproject.toml` with
   `~/.claude/skills/setup/templates/pyproject-tools.toml`. The shared rules
   leave out what these settings enforce, so a missing ruff rule or type checker option
   drops a convention silently. Propose the missing settings, keeping the project's own
   where they are stricter, and run ruff and the type checker once to show what the
   change reports. Fix nothing it reports without the user's agreement. Done when the
   user has agreed to or rejected each setting, or there is no difference.

6. **Approval.** On the first setup only, tell the user that the linked rules load only
   after they approve external imports in the dialog at the start of the next
   interactive session in this project; until then, and in `claude -p` runs before that
   approval, they are skipped silently. Suggest `/memory` in that session to see them
   loaded. Done when this is in the chat, or in update mode.

Report the linked modules, the edits made, and what was rejected or left open; in
update mode, also what was already up to date.
