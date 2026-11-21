# agents

The source of truth for the user's agent setup: shared coding rules, skills and subagent
roles, for Claude Code, Codex and Pi. Other places only link here or hold generated
copies. Nothing in it is specific to one machine.

## Layout
- `rules/`: one folder per context, each with a base file `common.md`. `shared/` holds
  the rules for all work in `common.md`, for all code in `code.md`, and `docs.md` and
  `changelog.md` for the files that mark a task. One folder per language (`python/`,
  later `typescript/`) holds the rules for all its code in `common.md` and one file per
  kind of code (`tests.md`, `cli.md`, …).
- `skills/`: skills, see `skills/README.md`. Write them for every harness: no tool name
  of one harness, only the words its "Harness words" table maps.
- `roles/`: the subagent roles, one neutral file each: `name`, `description`, `tier`
  (strong, middle, cheap), `effort`, `tools` (`all`, or groups of read, search,
  commands, web, edit).
- `models.local.json` (git-ignored, optional): models for the tiers on this machine; see
  `skills/README.md`. Without it, every role runs on the session's model.
- `adapters/`: the code that connects each harness to the rules, one folder per harness
  named after its own terms. `adapters/codex/hooks/`: the Codex hooks that load the
  rules, and the script that registers them. `adapters/pi/extensions/rules/`: the Pi
  extension that loads the rules.
- `scripts/install.py [--harness claude,codex,pi]`: links `~/agents` to this checkout,
  generates the role files per harness into `dist/` (git-ignored) and each user-invoked
  skill's `agents/openai.yaml` for Codex (committed), and installs the skills, roles and
  rule loading for each harness; see `skills/README.md`. The git hooks it installs run
  it after every pull; run it by hand after changing a skill's frontmatter or a role,
  and commit the `agents/openai.yaml` it changes.
- Scripts and hooks are Python 3.10 standard library only, run with `python3`. Use no
  uv in this repository: no `uv run`, no PEP 723 metadata. `pyproject.toml` holds only
  the ruff and ty settings that pin Python 3.10, and no `[project]`. The Pi extension is the
  only code that is not Python: Pi loads only TypeScript, on its own Node.js.
- `specs/` (git-ignored): the old rule set and the review that replaced it.

## Writing rules

`shared/common.md` is the only file without frontmatter. It loads in every request of
every session, so keep it minimal: only what matters before a file is touched (chat,
planning, shell, git). Every other file starts with `paths:` frontmatter, a list of
globs relative to the project root, and loads only when a matching file is read or
edited: `**/*.py` for `python/common.md`. Each harness reads `rules/` recursively, so a
new folder needs no install step.

Give each language a base file `common.md` for all its code, and a file per kind of code
(library, tests, scripts, scientific code …) with the narrowest globs that reach it. A
kind that no path marks keeps the base file's globs and opens with the code it applies
to, so that the model ignores it elsewhere. A rule for all code goes into
`shared/code.md`, and a language file adds only what is specific to it: `shared/code.md`
says what a comment may say, `python/common.md` the docstring format. The rules of a
task that no file marks, such as a release, go next to the skill that runs it
(`skills/release/rules/release.md`), not into `rules/`.

**Structure:**
- Write `# Title`, then `## Topic` sections.
- Write imperative bullets: "Name counts `num_<things>`." Give one requirement per
  bullet, or a tight group with one subject.
- Use no IDs and no MUST/SHOULD/MAY. A default reads "Prefer …"; everything else is a
  requirement. Give a subjective choice a default or an ordered decision.
- Put an exception inline: "…, except …".
- Add a reason only as one clause, and only where it lets the agent judge new cases:
  "…, so that it can be inspected in a debugger."
- Write in plain, self-contained words, and make each rule checkable by a tool, a test
  or a concrete review criterion.
- Keep each section short; a file loads whole, so every line costs tokens in every
  session that touches its globs.

**Examples:**
- Put examples inline in backticks; a code block only where words fail, at most 6 lines.
  An example illustrates a rule and adds no requirement of its own.
- Draw examples from this vocabulary:
  - services: `User`, `Order`, `fetch_user`, `timeout` in seconds, `max_retries`;
  - ML: `Classifier`, `Sampler`/`GreedySampler`, `ImageDataset`, `num_classes`, `batch`;
  - files: `load_image`, `save_report`, `image.py`, `IMAGE_SUFFIX`;
  - math, in `python/scientific.md` only: `so3.exp(phi)`, `theta`, `R`.

**Placement:**
- Refer to no other file. A rule that two files need goes into `shared/common.md`,
  `shared/code.md` or the language's `common.md`. A file for a kind of code states its
  own override: "Overriding the general Python rules, …"; `shared/common.md` says that
  such rules win. No rule contradicts one of higher precedence.
- Admit a rule only if it holds in both an ML repository and a web service. A
  convention of one project goes into that project's `AGENTS.md`.
- Write nothing that ruff, the type checker or the settings enforce;
  `skills/setup/templates/pyproject-tools.toml` lists what they enforce. Write
  nothing a model does by default; keep a line only if it answers an observed failure.

## Git
- The agent does not commit unless the user asks; the user pushes.
