---
name: spec
description: "Plan a feature as a spec in specs/: interview, check the code, record the decisions."
argument-hint: "<topic> [no-questions]"
disable-model-invocation: true
---

Plan a piece of work as a spec in the project's `specs/`. The user takes the decisions
now, so that the implementation has none left to take. A spec is done when an
implementer could build it without asking a single question.

Arguments: the topic, and optionally `no-questions`, which writes down what the
conversation already settled, without an interview.

Read `core.md` and `communication.md` in `~/agents/rules/`, and the rule files of the
area the idea touches.

## Steps

1. **Read.** Read the existing specs of the area, and the code that the idea touches.
   Give large reading to `fact-finder` subagents (middle tier, medium effort), each
   with a narrow question; check every claim they return against the code. Done when
   every fact that the spec will state about the code is checked and cited by file and
   line.

2. **Conflicts.** List where the idea conflicts with the codebase or the rules: file
   formats, directory layout, existing modules, names, conventions. Done when each
   conflict is settled by an earlier decision of the user or is a question for step 3.

3. **Interview.** Interview the user in rounds. Each round asks every question whose
   prerequisites are settled, numbered, each with a recommended answer, worded so that
   "yes" accepts it:

   ```
   **Q1. <title>.** <the question, with the options where there are several>

   Recommended: <answer>, because <reason>.
   ```

   Look facts up yourself and put only decisions to the user. Every new file format,
   naming scheme, directory layout or config key is a question (`core.md`, Decisions).
   Where a question needs published methods, call the Skill tool with "research". Skip
   this step under `no-questions`. Done when no question is left that an implementer
   would have to ask, or when the user ends the interview.

4. **Form.** Pick the form by size and name it to the user:
   - a small change: one file, `specs/<topic>.md`, from `templates/small-spec.md`;
   - a large effort: a folder `specs/<topic>/` with `overview.md` from
     `templates/overview.md`, and one `stages/<n>-<name>/concept.md` per stage from
     `templates/stage-concept.md`. The overview lists the stages and their goals.

   Done when the user has the form and, for a folder, the list of stages.

5. **Write.** Write the spec from its template.
   - Each decision has its date and reason, and the user's words stay apart from your
     reading of them: "The user decided: … My reading: …".
   - Whatever the user did not decide goes under "Proposed by the agent, not decided".
     A line you wrote is never a requirement of the user.
   - Facts about the code are cited by file and line.
   - Leave out the exact implementation: no full signatures and no code, except a short
     target shape where a decision needs one.

   Done when the file exists and every decision in it has a date.

6. **Check.** Offer a critique with the focus "questions an implementer would still have
   to ask". If the user accepts, call the Skill tool with "critique", naming the spec and
   that focus, and settle its findings with the user. Done when the user declines, or the
   critique finds no such question, or the user has settled every one it found.

## Changes later

A spec changes when the user decides something new: add the decision with its date,
and keep the old one visible where the change matters. A change to the list of stages is
made here, not in the workplan.
