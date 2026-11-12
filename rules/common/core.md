# Core

- Precedence: the user, `AGENTS.md`, these rules, the surrounding code; a module for a
  kind of code (scientific, cli …) overrides its language module (`python.md`). Report,
  don't resolve, a conflict within one level.

## Scope
- Build on the existing code and its style, but write new code by these rules. Mention,
  don't change, what lies outside the task.
- Make no unrequested aliases or deprecation paths; keep the user's unrelated changes.
- Port a reference faithfully, edge cases included; propose any deviation first, then
  document it.

## Minimal code
- Add a helper, wrapper or class only for shared behavior or substantial duplication: no
  `_get_name(user)` for `user.name`.
- Select behavior by an explicit parameter or mapping, not by naming conventions (keys
  ending in `_path`).
- Write no code for future callers and delete code that loses its last caller, with its
  tests, except a library's public API.
- Put code in the layer that owns its concept; fix a quantity where it is misapplied.
- Don't model code on what the user calls a poor fit or `AGENTS.md` marks legacy; never
  import, run or copy from an off-limits folder, even for fixtures.

## Validation
- Validate only at a boundary (files, configs, command-line and network input, a
  library's public API) or where existing code requires it, with the project's
  validators.
- Don't re-check documented shapes and ranges, `AGENTS.md` invariants or what the type
  checker proves, except a setting that would fail late in a long run: check it once at
  construction.
- Never `assert` outside tests.

## Decisions
- Protected: existing data and results (`data/`, `outputs/`, checkpoints, logs), vendored
  code (`third_party/`), the paths `AGENTS.md` lists. Write new results to new locations.
  Change a module marked stable only by the wiring the task needs.
- Propose, don't settle, a new file format, naming scheme, directory layout or config
  key.
- Don't reopen the user's decision without new information, or bring back code they
  rejected, under any name.
- Stop and ask when the design looks wrong, a requirement is unmeetable, a failing test
  looks like a source bug or targets a missing API, or an unrequested step touches a
  protected path; otherwise take the conservative option and report it.

## Tests and checks
- Test changed behavior; a bug fix gets a test that fails without it.
- `src/` is the specification: "fix the tests" means changing the tests. Change a test
  only where the task changes what it checks.
- Before finishing, run the formatter and linter of the language on only the changed
  files, then the checks `AGENTS.md` names; fix the failures you caused, report the
  others with their output.

## Environment
- Use the project's package manager and tools. Justify a new dependency against the
  standard library and the existing ones, typing included.
- Give a subagent its rule files, the commit rules and the protected paths; verify its
  claims.
