---
name: revise
description: "Turn your review notes on agent-written code into fixes and lasting rules."
argument-hint: "<notes> | session"
metadata:
  short-description: "Turn review notes into fixes and rules"
disable-model-invocation: true
---

The user read code that an agent wrote and noted what they dislike: names, docstrings,
methods, structure, or a whole approach. Turn the notes into agreed fixes, find the same
problems elsewhere, and propose what should last as a rule.

Arguments: the notes. With `session` instead, look back over the whole session for what
went wrong: the mistakes, the user's corrections, and the instructions the user gave more
than once.

Read `~/agents/rules/common.md`, and the rule files
for the code the notes are about.

## Steps

1. **Items.** Turn the notes into a numbered list. Each item has its place (file and
   line), the user's words, your reading of them, and its origin: the spec, the
   implementer's plan, a response to a review finding, or the agent itself. Done when
   every note is an item.

2. **Readings.** Where an item is ambiguous, ask back, in one round, with a recommended
   reading for each, worded so that "yes" accepts it. Done when the user has accepted a
   reading for every item.

3. **Fixes.** Propose a fix for each item, with a short before and after. Done when the
   user has agreed to or rejected each one.

4. **Apply.** Apply the agreed fixes, one item or one group at a time, and run the
   checks. Commit as the project's `AGENTS.md` allows. Done when every agreed fix is
   applied and the checks pass, or their failure is reported with its output.

5. **Elsewhere.** Search the rest of the change, or the codebase, for the same problems.
   Done when the places are listed in the chat. Fix them only after the user agrees.

6. **Lasting rules.** Propose which items should last, and where:
   - feedback about one project as an edit to its `AGENTS.md`;
   - feedback that holds in both an ML repository and a web service as a change to the
     rules in `~/agents/rules/`;
   - a rule that ruff, the type checker or a test can check, as that check.

   Each proposal gives the text, in the style of the target file. Done when the user has
   accepted or rejected each proposal. Write the accepted `AGENTS.md` edits; leave the
   rule changes as a list in the chat, since the user maintains the rules.

7. **Report.** If a stage report exists, fill its "User review" table: each item with
   its objection, origin and state (fixed, rejected, open). Done when the table lists
   every item.
