import { execFile } from "node:child_process";
import { accessSync, constants, existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { delimiter, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";

const SCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);
const PYTHON_EXTENSIONS = new Set([".py", ".pyi"]);
const CHECKERS = [
	{
		name: "biome",
		extensions: SCRIPT_EXTENSIONS,
		configs: ["biome.json", "biome.jsonc"],
		binDir: "node_modules/.bin",
		commands: [["check", "--colors=off", "--error-on-warnings", "--no-errors-on-unmatched"]],
	},
	{
		name: "ruff",
		extensions: PYTHON_EXTENSIONS,
		configs: ["ruff.toml", ".ruff.toml"],
		table: /^\s*\[\s*tool\.ruff\s*(?:\]|\.)/m,
		binDir: ".venv/bin",
		commands: [
			[
				"check",
				"--no-fix",
				"--no-fix-only",
				"--force-exclude",
				"--no-cache",
				"--output-format=concise",
				"--color=never",
			],
			["format", "--check", "--force-exclude", "--no-cache", "--color=never"],
		],
	},
	{
		name: "ty",
		extensions: PYTHON_EXTENSIONS,
		configs: ["ty.toml"],
		table: /^\s*\[\s*tool\.ty\s*(?:\]|\.)/m,
		binDir: ".venv/bin",
		commands: [["check", "--force-exclude", "--error-on-warning", "--color=never", "--output-format=concise"]],
	},
];

/**
 * Run report-only checks on the given files and return nonempty diagnostics.
 * @param {string} cwd
 * @param {string[]} paths
 * @param {{allowProjectBinaries?: boolean, signal?: AbortSignal}} [options]
 */
export async function checkFiles(cwd, paths, { allowProjectBinaries = false, signal } = {}) {
	const workspace = realpathSync(cwd);
	const pathDirs = (process.env.PATH ?? "").split(delimiter).filter(isAbsolute);
	const groups = new Map();
	const seen = new Set();
	for (const path of paths) {
		const checkers = CHECKERS.filter(({ extensions }) => extensions.has(extname(path)));
		if (checkers.length === 0) {
			continue;
		}
		const target = resolve(workspace, path);
		if (!statSync(target, { throwIfNoEntry: false })?.isFile()) {
			continue;
		}
		// A symlink must not bring files outside the workspace into a check.
		const file = realpathSync(target);
		const fromWorkspace = relative(workspace, file);
		if (!fromWorkspace || fromWorkspace === ".." || fromWorkspace.startsWith(`..${sep}`) || isAbsolute(fromWorkspace)) {
			continue;
		}
		if (seen.has(file)) {
			continue;
		}
		seen.add(file);
		for (const checker of checkers) {
			const root = findConfigRoot(workspace, file, checker);
			if (!root) {
				continue;
			}
			const key = `${checker.name}\0${root}`;
			if (!groups.has(key)) {
				const dirs = allowProjectBinaries ? [join(root, checker.binDir), ...pathDirs] : pathDirs;
				groups.set(key, { root, checker, binary: findBinary(checker.name, dirs), files: [] });
			}
			groups.get(key).files.push(relative(root, file));
		}
	}

	const diagnostics = await Promise.all(
		[...groups.values()].flatMap(({ root, checker, binary, files }) => {
			if (!binary) {
				return [`${checker.name} not found for ${relative(workspace, root) || "."}. Put it on PATH before editing.`];
			}
			return checker.commands.map((args) => runCheck(checker.name, binary, args, root, files, signal));
		}),
	);
	return signal?.aborted ? [] : diagnostics.filter(Boolean);
}

function findConfigRoot(workspace, file, checker) {
	for (let root = dirname(file); ; root = dirname(root)) {
		const pyproject = join(root, "pyproject.toml");
		if (
			checker.configs.some((config) => existsSync(join(root, config))) ||
			(checker.table && existsSync(pyproject) && checker.table.test(readFileSync(pyproject, "utf8")))
		) {
			return root;
		}
		if (root === workspace) {
			return undefined;
		}
	}
}

function findBinary(name, dirs) {
	for (const dir of dirs) {
		const binary = join(dir, name);
		try {
			if (statSync(binary, { throwIfNoEntry: false })?.isFile()) {
				accessSync(binary, constants.X_OK);
				return binary;
			}
		} catch (error) {
			if (error.code !== "EACCES" && error.code !== "ENOENT") {
				throw error;
			}
		}
	}
}

function runCheck(name, binary, args, cwd, files, signal) {
	return new Promise((resolve) => {
		execFile(
			binary,
			[...args, "--", ...files],
			{ cwd, signal, timeout: 5000, maxBuffer: 8000, killSignal: "SIGKILL" },
			(error, stdout, stderr) => {
				if (!error) {
					resolve("");
					return;
				}
				const label = `${name} ${args[0]}${args.includes("--check") ? " --check" : ""}`;
				const status =
					error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER"
						? "output limit reached"
						: error.killed
							? "timed out"
							: `exit ${error.code ?? error.signal}`;
				const output = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
				resolve(`${label} (${status}) in ${cwd}:\n${output || error.message}`);
			},
		);
	});
}
