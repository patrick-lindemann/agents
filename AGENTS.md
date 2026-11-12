# agents

The source of truth for the user's agent setup: shared coding rules, skills and subagent
roles, for Claude Code, Codex and Pi. Other places only link here or hold generated
copies. Nothing in it is specific to one machine.

## Layout
- `rules/`: `common/` holds the rules for all work; one folder per language
  (`python/`, …) holds a module per kind of code; `workflows/` holds the rules of a task
  that a file marks, such as `CHANGELOG.md`.
- `skills/`: skills, see `skills/README.md`. Write them for every harness: no tool name
  of one harness, only the words its "Harness words" table maps.
- `roles/`: the subagent roles, one neutral file each: `name`, `description`, `tier`
  (strong, middle, cheap), `effort`, `tools` (`all`, or groups of read, search,
  commands, web, edit).
- `models.local.json` (git-ignored, optional): models for the tiers on this machine; see
  `skills/README.md`. Without it, every role runs on the session's model.
- `harnesses/codex/`: the Codex hooks that load the rules, and the script that registers
  them. `harnesses/pi/claude-rules.json`: the settings of Pi's rules extension.
- `scripts/build.py`: generates the role files per harness into `dist/` (git-ignored).
- `scripts/install.sh [--harness claude,codex,pi]`: links `~/agents` to this checkout,
  and installs the skills, roles and rule loading for each harness; see
  `skills/README.md`. Run again after adding or removing a skill or a role, or after
  changing a role.
- `specs/` (git-ignored): the old rule set and the review that replaced it.

## Writing rules

The files in `common/` have no frontmatter and load at the start of every session; keep
them short. Every other module starts with `paths:` frontmatter, a list of globs relative
to the project root, and loads only when a matching file is read or edited: `**/*.py`
for `python/python.md`. A module that applies to only part of a language's code, such as
`scientific.md`, says so in its first line, so that the model ignores it elsewhere. Put a
new language in its own folder. A rule that holds for every language goes into
`common/`, and the language folder adds only what is specific to it: `common/docs.md`
says what a comment may say, `python/python.md` the docstring format. Every harness
loads a module without `paths:` in every session, so the rules of a task that no file
marks, such as a release, go next to the skill that runs it
(`skills/release/rules/release.md`), not into `rules/`.

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
- Refer to no other module. A rule that two modules need goes into `core.md` or the
  language module (`python.md`). A specific module states its own override of the
  language module; `core.md` says that specific modules win. No rule contradicts one of
  higher precedence.
- Admit a rule only if it holds in both an ML repository and a web service. A
  convention of one project goes into that project's `AGENTS.md`.
- Write nothing that ruff, the type checker or the settings enforce;
  `skills/setup/templates/pyproject-tools.toml` lists what they enforce. Write
  nothing a model does by default; keep a line only if it answers an observed failure.
- Keep maintainer notes in block `<!-- -->` comments, which Claude Code and the Codex
  hook strip.

## Git
- The agent does not commit unless the user asks; the user pushes.
