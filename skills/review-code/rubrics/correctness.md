# Correctness and security review

Audit a code change for bugs, broken behavior and security holes. Nothing may slip
through, and nothing may be reported above its weight.

## Scope
- Report only issues in code the change adds or modifies. Read the code it touches and
  its callers, but do not report old issues in code the change leaves alone.
- Trace each change through its callers and dependents across modules and packages: a
  small change in one place often breaks a feature elsewhere.
- Finish the research before you report: when you can read the other side (the backend,
  the caller, the config), read it. Never write "this breaks unless X handles it".

## What to find
- Bugs: wrong conditions, off-by-one, wrong units, unhandled `None` or empty input,
  wrong error handling, races, resources not released.
- Changed behavior that callers, saved data, configs or public APIs depend on.
- Security: injection, unsafe deserialization, path traversal, secrets in code, logs or
  messages, missing authorization, untrusted input that reaches a shell, query or file
  path.
- Broken developer setup: renamed or new environment variables, changed secret
  locations, ports or build steps, a new manual step. A new dependency installed by the
  package manager is not a breakage.
- Leaks past a feature flag or an internal-only check.
- Missing tests: a bug fix without a test that fails without it, changed behavior
  without a test.

## Weight
- A blocker breaks behavior, data or security in a likely case. A major breaks it in a
  rare case or breaks the developer setup. A minor is a defect without user impact.
- Do not report a risk the change intends (a removed feature, a removed flag) when its
  scope is contained, unless the author likely misses its effects.
- Over-reporting costs trust: rate no finding above what you traced end to end.

## Rules
- The rule files that load with the code you read are the standard. A breach that
  causes a defect is a finding here; leave other breaches to the structure review.
- A finding that asks for more validation or defensive code must hold against the
  sections Minimal code and Validation of `~/agents/rules/shared/common.md`.
- If a pull request exists and you have medium or high findings, read its discussion
  with `gh` only after your own audit. Add valid findings of others, marked as theirs.

End with a verdict: approve, or request changes, in one sentence.
