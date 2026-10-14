# <Title>: workplan

Status: <date>, <state>. The design is in [overview.md](overview.md) and the stage
concepts.

**The principle.** <Copied from the overview.>

A stage has a goal, which is something the user can do once it is finished, and a few
work packages. A package states what it delivers and the criteria by which it is
accepted.

## Stages

| # | Stage | Goal | Needs |
|---|---|---|---|
| 1 | | | none |

<Which stages are independent of each other; which wait for something outside.>

## How to work with this plan

- Branch: <the branch, and what it is created from>.
- One package is one concern for one session. Before coding, the implementer reads the
  concept, the package and the code it touches, and writes down the files, signatures
  and tests it intends. That plan is critiqued, then implemented.
- A package is accepted when each criterion is shown: the command that was run and what
  it printed.
- Each stage has one report, `reports/stage-<n>.md`, kept current while working. After
  each package a reviewer that did not write it checks it; each finding is recorded with
  its response.
- Open questions inside a stage: the implementer stops and asks when the design looks
  wrong, a criterion cannot be met, or a step would touch a protected path. Otherwise it
  takes the conservative option and records it as taken without the user.
- At the end of the stage the report opens with a summary, and the user reviews.

## Rules for every package

- Protected: <paths that are not deleted or changed; where new output goes>.
- Checks: <the commands from `AGENTS.md` that pass at the end of every package>.
- Commits: <one commit per package, one-line imperative message | nothing is
  committed; the report lists the files>.
- <Project-specific rules from the spec.>

## Stage 1: <Name>

Goal: <goal>. <Concept: link.>

### 1.1 <Package>

Delivers:
- <what exists or works afterwards>

Accepted when:
- <a criterion, shown by a command and its output>

## Built on top, later

| Extension | Attaches through | Notes |
|---|---|---|
| | | |

## Risks

| Risk | Shows in | Response |
|---|---|---|
| | <package> | |

## Not in this plan

- <work that is deliberately left out>
