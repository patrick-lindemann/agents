# <project>

<What it is, in one sentence.> Python <version>, uv<, PyTorch>.

## Commands
- Format and lint changed files: `uv run ruff format <paths>`, `uv run ruff check --fix <paths>`
- Type check: `uv run <pyright | mypy | ty check>`
- Test: `uv run pytest` (fast: `uv run pytest -m "not slow"`)

## Layout
- <areas of the package, one line each, only what the code does not make obvious>

## Facts
- Invariants, not re-checked: <…>
- Protected: <data/, outputs/, third_party/, …>. Off limits: <…>. Legacy, not a model: <…>.
  Stable, minimal wiring only: <…>
- Formats: <…>
- Git: <the agent commits each work package | the agent does not commit>; <branch model>

## Project rules
- <conventions of this project only, and overrides of the shared rules>

## Shared rules
`.claude/rules/` links the shared rules from `~/agents/rules/`. This file overrides
them. Agents that do not load `.claude/rules/` read `core.md` and `python.md` there
first, then the other linked modules.
