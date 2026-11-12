# Shell

<!-- The rm, git restore and git checkout -- ask rules were removed from
~/.claude/settings.json on 2026-10-19; these rules replace them. -->

## Workspace
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

## Commands
- Write a script longer than five lines to a file in the scratch directory and run it
  (`uv run python "$scratch/check.py"`), instead of a heredoc or `python -c` in the
  command.
- Change project files with Edit or Write, not with `sed -i`, `cat > file <<EOF` or an
  inline Python string replacement.
- Give a Bash call one purpose: no setup, edit, run and cleanup chained in one command.
- Read no file a deny rule covers (`.env*`, `*key*`, `*token*`, `*password*`,
  `*credential*`); one such path rejects the whole command.
