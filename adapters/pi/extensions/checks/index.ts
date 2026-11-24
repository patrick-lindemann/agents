import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { checkFiles } from "../../../checks.mjs";

/** Report diagnostics for each batch of successful edits in a trusted workspace. */
export default function (pi: ExtensionAPI) {
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
		const diagnostics = await checkFiles(ctx.cwd, files, { allowProjectBinaries: true, signal: ctx.signal });
		if (diagnostics.length === 0) {
			return;
		}
		const text = diagnostics.join("\n\n");
		const output = text.length > 8000 ? `${text.slice(0, 8000)}\n[Diagnostics truncated.]` : text;
		// Let the agent respond once, but do not keep it running if diagnostics remain.
		const continueWithDiagnostics = !requestedContinuation;
		requestedContinuation = true;
		return {
			entries: [
				...event.entries,
				{
					type: "custom_message",
					customType: "post-edit-checks",
					content: `Post-edit checks:\n${output}`,
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
