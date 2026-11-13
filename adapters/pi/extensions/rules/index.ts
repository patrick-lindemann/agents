// Pi extension that loads rules as Claude Code does, without blocking a tool call and
// without any output in the terminal. Rules are the Markdown files under ~/.claude/rules/
// and under .claude/rules/ in the working directory and its parents. A rule without
// `paths:` goes into the system prompt. A rule with `paths:` is appended once to the
// result of the first read, write or edit of a matching file, or of a bash command that
// names one, and again after a compaction drops it. Globs match the path relative to the
// directory that holds `.claude/`, and to the working directory for ~/.claude/rules/.

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, matchesGlob, relative, resolve } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

type Rule = { file: string; root: string | undefined; paths: string[]; body: string };

const PATH_TOOLS = new Set(["read", "write", "edit"]);
const WORD = /"((?:[^"\\]|\\.)*)"|'([^']*)'|([^\s"'|;&<>()]+)/g;
const RULE_TAG = /<rule file="([^"]+)">/g;

export default function (pi: ExtensionAPI) {
	let rules: Rule[] = [];
	let delivered = new Set<string>();

	const reset = (ctx: ExtensionContext) => {
		rules = loadRules(ctx.cwd);
		delivered = deliveredInContext(ctx);
	};
	pi.on("session_start", async (_event, ctx) => reset(ctx));
	pi.on("session_compact", async (_event, ctx) => reset(ctx));
	pi.on("session_tree", async (_event, ctx) => reset(ctx));

	pi.on("before_agent_start", async (event) => {
		const always = rules.filter((rule) => rule.paths.length === 0);
		if (always.length > 0) event.systemPromptOptions.sections.project_rules = always.map(format).join("\n\n");
	});

	pi.on("tool_result", async (event, ctx) => {
		const targets = targetsOf(event.toolName, event.input, ctx.cwd);
		if (targets.length === 0) return;
		const due = rules.filter(
			(rule) =>
				rule.paths.length > 0 &&
				!delivered.has(rule.file) &&
				targets.some((target) => rule.paths.some((glob) => matches(target, rule.root ?? ctx.cwd, glob))),
		);
		if (due.length === 0) return;
		for (const rule of due) delivered.add(rule.file);
		const changed = event.toolName === "write" || event.toolName === "edit";
		const intro = changed
			? "Rules for this file, loaded after the change: check the change against them."
			: "Rules for this file:";
		const text = [intro, ...due.map(format)].join("\n\n");
		return { content: [...event.content, { type: "text", text }] };
	});
}

function format(rule: Rule): string {
	return `<rule file="${rule.file}">\n${rule.body.trim()}\n</rule>`;
}

// The rules whose text is still in the model's context; a compaction drops the others.
function deliveredInContext(ctx: ExtensionContext): Set<string> {
	const delivered = new Set<string>();
	for (const message of ctx.sessionManager.buildSessionProjection().messages) {
		if (message.role !== "toolResult") continue;
		for (const part of message.content) {
			if (part.type === "text") for (const match of part.text.matchAll(RULE_TAG)) delivered.add(match[1]);
		}
	}
	return delivered;
}

function targetsOf(toolName: string, input: Record<string, unknown>, cwd: string): string[] {
	if (PATH_TOOLS.has(toolName)) {
		return typeof input.path === "string" ? [resolve(cwd, expandHome(input.path.trim().replace(/^@/, "")))] : [];
	}
	if (toolName !== "bash" || typeof input.command !== "string") return [];
	const targets = new Set<string>();
	for (const match of input.command.matchAll(WORD)) {
		const word = match[1] ?? match[2] ?? match[3];
		if (!word || word.startsWith("-") || word.includes("$") || /^[a-z]+:\/\//i.test(word)) continue;
		const path = resolve(cwd, expandHome(word));
		if (existsSync(path) && statSync(path).isFile()) targets.add(path);
	}
	return [...targets];
}

function matches(target: string, root: string, glob: string): boolean {
	const path = relative(root, target);
	if (path === "" || path.startsWith("..") || isAbsolute(path)) return false;
	// matchesGlob never lets `*` match a leading dot, so `**/*.exs` would miss
	// `.formatter.exs`; the second match hides the dots from it.
	const undotted = path.split("/").map((part) => part.replace(/^\./, "\u0000")).join("/");
	return matchesGlob(path, glob) || matchesGlob(undotted, glob);
}

function loadRules(cwd: string): Rule[] {
	const sources: { dir: string; root: string | undefined }[] = [];
	for (let dir = resolve(cwd); ; dir = dirname(dir)) {
		sources.push({ dir: join(dir, ".claude", "rules"), root: dir });
		if (dirname(dir) === dir) break;
	}
	sources.push({ dir: join(homedir(), ".claude", "rules"), root: undefined });
	const seen = new Set<string>();
	return sources.flatMap(({ dir, root }) =>
		existsSync(dir)
			? markdownFiles(dir, seen).map((file) => ({ file, root, ...parseRule(readFileSync(file, "utf8")) }))
			: [],
	);
}

function markdownFiles(dir: string, seen: Set<string>): string[] {
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
function parseRule(text: string): { paths: string[]; body: string } {
	const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
	const paths: string[] = [];
	if (match) {
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
	}
	const body = match ? text.slice(match[0].length) : text;
	return { paths, body: body.replace(/<!--[\s\S]*?-->\n*/g, "") };
}

function unquote(value: string): string {
	return value.trim().replace(/^(["'])(.*)\1$/, "$2");
}

function expandHome(path: string): string {
	return path === "~" || path.startsWith("~/") ? join(homedir(), path.slice(1)) : path;
}
