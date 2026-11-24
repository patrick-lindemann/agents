---
name: review-structure
description: "Strict review of the structure and practice of a codebase or folder: layers, coupling, contracts, complexity against need, and consistency. Read-only; ranked findings, a verdict and proposed rules."
argument-hint: "[path or diff range] [focus]"
disable-model-invocation: true
metadata:
  short-description: "Review the structure of a codebase"
---

Review how easy existing code is to understand, change and extend, for a developer new
to it or an agent that reads one file at a time. Report in the chat and turn repeated
findings into proposed rules. No file changes.

Arguments: the scope (a path, a diff range, or the whole repository by default), and
optionally a focus. For a diff, the reviewer also reads the code the diff touches.

## Steps

1. **Review.** Start one `reviewer-strong` subagent. Give it the scope, the focus, and
   `~/agents/skills/review-structure/rubric.md` to read and follow. For a scope of a few
   files, do the review yourself. Done when the report of the rubric has returned.

2. **Check.** Check each blocker and major finding yourself: open the file, run the
   command. Done when each is confirmed or rejected with the reason.

3. **Report** in the chat, in the form of the rubric, with the rejected findings in one
   line each at the end. Say in one line that the `save` skill writes it to a file.
   Done when the report is in the chat.

4. **Decide.** Ask with the question tool, at most 4 per call, the recommendation first
   with "(Recommended)" in its label:
   - which findings to fix, grouped by kind;
   - which proposed rules to adopt, each as an edit to the project's `AGENTS.md`, to
     `~/agents/rules/` where it holds in both an ML repository and a web service, or to
     the linter config.

   Done when the user has answered. Apply nothing; tell the user that `/revise` or a
   new spec turns the answers into changes.
