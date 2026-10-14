---
name: workplan
description: "Split an approved spec into stages, work packages and acceptance criteria."
argument-hint: "<path of the spec>"
disable-model-invocation: true
---

Split a spec that the user approved into stages and work packages, so that `implement`
can build one stage at a time without asking. This is for larger work, not for every
plan. The workplan adds no design.

Argument: the path of the spec.

Read `core.md`, `communication.md` and `git.md` in `~/agents/rules/`, and the project's
`AGENTS.md` and `CLAUDE.md`.

## Steps

1. **Read.** Read the spec, the stage concepts and the code they name. Done when you know
   the stages and their goals from the overview, or, for a one-file spec, its goal.

2. **Draft.** Draft the packages of each stage.
   - A package is one concern for one session. It states what it **delivers**, and the
     **acceptance criteria** by which it is accepted. Each criterion can be shown by a
     command and what it printed.
   - Each stage states what it **needs**: earlier stages, or a release from outside.
   - A wide mechanical change goes in three packages: add the new form beside the old,
     move the callers over, remove the old form.

   Done when the packages of every stage together reach the stage's goal.

3. **Ask.** Show the stages and packages to the user as a numbered list, and ask whether
   their size and order are right. A missing decision, or a change to the list of
   stages, goes back to the spec: tell the user to run `/spec` on it. Done when the user
   approves the breakdown.

4. **Write.** Write the workplan from `templates/workplan.md`. Its "Rules for every
   package" name the protected paths, the checks to run, and the commit rule of the
   project's `AGENTS.md`: one commit per package where the agent may commit, otherwise
   uncommitted. Add the risks and what is not in the plan. Done when the file exists:
   `specs/<topic>/workplan.md`, or `specs/<topic>-workplan.md` beside a one-file spec.

5. **Check.** Offer a critique. If the user accepts, call the Skill tool with "critique",
   naming the workplan and the focus "do the packages reach each stage's goal, and can
   every criterion be shown by a command". Done when the user declines, or its findings
   are settled.

Then tell the user that `/implement <workplan> <stage>` builds a stage.
