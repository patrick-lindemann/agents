# Core

- Precedence: the user, the project's `AGENTS.md`, these rules, the surrounding code.
  A module for a kind of code (arrays, numerics, cli …) overrides `python.md`. Report
  a conflict within one level instead of choosing.

## Scope
- Build on the existing code and its style; new code follows these rules even where
  old code does not. Mention, don't change, what lies outside the task.
- Make no unrequested refactors, renames, aliases or deprecation paths; keep the user's
  unrelated changes.
- Port a reference faithfully, edge cases included; propose a deviation first and
  document it.

## Minimal code
- Add a helper, wrapper or class only for shared behavior or substantial duplication:
  no `_get_name(user)` for `user.name`.
- Select behavior by an explicit parameter or mapping, not by naming conventions (keys
  ending in `_path`).
- Write nothing for a caller that does not exist yet; delete code that loses its last
  caller, with its tests; except public API that a library ships.
- Put code in the layer that owns its concept; fix a quantity where it is misapplied.
- Don't model code on what the user calls a poor fit or `AGENTS.md` marks legacy. Never
  import, run or copy from an off-limits folder, not even for fixtures.

## Validation
- Validate only where existing code requires it or at a boundary: files, configs,
  command-line and network input, a library's public API. Use the project's validators.
- Don't re-check documented shapes and ranges, the invariants in `AGENTS.md` or what
  the type checker proves; only a setting that would fail late in a long run is checked
  once at construction.
- Raise a specific exception; never `assert` outside tests.

## Decisions
- Protected: existing data and results (`data/`, `outputs/`, checkpoints, logs),
  vendored code (`third_party/`), the paths `AGENTS.md` lists. Write new results to new
  locations. Change a module marked stable only by the wiring the task needs.
- Propose, don't settle, a new file format, naming scheme, directory layout or config
  key.
- Don't reopen a decision of the user without new information, or bring back code they
  rejected, under any name.
- Stop and ask when the design looks wrong, a requirement is unmeetable, a failing test
  looks like a source bug or targets a missing API, or an unrequested step touches a
  protected path; otherwise take the conservative option and report it.

## Tests and checks
- Test changed behavior; a bug fix gets a test that fails without it.
- `src/` is the specification: "fix the tests" means changing the tests. Change a test
  only where the task changes what it checks.
- Before finishing, run `uv run ruff format` and `uv run ruff check --fix` on the
  changed files only, then the checks `AGENTS.md` names. Fix the failures you caused;
  report the others with their output.

## Environment
- Use uv, never `pip` or a bare `python`. Justify a new dependency against the standard
  library and the existing ones, typing included.
- Give a subagent its rule files, the commit rules and the protected paths; verify
  its claims.
- `README.md` and `docs/` are for users: short, no code tour, no links to `specs/`.
  A change to a language users write (config syntax, command line) updates its docs in
  the same commit.
