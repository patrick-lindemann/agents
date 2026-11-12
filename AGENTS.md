# agents

The source of truth for the user's agent setup: shared coding rules, skills and subagent
roles, for Claude Code, Codex and Pi. Other places only link here or hold generated
copies. Nothing in it is specific to one machine.

## Layout
- `rules/`: `common.md` holds the rules for all work, one file per language
  (`python.md`, …) the rules of that language with a section per kind of code, and
  `changelog.md` the rules of a file that marks a task.
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

`common.md` has no frontmatter and loads at the start of every session; keep it short.
Every other file starts with `paths:` frontmatter, a list of globs relative to the project
root, and loads only when a matching file is read or edited: `**/*.py` for `python.md`.
Each language is one file (`python.md`, later `typescript.md`, `elixir.md`): first the
section "All <language> code", then one section per kind of code (libraries, tests,
scripts, scientific code …) that opens with the code it applies to, so that the model
ignores it elsewhere. Split a file only where the globs that load it differ by language.
A rule that holds for every language goes into `common.md`, and a language file adds only
what is specific to it: `common.md` says what a comment may say, `python.md` the
docstring format. Every harness loads a file without `paths:` in every session, so the
rules of a task that no file marks, such as a release, go next to the skill that runs it
(`skills/release/rules/release.md`), not into `rules/`.

**Structure:**
- Write `# Title`, then `## Kind of code` sections with `### Topic` subsections.
- Write imperative bullets: "Name counts `num_<things>`." Give one requirement per
  bullet, or a tight group with one subject.
- Use no IDs and no MUST/SHOULD/MAY. A default reads "Prefer …"; everything else is a
  requirement. Give a subjective choice a default or an ordered decision.
- Put an exception inline: "…, except …".
- Add a reason only as one clause, and only where it lets the agent judge new cases:
  "…, so that it can be inspected in a debugger."
- Write in plain, self-contained words, and make each rule checkable by a tool, a test
  or a concrete review criterion.
- Keep each section short; a language file loads whole, so every line costs tokens in
  every session that touches the language.

**Examples:**
- Put examples inline in backticks; a code block only where words fail, at most 6 lines.
  An example illustrates a rule and adds no requirement of its own.
- Draw examples from this vocabulary:
  - services: `User`, `Order`, `fetch_user`, `timeout` in seconds, `max_retries`;
  - ML: `Classifier`, `Sampler`/`GreedySampler`, `ImageDataset`, `num_classes`, `batch`;
  - files: `load_image`, `save_report`, `image.py`, `IMAGE_SUFFIX`;
  - math, in the scientific section only: `so3.exp(phi)`, `theta`, `R`.

**Placement:**
- Refer to no other file. A rule that two sections need goes into `common.md` or the
  "All <language> code" section. A section for a kind of code states its own override:
  "Overriding "All Python code", …"; `common.md` says that such sections win. No rule
  contradicts one of higher precedence.
- Admit a rule only if it holds in both an ML repository and a web service. A
  convention of one project goes into that project's `AGENTS.md`.
- Write nothing that ruff, the type checker or the settings enforce;
  `skills/setup/templates/pyproject-tools.toml` lists what they enforce. Write
  nothing a model does by default; keep a line only if it answers an observed failure.
- Keep maintainer notes in block `<!-- -->` comments, which Claude Code and the Codex
  hook strip.

## Git
- The agent does not commit unless the user asks; the user pushes.
