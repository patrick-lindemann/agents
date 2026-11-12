---
paths:
  - "**/CHANGELOG.md"
---
# Changelog

- Follow Keep a Changelog and Semantic Versioning: `## [Unreleased]` at the top (create
  it where missing), then `## [<version>] - <date>` with `### Added`, `### Changed`,
  `### Fixed`, `### Removed`, and the release links at the bottom.
- Internal refactors, tests and CI changes get no line.
- Describe the change as a user sees it, with the old behavior where that helps:
  "`load_image` accepts a `str` path as well as a `Path`. It raised a `TypeError`."
