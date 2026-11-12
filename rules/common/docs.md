# Comments and docs

## Comments
- Comment only reasons the code cannot show, as a full sentence above the code, except a
  terse label over a section of a long body or a short identity at the line's end:
  `# Checked before the first request, so that nothing is sent for an invalid config`.
- Write no divider or banner comments (`# ---- helpers ----`, `// ======`), no commented-out
  code, and no comment that restates the code, the name or the type.
- Never mention in a comment modules the code is independent of, the history of the code
  ("previously", "now"), the task, or the conversation that led to it.
- Mark nothing as `TODO` or `FIXME` unless the user asked for it; report open work
  instead.

## API documentation
- Document the contract of a public function, class or type (inputs, result, errors),
  not its implementation, in the language's standard format.
- Write documentation and comments as plain sentences, without semicolons: split joined
  clauses into sentences.
- Write no documentation that only restates the name, base class or signature.

## User documentation
- Keep user docs (`README.md`, `docs/`) short, without a code tour. Update the docs of a
  language users write (config syntax, command line) in the same commit as the change.
- Write in plain words and the codebase's vocabulary. Show a command or snippet only
  where words fail.
