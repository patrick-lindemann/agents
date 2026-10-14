---
name: handoff
description: "Write the session into a file that a fresh agent can continue from."
argument-hint: "[what the next session is for]"
disable-model-invocation: true
---

Write the session into a file, so that a fresh agent, in another harness, on another
machine or for another person, can continue the work. Do this yourself, in the session:
a subagent does not have the session's context.

Argument: what the next session is for. Tailor the file to it.

## Steps

1. **Collect** the items of `templates/handoff.md`: the goal, the state, the decisions
   with the user's words, the open points, the next step, the skills the next session
   should use, and the pointers. Point at specs, commits and files by path instead of
   copying them. Done when each item is filled or marked "none".

2. **Write** the file to `specs/handoff/<date>-<topic>.md`, without secrets: no keys,
   passwords or tokens. Done when the file exists and its path is in the chat.
