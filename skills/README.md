# Skills

Skills for planning, implementing, reviewing and explaining work in the user's projects.
The concept is `specs/skills/task.md`.

## User-invoked

Only the user starts these, as `/<name>` in Claude Code.

| Skill | What it does |
|---|---|
| `spec` | Plan a feature as a spec in `specs/`: interview, check the code, record the decisions. |
| `workplan` | Split an approved spec into stages, work packages and acceptance criteria. |
| `implement` | Implement a stage of a workplan, or a small spec, without asking, and report. |
| `revise` | Turn the user's review notes on agent-written code into fixes and lasting rules. |
| `explain` | Explain an answer, spec, plan, code, research or session in plain technical English. |
| `handoff` | Write the session into a file that a fresh agent can continue from. |
| `spike` | Try a design as a throwaway patch and measure it. |
| `setup-project` | Link the shared rules into a project by kind, and align its `AGENTS.md`, `CLAUDE.md` and tool settings. |
| `write-down` | Save the current report, review, research or discussion to a file in `specs/`. |

## Model-invoked

The user, the model or another skill starts these.

| Skill | What it does |
|---|---|
| `critique` | Harsh, independent review by two reviewer agents that discuss their findings. |
| `research` | Research papers, released code and documentation, cited, with a recommendation. |

## Conventions shared by all skills

- **Rules.** The rules are in `~/agents/rules/`. `communication.md` and `git.md` are
  user-level and load in every session; `/setup-project` links `core.md`, `python.md`
  and the modules that fit a project into its `.claude/rules/`, where Claude Code loads
  them. A harness that loads neither reads `core.md`, `communication.md` and `git.md`
  for every task, and each other file for the work its title names. The skills point at
  a rule by file and section and do not change the rules.
- **Files** go into the project's `specs/`, which is usually git-ignored and exists only
  in the main checkout.
- **Tiers.** A subagent role names a tier and an effort, not a model:

  | Tier | Claude Code |
  |---|---|
  | strong | Opus 5.5 (`opus`) |
  | middle | Sonnet 5.5 (`sonnet`) |
  | cheap | Haiku 5.5 (`haiku`) |

  The coordinating agent is the session's model. Fable 5.1 is used only when the user
  asks for it.
- **Roles.** The skills name their subagents by role. In Claude Code each role is an
  agent definition in `~/agents/.claude/agents/`, which sets its model, effort and
  tools:

  | Role | Used by | Tier | Effort | Tools |
  |---|---|---|---|---|
  | `reviewer-strong` | `critique` | strong | high | read, search, commands, web; no edits |
  | `reviewer-middle` | `critique`, and the critic in `implement` | middle | high | read, search, commands, web; no edits |
  | `implementer` | `implement` | strong | medium | all |
  | `fact-finder` | `spec`, any skill | middle | medium | read, search |
  | `locator` | any skill | cheap | low | read, search |
  | `paper-reader` | `research` | middle | medium | read, search, commands, web |
  | `code-checker` | `research` | strong | high | read, search, commands, web |
- **Without subagents.** Where a harness cannot start subagents, the coordinating agent
  does the subagent steps itself, in sequence, and its report says that the reviewers
  were not independent. Where a subagent cannot be continued, a new one is started with
  the earlier findings.
- **Invocation.** A skill starts another, model-invoked skill with "call the Skill tool
  with …". A user-invoked skill is never started this way; the skill tells the user to
  run it.

## Installation

Claude Code: run `scripts/install.sh` once per machine, and again after adding or removing
a skill or an agent. It links the user-level rules, every skill and every agent into
`~/.claude/`.

A user-invoked skill carries `disable-model-invocation: true` in its frontmatter for
Claude Code, and `policy.allow_implicit_invocation: false` in `agents/openai.yaml` for
Codex. In Claude Code 2.1.299, `opus`, `sonnet` and `haiku` resolve to the 5.5 models.
