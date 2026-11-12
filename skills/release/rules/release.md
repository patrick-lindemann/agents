# Release

<!-- Kept with the release skill, outside rules/, since every harness loads a rule
without `paths:` in every session. -->

## Flows
A project releases in one of two flows; its `AGENTS.md` or `CONTRIBUTING.md` names it,
else a `develop` branch means the pull request flow.
- **Pull request**: work happens on an integration branch, usually `develop`; `main`
  moves only by merging a pull request from it. The release is a commit
  `Prepare <version>` on the integration branch, merged as `Release <version>`.
- **Direct**: the project has only `main`; the release is a commit `Release <version>`
  on it.

## Versions and tags
- Pick the version by Semantic Versioning: a removed or changed public behaviour bumps
  the major version, or the minor one before 1.0; an addition bumps the minor version;
  fixes alone bump the patch version.
- Tags are `v<version>`, release candidates `v<version>-rc<N>`, made only where the
  project says so. The user or CI tags, never the agent.
- Set the version with the language's tool: `uv version <version>` for Python, which also
  updates `uv.lock`; `npm version <version> --no-git-tag-version` for a Node package; the
  `version` in `mix.exs` for Elixir.
