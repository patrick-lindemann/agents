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
| `setup` | Align a project's `AGENTS.md`, `CLAUDE.md` and tool settings with the shared rules; on a project already set up, bring them up to date. |

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

- **Rules.** The rules are in `~/agents/rules/`: `common/` loads in every session, a
  language folder such as `python/` when a matching file is read or edited (see
  "Installation"). The skills point at a rule by file and section and do not change the
  rules.
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
skill or a role, or after changing a role. The skills always go
into `~/.agents/skills/`. The rest goes to each harness that is installed, that is whose
command is on `PATH` or whose config directory exists, or to those given with
`--harness claude,codex,pi`; a harness that is not installed is skipped, and its
directory is not created:

| | Claude Code | Codex | Pi |
|---|---|---|---|
| Skills | `~/.claude/skills/` | `~/.agents/skills/` | `~/.agents/skills/` |
| Roles | `~/.claude/agents/*.md` | `~/.codex/agents/*.toml` | `~/.pi/agent/agents/*.md` |
| Rules | `~/.claude/rules/agents` | hooks in `~/.codex/hooks.json` | `pi-claude-rules`, from `~/.claude/rules/agents` |

It also links `~/agents` to the checkout, so the skills find the rules and templates
wherever it is. Rules need no install step after an edit: every harness reads them from
the checkout.

How rules load:
- **Claude Code** loads `~/.claude/rules/` natively: a rule without `paths:` at the start
  of a session, one with `paths:` when a matching file is read or edited. Globs match the
  path relative to the working directory.
- **Pi** reads the same folder through the extension `@jordyvanvorselen/pi-claude-rules`,
  pinned in `install.sh`, with `bashActivation` on (`harnesses/pi/claude-rules.json`). A
  matching read, by the read tool or a reading bash command, gets the rules in its result;
  the first edit, write or other bash command on a matching file is blocked until the
  rules have reached the model. Pi subagents load the extension through
  `subagentOnlyExtensions` in their role file.
- **Codex** runs `harnesses/codex/rules-hook.mjs`: `SessionStart` and `SubagentStart` give
  the rules without `paths:`; `PreToolUse` blocks the first `apply_patch` or shell
  command on a matching file and puts its rules into the context (`additionalContext`, up
  to 12,000 tokens per hook in `hooks.json`; a block reason would be cut at about 2,500).
  Run `/hooks` in Codex once to trust the hooks; until then Codex loads no rules.
- After a compaction, each harness delivers the rules again on the next match.
- Rules load only for files inside the working directory. Throwaway scripts go to a
  scratch directory outside the project (`common/shell.md`), so they load no language
  rules.
- A shell command counts when it names the file: as an argument that exists, or, in
  Codex, as the target of `>`. A path built at run time (`$dir/a.py`), or a file a script
  writes, is not seen.

A user-invoked skill carries `disable-model-invocation: true` in its frontmatter for
Claude Code and Pi, and `policy.allow_implicit_invocation: false` in `agents/openai.yaml`
for Codex.
