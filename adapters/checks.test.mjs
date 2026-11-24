import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkFiles } from "./checks.mjs";
import registerPiChecks from "./pi/extensions/checks/index.ts";

const hook = fileURLToPath(new URL("./post-tool-checks.mjs", import.meta.url));
const register = fileURLToPath(new URL("./register-check-hook.mjs", import.meta.url));

function makeFixture(t) {
	const dir = mkdtempSync(join(tmpdir(), "agents-checks-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const cwd = join(dir, "project");
	const bin = join(dir, "bin");
	for (const folder of [cwd, bin, join(cwd, "node_modules/.bin")]) {
		mkdirSync(folder, { recursive: true });
	}
	const checker = "#!/usr/bin/env node\nconsole.log(JSON.stringify(process.argv.slice(2))); process.exitCode = 1;\n";
	for (const name of ["biome", "ruff", "ty"]) {
		writeFileSync(join(bin, name), checker, { mode: 0o755 });
	}
	writeFileSync(join(cwd, "node_modules/.bin/biome"), `${checker}console.log('project binary');\n`, { mode: 0o755 });
	for (const file of ["edited.ts", "other.ts", "edited.py", "moved file.py"]) {
		writeFileSync(join(cwd, file), "");
	}
	writeFileSync(join(cwd, "biome.json"), "{}");
	writeFileSync(join(cwd, "pyproject.toml"), "[tool.ruff.lint]\n[tool.ty.rules]\n");
	writeFileSync(join(dir, "outside.py"), "");
	symlinkSync(join(dir, "outside.py"), join(cwd, "linked.py"));
	return { dir, cwd, bin };
}

function runHook(harness, { cwd, bin }, event) {
	const result = spawnSync(process.execPath, [hook, harness], {
		input: JSON.stringify({ cwd, hook_event_name: "PostToolUse", ...event }),
		encoding: "utf8",
		env: { ...process.env, PATH: [bin, dirname(process.execPath)].join(delimiter) },
	});
	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stderr, "");
	return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput.additionalContext : "";
}

test("Claude reports only the edited file and skips unrelated events and standalone files", (t) => {
	const fixture = makeFixture(t);
	const event = { tool_name: "Write", tool_input: { file_path: join(fixture.cwd, "edited.ts") } };
	const context = runHook("claude", fixture, event);
	assert.match(context, /biome check.*\n\[.*"--","edited.ts"\]/);
	assert.doesNotMatch(context, /other\.ts|ruff|ty check|project binary/);
	assert.equal(runHook("claude", fixture, { ...event, hook_event_name: "PostToolUseFailure" }), "");
	assert.equal(runHook("claude", fixture, { ...event, tool_name: "Bash" }), "");
	const standalone = { ...fixture, cwd: fixture.dir };
	assert.equal(runHook("claude", standalone, { tool_name: "Edit", tool_input: { file_path: "outside.py" } }), "");
});

test("Codex checks patch destinations only, batches Python paths and skips failures and outside files", (t) => {
	const fixture = makeFixture(t);
	const command = [
		"*** Begin Patch",
		"*** Add File: edited.py",
		"*** Update File: old.py",
		"*** Move to: moved file.py",
		"*** Delete File: other.ts",
		"*** Add File: linked.py",
		"*** End Patch",
	].join("\n");
	const event = {
		tool_name: "apply_patch",
		tool_input: { command },
		tool_response: "Output:\nSuccess. Updated the following files:\nA edited.py\nM old.py\nD other.ts\nA linked.py\n",
	};
	const context = runHook("codex", fixture, event);
	for (const name of [/ruff check/, /ruff format --check/, /ty check/]) {
		assert.match(context, new RegExp(`${name.source}.*\\n\\[.*"--","edited.py","moved file.py"\\]`));
	}
	assert.doesNotMatch(context, /biome|old\.py|linked\.py|outside\.py/);
	assert.equal(runHook("codex", fixture, { ...event, tool_response: "Patch failed" }), "");
});

test("trusted Pi workspaces can use their project binary", async (t) => {
	const { cwd } = makeFixture(t);
	const diagnostics = await checkFiles(cwd, ["edited.ts"], { allowProjectBinaries: true });
	assert.equal(diagnostics.length, 1);
	assert.match(diagnostics[0], /project binary/);
});

const completed = { outcome: "completed", entries: [], continue: false };

function bindPiChecks() {
	const handlers = new Map();
	registerPiChecks({ on: (event, handler) => handlers.set(event, handler) });
	return handlers;
}

test("Pi waits for settlement and batches successful edits without duplicates", async (t) => {
	const { cwd } = makeFixture(t);
	const checks = join(cwd, "check-runs.jsonl");
	writeFileSync(
		join(cwd, "node_modules/.bin/biome"),
		'#!/usr/bin/env node\nrequire("node:fs").appendFileSync("check-runs.jsonl", JSON.stringify(process.argv.slice(2)) + "\\n");\nconsole.log("Found a lint issue");\nprocess.exitCode = 1;\n',
	);
	const handlers = bindPiChecks();
	const ctx = { cwd, isProjectTrusted: () => true };
	const onResult = handlers.get("tool_result");
	onResult({ toolName: "edit", input: { path: "edited.ts" } }, ctx);
	onResult({ toolName: "write", input: { path: join(cwd, "edited.ts") } }, ctx);
	onResult({ toolName: "write", input: { path: "@other.ts" } }, ctx);
	onResult({ toolName: "write", isError: true, input: { path: "edited.py" } }, ctx);
	onResult({ toolName: "read", input: { path: "edited.py" } }, ctx);
	assert.equal(existsSync(checks), false);

	const onBeforeSettle = handlers.get("agent_before_settle");
	const earlierEntry = { type: "custom", customType: "another-extension" };
	const result = await onBeforeSettle({ ...completed, entries: [earlierEntry] }, ctx);
	const invocations = readFileSync(checks, "utf8").trim().split("\n").map(JSON.parse);
	assert.equal(invocations.length, 1);
	assert.deepEqual(invocations[0].slice(-3), ["--", "edited.ts", "other.ts"]);
	assert.equal(result.entries[0], earlierEntry);
	assert.match(result.entries[1].content, /^Post-edit checks:\nbiome check .*\nFound a lint issue$/);
	assert.equal(result.continue, true);
	assert.equal(await onBeforeSettle(completed, ctx), undefined);
});

test("Pi reports further diagnostics without forcing another continuation", async (t) => {
	const { cwd } = makeFixture(t);
	const handlers = bindPiChecks();
	const ctx = { cwd, isProjectTrusted: () => true };
	const edit = { toolName: "edit", input: { path: "edited.ts" } };
	const onResult = handlers.get("tool_result");
	const onBeforeSettle = handlers.get("agent_before_settle");

	onResult(edit, ctx);
	assert.equal((await onBeforeSettle(completed, ctx)).continue, true);
	onResult(edit, ctx);
	const result = await onBeforeSettle(completed, ctx);
	assert.equal(result.continue, false);
	assert.equal(result.entries[0].display, true);
	assert.match(result.entries[0].content, /project binary/);

	onResult(edit, ctx);
	assert.equal((await onBeforeSettle({ ...completed, continue: true }, ctx)).continue, true);
	handlers.get("agent_settled")();
	onResult(edit, ctx);
	assert.equal((await onBeforeSettle(completed, ctx)).continue, true);
});

test("Pi skips untrusted edits and clears a pending batch after an abort", async (t) => {
	const { cwd } = makeFixture(t);
	const handlers = bindPiChecks();
	const trusted = { cwd, isProjectTrusted: () => true };
	const untrusted = { cwd, isProjectTrusted: () => false };
	const edit = { toolName: "edit", input: { path: "edited.ts" } };
	const onResult = handlers.get("tool_result");
	const onBeforeSettle = handlers.get("agent_before_settle");

	onResult(edit, untrusted);
	assert.equal(await onBeforeSettle(completed, trusted), undefined);
	onResult(edit, trusted);
	assert.equal(await onBeforeSettle(completed, untrusted), undefined);
	handlers.get("agent_settled")({ aborted: true });
	assert.equal(await onBeforeSettle(completed, trusted), undefined);
});

test("installing the Claude and Codex hooks preserves existing settings and is idempotent", (t) => {
	const { dir } = makeFixture(t);
	const custom = { matcher: "^Bash$", hooks: [{ type: "command", command: "existing" }] };
	for (const harness of ["claude", "codex"]) {
		const file = join(dir, `${harness}.json`);
		writeFileSync(file, JSON.stringify({ keep: true, hooks: { PostToolUse: [custom] } }));
		for (let index = 0; index < 2; index++) {
			const result = spawnSync(process.execPath, [register, harness, file], { encoding: "utf8" });
			assert.equal(result.status, 0, result.stderr);
		}
		const config = JSON.parse(readFileSync(file, "utf8"));
		assert.equal(config.keep, true);
		assert.equal(config.hooks.PostToolUse.length, 2);
		assert.deepEqual(config.hooks.PostToolUse[0], custom);
		assert.match(config.hooks.PostToolUse[1].hooks[0].command, new RegExp(`post-tool-checks.mjs" ${harness}$`));
	}
});
