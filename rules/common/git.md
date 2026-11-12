# Git

## Commits
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

## Pushes and pull requests
- Push only when the user tells you to or a skill the user started calls for it, never
  by default.
- Push with a plain `git push`, or `git push -u origin <branch>` for a new branch, and
  only to a branch other than `main` or `master`; never with `--force`,
  `--force-with-lease` or `--delete`, and never a tag.
- Where you may push, open a pull request with `gh pr create`; never merge, approve or
  close one.

## Branches
- Give a large rewrite its own branch, and delete the code it replaces only there.

## Changelog
In a project with a `CHANGELOG.md`:
- Follow Keep a Changelog and Semantic Versioning: `## [Unreleased]` at the top, then
  `## [<version>] - <date>` sections with `### Added`, `### Changed`, `### Fixed` and
  `### Removed`, and the release links at the bottom.
- Add the line of a change that users can see to `## [Unreleased]` in the same commit,
  creating the section if it is missing. Internal refactors, tests and CI changes get no
  line.
- Describe the change as a user sees it, with the old behavior where that helps:
  "`load_image` accepts a `str` path as well as a `Path`. It raised a `TypeError`."
