---
name: release
description: "Prepare a release: pick the version, update the changelog and version files, commit, and open the release pull request or hand over the push and tag commands."
argument-hint: "[version]"
metadata:
  short-description: "Prepare a release commit and its pull request"
disable-model-invocation: true
---

Prepare a release of the current project up to the step that publishes it, which stays
with the user: merging the release pull request, pushing `main`, and tags.

Argument: the version. Without it, pick one in step 2.

Read `~/agents/rules/shared/common.md`, `~/agents/rules/shared/changelog.md`,
`~/agents/skills/release/rules/release.md`, the project's `AGENTS.md`, and its `CONTRIBUTING.md` if
there is one. The project's release section wins over the defaults: the flow, release
candidates, the files, extra steps, the commit message and who tags.

## Steps

1. **State.** Name the flow and the release branch: the integration branch, or `main`.
   Check that it is checked out, that `git status --short` is empty, and that it is
   level with its remote after `git fetch`. Find the last release tag `v<previous>`. Stop
   and report what is wrong otherwise. Done when the flow, the branch and `v<previous>`
   are in the chat.

2. **Version.** Read `## [Unreleased]` in `CHANGELOG.md` and `git log
   v<previous>..HEAD`. Pick the version as `release.md` says. Name the version and the
   entries that decide it. A version given as argument is checked the same way; where
   it differs from yours, ask the user with the question tool. Done when the version is
   set.

3. **Candidate.** Only where the project makes release candidates. If no tag
   `v<version>-rc<N>` exists on the release branch, or the user has not confirmed the
   last one, give the commands that tag the next candidate on the branch's last commit
   and push the tag, and stop: the user tags, tries the candidate, and runs `/release`
   again. Done when a candidate exists and the user confirmed it.

4. **Prepare.**
   - Set the version with the language's tool (`release.md`).
   - In `CHANGELOG.md`, rename `## [Unreleased]` to `## [<version>] - <date>` and leave
     an empty `## [Unreleased]` above it. Check each line against the log: add a
     user-visible change that is missing, drop a line whose change is not in the log, and
     name both. Update the links at the bottom: `[Unreleased]` compares from
     `v<version>`, and `[<version>]` compares `v<previous>` with `v<version>`.
   - Replace `@v<previous>` by `@v<version>` in the install lines of the README and the
     docs.
   - Do the extra steps of the project's release section.

   Done when the files are changed and every change is named in the chat.

5. **Check.** Run every check command of the project's `AGENTS.md`, and the release
   check of its CI where it has one, such as `.github/scripts/check_release.sh`, so that
   the pull request does not fail on it. Fix nothing they report beyond the release
   files; stop and report a failure. Done when each command and what it printed is in
   the chat and they pass.

6. **Commit.** Stage exactly the changed files, check `git diff --cached --name-only`,
   and commit with the project's message, by default the one `release.md` names for the
   flow. Done when `git log -1 --stat` is in the chat.

7. **Hand over.**
   - **Pull request flow**: push the release branch with `git push`. Write the
     version's changelog section to a file in the scratch directory and open the pull request
     with `gh pr create --base main --head <branch> --title "Release <version>"
     --body-file <file>`. Give its URL, and tell the user to merge it with a merge
     commit once CI passes. Where the project's CI tags the merge, name the workflow and
     how to see its result: `gh run list --workflow <file>` and
     `gh release view v<version>`. Otherwise give the tag commands for after the merge:
     `git fetch origin`, `git tag v<version> origin/main`, `git push origin v<version>`.
   - **Direct flow**: give the commands `git push origin main`,
     `git tag v<version>` and `git push origin v<version>`.

   Done when the URL or the commands are in the chat.

Report the version and why, the changelog lines added or dropped, the check output, and
what is left to the user. Where another project pins this one by tag, name the pin as a
follow-up there; do not change it.
