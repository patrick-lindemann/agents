# Skills

Skills for planning, implementing, reviewing and explaining work in the user's projects.
The concept is `specs/skills/task.md`.

## User-invoked

Only the user starts these: `/<name>` in Claude Code, `$<name>` in Codex,
`/skill:<name>` in Pi.

| Skill | What it does |
|---|---|
| `spec` | Plan work as a small, medium or big spec in `specs/`: check the code, interview, record the decisions. The size is an argument or chosen by the agent. |
| `workplan` | Optional: split an approved medium or big spec into work packages for the user to approve first. |
| `implement` | Implement an approved spec, or a stage of a big one, without asking, from its workplan or from packages it drafts itself; one review per stage, then decision prompts and a report. |
| `revise` | Turn the user's review notes on agent-written code into fixes and lasting rules. |
| `explain` | Explain an answer, spec, plan, code, research or session in plain technical English. |
| `handover` | Give the session as a prompt in the chat that a fresh agent can continue from; `file` also saves it. |
| `spike` | Try a design as a throwaway patch and measure it. |
| `release` | Prepare a release: version, changelog, checks and commit, then the release pull request or the push and tag commands. |
| `setup` | Link the shared rules into a project by kind, and align its `AGENTS.md`, `CLAUDE.md` and tool settings; on a project already set up, bring it up to date. |

## Model-invoked

The user, the model or another skill starts these.

| Skill | What it does |
|---|---|
| `critique` | Harsh, independent review by two reviewer agents that discuss their findings. |
| `research` | Research papers, released code and documentation, cited, with a recommendation. |
| `save` | Save the current report, review, research or discussion to a file in `specs/`, when the user asks. |

## Conventions shared by all skills

The skills run in Claude Code, Codex and Pi. They name no tool of one harness; the
tables below map their words to each harness.

- **Rules.** The rules are in `~/agents/rules/`. `communication.md`, `git.md` and
  `shell.md` are user-level and load in every session: Claude Code links them into
  `~/.claude/rules/`, Codex and Pi get them in a generated block of their user
  `AGENTS.md`. `/setup` links `core.md`, `python.md` and the modules that fit a project
  into its `.claude/rules/` for Claude Code, and lists them, with when to read each, in a
  generated block of the project's `AGENTS.md` for the others. The skills point at a rule
  by file and section and do not change the rules.
- **Files** go into the project's `specs/`, which is usually git-ignored and exists only
  in the main checkout. A skill's templates are in `~/agents/skills/<skill>/templates/`.
- **Harness words.** What a skill says, and what it is in each harness:

  | The skills say | Claude Code | Codex | Pi |
  |---|---|---|---|
  | the question tool | AskUserQuestion | none: numbered questions in text | `ask_user_question` |
  | run the skill "x" | the Skill tool | read `~/agents/skills/x/SKILL.md` and follow it | read `~/agents/skills/x/SKILL.md` and follow it |
  | start a `role` subagent | the Agent tool, `subagent_type: role` | spawn the custom agent `role` | the `subagent` tool, `agent: role` |
  | the user runs `/x` | `/x` | `$x` | `/skill:x` |

- **Tiers.** A subagent role names a tier (strong, middle, cheap) and an effort, not a
  model. By default every role runs on the session's model at its effort, so the repository
  names no model and needs no update when the models change. To pin a tier on one
  machine, write the git-ignored `models.local.json` and run `install.sh`:
  `{"claude": {"cheap": "haiku"}, "pi": {"middle": "openai-codex/gpt-6.1-terra"}}`. A
  tier without an entry stays on the session's model.
- **Roles.** The skills name their subagents by role. Each role is one file in
  `~/agents/roles/` with a tier, an effort and tool groups; `scripts/build.py` turns it
  into an agent definition per harness:

  | Role | Used by | Tier | Effort | Tools |
  |---|---|---|---|---|
  | `reviewer-strong` | `critique`, and the stage review in `implement` | strong | high | read, search, commands, web; no edits |
  | `reviewer-middle` | `critique` | middle | high | read, search, commands, web; no edits |
  | `implementer` | `implement` | strong | medium | all |
  | `fact-finder` | `spec`, any skill | middle | medium | read, search |
  | `locator` | any skill | cheap | low | read, search |
  | `paper-reader` | `research` | middle | medium | read, search, commands, web |
  | `code-checker` | `research` | strong | high | read, search, commands, web |

  Codex has no tool list per agent: a role without edits is told to change no file, and
  runs in the parent's sandbox. In Pi, a role with web tools runs in the background by
  default, since only a background subagent loads the installed `pi-web-access`.
- **Without subagents.** Where a harness cannot start subagents, the coordinating agent
  does the subagent steps itself, in sequence, and its report says that the reviewers
  were not independent. Where a subagent cannot be continued, a new one is started with
  the earlier findings.
- **Invocation.** A skill starts another, model-invoked skill with "run the skill …". A
  user-invoked skill is never started this way; the skill tells the user to run it.

## Installation

Run `~/agents/scripts/install.sh` once per machine, and again after adding or removing a
skill or a role, or after changing a role or a user-level rule. The skills always go
into `~/.agents/skills/`. The rest goes to each harness that is installed, that is whose
command is on `PATH` or whose config directory exists, or to those given with
`--harness claude,codex,pi`; a harness that is not installed is skipped, and its
directory is not created:

| | Claude Code | Codex | Pi |
|---|---|---|---|
| Skills | `~/.claude/skills/` | `~/.agents/skills/` | `~/.agents/skills/` |
| Roles | `~/.claude/agents/*.md` | `~/.codex/agents/*.toml` | `~/.pi/agent/agents/*.md` |
| User-level rules | `~/.claude/rules/` | block in `~/.codex/AGENTS.md` | block in `~/.pi/agent/AGENTS.md` |

It also links `~/agents` to the checkout, so the skills find the rules and templates
wherever it is.

A user-invoked skill carries `disable-model-invocation: true` in its frontmatter for
Claude Code and Pi, and `policy.allow_implicit_invocation: false` in `agents/openai.yaml`
for Codex.
