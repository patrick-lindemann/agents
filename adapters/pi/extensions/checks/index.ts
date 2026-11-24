import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Report diagnostics for each batch of successful edits in a trusted workspace. */
export default function (pi: ExtensionAPI) {
	const extensionDir = dirname(realpathSync(fileURLToPath(import.meta.url)));
	const checker = join(extensionDir, "../../../post_tool_checks.py");
	const editedFiles = new Set<string>();
	let requestedContinuation = false;

	pi.on("tool_result", (event, ctx) => {
		if (event.isError || (event.toolName !== "edit" && event.toolName !== "write")) {
			return;
		}
		if (!ctx.isProjectTrusted() || typeof event.input.path !== "string") {
			return;
		}
		const path = event.input.path.replace(/^@/, "");
		const file = path.startsWith("file://")
			? fileURLToPath(path)
			: path.startsWith("~/")
				? join(homedir(), path.slice(2))
				: path;
		editedFiles.add(file);
	});

	pi.on("agent_before_settle", async (event, ctx) => {
		if (editedFiles.size === 0 || event.outcome !== "completed" || !ctx.isProjectTrusted()) {
			return;
		}
		const files = [...editedFiles];
		editedFiles.clear();
		const result = await pi.exec("python3", [checker, "pi", "--", ...files], {
			cwd: ctx.cwd,
			signal: ctx.signal,
			timeout: 10_000,
			maxBuffer: 36_000,
		});
		if (ctx.signal?.aborted) {
			return;
		}
		const output =
			result.code === 0 ? result.stdout.trim() : result.stderr.trim() || "Post-edit checks did not finish.";
		if (!output) {
			return;
		}
		// Let the agent respond once, but do not keep it running if diagnostics remain.
		const continueWithDiagnostics = !requestedContinuation;
		requestedContinuation = true;
		return {
			entries: [
				...event.entries,
				{
					type: "custom_message",
					customType: "post-edit-checks",
					content: output,
					display: !continueWithDiagnostics,
				},
			],
			continue: event.continue || continueWithDiagnostics,
		};
	});

	pi.on("agent_settled", () => {
		editedFiles.clear();
		requestedContinuation = false;
	});
}
