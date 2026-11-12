# agents

The source of truth for the user's agent setup: shared coding rules, skills and subagent
roles, for Claude Code, Codex and Pi. Other places only link here or hold generated
copies. Nothing in it is specific to one machine.

## Layout
- `rules/`: one module per kind of code. `communication.md`, `git.md` and `shell.md` are
  user-level; `core.md` and `python.md` are linked into every Python project; the rest
  are linked per project.
- `skills/`: skills, see `skills/README.md`. Write them for every harness: no tool name
  of one harness, only the words its "Harness words" table maps.
- `roles/`: the subagent roles, one neutral file each: `name`, `description`, `tier`
  (strong, middle, cheap), `effort`, `tools` (`all`, or groups of read, search,
  commands, web, edit).
- `models.local.json` (git-ignored, optional): models for the tiers on this machine; see
  `skills/README.md`. Without it, every role runs on the session's model.
- `scripts/build.py`: generates the role files per harness into `dist/` (git-ignored),
  and the `AGENTS.md` blocks of the rules.
- `scripts/install.sh [--harness claude,codex,pi]`: links `~/agents` to this checkout,
  and installs the skills, roles and user-level rules for each harness; see
  `skills/README.md`. Run again after adding or removing a skill or a role, or after
  changing a role or a user-level rule.
- `scripts/link-rules.sh <project> [module ...]`: links `core.md`, `python.md` and the
  modules into a project's `.claude/rules/`, and lists them in a generated block of its
  `AGENTS.md`; the `setup` skill drives it.
- `specs/` (git-ignored): the old rule set and the review that replaced it.

## Writing rules

`core.md` and the user-level files load at the start of every session. The other
modules start with `paths:` frontmatter, so that Claude Code loads one only when it
reads a matching file, such as `**/*.py` for `python.md`; for Codex and Pi,
`link-rules.sh` turns the same `paths:` into "read when working on …". Give a new module `paths:`
unless it is needed without any file at hand.

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
- Keep maintainer notes in block `<!-- -->` comments, which Claude Code strips and
  `build.py` drops from the user-level rules it copies.

## Git
- The agent does not commit unless the user asks; the user pushes.
