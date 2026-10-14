---
name: research
description: "Research papers, released code and documentation, to answer how to implement something or to survey the state of the art for a model. Cited, with a recommendation. Use when the user asks for research, papers, the state of the art, or how a published method is implemented."
argument-hint: "<question>"
---

Answer a question from primary sources: papers, the authors' released code, and
documentation. Two cases:

- **how to implement**: how do we implement this, which may need current research;
- **survey**: the state of the art for a model that the user wants to implement.

Argument: the question. Run in the background where the harness allows, so that the user
can keep working. Write as `communication.md` in `~/agents/rules/` says.

## Roles

| Role | Does | Tier | Effort |
|---|---|---|---|
| you, the coordinating agent | plan, check, compare | strong | high; `xhigh` for a survey |
| `paper-reader` | reads one paper or one repository | middle | medium |
| `code-checker` | checks released code against its paper | strong | high |

## Steps

1. **Question.** Write down the question, the decision it feeds, and for a survey the
   criteria for including a paper. Done when this is in the chat.

2. **Search and read.** Search arXiv, OpenReview, conference proceedings, the authors'
   code and its documentation. Start one `paper-reader` subagent per paper or
   repository. Each returns claims, numbers and code facts, each with its source:
   section, table, figure, or file and line at a commit. Done when every candidate is read, or excluded with the
   reason.

3. **Describe** each method:
   - what problem it solves and what it proposes;
   - how it works, with formulas in plain text (`theta = |phi|`);
   - what it needs: data, compute, code, licence;
   - its reported results, with table or figure numbers;
   - its pros and cons;
   - how it would be implemented in this project.

   Done when every field is filled, or marked as unknown.

4. **Released code.** Where the implementation matters, start a `code-checker` subagent
   that compares the released code with the paper: components switched off, defaults
   that differ, indices or shapes that do not match. Done when each difference cites the code
   at a commit and the paper's section.

5. **Verify.** Check the claims of the subagents against their sources. Done when every
   claim has a source or is marked unverified, and the sources are kept apart from your
   judgement.

6. **Report** in the chat, in full:
   1. the answer and your recommendation for the user's case, first;
   2. a comparison table of the methods;
   3. each method with the fields of step 3;
   4. the differences between papers and released code;
   5. the unverified claims;
   6. the references: arXiv links with version, code at a commit, section, table and
      figure numbers.

   Done when the report is in the chat. A file is written only when the user runs
   `/write-down`, by default to `specs/research/<topic>.md`; say so in one line at the
   end.
