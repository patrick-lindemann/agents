---
name: handover
description: "Give the session as a prompt in the chat that a fresh agent can continue from."
argument-hint: "[what the next session is for] [file]"
metadata:
  short-description: "Give the session as a prompt for a fresh agent"
disable-model-invocation: true
effort: low
---

Give the session as a prompt in the chat, for the user to paste into a fresh agent, in
another harness, on another machine or for another person, so that it can continue the
work. Do this yourself, in the session: a subagent does not have the session's context.

Arguments: what the next session is for; tailor the prompt to it. `file` also saves the
prompt to `specs/handover/<date>-<topic>.md`.

Write from what the session already holds. Run only `git status --short` and
`git log -1 --oneline` for the header; read and verify nothing else, and leave out what
the session does not show.

## Steps

1. **Collect** the items of `~/agents/skills/handover/templates/handover.md`: the goal,
   the state, the decisions with the user's words, the open points, the next step, the
   skills the next session should use, and the pointers. Point at specs, commits and
   files by path instead of copying them. Done when each item is filled or marked
   "none".

2. **Give** the prompt in the chat as one fenced block of four backticks, so that inner
   code blocks survive and the user can copy it in one piece, without secrets: no keys,
   passwords or tokens. Under `file`, also write it to the file and name its path. Done
   when the block is in the chat.
