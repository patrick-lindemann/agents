# Structure and practice review

Review code for how easy it is to understand, change and extend. Behavior stays the
same; the structure is open to question. Working code does not pass by default. Change
no file.

## Standards
- The rule files that load with the code you read are the standard for names,
  comments, docstrings, types, imports and errors, and they win over this rubric. Report
  a breach of them only as a repeated pattern, never one name at a time.
- Judge each language by its own idiom (Go's `(value, err)`, Rust's `Result`). Flag a
  deviation from the idiom, not from this rubric.
- A fix must hold against the sections Minimal code and Validation of
  `~/agents/rules/shared/common.md`: no abstraction that removes nothing.

## 1. Calibrate
- Read `AGENTS.md`, `CLAUDE.md` and the README: what the project does, who runs it, how
  far it will grow. Without a statement, assume a small team, one deployable and a life
  of a few years. Judge "too complex" and "too simple" against that.
- Find the languages and frameworks from the manifests.
- Run the project's linter and type checker with the commands from its config, task
  runner or CI. Report nothing they catch, or could catch with the current config; give
  their totals in one line.

## 2. Map the structure
- Build the internal import graph with the stack's tool, or a throwaway script in a
  temporary directory that parses the imports. Collect file sizes, fan-in and fan-out,
  cycles, imports deferred to dodge a cycle, and modules with generic names.
- Read the directory tree and the entry points (`__init__`, `index`, `main`).
- Write the layers as they are, in a few lines (`cli → services → domain ← adapters`),
  and what each top-level module owns. If you cannot, that is the first finding.
- Change test: take the most likely next change (a new endpoint, a new sampler, a new
  report type) and count the files it touches. More than two or three unrelated places
  is a finding.

## 3. Review from the top down
One structural problem explains many local ones: report it once, where it lives, and
look first for a reframing that makes branches, flags, layers or classes disappear.

**Hierarchy and coupling**
- Cycles, and deferred imports that hide them. Lower layers that import higher ones:
  domain code that imports the web framework, ORM or CLI.
- Feature conditionals in shared code: a feature plugs in, it is not checked for.
- Dumping grounds (`utils`, `helpers`, `common`, `misc`) where a concept has no name.
- God modules, imported everywhere and changed for unrelated reasons. Files over 1000
  lines, and files split by banner comments, whose banners name the missing modules.
- Hidden global state: mutable module state, singletons, config or environment read
  deep in logic instead of once at the edge.
- Inheritance deeper than two levels, or used to share code without an "is a".

**Contracts.** A caller must use a function correctly from its name and signature.
- Names that lie: a `get_*` that writes or calls the network, a `validate_*` that
  mutates, a property that does I/O.
- Boolean or mode parameters that switch behavior: split the function or use a closed
  set of options.
- Loose shapes at boundaries: untyped dicts, `Any`, pass-through `**kwargs`, casts,
  suppressions without a reason.
- Silent failure: a sentinel or empty result for an error, a fallback over a broken
  invariant, swallowed or catch-all errors, errors re-raised without their cause.
- Mutated arguments; result types that differ by branch.
- Internals used from outside their module, tests included.
- One concept with two contracts: one loader raises, another returns `None`.

**Complexity against need**
- Too much: an interface with one implementation and no test double; a registry,
  factory or plugin system with one entry; layers that only delegate; configurable
  machinery for one use; options nobody sets; concurrency, caching, reflection or
  dependency injection without a shown need.
- Too little: the same type switch in several places; copied logic with small
  variations; a helper that duplicates another; long functions that mix I/O and
  sequencing with decisions.

**Readability** beyond the linter: functions that make the reader hold many things at
once, nesting deeper than three levels, clever one-liners, more than five parameters,
control flow carried by exceptions or sentinels.

**Consistency.** For each dimension, find the dominant convention and count the
deviations: data modelling, error handling, function verbs, logging, config access,
imports, sync or async at boundaries, dependency injection, test layout and fixtures.
Argue for another convention only when the dominant one does harm.

**Tests as evidence**, not coverage: code that needs heavy mocking has its seams in the
wrong place, so name the right seam. Tests that patch internals freeze the structure.

## 4. Report

```
Verdict: APPROVE | REQUEST CHANGES: <one sentence>
Assumed use: <one line>. Languages: <…>. Already enforced: <tool> <n>, <tool> <n>.

Structure as found: <3 to 8 lines: layers, what each module owns, where it differs from the intent>
Findings: <n>. [blocker|major|minor] <path>:<lines>: <problem>. Fix: <change>. Removes: <what disappears>.
Consistency: | Dimension | Dominant convention | Deviations (count, examples) |
Proposed rules: <one per repeated finding: a linter setting, an import contract, or one rule line>
```

- Blockers first, then by how much of the codebase the fix simplifies. At most about 15
  findings; group a repeated pattern ("the same in 9 modules: …"). A structural finding
  replaces the local findings it explains. Say nothing of a dimension that is fine.
- Blocker: cycles and layer breaches, feature logic in shared paths, contracts that lie,
  swallowed errors, abstractions that add a concept and remove nothing.
- Major: god modules, files over 1000 lines, dumping grounds, mode parameters, loose
  contracts at boundaries, duplicated logic, inconsistency across the codebase.
- Minor: single names, one function's readability, comments.
- Approve only with no blockers and few, contained majors.
- Propose a rule only where a finding can recur, and only one that is not yet enabled
  or written. Write a rule line in the style of the loaded rules: one imperative,
  checkable sentence.
