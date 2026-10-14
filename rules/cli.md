# Scripts and command-line tools

## Scripts
- Write a utility outside the package, such as data preparation or conversion, as one
  file in `scripts/` with PEP 723 inline metadata, run with
  `uv run --script scripts/<name>.py`. List every third-party import in `dependencies`,
  bounded below and at its next breaking version, since a script has no lock file.
- Parse the arguments in `get_args()` into an `argparse.Namespace` subclass
  `Arguments`, and run in `main()`, called under `if __name__ == "__main__":`.
- Never change `sys.path` to import the package or another script; raise a script that
  needs the package with the user as a candidate for a command.
- Take inputs as files, directories or quoted globs, filtered by suffix, sorted and
  deduplicated; write into `--outdir`, each file atomically.

## Commands of a package
- Make the entry point `[project.scripts] <name> = "<package>.__main__:main"`, where
  `__main__.py` defines `main(argv: list[str] | None = None) -> None` and ends with
  `if __name__ == "__main__": main()`.
- Keep one module per command in `cli/` for a tool with several commands, each a
  `*Routine` with its own `*Arguments` subclass; `main` builds one subparser per routine,
  parses into a typed namespace and calls `args.routine.run(args)`. A single-purpose
  command module may define `Arguments`, `get_args` and `main` as a script does.
- Say what a script or command does in one sentence, as its parser's `description`.
- Name these options as given: `--outdir`, `--overrides KEY=VALUE ...` (`nargs="+"`,
  `action="extend"`), `--overwrite` to replace outputs, `--skip-errors` to skip failing
  items, `-v`/`--verbose` (`action="count"`).
- Write help texts as short lowercase phrases without a final period:
  `"maximum number of retries"`.

## Errors and output
- Raise a mistake in the arguments as `ArgumentError(None, "<message>")`, which `main`
  turns into `parser.error(...)`, exit status 2. Overriding `python.md`, its message is
  lowercase, without a final period, and names the flag as typed:
  `"--port requires --serve"`.
- Print an expected failure as `<input>: <ErrorClass>: <message>` with the error's notes
  to stderr, without a traceback, and end with `raise SystemExit(1)`.
- Check cheaply, before the first expensive step, what can fail: build the config once,
  check that the outputs don't exist.
- Only the command skips a failing item, under `--skip-errors`, logging the error and
  going on.
- Configure logging once, from the verbosity flag:
  `logging.basicConfig(level=..., format="%(levelname)s: %(message)s")`.
- Show progress with `tqdm(..., disable=None)`, inside `logging_redirect_tqdm()` when the
  loop also logs.
