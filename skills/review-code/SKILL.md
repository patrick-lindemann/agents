---
name: review-code
description: "Thermo-nuclear review of a code change: one reviewer audits correctness and security, one audits structure and pushes for simplifications. Use when the user asks for a code review, a review of a diff, branch or pull request, or a thermo-nuclear review."
argument-hint: "[base or diff range] [focus] | stage"
metadata:
  short-description: "Thermo-nuclear review of a code change"
---

Review a code change with two reviewer agents in parallel, check their main findings,
report in the chat and put the decisions to the user. No file changes.

Arguments: the change (a base branch or a diff range; default the merge base with
`main` or `master` up to `HEAD`, with uncommitted changes), and optionally a focus. The
argument `stage` runs the form inside `implement` (see the last section).

## Findings

Every reviewer reports each finding as one line:
`<ID> [blocker|major|minor] <file>:<lines>: <problem>. Fix: <one fix>. Evidence: [run|read|unverified] <what shows it>.`
IDs are `C1, C2 …` for correctness and `S1, S2 …` for structure.

## Steps

1. **Scope.** Find the diff and list the changed files with their line counts before
   and after. Read the project's `AGENTS.md` and the title and description of the pull
   request, if there is one. Done when the diff range and the file list are fixed.

2. **Review.** Start two `reviewer-strong` subagents at the same time. Give each the
   diff range, the file list, the user's focus and decisions, and the finding form
   above. Leave out the author's reasoning.
   - C reads `~/agents/skills/review-code/rubrics/correctness.md`;
   - S reads `~/agents/skills/review-code/rubrics/structure.md`.

   Done when both have returned their findings and their verdict.

3. **Check.** Check each blocker and major finding yourself: open the file, run the
   command. Merge findings that say the same, keeping both IDs. Done when each of them
   is confirmed or rejected with the reason.

4. **Report** in the chat:
   1. the verdict, approve or request changes, in two sentences;
   2. "What to decide": a numbered table (decision, recommended, why), worded so that
      "yes" accepts the recommendation;
   3. the confirmed findings, blockers first, then by how much code the fix removes;
   4. the rejected findings, one line each with the reason.

   Say in one line at the end that the `save` skill writes the report to a file.
   Done when the report is in the chat.

5. **Decide.** When the user started the review, ask the "What to decide" items with
   the question tool: at most 4 per call, the recommendation first with "(Recommended)"
   in its label. When another skill started it, leave the questions to that skill.
   Done when the user has answered, or the questions are left to the calling skill.

## Inside `implement` (`stage`)

One `reviewer-strong` reads both rubrics and reviews the diff of the stage against the
spec or the stage concept and the report. It also checks that each package delivers
what it names and that every statement of the report holds in the code. Each finding
names its package. The findings go back to the coordinating agent of `implement`, not
into the chat; steps 3 to 5 are left to `implement`.
