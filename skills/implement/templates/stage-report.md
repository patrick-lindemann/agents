# Stage <n>: <Name> — report

Goal of the stage: <goal>. Spec: <[spec.md](spec.md) | concept
[stages/<n>-<name>/concept.md](../stages/<n>-<name>/concept.md)>. Packages: <from
[workplan.md](../workplan.md) | drafted by `implement`, below>.

Living document. Branch `<branch>`, based on `<commit>`. <Committed per package and
for the review fixes | Nothing is committed; the user commits.>

## User review

Filled after the user's review, by `revise`.

| # | Objection | Origin | State |
|---|---|---|---|

## Summary for the review

State on <date>: <one or two sentences, including whether the stage goal is met>.

| Package | State | Criteria |
|---|---|---|
| <n>.1 <name> | implemented, reviewed with the stage | <k> of <m> met |

```
$ <check command>
<what it printed>
```

What needs the user, in order of weight:

1. <item>

## Gaps in the spec and provisional conventions

| # | Package | Gap or convention | What was taken | Why |
|---|---|---|---|---|

## Blockers

<Each blocker with its options and one recommended. "None" otherwise.>

## Environment findings

<What is broken outside the task, with the command and its output.>

## Decisions taken without the user

| # | Package | Decision | Reason |
|---|---|---|---|
| A1 | | | |

## Points left to the user

| # | Point | Recommended | The user's answer | State: applied, recorded, open |
|---|---|---|---|---|

## Review of the stage

Reviewer: `reviewer-strong`, on the diff since `<commit>`.

| # | Severity | Package | Finding | Response: fixed, rejected with reason, or left to the user |
|---|---|---|---|---|

## Packages

Without a workplan only: the packages drafted by `implement`.

| # | Package | Delivers | Criteria of the spec it shows |
|---|---|---|---|
| <n>.1 | | | |

## Baseline

```
$ <check command>
<what it printed before any change>
```

## <n>.1 <Package name>

### Changes

| File | Change |
|---|---|

### Signatures

<The public signatures added or changed.>

### Tests

| Test | Asserts |
|---|---|

### Acceptance criteria

**1. <criterion> — met | not met**

```
$ <command>
<what it printed>
```

### Findings

<What the implementer noticed beyond the package.>

### For later packages

<What a later package needs to know.>
