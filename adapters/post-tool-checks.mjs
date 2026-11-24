import { readFileSync } from "node:fs";
import { checkFiles } from "./checks.mjs";

const CLAUDE_EDIT_TOOLS = new Set(["Edit", "MultiEdit", "Write"]);
const PATCH_TARGET = /^\*\*\* (?:Update|Add) File: ([^\r\n]+)(?:\r?\n\*\*\* Move to: ([^\r\n]+))?/gm;

async function main() {
	const event = JSON.parse(readFileSync(0, "utf8"));
	if (event.hook_event_name !== "PostToolUse" || typeof event.cwd !== "string") {
		return;
	}

	let paths;
	if (process.argv[2] === "claude" && CLAUDE_EDIT_TOOLS.has(event.tool_name)) {
		if (typeof event.tool_input?.file_path !== "string") {
			return;
		}
		paths = [event.tool_input.file_path];
	} else if (process.argv[2] === "codex" && event.tool_name === "apply_patch") {
		const patch = event.tool_input?.command;
		if (
			typeof patch !== "string" ||
			typeof event.tool_response !== "string" ||
			!/^Success\. Updated the following files:\r?$/m.test(event.tool_response)
		) {
			return;
		}
		// The success summary reports the old path for moves. The patch has the destination.
		paths = [...patch.matchAll(PATCH_TARGET)].map((match) => (match[2] ?? match[1]).trim());
	} else {
		return;
	}

	const diagnostics = await checkFiles(event.cwd, paths);
	if (diagnostics.length === 0) {
		return;
	}
	const text = diagnostics.join("\n\n");
	const output = text.length > 8000 ? `${text.slice(0, 8000)}\n[Diagnostics truncated.]` : text;
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: `Post-edit checks:\n${output}` },
		}),
	);
}

await main().catch((error) => {
	console.error(`Post-edit checks failed: ${error.message}`);
	process.exitCode = 1;
});
