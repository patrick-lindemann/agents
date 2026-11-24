import { readFileSync, writeFileSync } from "node:fs";

const [harness, file] = process.argv.slice(2);
const matchers = { claude: "^(Edit|MultiEdit|Write)$", codex: "^apply_patch$" };
if (!Object.hasOwn(matchers, harness) || !file) {
	throw new Error("Usage: register-check-hook.mjs <claude|codex> <settings-file>");
}

let config = {};
try {
	config = JSON.parse(readFileSync(file, "utf8"));
} catch (error) {
	if (error.code !== "ENOENT") {
		throw error;
	}
}

const command = `node "$HOME/agents/adapters/post-tool-checks.mjs" ${harness}`;
const matcher = matchers[harness];
config.hooks ??= {};
config.hooks.PostToolUse ??= [];
const groups = config.hooks.PostToolUse;
if (!groups.some((group) => group.matcher === matcher && group.hooks.some((hook) => hook.command === command))) {
	groups.push({ matcher, hooks: [{ type: "command", command, timeout: 10 }] });
	writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
	console.log(`add ${harness} post-edit checks in ${file}`);
}
