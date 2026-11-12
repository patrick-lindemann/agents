---
paths:
  - "**/*.{py,pyi,ipynb,ts,tsx,js,jsx,mjs,cjs,ex,exs,rs,go,java,kt,swift,c,h,cc,cpp,hpp,cu,cs,rb,php,scala,lua,jl,sh,bash,zsh,sql}"
---
# Code

## Tests and checks
- Test changed behavior; a bug fix gets a test that fails without it.
- `src/` is the specification: "fix the tests" means changing the tests. Change a test
  only where the task changes what it checks.
- Before finishing, run the language's formatter and linter on the changed files only,
  then the checks `AGENTS.md` names; fix the failures you caused, report the others with
  their output.

## Comments and API documentation
- Comment only reasons the code cannot show, as a full sentence above the code:
  `# Checked before the first request, so that nothing is sent for an invalid config`.
  Allowed besides: a terse label over a section of a long body, a short identity at the
  line's end.
- Write no dividers or banners, no commented-out code, and no comment that restates the
  code, the name or the type.
- Never mention in a comment the code's history ("previously", "now"), the task, the
  conversation, or modules the code is independent of.
- Write no `TODO` or `FIXME` unless the user asked; report open work instead.
- Document the contract of a public function, class or type (inputs, result, errors),
  not its implementation, in the language's standard format, and never only restate the
  name, base class or signature.
- Write documentation and comments as plain sentences without semicolons.
