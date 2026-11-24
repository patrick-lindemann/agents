---
name: review-spec
description: "Harsh, independent review of a spec, workplan, benchmark, report or research by one reviewer agent. Use when the user or another skill asks for a review of a plan or a written result. For code, use review-code."
argument-hint: "<material> [focus]"
metadata:
  short-description: "Independent review of a plan or result"
---

Review a spec, workplan, benchmark, report or research with one independent reviewer,
check its main findings, report in the chat and put the decisions to the user. No file
changes.

Arguments: the material (a path, or "this discussion") and optionally a focus.

## Steps

1. **Review.** Start one `reviewer-strong` subagent. Its brief gives the material, the
   sources to check it against (code, spec, rules), the user's decisions on it with
   their dates, the focus, and the finding form below. Leave out the author's
   reasoning. Without a focus, it checks by material:

   | Material | Focus |
   |---|---|
   | spec | false statements about the code, contradictions, missing decisions, criteria no command can show, questions an implementer would have to ask |
   | workplan | whether the packages reach each stage's goal, and whether a command can show every criterion |
   | benchmark | whether the numbers reproduce, the method, confounders |
   | report, research | whether each claim leads to its source |

   Each finding is one line:
   `<ID> [blocker|major|minor] <section>: <problem>. Fix: <one fix>. Evidence: [run|read|unverified] <what shows it>.`
   Done when it has returned its findings.

2. **Check.** Check each blocker and major finding yourself against its source. Done
   when each is confirmed or rejected with the reason.

3. **Report** in the chat: the verdict in two sentences; "What to decide" as a numbered
   table (decision, recommended, why), worded so that "yes" accepts the recommendation;
   the confirmed findings, most severe first; the rejected ones, one line each with the
   reason. Say in one line that the `save` skill writes it to a file. Done when the
   report is in the chat.

4. **Decide.** When the user started the review, ask the "What to decide" items with
   the question tool: at most 4 per call, the recommendation first with "(Recommended)"
   in its label. When another skill started it, leave the questions to that skill.
   Done when the user has answered, or the questions are left to the calling skill.
