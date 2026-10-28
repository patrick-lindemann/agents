# Claude Code setup

How Claude Code runs on the GPU server (`graspdiff`, reached over VS Code Remote-SSH):
the user settings, the status line, the rules and skills from this repository, and
Claude in a VS Code side-bar tab that survives disconnects through tmux.

State of 2026-10-28, Claude Code 2.1.312.

## Files

| What | Where | Source |
|---|---|---|
| User settings | `~/.claude/settings.json` | this machine only |
| Status line | `~/.claude/statusline.sh` | link to `claude/statusline.sh` |
| Rules, skills, subagents | `~/.claude/{rules,skills,agents}/` | links to `rules/`, `skills/`, `.claude/agents/` |
| Claude in tmux | `~/.local/bin/claude-tmux` | link to `bin/claude-tmux` |
| VS Code server settings | `~/.vscode-server/data/Machine/settings.json` | this machine only |
| Cleanup schedule | `crontab -l` | this machine only |

`scripts/install.sh` makes the links. On a new machine, run it, then set the plugin
setting and the cron entry below by hand.

## User settings

`~/.claude/settings.json`:

- Model `opus` with effort `medium`, `high` for Fable (`modelSettings`).
  `switchModelsOnFlag` is on.
- Permissions: `defaultMode: "auto"`. `Bash`, `Read`, `Edit` and `Write` are allowed,
  and `/` is an additional directory.
  - Asked first: `sudo`, `dd`, `git reset --hard`, `git clean`, `git push`,
    `git rebase`, `git filter-branch`.
  - Denied: `rm -rf /`, `rm -rf ~`, every forced or deleting `git push`, and
    `SendFeedback`.
- No attribution lines in commits and pull requests (`attribution` empty).
- Interface: `tui: "fullscreen"`, `theme: "dark"`. Spinner tips and prompt suggestions
  are off.
- Transcripts are kept for 10 years (`cleanupPeriodDays: 3650`).
- Built-in `anthropic-skills:*` that duplicate this repository's skills, or that aren't
  used, are switched off in `skillOverrides`.

## Status line

`statusLine` runs `~/.claude/statusline.sh` every 60 s. The script needs `jq`
(`/usr/bin/jq`). It shows, modeled on pi's footer:

- Left: the session's input and output tokens (`↑` `↓`), cache reads and writes (`R`
  `W`), the cache hit rate (`CH`), and the context use as a percentage of the window.
  The context turns yellow above 70 % and red above 90 %.
- Right: the model (`opus-5.5`), the effort level, and the 5-hour limit with the time
  until it resets.
- The cache figures are dropped when the line doesn't fit, as in a narrow side bar.

## Rules, skills and subagents

`scripts/install.sh` links `rules/communication.md`, `git.md` and `shell.md`, every
skill, every subagent and the status line into `~/.claude/`, and every command in
`bin/` into `~/.local/bin/`. Run it again after adding or removing a
skill or a subagent. `scripts/link-rules.sh` links the rules of a project, driven by
the `setup` skill.

## Claude in the VS Code side bar

### Plugin

The extension Claude Terminal Panel (`0ly.claude-terminal-panel`, MIT,
github.com/nolikzero/claude-terminal-panel) gives a terminal with tabs in the secondary
side bar, separate from VS Code's own terminals. It is installed on the server, not on
the laptop, so that its tabs run here.

In `~/.vscode-server/data/Machine/settings.json`:

```json
"claudeTerminal.command": "/home/graspdiff/.local/bin/claude-tmux"
```

### Patch

The plugin's terminal is a bare xterm.js: Shift+Enter sends the same CR as Enter,
Ctrl+C and Ctrl+V send control characters, and OSC 52 (how tmux and Claude copy) is
ignored. `claude/claude-terminal-panel.patch` changes its webview, `media/main.js`:

- Shift+Enter sends ESC CR, a newline in Claude.
- Ctrl+C copies an xterm.js selection (Shift+drag) and is Ctrl+C without one.
  Ctrl+Shift+C copies too.
- Ctrl+V and Ctrl+Shift+V paste text. Claude's image paste on Ctrl+V is lost, which
  cannot reach the laptop's clipboard anyway.
- OSC 52 writes the laptop's clipboard.

An update installs a new folder without the patch, so "Auto Update" is off for this
extension (Extensions view, gear menu, on the laptop). After a manual update, check
that it still applies, then apply it and reload the window:

```sh
cd ~/.vscode-server/extensions/0ly.claude-terminal-panel-*-linux-x64
patch -p1 --dry-run < ~/agents/claude/claude-terminal-panel.patch && patch -p1 < ~/agents/claude/claude-terminal-panel.patch
```

`~/.tmux.conf` sets `set-clipboard on`, so that tmux passes Claude's OSC 52 copies on,
and `escape-time 10`, so that Esc takes effect at once.

### `claude-tmux`

The plugin starts `claude-tmux` instead of `claude` in every new tab:

| What you do | What happens |
|---|---|
| Open a tab | A new tmux session `claude-<folder>-<n>` with a new Claude. |
| Close the tab | Its session ends within 20 s. |
| Quit Claude (`/exit`) | Its session ends. |
| SSH drops, VS Code closes | The sessions keep running. |
| Reconnect | Each tab you open reattaches one session left by the disconnect. Once none is left, tabs start new ones. |

- The plugin closes a tab with SIGHUP and keeps running. On a disconnect, the VS Code
  extension host exits. So after a SIGHUP the script ends the session only if the
  extension host (`--type=extensionHost`) is still alive 20 s later.
- A lock (`/tmp/claude-tmux-<uid>.lock`) and a 10-second claim stop two tabs from
  taking the same session.
- The `claude-*` sessions turn tmux's mouse mode on, so that the wheel scrolls, and
  hide the status bar. Other tmux sessions and `~/.tmux.conf` are unchanged.
- Arguments are passed on to `claude`. Run in a normal terminal, the script works the
  same, except that closing the terminal keeps the session.

### After a disconnect

The VS Code server keeps the extension host, and with it the tabs, for 3 hours after a
disconnect (`reconnection-grace-time`, default 10800 s):

- Back within 3 hours: the tabs are still there and attached.
- Back later: the plugin opens one tab, which reattaches one session. The plugin keeps
  its tabs in memory only, so open one more tab for each further session.
  `tmux ls | grep claude-` lists them.

The grace time is the Remote-SSH setting `remote.SSH.reconnectionGraceTime` in seconds
on the laptop. It isn't changed. Claude doesn't need it, since tmux keeps it running.

### Cleanup

A `claude-*` session of any project ends when no tab is attached and it has printed
nothing for 7 days (`max_idle` in the script). The last output is tmux's
`window_activity`, since `session_activity` only counts key presses. A working Claude
prints, so it is never ended. A finished one waiting at its prompt prints nothing.

The cleanup runs on every new tab and every night at midnight server time (CET):

```
0 0 * * * /home/graspdiff/.local/bin/claude-tmux --prune
```

### Undo

1. Remove `claudeTerminal.command` from `~/.vscode-server/data/Machine/settings.json`.
2. Run `crontab -r`, while that line is the only entry, else `crontab -e`.
3. Delete the link `~/.local/bin/claude-tmux`, and `bin/claude-tmux` with it, or
   `install.sh` links it again.
