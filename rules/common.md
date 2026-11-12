# Common rules

## Communication

- Open an answer or report with a short summary of the result, without a heading or a
  "TL;DR" label, then give the details.
- State doubt or ambiguity plainly, once, not as hedging in every sentence.
- Back a claim that something works with the command that ran and what it printed.
- Use plain words and the codebase's vocabulary, with no coined jargon or metaphors,
  such as "the warm path" for the cached branch.
- Write math outside docstrings as plain text, in chat, specs and comments alike:
  `theta = |phi|`, `sigma^2`.
- Give options with one recommendation and its reason.
- Keep the user's words apart from your reading when restating their decision: "You
  decided … My reading is …".
- Propose lasting feedback about one project as an edit to its `AGENTS.md`. Propose a
  change to the shared rules only for feedback that holds in both an ML repository and
  a web service.

## Core

- Precedence: the user, `AGENTS.md`, these rules, the surrounding code; a section for a
  kind of code (scientific, scripts …) overrides the general section of its language.
  Report, don't resolve, a conflict within one level.

### Scope
- Build on the existing code and its style, but write new code by these rules. Mention,
  don't change, what lies outside the task.
- Make no unrequested aliases or deprecation paths; keep the user's unrelated changes.
- Port a reference faithfully, edge cases included; propose any deviation first, then
  document it.

### Minimal code
- Add a helper, wrapper or class only for shared behavior or substantial duplication: no
  `_get_name(user)` for `user.name`.
- Select behavior by an explicit parameter or mapping, not by naming conventions (keys
  ending in `_path`).
- Write no code for future callers and delete code that loses its last caller, with its
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
  code (`third_party/`), the paths `AGENTS.md` lists. Write new results to new locations.
  Change a module marked stable only by the wiring the task needs.
- Propose, don't settle, a new file format, naming scheme, directory layout or config
  key.
- Don't reopen the user's decision without new information, or bring back code they
  rejected, under any name.
- Stop and ask when the design looks wrong, a requirement is unmeetable, a failing test
  looks like a source bug or targets a missing API, or an unrequested step touches a
  protected path; otherwise take the conservative option and report it.

### Tests and checks
- Test changed behavior; a bug fix gets a test that fails without it.
- `src/` is the specification: "fix the tests" means changing the tests. Change a test
  only where the task changes what it checks.
- Before finishing, run the formatter and linter of the language on only the changed
  files, then the checks `AGENTS.md` names; fix the failures you caused, report the
  others with their output.

### Environment
- Use the project's package manager and tools. Justify a new dependency against the
  standard library and the existing ones, typing included.
- Give a subagent its rule files, the commit rules and the protected paths; verify its
  claims.

## Comments and docs

### Comments
- Comment only reasons the code cannot show, as a full sentence above the code, except a
  terse label over a section of a long body or a short identity at the line's end:
  `# Checked before the first request, so that nothing is sent for an invalid config`.
- Write no divider or banner comments (`# ---- helpers ----`, `// ======`), no commented-out
  code, and no comment that restates the code, the name or the type.
- Never mention in a comment modules the code is independent of, the history of the code
  ("previously", "now"), the task, or the conversation that led to it.
- Mark nothing as `TODO` or `FIXME` unless the user asked for it; report open work
  instead.

### API documentation
- Document the contract of a public function, class or type (inputs, result, errors),
  not its implementation, in the language's standard format.
- Write documentation and comments as plain sentences, without semicolons: split joined
  clauses into sentences.
- Write no documentation that only restates the name, base class or signature.

### User documentation
- Keep user docs (`README.md`, `docs/`) short, without a code tour. Update the docs of a
  language users write (config syntax, command line) in the same commit as the change.
- Write in plain words and the codebase's vocabulary. Show a command or snippet only
  where words fail.

## Shell

<!-- The rm, git restore and git checkout -- ask rules were removed from
~/.claude/settings.json on 2026-10-19; these rules replace them. -->

### Workspace
- Your scratch directory is a temporary directory outside the project: the harness's
  scratchpad where it has one, else one you create once per session with `mktemp -d`.
  Write throwaway scripts, probes, patches and notes there, never into the project, so
  that the project's rules and `git status` see only real work.
- Your workspace is the scratch directory and the temporary files you created in this
  session (`.coverage`, build output). Inside it, create, overwrite and `rm` freely.
- Outside the workspace, `rm` only what the user explicitly told you to delete. Move
  anything else to the trash, tracked files included, with `trash <path>` on macOS or
  `gio trash <path>` on Linux, so that it stays restorable. This covers what you wrote
  this session that is meant to stay (`src/`, `specs/`, docs, configs).
- Delete outside the workspace by no other means either (`find -delete`, `unlink`,
  `shutil.rmtree`, `os.remove`, `mv` to a throwaway path), except on the user's explicit
  instruction.
- Remove large scratch data (downloads, copies of datasets) once the task no longer
  needs it.

### Commands
- Write a script longer than five lines to a file in the scratch directory and run it
  (`uv run python "$scratch/check.py"`), instead of a heredoc or `python -c` in the
  command.
- Change project files with Edit or Write, not with `sed -i`, `cat > file <<EOF` or an
  inline Python string replacement.
- Give a Bash call one purpose: no setup, edit, run and cleanup chained in one command.
- Read no file a deny rule covers (`.env*`, `*key*`, `*token*`, `*password*`,
  `*credential*`); one such path rejects the whole command.

## Git

### Commits
- Commit only when the project's `AGENTS.md`, the user or a skill the user started says
  so; otherwise leave the work uncommitted and say what is ready.
- Where you commit, end each work package with one commit, made once its checks pass.
- Write the message as one short line in the imperative ("Reject empty uploads"),
  without body, bullet points or trailer.
- Give a commit one concern; a message that needs "and" describes two commits.
- Stage only the package's files with `git add <paths>`, never `git add -A` or
  `git add .`, and check before committing that `git diff --cached --name-only` lists
  only them, so that nothing the user staged, such as a release, is committed.
- Never amend, rebase, force-push, tag or merge; these stay with the user.
- Discard a change (`git restore`, `git checkout -- <path>`) only when it is your own
  from this session or the user explicitly told you to; otherwise save it first with
  `git diff -- <paths> > "$scratch/<name>.patch"` and name the patch in your report. Unstage
  with `git restore --staged`.

### Pushes and pull requests
- Push only when the user tells you to or a skill the user started calls for it, never
  by default.
- Push with a plain `git push`, or `git push -u origin <branch>` for a new branch, and
  only to a branch other than `main` or `master`; never with `--force`,
  `--force-with-lease` or `--delete`, and never a tag.
- Where you may push, open a pull request with `gh pr create`; never merge, approve or
  close one.

### Branches
- Give a large rewrite its own branch, and delete the code it replaces only there.

### Changelog
- In a project with a `CHANGELOG.md`, add a line for each change users can see to its
  `## [Unreleased]` section, in the same commit as the change.
