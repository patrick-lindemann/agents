---
name: spike
description: "Try a design as a throwaway patch and measure it, before it goes into a spec."
argument-hint: "<design question>"
disable-model-invocation: true
---

Answer one design question with a throwaway implementation, and measure it, before the
design goes into a spec. Use it for a design whose cost matters (speed, size,
complexity), and for a behaviour before its rules are written into a spec. The working
tree of the project stays unchanged.

Argument: the design question.

## Steps

1. **Question.** Write down the question and what is measured: lines added and removed,
   the tests, and where speed matters the timings of the first and of later calls. Done
   when this is in the chat.

2. **Build.** Clone the repository at `HEAD` into the scratch directory (`common.md` in
   `~/agents/rules/`, section Shell) and build the design there, as small as answers the
   question. Run the tests that it touches. Done when `git diff HEAD` in the clone gives
   a patch that applies to the project's `HEAD`.

3. **Measure.** Write a checks script that prints the examples and the timings, and run
   it with uv in the clone. Done when its output is recorded.

4. **Report** in the chat: the answer to the question, the numbers, and the alternatives
   that lost, each with the reason. Then save the patch and the script next to the spec,
   in the project's `specs/` (it exists only in the main checkout):
   `specs/<topic>/<name>-spike.patch` and `specs/<topic>/<name>-checks.py`. Done when
   both files exist and their paths are in the chat.
