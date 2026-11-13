---
name: spec
description: "Plan work as a small, medium or big spec in specs/: check the code, interview, record the decisions."
argument-hint: "[small|medium|big] <topic> [no-questions]"
metadata:
  short-description: "Plan work as a small, medium or big spec"
disable-model-invocation: true
---

Plan a piece of work as a spec in the project's `specs/<topic>/`. The user takes the
decisions now, so that the implementation has none left to take. A spec is done when an
implementer could build it without asking a single question.

Arguments: optionally the size, then the topic, and optionally `no-questions`, which
writes down what the conversation already settled, without an interview. Without a size,
choose one in step 2.

The size sets the spec's files, the length of the interview and whether the review is
required:

| Size | When | Spec |
|---|---|---|
| small | one concern, one package, at most 4 questions | `spec.md` from `small-spec.md` |
| medium | one goal, reached at once, in 2 to 5 packages | `spec.md` from `medium-spec.md` |
| big | several goals, reached one after another | `overview.md` and one `stages/<n>-<name>/concept.md` per stage |

Every spec states its acceptance criteria, so that `implement` can build it directly; a
workplan is optional.

The templates are in `~/agents/skills/spec/templates/`.

Read `~/agents/rules/shared/common.md`, and the rule files of the
area the work touches.

## Steps

1. **Read.** Read the existing specs of the area, and the code that the work touches.
   For a big spec, give large reading to `fact-finder` subagents (middle tier, medium
   effort), each with a narrow question; check every claim they return against the code.
   Done when every fact that the spec will state about the code is checked and cited by
   file and line.

2. **Size.** Without a size argument, choose one from the table. With one, check that
   the work fits it; if it does not, say why and recommend the fitting size with the
   question tool, and continue with the size the user picks. Done when the size is set;
   a size you chose is the first decision you name in step 4.

3. **Conflicts.** List where the work conflicts with the codebase or the rules: file
   formats, directory layout, existing modules, names, conventions. Done when each
   conflict is settled by an earlier decision of the user or is a question for step 4.

4. **Interview.** Look facts up yourself and put only decisions to the user. Sort each
   open decision first:
   - **Take it yourself** when one answer is clearly right: it follows from the code,
     a rule, an existing convention or an earlier decision of the user, or it is cheap
     to change later and no option is clearly better.
   - **Ask** when the options differ in what the user gets, when it is costly to
     undo, or when it is a new file format, naming scheme, directory layout or config
     key (`common.md`, Decisions); one that follows an existing scheme is not new.

   Open each round with the decisions you took, one line each with its reason, so the
   user can overturn any. Then ask the questions whose prerequisites are settled, the
   most consequential first, with the question tool: at most 4 per call, 2 to 4
   options each, your recommendation first with "(Recommended)" in its label and the
   reason in its description. Where no such tool exists, number the questions in text,
   each with its recommended answer, worded so that "yes" accepts it.

   Keep a small spec to one call of at most 4 questions, and a medium or big one to
   about 8 questions. If more remain, the size is too small: say so and recommend the
   next size, or ask the questions that block the rest and take the others yourself.
   Where a question needs published methods, run the skill "research". Skip
   this step under `no-questions`. Done when no question is left that an implementer
   would have to ask, or when the user ends the interview.

5. **Stages.** Big spec only. Propose the stages to the user, each with its goal, as
   they will stand in the overview. If the work turns out to have one goal, recommend
   the medium size with the question tool instead. Done when the user has approved the
   list of stages.

6. **Write.** Write the spec from its templates.
   - Each decision has its date and reason, and the user's words stay apart from your
     reading of them: "The user decided: … My reading: …".
   - A decision you took in step 4 and the user let stand is marked "Taken by the
     agent, shown to the user", with its reason.
   - Whatever else the user did not decide goes under "Proposed by the agent, not
     decided". A line you wrote is never a requirement of the user.
   - Facts about the code are cited by file and line.
   - Leave out the exact implementation: no full signatures and no code, except a short
     target shape where a decision needs one.
   - "Done when" lists the acceptance criteria, in `spec.md` or in each stage concept:
     what the user can observe once the work is done, each shown by a command and what
     it printed.

   Done when the files exist, every decision in them has a date, and every spec file or
   stage concept has its criteria.

7. **Check.** For a small spec, run the skill "review", naming the spec,
   `rounds=1`, and the focus "questions an implementer would still have to ask, false
   statements about the code, and criteria that cannot be shown by a command". For a
   medium or big spec, offer that review with the question tool, with the focus
   "questions an implementer would still have to ask", and run it if the user accepts.
   Settle the findings as in step 4: take the clear ones yourself and name them, one
   line each, and ask the rest with the question tool. For a small spec, add as the last
   question whether the spec is approved, and record the findings under "Review". Update
   the spec with every answer and set its status. Done when the user declined the
   review, or every finding is settled, and a small spec is approved or the user ended
   the planning.

Then tell the user that `/implement specs/<topic>/spec.md` builds a small or medium
spec, and `/implement specs/<topic> <stage>` a stage of a big one. For a big spec, add
that `/workplan specs/<topic>` first splits the stages into packages for the user to
approve.

## Changes later

A spec changes when the user decides something new: add the decision with its date,
and keep the old one visible where the change matters. A change to the size, the list
of stages or the criteria is made here, not in the workplan.
