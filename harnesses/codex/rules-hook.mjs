#!/usr/bin/env node
// Codex hook that loads path-scoped rules as Claude Code does: the first apply_patch on
// a file that a rule's `paths:` matches is blocked, and the rules go into the model's
// context with the block, so that the patch is made again with them in view. The rules go
// in `additionalContext`, not in the block reason: Codex shortens a reason above about
// 2,500 tokens, while hooks.json raises the limit for context (`additionalContextLimit`).
// Each rule is delivered once per session
// and subagent, and again after a compaction. Globs match the path relative to the
// working directory, as for Claude Code's user-level rules.
//
//   rules-hook.mjs session-start   SessionStart (startup, clear, compact) and SubagentStart:
//                                  give the rules without `paths:`, which always apply
//   rules-hook.mjs pre-tool-use    PreToolUse on apply_patch: the gate described above
//
// Rules are the Markdown files under ~/agents/rules/ (or AGENTS_RULES_DIR).
// Any error lets the tool call through, and is logged to the state directory.

import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, matchesGlob, relative, resolve } from "node:path";

const RULES_DIR = process.env.AGENTS_RULES_DIR ?? join(homedir(), "agents", "rules");
const STATE_DIR = join(process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"), "agents-rules", "codex");
const PATCH_HEADER = /^\*\*\* (?:Add|Update) File: (.+)$|^\*\*\* Move to: (.+)$/gm;

function main() {
	const event = JSON.parse(readFileSync(0, "utf8"));
	// Subagents share the session id of their parent, so their own id or transcript keys
	// them apart where Codex sends one.
	const key = [event.session_id, event.agent_id ?? event.transcript_path].join("\0");
	const statePath = join(STATE_DIR, `${hash(key)}.json`);
	if (process.argv[2] === "session-start") {
		// A compacted or cleared session has lost the rules it was given.
		if (event.source === "compact" || event.source === "clear") rmSync(statePath, { force: true });
		const always = loadRules().filter((rule) => rule.paths.length === 0);
		const context = always.map((rule) => `<rule file="${rule.file}">\n${rule.body.trim()}\n</rule>`).join("\n\n");
		const hookEventName = event.hook_event_name === "SubagentStart" ? "SubagentStart" : "SessionStart";
		process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: context } }));
		return;
	}
	if (process.argv[2] !== "pre-tool-use") return;

	const command = event.tool_input?.command;
	if (typeof command !== "string") return;
	const root = resolve(event.cwd);
	const targets = [...command.matchAll(PATCH_HEADER)].map((match) => resolve(event.cwd, (match[1] ?? match[2]).trim()));
	if (targets.length === 0) return;

	const delivered = new Set(readJson(statePath, []));
	const due = loadRules().filter(
		(rule) => rule.paths.length > 0 && !delivered.has(rule.file) && targets.some((target) => rule.paths.some((glob) => matches(target, root, glob))),
	);
	if (due.length === 0) return;

	for (const rule of due) delivered.add(rule.file);
	mkdirSync(STATE_DIR, { recursive: true });
	writeFileSync(statePath, JSON.stringify([...delivered]));

	const names = due.map((rule) => relative(RULES_DIR, rule.file)).join(", ");
	const reason = `Patch not applied: the rules for these files (${names}) are now in your context. Follow them and apply the same patch again.`;
	const context = due.map((rule) => `<rule file="${rule.file}">\n${rule.body.trim()}\n</rule>`).join("\n\n");
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: "PreToolUse",
				permissionDecision: "deny",
				permissionDecisionReason: reason,
				additionalContext: context,
			},
		}),
	);
}

function matches(target, root, glob) {
	const path = relative(root, target);
	return path !== "" && !path.startsWith("..") && !isAbsolute(path) && matchesGlob(path, glob);
}

function loadRules() {
	return markdownFiles(RULES_DIR, new Set()).map((file) => ({ file, ...parseRule(readFileSync(file, "utf8")) }));
}

function markdownFiles(dir, seen) {
	const real = realpathSync(dir);
	if (seen.has(real)) return [];
	seen.add(real);
	return readdirSync(dir)
		.sort()
		.flatMap((name) => {
			const path = join(dir, name);
			const stats = statSync(path);
			if (stats.isDirectory()) return markdownFiles(path, seen);
			return stats.isFile() && name.endsWith(".md") ? [path] : [];
		});
}

// Reads the `paths:` list of the frontmatter, in the two forms Claude Code accepts: a
// block list of quoted or bare globs, or one glob on the same line.
function parseRule(text) {
	const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
	if (!match) return { paths: [], body: text };
	const paths = [];
	let inPaths = false;
	for (const line of match[1].split("\n")) {
		const key = /^(\w+):\s*(.*)$/.exec(line);
		if (key) {
			inPaths = key[1] === "paths";
			if (inPaths && key[2]) paths.push(unquote(key[2]));
		} else if (inPaths && /^\s+-\s+/.test(line)) {
			paths.push(unquote(line.replace(/^\s+-\s+/, "")));
		}
	}
	return { paths, body: text.slice(match[0].length).replace(/<!--[\s\S]*?-->\n*/g, "") };
}

function unquote(value) {
	return value.trim().replace(/^(["'])(.*)\1$/, "$2");
}

function readJson(path, fallback) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return fallback;
	}
}

function hash(text) {
	return createHash("sha256").update(text).digest("hex").slice(0, 32);
}

try {
	main();
} catch (error) {
	try {
		mkdirSync(STATE_DIR, { recursive: true });
		appendFileSync(join(STATE_DIR, "errors.log"), `${new Date().toISOString()} ${error?.stack ?? error}\n`);
	} catch {}
}
