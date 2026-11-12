# Common rules

## Communication
- Open with a short summary of the result, without a heading or "TL;DR", then details.
- State doubt once, plainly, not as hedging in every sentence.
- Back a claim that something works with the command that ran and what it printed.
- Use plain words and the codebase's vocabulary, no coined jargon or metaphors.
- Write math outside docstrings as plain text: `theta = |phi|`, `sigma^2`.
- Give options with one recommendation and its reason.
- Keep the user's words apart from your reading: "You decided … My reading is …".
- Propose lasting feedback as an edit to the project's `AGENTS.md`, and to the shared
  rules only if it holds in both an ML repository and a web service.

## Core
- Precedence: the user, `AGENTS.md`, these rules, the surrounding code. Rules for a kind
  of code (tests, scripts, scientific …) override the general rules of their language.
  Report, don't resolve, a conflict within one level.
- Follow the existing style, but write new code by these rules. Mention, don't change,
  what lies outside the task; keep the user's unrelated changes. Add no unrequested
  aliases or deprecation paths.
- Port a reference faithfully, edge cases included; propose any deviation first, then
  document it.
- Use the project's package manager and tools; justify a new dependency against the
  standard library and the existing ones.
- Give a subagent its rule files, the commit rules and the protected paths; verify its
  claims.

### Minimal code
- Add a helper, wrapper or class only for shared behavior or substantial duplication: no
  `_get_name(user)` for `user.name`.
- Select behavior by an explicit parameter or mapping, not by naming conventions (keys
  ending in `_path`).
- Write no code for future callers; delete code that loses its last caller, with its
  tests, except a library's public API.
- Put code in the layer that owns its concept; fix a quantity where it is misapplied.
- Don't model code on what the user calls a poor fit or `AGENTS.md` marks legacy; never
  import, run or copy from an off-limits folder, even for fixtures.

### Validation
- Validate only at a boundary (files, configs, command-line and network input, a
  library's public API) or where existing code requires it, with the project's
  validators.
- Don't re-check documented shapes and ranges, `AGENTS.md` invariants or what the type
  checker proves, except a setting that would fail late in a long run: check it once at
  construction.
- Never `assert` outside tests.

### Decisions
- Protected: existing data and results (`data/`, `outputs/`, checkpoints, logs), vendored
  code (`third_party/`) and the paths `AGENTS.md` lists. Write new results to new
  locations. Change a module marked stable only by the wiring the task needs.
- Propose, don't settle, a new file format, naming scheme, directory layout or config
  key.
- Don't reopen the user's decision without new information, or bring back rejected code
  under any name.
- Stop and ask when the design looks wrong, a requirement is unmeetable, a failing test
  looks like a source bug or targets a missing API, or an unrequested step touches a
  protected path; otherwise take the conservative option and report it.

## Shell
- Your scratch directory lies outside the project: the harness's scratchpad, else one
  `mktemp -d` per session. Put throwaway scripts, probes, patches and notes there.
- Inside it, and for temporary files you created this session (`.coverage`, build
  output), `rm` freely; remove large scratch data once the task no longer needs it.
- Elsewhere, `rm` only what the user told you to delete; move anything else to the
  trash (`trash` on macOS, `gio trash` on Linux), tracked files and your own lasting
  files included. Delete by no other means (`find -delete`, `unlink`, `shutil.rmtree`,
  `mv` to a throwaway path).
- Run a script longer than five lines from a file in the scratch directory, not as a
  heredoc or `python -c`.
- Change project files with the edit and write tools, not `sed -i` or `cat > file`.
- Give each shell command one purpose: no setup, edit, run and cleanup chained together.
- Read no secret files (`.env*`, `*key*`, `*token*`, `*password*`, `*credential*`).

## Git
- Commit only when `AGENTS.md`, the user or a skill the user started says so; otherwise
  leave the work uncommitted and say what is ready.
- End each work package with one commit once its checks pass: one concern, one-line
  imperative message ("Reject empty uploads"), no body or trailer.
- Stage with `git add <paths>`, never `-A` or `.`, and check that
  `git diff --cached --name-only` lists only them, so that nothing the user staged is
  committed.
- In the same commit as a change users can see, add a line to `## [Unreleased]` of an
  existing `CHANGELOG.md`, and update the docs of a language users write (config syntax,
  command line).
- Never amend, rebase, force-push, tag or merge.
- Discard a change (`git restore`, `git checkout -- <path>`) only if it is your own from
  this session or the user said so; otherwise first save it with
  `git diff -- <paths> > "$scratch/<name>.patch"` and name the patch.
- Push only when the user or a skill the user started calls for it, with a plain
  `git push` (`-u origin <branch>` for a new branch), never to `main` or `master`, never
  `--force`, `--force-with-lease`, `--delete` or a tag.
- Where you may push, open pull requests with `gh pr create`; never merge, approve or
  close one.
- Give a large rewrite its own branch, and delete the code it replaces only there.
