# Structure review

Audit a code change for how it leaves the codebase: abstractions, modules, branching
and size. Working code does not pass by default. Behavior stays the same; the structure
is open to question.

## Be ambitious
- Look for the code judo move first: a reframing that makes branches, modes, flags,
  helpers or layers disappear, not one that moves them elsewhere.
- Prefer the solution that looks obvious in hindsight. Push for deleting complexity
  over rearranging it, and for a simpler idea over a cleaner version of a messy one.
- Do not settle for a rename when the problem is structural.

## What to find
- Spaghetti growth: a one-off conditional, flag or nullable mode added to an unrelated
  flow; an edge case handled in the middle of a busy function; "temporary" branching.
- The same case checked in several places, where one typed model or explicit dispatch
  would replace the checks.
- Feature logic in a shared path, or details that leak through an API. Logic in the
  wrong layer, where another module already owns the concept.
- A new helper that duplicates one the codebase already has. Search before you accept
  any new helper.
- A wrapper, pass-through layer or identity abstraction that adds indirection and
  clarifies nothing.
- Generic or magic code (reflection, catch-all parameters, string dispatch) that hides
  a simple data shape.
- A cast, `Any`, optional parameter or silent fallback that hides an unstated invariant,
  where an explicit type or boundary would simplify the control flow.
- Copied logic with small variations.
- A module that the change makes more coupled, more stateful or harder to scan.
- A file the change pushes past 1000 lines: ask for the split first.
- Related updates that can leave state half-applied; independent steps run in sequence
  where parallel would also be simpler.
- A refactor that moves code but does not reduce what a reader must hold in mind.

## Weight
- Presumed blockers, unless the material justifies them: a visible code judo move left
  out, a file pushed past 1000 lines, ad-hoc branching in an existing flow, feature
  checks spread across shared code, an abstraction or cast that makes the design more
  indirect, a duplicated helper or logic in the wrong layer.
- Major: other structural regressions and missed decompositions.
- Minor: legibility of one function. Give few minor findings and no nits while larger
  structural issues exist.
- A restructuring beyond the change is reported as outside the task.

## Rules
- The rule files that load with the code you read are the standard: naming, comments,
  docstrings, types, imports and errors. Report a breach as a minor finding, or group
  repeated breaches into one; do not restate the rules here.
- A fix must hold against the sections Minimal code and Validation of
  `~/agents/rules/shared/common.md`: no abstraction that removes nothing.

Approve only with no structural regression, no visible simplification left out, no
file pushed past 1000 lines and no spaghetti growth. End with that verdict in one
sentence.
