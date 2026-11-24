# agents

Coding rules, skills and subagent roles for Claude Code, Codex and Pi. The harnesses
link to this repository, so changes here apply everywhere.

## Install

Requires Python 3.10 or newer, standard library only.

```sh
git clone git@github.com:patrick-lindemann/agents.git ~/agents
~/agents/scripts/install.py
```

By default, the script installs for every harness whose command is on `PATH` or whose
config directory exists; `--harness claude,codex,pi` selects them explicitly. It
installs git hooks that rerun it after every pull. Rerun it manually after adding,
removing or renaming a skill or a role, or after changing a role or a skill's
frontmatter; rule changes need no reinstall. Roles run on the session's model; to pin a
tier to a model on one machine, add it to the git-ignored `models.local.json`, for
example `{"claude": {"cheap": "haiku"}}`, and rerun the script.

## Post-edit checks

Rerun `~/agents/scripts/install.py` to register the checks. In Codex, trust the new
hook with `/hooks`. Restart the harnesses, or use `/reload` in Pi.

- Pi batches files from successful `edit` and `write` calls in trusted workspaces.
  It checks them as the agent finishes. Diagnostics can trigger one extra response.
- Claude Code checks after each `Edit`, `MultiEdit`, or `Write` call.
- Codex checks the files from each successful `apply_patch` call.

The checks do not fix files, install tools, or check shell edits. Each tool uses its
nearest config directory within the workspace:

- Biome checks TypeScript and JavaScript if it finds `biome.json` or `biome.jsonc`.
- Ruff checks Python lint and formatting if it finds `ruff.toml`, `.ruff.toml`, or
  a `[tool.ruff]` table in `pyproject.toml`.
- ty checks Python types if it finds `ty.toml` or a `[tool.ty]` table in `pyproject.toml`.

Claude Code and Codex look for tools on `PATH`. Pi first looks beside the config in
`node_modules/.bin` or `.venv/bin`, then on `PATH`. Keep your full project checks for
issues that span files.

## Rules

Rules are in `rules/shared/` and `rules/python/`. `shared/common.md` loads in every
session. The other files load when the agent reads or edits a file that matches their
`paths:` frontmatter. The `setup` skill aligns a project's `AGENTS.md`, `CLAUDE.md` and tool settings with
the rules.

## Skills

Invoked with `/<name>` in Claude Code, `$<name>` in Codex and `/skill:<name>` in Pi.

| Skill | Purpose |
|---|---|
| `spec` | Plan work as a spec in `specs/` |
| `workplan` | Split an approved spec into work packages |
| `implement` | Implement an approved spec, review it, report |
| `revise` | Turn review notes into fixes and rules |
| `spike` | Try a design as a throwaway patch and measure it |
| `release` | Prepare a release |
| `setup` | Set up or update a project for the rules |
| `explain` | Explain an answer, plan, code or session |
| `handover` | Write a prompt for a fresh agent to continue from |

`review`, `research` and `save` can also be invoked by the model. Subagent roles are
defined in `roles/`; see [skills/README.md](skills/README.md) for
roles, tiers and per-harness details.

## Scripts

`scripts/install.py` replaces only links and files it created and skips anything else.
It:

- Links the skills into `~/.agents/skills/` and `~/.claude/skills/`.
- Builds the roles into `dist/` (git-ignored). It links them into `~/.claude/agents/`
  and `~/.pi/agent/agents/`, and copies them into `~/.codex/agents/`, since Codex
  cannot start linked agents.
- Links `rules/` to `~/.claude/rules/agents`. Claude Code loads the rules from there.
  Pi loads them through `adapters/pi/`. Codex loads them through the hook
  `adapters/codex/hooks/rules_hook.py`, which blocks the first edit of a matching file
  until its rules are loaded. Codex runs the hook only after it is trusted with `/hooks`.
- Writes `skills/*/agents/openai.yaml`, which marks user-invoked skills for Codex. These
  files are committed so that a fresh clone works before the first install. Commit them
  when they change.
- Links `~/agents` to the checkout.

The Pi extensions use TypeScript and run on Pi's Node.js. Everything else is Python.
