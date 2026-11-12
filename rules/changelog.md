---
paths:
  - "**/CHANGELOG.md"
---
# Changelog

- Follow Keep a Changelog and Semantic Versioning: `## [Unreleased]` at the top, then
  `## [<version>] - <date>` sections with `### Added`, `### Changed`, `### Fixed` and
  `### Removed`, and the release links at the bottom.
- Create `## [Unreleased]` where it is missing. Internal refactors, tests and CI changes
  get no line.
- Describe the change as a user sees it, with the old behavior where that helps:
  "`load_image` accepts a `str` path as well as a `Path`. It raised a `TypeError`."
