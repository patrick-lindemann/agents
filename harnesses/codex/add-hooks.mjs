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
	{ event: "PreToolUse", matcher: "^apply_patch$", command: `${hook} pre-tool-use` },
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
	if (groups.some((group) => group.hooks?.some((entry) => entry.command === command))) continue;
	// The always-applying rules are about 2,500 tokens, Codex's default limit for context.
	const entry = { type: "command", command, timeout: 10, additionalContextLimit: 6000 };
	groups.push({ ...(matcher ? { matcher } : {}), hooks: [entry] });
	changed = true;
	console.log(`add ${event} hook to ${file}`);
}
if (changed) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
