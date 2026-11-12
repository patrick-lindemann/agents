#!/usr/bin/env node
// Generate the per-harness files of this repository; scripts/install.sh calls it.
//
//   build.mjs roles <out> [harness ...]   write <out>/<harness>/agents/ from roles/
//   build.mjs unblock <file> <name>       remove the generated block <name> from <file>
//
// Node standard library only.

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Loaded into Pi subagents, which load no extensions of their own in the foreground, so
// that they get the rules too.
const piRulesPackage = "npm:@jordyvanvorselen/pi-claude-rules@0.1.4";

// The neutral tool groups of a role, per harness. `all` omits the tool list.
const claudeTools = {
	read: ["Read"],
	search: ["Grep", "Glob"],
	commands: ["Bash"],
	web: ["WebFetch", "WebSearch"],
	edit: ["Edit", "Write"],
};
const piTools = {
	read: ["read"],
	search: ["grep", "find", "ls"],
	commands: ["bash"],
	web: ["web_search", "fetch_content", "get_search_content"],
	edit: ["edit", "write"],
};
const piDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi/agent");
// Optional, git-ignored: {"<harness>": {"<tier>": "<model>"}}. A tier without an entry
// runs on the session's model.
const modelsFile = join(repo, "models.local.json");

function piHasWebTools() {
	let settings;
	try {
		settings = JSON.parse(readFileSync(join(piDir, "settings.json"), "utf8"));
	} catch {
		return false;
	}
	return (settings.packages ?? []).some((pkg) => JSON.stringify(pkg).includes("pi-web-access"));
}

// The flat frontmatter of a role: `key: value`, quoted values as JSON, and `  - item`
// lists.
function splitFrontMatter(text) {
	const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
	if (!match) return [{}, text];
	const [, front, body] = match;
	const fields = {};
	let key = null;
	for (const line of front.split("\n")) {
		if (line.startsWith("  - ") && key) {
			const item = line.slice(4).trim().replace(/^"+|"+$/g, "");
			if (!Array.isArray(fields[key])) fields[key] = [];
			fields[key].push(item);
		} else if (line.includes(":")) {
			const index = line.indexOf(":");
			key = line.slice(0, index).trim();
			let value = line.slice(index + 1).trim();
			if (value.length >= 2 && value[0] === '"' && value.at(-1) === '"') value = JSON.parse(value);
			fields[key] = value || [];
		}
	}
	return [fields, body];
}

function loadRoles() {
	const directory = join(repo, "roles");
	return readdirSync(directory)
		.filter((file) => file.endsWith(".md"))
		.sort()
		.map((file) => {
			const [fields, body] = splitFrontMatter(readFileSync(join(directory, file), "utf8"));
			const tools = fields.tools.split(",").map((tool) => tool.trim());
			return { ...fields, tools, body: body.replace(/^\n+/, ""), file };
		});
}

const quote = (text) => JSON.stringify(text);
const isAll = (tools) => tools.length === 1 && tools[0] === "all";

function claudeRole(role, model) {
	const lines = ["---", `name: ${role.name}`, `description: ${quote(role.description)}`];
	if (!isAll(role.tools)) {
		lines.push(`tools: ${role.tools.flatMap((group) => claudeTools[group]).join(", ")}`);
	}
	lines.push(`model: ${model || "inherit"}`, `effort: ${role.effort}`, "---", "", role.body);
	return lines.join("\n");
}

function piRole(role, model) {
	const lines = ["---", `name: ${role.name}`, `description: ${quote(role.description)}`];
	if (!isAll(role.tools)) {
		let groups = [...role.tools];
		if (groups.includes("web") && !piHasWebTools()) {
			console.error(`pi: ${role.name}: pi-web-access is not installed, so no web tools`);
			groups = groups.filter((group) => group !== "web");
		}
		// Only a background child loads the installed extensions, pi-web-access among them.
		if (groups.includes("web")) lines.push("async: true");
		lines.push(`tools: ${groups.flatMap((group) => piTools[group]).join(", ")}`);
	}
	if (model) lines.push(`model: ${model}`);
	lines.push(
		`subagentOnlyExtensions: ${piRulesPackage}`,
		`thinking: ${role.effort}`,
		"inheritProjectContext: true",
		"inheritSkills: false",
		"---",
		"",
		role.body,
	);
	return lines.join("\n");
}

function codexRole(role, model) {
	let body = role.body;
	if (body.includes("'''")) throw new Error(`${role.file}: ''' cannot go into a TOML literal string`);
	// Codex has no per-agent tool list; the sandbox is the parent's.
	if (!role.tools.includes("edit") && !isAll(role.tools)) body = `Change no file.\n\n${body}`;
	const lines = [`name = ${quote(role.name)}`, `description = ${quote(role.description)}`];
	if (model) lines.push(`model = ${quote(model)}`);
	lines.push(`model_reasoning_effort = ${quote(role.effort)}`, `developer_instructions = '''\n${body}'''`, "");
	return lines.join("\n");
}

const harnesses = {
	claude: [claudeRole, ".md"],
	codex: [codexRole, ".toml"],
	pi: [piRole, ".md"],
};

function buildRoles(out, selected) {
	const models = existsSync(modelsFile) ? JSON.parse(readFileSync(modelsFile, "utf8")) : {};
	const roles = loadRoles();
	for (const [harness, [render, suffix]] of Object.entries(harnesses)) {
		if (selected.length && !selected.includes(harness)) continue;
		const directory = join(out, harness, "agents");
		mkdirSync(directory, { recursive: true });
		for (const stale of readdirSync(directory)) unlinkSync(join(directory, stale));
		for (const role of roles) {
			const text = render(role, models[harness]?.[role.tier]);
			writeFileSync(join(directory, role.name + suffix), text);
		}
	}
}

function removeBlock(file, name) {
	const path = file.replace(/^~(?=\/|$)/, homedir());
	if (!existsSync(path)) return;
	const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const begin = `<!-- BEGIN ${name}: generated by ~/agents/scripts, do not edit -->`;
	const end = `<!-- END ${name} -->`;
	const text = readFileSync(path, "utf8");
	const pattern = new RegExp(`\\n*${escape(begin)}[\\s\\S]*?${escape(end)}\\n?`, "g");
	let updated = text.replace(pattern, "\n").replace(/^\n+|\n+$/g, "");
	updated = updated ? `${updated}\n` : "";
	if (updated !== text) {
		writeFileSync(path, updated);
		console.log(`remove block ${name} from ${path}`);
	}
}

const [command, ...args] = process.argv.slice(2);
if (command === "roles") buildRoles(args[0], args.slice(1));
else if (command === "unblock") removeBlock(args[0], args[1]);
else {
	console.error("usage: build.mjs roles <out> [harness ...] | unblock <file> <name>");
	process.exit(2);
}
