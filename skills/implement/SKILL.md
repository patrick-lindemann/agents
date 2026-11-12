---
name: implement
description: "Implement an approved spec, or a stage of a big one, without asking, then have it reviewed once and report."
argument-hint: "<spec | workplan> [stage]"
disable-model-invocation: true
---

Build an approved spec, or one stage of a big spec, package by package, without the
user. You are the coordinating agent: an implementer subagent writes each package, one
reviewer checks the whole stage at the end, and you keep the report and make the
commits. The spec decides; the implementation follows it and reports every place where
the spec was not enough.

Arguments: the path of the spec, `specs/<topic>/spec.md` for a small or medium spec or
`specs/<topic>` for a big one, or of its workplan; and for a big spec the stage number.
A small or medium spec is one stage. Where a workplan exists, its packages are used;
otherwise you draft them in step 1.

## Rules

The user started this skill, so these rules are the user's instructions and rank above
the project's `AGENTS.md` and the rules in `~/agents/rules/`.

- **Follow the spec.** Build what the package names, in the project's formats and
  layout. No helpers, options or layers that the package does not need; no code modelled
  on what the spec or `AGENTS.md` calls legacy.
- **Open questions.** Stop and ask the user with the question tool when the design looks
  wrong, a criterion cannot be met, a failing test looks like a bug in the source, or a
  step would touch a protected path (`common.md`, Decisions). Otherwise take the
  conservative option, record it under "Decisions taken without the user", and list the
  gap under "Gaps in the spec".
- **Conventions.** Where the spec lacks a new file format, naming scheme, directory
  layout or config key, settle it provisionally and list it under "Provisional
  conventions" for the user to decide. This departs from `common.md` ("Propose, don't
  settle") by the user's instruction.
- **Review findings.** A finding that asks for more validation, defensive code or
  abstraction is weighed against `common.md`, sections Minimal code and Validation, and
  is not adopted by default.
- **Commits** follow the project's `AGENTS.md` and `common.md`, section Git: one commit per package,
  once its checks pass, and one for the fixes from the stage review, where the agent may
  commit. Elsewhere the work stays uncommitted, and the report lists its files.
- **Subagents** get the spec, the package, the rule files of their task, the protected
  paths and the commit rule. Check their claims before building on them.
- **The question tool** is the harness's tool for structured questions (see
  `~/agents/skills/README.md`): at most 4 questions per call, 2 to 4 options each, your
  recommendation first with "(Recommended)" in its label and the reason in its
  description. Where no such tool exists, number the questions in text, each with its
  recommended answer, worded so that "yes" accepts it.

## Steps

1. **Baseline.** Read the spec, the workplan if there is one,
   `~/agents/rules/common.md`, the rule files for the code the stage touches, and
   the project's `AGENTS.md`. Create the report from
   `~/agents/skills/implement/templates/stage-report.md`, or continue the existing one,
   and note the commit the stage starts from. Without a workplan, draft the packages of
   the stage into the report's "Packages": one for a small spec, otherwise one concern
   per package, each with what it delivers and the spec's criteria it shows, which
   together cover all of them. A wide mechanical change goes in three packages: add the
   new form beside the old, move the callers over, remove the old form. Do not ask the
   user about the packages. Run the project's checks.
   Done when the packages and each check command and what it printed are in the report.

2. **Packages.** For each package, in order, and only once the one before is finished:
   1. **Build.** Start an `implementer` subagent (strong tier, medium effort). It reads
      the package, the concept and the code it touches, builds the package, and adds or
      updates the tests of changed behaviour. It shows each acceptance criterion with
      the command and what it printed. Done when every criterion is shown or marked as
      not met.
   2. **Close.** Check the implementer's claims, run the checks, complete the package's
      section of the report, and commit the package or list its files. Done when the
      section is complete and the checks pass, or their failure is reported.

3. **Review.** Once every package is closed, run the skill "critique",
   argument `stage`, on the diff of the stage since its starting commit, together with
   uncommitted changes. Give the findings to an implementer subagent: continue the last
   one, or start one with the report. It answers each finding: fixed, rejected with the
   reason, or left to the user. Check the fixes, run the checks, and commit the fixes or
   list their files. Done when every finding has an answer in "Review of the stage" and
   the checks pass, or their failure is reported.

4. **Summary.** Write the summary at the top of the report: the state of every package
   and criterion, the check output, the gaps and provisional conventions, the decisions
   taken without the user, the points left to the user. Give the summary in the chat.
   Done when the summary is current and in the chat.

5. **Decide.** Ask the user, with the question tool, about the provisional conventions,
   the findings left to the user and the other points left to the user, the most
   consequential first. Where several are of one kind, group them into one question.
   Record each answer in the report beside its point. An answer that changes code
   inside the stage goes to an implementer subagent, then through the checks and a
   commit as in step 3; any other goes into "Points left to the user" as open. Then ask
   the user to review the stage. Done when every point has an answer or is marked open.

The report is `specs/<topic>/report.md` for a small or medium spec, and
`specs/<topic>/reports/stage-<n>.md` for a stage of a big one. After the review, `/revise` turns the user's notes into fixes.
