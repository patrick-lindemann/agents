# agents

The source of truth for the user's agent setup: shared coding rules, skills and subagent
definitions. Other places only link here.

## Layout
- `rules/`: one module per kind of code. `communication.md` and `git.md` are user-level;
  `core.md` and `python.md` load in every Python project; the rest are linked per
  project.
- `skills/`: skills, see `skills/README.md`. `.claude/agents/`: the subagent roles.
- `scripts/install.sh`: links the user-level rules, the skills and the agents into
  `~/.claude/`. Run again after adding or removing a skill or an agent.
- `scripts/link-rules.sh <project> [module ...]`: links `core.md`, `python.md` and the
  modules into a project's `.claude/rules/`; the `setup` skill drives it.
- `specs/` (git-ignored): the old rule set and the review that replaced it.

## Writing rules

Every module linked into a project loads at the start of every session there, together
with `core.md`, `python.md` and the user-level files. No module uses `paths:`.

**Structure:**
- Write `# Title`, then `## Topic` sections. One module covers one kind of code.
- Write imperative bullets: "Name counts `num_<things>`." Give one requirement per
  bullet, or a tight group with one subject.
- Use no IDs and no MUST/SHOULD/MAY. A default reads "Prefer …"; everything else is a
  requirement. Give a subjective choice a default or an ordered decision.
- Put an exception inline: "…, except …".
- Add a reason only as one clause, and only where it lets the agent judge new cases:
  "…, so that it can be inspected in a debugger."
- Write in plain, self-contained words, and make each rule checkable by a tool, a test
  or a concrete review criterion.
- Keep each file under 200 lines, since longer files reduce adherence.

**Examples:**
- Put examples inline in backticks; a code block only where words fail, at most 6 lines.
  An example illustrates a rule and adds no requirement of its own.
- Draw examples from this vocabulary:
  - services: `User`, `Order`, `fetch_user`, `timeout` in seconds, `max_retries`;
  - ML: `Classifier`, `Sampler`/`GreedySampler`, `ImageDataset`, `num_classes`, `batch`;
  - files: `load_image`, `save_report`, `image.py`, `IMAGE_SUFFIX`;
  - math, in `numerics.md` only: `so3.exp(phi)`, `theta`, `R`.

**Placement:**
- Refer to no other module. A rule that two modules need goes into `core.md` or
  `python.md`. A specific module states its own override of `python.md`; `core.md` says
  that specific modules win. No rule contradicts one of higher precedence.
- Admit a rule only if it holds in both an ML repository and a web service. A
  convention of one project goes into that project's `AGENTS.md`.
- Write nothing that ruff, the type checker or the settings enforce;
  `skills/setup/templates/pyproject-tools.toml` lists what they enforce. Write
  nothing a model does by default; keep a line only if it answers an observed failure.
- Keep maintainer notes in block `<!-- -->` comments, which Claude Code strips.

## Git
- The agent does not commit unless the user asks; the user pushes.
