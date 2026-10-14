---
name: implement
description: "Implement a stage of an approved workplan, or a small spec, without asking, and report."
argument-hint: "<workplan> <stage> | <spec>"
disable-model-invocation: true
---

Build one stage of a workplan, or a small spec, package by package, without the user.
You are the coordinating agent: an implementer subagent writes each package, a critic
reviews it, and you keep the report and make the commits. The spec decides; the
implementation follows it and reports every place where the spec was not enough.

Arguments: the workplan's path and the stage number, or the path of a small spec.

## Rules

The user started this skill, so these rules are the user's instructions and rank above
the project's `AGENTS.md` and the rules in `~/agents/rules/`.

- **Follow the spec.** Build what the package names, in the project's formats and
  layout. No helpers, options or layers that the package does not need; no code modelled
  on what the spec or `AGENTS.md` calls legacy.
- **Open questions.** Stop and ask the user when the design looks wrong, a criterion
  cannot be met, a failing test looks like a bug in the source, or a step would touch a
  protected path (`core.md`, Decisions). Otherwise take the conservative option, record
  it under "Decisions taken without the user", and list the gap under "Gaps in the spec".
- **Conventions.** Where the spec lacks a new file format, naming scheme, directory
  layout or config key, settle it provisionally and list it under "Provisional
  conventions" for the user to decide. This
  departs from `core.md` ("Propose, don't settle") by the user's instruction.
- **Review findings.** A finding that asks for more validation, defensive code or
  abstraction is weighed against `core.md`, sections Minimal code and Validation, and
  is not adopted by default.
- **Commits** follow the project's `AGENTS.md` and `git.md`: one commit per package,
  once its checks pass, where the agent may commit. Elsewhere the package stays
  uncommitted, and the report lists its files.
- **Subagents** get the spec, the package, the rule files of their task, the protected
  paths and the commit rule. Check their claims before building on them.

## Steps

1. **Baseline.** Read the spec, the workplan, `core.md`, `communication.md` and
   `git.md`, the rule files for the code the stage touches, and the project's
   `AGENTS.md` and `CLAUDE.md`. Create the report from `templates/stage-report.md`, or
   continue the existing one. Run the project's checks. Done when each check command and
   what it printed is in the report.

2. **Packages.** For each package, in order, and only once the one before is finished:
   1. **Plan.** Start an `implementer` subagent (strong tier, medium effort). It reads
      the package, the concept and the code it touches, and writes its plan: the files,
      signatures and tests it intends. Done when the plan is in the report.
   2. **Critique the plan.** Call the Skill tool with "critique", argument `package`, on
      the plan. Give the findings to the implementer. Done when the implementer has
      answered every finding and the answers are in the report.
   3. **Build.** The implementer builds the package and adds or updates the tests of
      changed behaviour. It shows each acceptance criterion with the command and what it
      printed. Done when every criterion is shown or marked as not met.
   4. **Critique the result.** Call the Skill tool with "critique", argument `package`,
      on the diff. The implementer answers each finding: fixed, rejected with the
      reason, or left to the user. Done when every finding has an answer in the report.
   5. **Close.** Check the implementer's claims, run the checks, complete the package's
      section of the report, and commit the package or list its files. Done when the
      section is complete and the checks pass, or their failure is reported.

3. **Summary.** Write the summary at the top of the report: the state of every package
   and criterion, the check output, the gaps and provisional conventions, the decisions
   taken without the user, the points left to the user. Then give the summary in the
   chat and ask the user to review the stage. Done when the summary is current and the
   user is asked.

The report is `specs/<topic>/reports/stage-<n>.md`, or `specs/<topic>-report.md` for a
small spec. After the review, `/revise` turns the user's notes into fixes.
