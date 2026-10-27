# Shell

<!-- The rm, git restore and git checkout -- ask rules were removed from
~/.claude/settings.json on 2026-10-19; these rules replace them. -->

## Workspace
- Your workspace is the session scratchpad and the temporary files you created in this
  session (probe files, `.coverage`, build output). Inside it, create, overwrite and `rm`
  freely.
- Outside the workspace, `rm` only what the user explicitly told you to delete. Move
  anything else to the trash with `gio trash <path>`, tracked files included; it stays
  restorable from `trash:///`. This covers what you wrote this session that is meant to
  stay (`src/`, `specs/`, docs, configs).
- Delete outside the workspace by no other means either (`find -delete`, `unlink`,
  `shutil.rmtree`, `os.remove`, `mv` to a throwaway path), except on the user's explicit
  instruction.
- Remove large scratch data (downloads, copies of datasets) once the task no longer
  needs it.

## Commands
- Write a script longer than five lines to a file in the scratchpad and run it
  (`uv run python $S/check.py`), instead of a heredoc or `python -c` in the command.
- Change project files with Edit or Write, not with `sed -i`, `cat > file <<EOF` or an
  inline Python string replacement.
- Give a Bash call one purpose: no setup, edit, run and cleanup chained in one command.
- Read no file a deny rule covers (`.env*`, `*key*`, `*token*`, `*password*`,
  `*credential*`); one such path rejects the whole command.
