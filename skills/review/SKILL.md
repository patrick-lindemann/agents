---
name: review
description: "Harsh, independent review of a spec, workplan, diff, benchmark, report or research by two reviewer agents that split the focus. Use when the user asks for a critique, an independent review, reviewers, or a consensus. Not for a quick look at code."
argument-hint: "<material> [reviewers=2] [rounds=0] [focus] | stage"
metadata:
  short-description: "Independent review by two reviewers"
---

Review material with independent reviewer agents that split the focus, check every
claim, report in the chat, and put the decisions to the user. No file changes.

Arguments: the material (a path, a diff range, or "this discussion"), and optionally the
number of reviewers, the number of discussion rounds (none by default) and a focus. The
argument `stage` runs the short form inside `implement` (see the last section).

Read `~/agents/rules/shared/common.md`, and `~/agents/rules/shared/code.md` for code.

## Findings

Every reviewer reports findings in this form:

| Field | Content |
|---|---|
| ID | `<reviewer letter><number>`: A1, A2, B1 … |
| Severity | blocker, major, minor or nit |
| Location | file and line, or section |
| Problem | one or two sentences |
| Evidence | what shows it, marked [run] (a command ran), [read] (read in a source) or [unverified] |
| Proposal | one fix |

## Steps

1. **Briefs.** Write one brief per reviewer: the material, the sources to check it
   against (code, spec, rules), the user's decisions on it with their dates, its focus,
   the finding form above, and the rules for reviewers below. Leave out the author's
   reasoning. Reviewers A and B split the focus by material, so that B does not repeat
   A; a further reviewer, or every reviewer when the user or the calling skill gave a
   focus, gets the whole focus:

   | Material | Reviewer A | Reviewer B |
   |---|---|---|
   | code | correctness, faithfulness to the spec | structure, the rules |
   | spec | false statements about the code, contradictions, missing decisions | structure of the design, criteria that cannot be tested, questions an implementer would have to ask |
   | workplan | whether the packages reach each stage's goal | whether every criterion can be shown by a command |
   | benchmark | whether the numbers reproduce | the method, confounders |
   | research | whether each claim leads to its source | the same |

   Structure means, where it applies:
   - a reframing that deletes branches, modes, flags or layers instead of moving them;
   - a one-off conditional or flag added to an unrelated flow;
   - conditionals on the same case in several places, which one explicit mapping or
     dispatcher would replace;
   - a new helper that duplicates one the codebase already has;
   - generic code, such as reflection or a catch-all parameter, that hides a simple
     data shape;
   - a silent fallback, optional parameter or cast that hides an unstated invariant;
   - a module the change makes more coupled to others or more stateful;
   - a file the change pushes past 1000 lines;
   - related updates that can leave state half-applied.

   Rate a structure finding at least major unless the material justifies it. A
   restructuring beyond the task is reported as outside the task. Done when every
   brief is written.

2. **Round 0.** Start the reviewers as subagents that can read, search and run commands
   but not edit: by default one `reviewer-strong` (strong tier) as A and one
   `reviewer-middle` (middle tier) as B, both at high effort; more on request. Each
   reviews the material on its own. Done when each has returned its findings.

3. **Discussion.** Only when the user or the calling skill gave `rounds`: up to that
   many rounds. In each round, give every reviewer the findings of the others. The
   reviewer answers each one: agree, disagree with a reason, or refine it. Done when a
   round changes no finding, or after the last round.

4. **Check.** Check each claim against its source yourself: open the file, run the
   command. Merge findings that say the same, keeping both IDs. Done when every finding
   is confirmed, rejected with the reason, or marked unverified.

5. **Report** in the chat, in full:
   1. the verdict, in two or three sentences;
   2. "What to decide": a numbered table (decision, recommended, why), worded so that
      "yes" accepts the recommendation;
   3. the confirmed findings, most severe first, each with one recommendation;
   4. the disputed findings, where the reviewers contradict each other, each with both
      sides and your recommendation;
   5. what holds up: what the reviewers checked and found correct;
   6. the findings you rejected, with the reason;
   7. how the review was done: reviewers, tiers, rounds.

   Done when the report is in the chat. A file is written only when the user asks
   for one, through the `save` skill; say so in one line at the end.

6. **Decide.** When the user started the review, ask the "What to decide" items with
   the question tool: at most 4 per call, 2 to 4 options each, the recommendation first
   with "(Recommended)" in its label and the reason in its description. Where no such
   tool exists, the numbered table stands. When another skill started the review,
   leave the questions to that skill. Done when the user has answered, or the questions
   are left to the calling skill.

## Rules for reviewers

- Be harsh. Look for errors, contradictions, claims without support, and nitpicks.
- Being harsh about errors does not mean asking for more code. A finding that asks for
  more validation, defensive code or abstraction is weighed against `common.md`, sections
  Minimal code and Validation, and is dropped where they argue against it.
- A finding against a decision of the user names the new information that reopens it.
- Change no file.

## Inside `implement` (`stage`)

One `reviewer-strong` (strong tier, high effort), no discussion, once per stage. It reads
the spec or the stage concept, the workplan if there is one; the report, which lists the
packages; and the diff of the stage.
It checks that the stage reaches its goal and each package delivers what it names; bugs,
code smells, the structure points of step 1 at the severity given there, and breaches
of the rules; and that every statement of the report holds in the code. Each finding
names its package. The findings, in the form above, go back to the coordinating agent
of `implement` for the report, not into the chat.
