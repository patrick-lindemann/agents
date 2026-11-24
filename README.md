# Agents

## Post-edit checks

Run `bash ~/agents/scripts/install.sh` once per machine, then restart the harnesses.
In Codex, review and trust the new hook in `/hooks`. In Pi, `/reload` also works.

- Pi: Collects files from successful `edit` and `write` calls in trusted workspaces.
  It checks them together as the agent finishes. Diagnostics can trigger one extra response.
- Claude Code: Checks after each `Edit`, `MultiEdit`, or `Write` call.
- Codex: Checks after each `apply_patch` call, including patches that edit multiple files.

The hooks report diagnostics to the agent. They do not change files, install tools, or check shell edits.

- TypeScript and JavaScript: `biome check` for `biome.json` or `biome.jsonc`.
- Python: `ruff check` and `ruff format --check` for Ruff config, and `ty check` for ty config.
  The hooks recognize `ruff.toml`, `.ruff.toml`, `ty.toml`, and the corresponding `pyproject.toml` tables.

The hooks use the nearest config within the workspace. Files without a matching config are skipped.
Claude Code and Codex use tools on `PATH` because their global hooks can run outside trusted workspaces.
For a trusted project, add its `node_modules/.bin` to `PATH` or activate its Python environment before launch.
Pi first tries `node_modules/.bin` or `.venv/bin` beside the config, then tries `PATH`.
Keep your full project checks for issues across files.
