---
name: explain
description: "Explain an answer, spec, plan, code, research or session in plain technical English."
argument-hint: "[what] [plain | code | status]"
metadata:
  short-description: "Explain again, in plain words"
disable-model-invocation: true
---

The user did not understand something. Explain it again, shorter and plainer, with the
context that was missing. Edit no file.

Arguments: what to explain (by default your last answer), and the level:
- `plain`: no technical detail;
- `code`: with minimal code examples.

The default is `code` where the topic is code, and `plain` otherwise. With `status`,
sum up what was said in a plan, spec or session instead.

Write as section Communication of `~/agents/rules/common.md` says.

## Steps

1. **Name it.** Say in one line what you are explaining. Done when the user can see what
   is being explained.

2. **Explain.** Use ASD-STE100 Simplified Technical English: short sentences, one
   statement each, active voice, common words. Say:
   - what it is;
   - why it matters;
   - what changes;
   - what the result looks like.

   At the level `code`, add a before and after of a few lines for each idea. With
   `status`, say what is done, what is open, and what needs the user.

   Explain the meaning, not the name: a label, a file path or a function name is never
   the explanation. Define each term where it is first used, or replace it with plain
   words. Where there are options, list them with one recommendation. Done when the
   explanation fits on one screen and every term in it is defined or replaced.

3. **Check.** Ask whether it is clear, and answer the user's questions the same way. If
   the user asks to be tested, ask one to three questions per round about the material
   and correct the answers. Done when the user says it is clear.

A file is written only when the user asks for one, through the `save` skill.
