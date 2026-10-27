---
name: save
description: "Save the current report, review, research or discussion to a Markdown file in specs/. Use when the user asks to save, write down or file something from the chat. Not on your own initiative."
argument-hint: "[path] [what to write]"
---

Save what was shown in the chat to a Markdown file in the project's `specs/`.

Arguments, both optional: the path, and what to write. By default, write the last
report, or the discussion since the last file was written.

## Steps

1. **Content.** Take the report as it was shown in the chat, and the user's decisions
   since then. Keep the user's words apart from your reading: "The user decided: … My
   reading: …". What the user did not agree to stays marked as a proposal. Done when
   the content is named in the chat in one line.

2. **Path.** A given path is relative to the project's `specs/` unless it is absolute.
   Without one:
   - a review: `specs/<topic>/review.md` if the topic has a folder, else
     `specs/<topic>-review.md`, from `~/.claude/skills/save/templates/review.md`;
   - research: `specs/research/<topic>.md`, from
     `~/.claude/skills/save/templates/research-note.md`;
   - anything else: `specs/<topic>.md`.

   Done when the path is fixed.

3. **Write.** Start with a status line with the date, then the content as it was shown,
   not shortened, in the sections of its template where there is one. Update an
   existing file in place: keep its structure, and drop nothing without saying so. Done
   when the file is written and the chat names its path and, for an existing file, what
   changed.
