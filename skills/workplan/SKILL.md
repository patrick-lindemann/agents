---
name: workplan
description: "Optionally split an approved medium or big spec into work packages for the user to approve before implementing."
argument-hint: "<path of the spec>"
disable-model-invocation: true
---

Split a spec that the user approved into stages and work packages, for the user to
approve before `implement` builds them. The workplan is optional: without one,
`implement` drafts the packages itself. It is worth it where the user wants to see the
split first, mostly for a big spec. The workplan adds no design; its criteria come from
the spec. Its extent follows the spec's size:
- **small**: no workplan. Tell the user that `/implement specs/<topic>/spec.md` builds
  it, and stop.
- **medium** (`spec.md` with "Size: medium"): one stage, whose goal is the spec's goal,
  and its packages. Leave out the stages table.
- **big** (`overview.md` and stage concepts): every stage of the overview and its
  packages.

Argument: the path of the spec folder or file.

Read `~/agents/rules/common.md`, and the project's
`AGENTS.md`.

## Steps

1. **Read.** Read the spec, the stage concepts and the code they name. Done when you know
   the size, and the stages and their goals.

2. **Draft.** Draft the packages of each stage.
   - A package is one concern for one session. It states what it **delivers**, and the
     **acceptance criteria** by which it is accepted: the spec's criteria it shows, and
     where needed a narrower one of its own. Each criterion can be shown by a command
     and what it printed.
   - Each stage states what it **needs**: earlier stages, or a release from outside.
   - A wide mechanical change goes in three packages: add the new form beside the old,
     move the callers over, remove the old form.

   Done when the packages of every stage together reach the stage's goal and show all
   of its criteria.

3. **Ask.** Show the stages and packages to the user as a numbered list, and ask with
   the question tool whether their size and order are right, with your recommendation
   first. A missing decision, a change to the list of stages, or a medium spec that
   needs more than one stage goes back to the spec: tell the user to run `/spec` on it.
   Done when the user approves the breakdown.

4. **Write.** Write the workplan from `~/agents/skills/workplan/templates/workplan.md`.
   Its "Rules for every package" name the protected paths, the checks to run, and the
   commit rule of the project's `AGENTS.md`: one commit per package where the agent may
   commit, otherwise uncommitted. Add the risks and what is not in the plan. Done when
   the file exists: `specs/<topic>/workplan.md`.

5. **Check.** Offer a critique with the question tool. If the user accepts, run the skill "critique",
   naming the workplan and the focus "do the packages reach each stage's goal, and can
   every criterion be shown by a command". Take the clear findings yourself and name
   them; ask the rest with the question tool. Done when the user declines, or its
   findings are settled.

Then tell the user that `/implement <workplan> <stage>` builds a stage of a big spec,
and `/implement <workplan>` a medium spec.
