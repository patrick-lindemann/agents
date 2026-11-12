#!/usr/bin/env node
// Add the rules hooks to a Codex hooks.json, once each, and leave every other hook alone.
//
// Usage: add-hooks.mjs <hooks.json>

import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
const hook = 'node "$HOME/agents/harnesses/codex/rules-hook.mjs"';
const wanted = [
	{ event: "SessionStart", matcher: "startup|clear|compact", command: `${hook} session-start` },
	{ event: "SubagentStart", command: `${hook} session-start` },
	{ event: "PreToolUse", matcher: "^(apply_patch|Bash)$", command: `${hook} pre-tool-use` },
];

let config = {};
try {
	config = JSON.parse(readFileSync(file, "utf8"));
} catch (error) {
	if (error.code !== "ENOENT") throw error;
}
config.hooks ??= {};
let changed = false;
for (const { event, matcher, command } of wanted) {
	const groups = (config.hooks[event] ??= []);
	// The rules of one language are about 6,000 tokens; Codex shortens context above the
	// limit, by default 2,500 tokens.
	const entry = { type: "command", command, timeout: 10, additionalContextLimit: 12000 };
	const group = { ...(matcher ? { matcher } : {}), hooks: [entry] };
	const index = groups.findIndex((existing) => existing.hooks?.some((hook) => hook.command === command));
	if (index >= 0 && JSON.stringify(groups[index]) === JSON.stringify(group)) continue;
	if (index >= 0) groups[index] = group;
	else groups.push(group);
	changed = true;
	console.log(`${index >= 0 ? "update" : "add"} ${event} hook in ${file}`);
}
if (changed) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
