---
paths:
  - "**/*.py"
  - "**/*.pyi"
  - "**/*.ipynb"
---
# Python

## Tools
- Use uv, never `pip` or a bare `python`: `uv run`, `uv add`. Format and lint with
  `uv run ruff format <paths>` and `uv run ruff check --fix <paths>`.

## Names
- Use complete words and only established abbreviations (`args`, `config`, `rng`,
  `num_`), never single letters, even in comprehensions, except a lone type parameter `T`
  and math symbols that follow their source (`R`, `x_t`).
- Give each concept one name across the project, from the existing vocabulary, never
  reused for another concept; judge a name by what it suggests users may do.
- "path" means a `pathlib` path; an import path is a `qualified_name`, a position in a
  nested config a `key`. Use `file_path`, `<what>_dir`, `outdir` for an output directory
  option, `<what>_root` for a directory others must stay under.
- Name a caught exception `error`; a value passed on keeps its name.
- Prefix with `_` what only its module or class uses; modules don't, except a helper
  module of its package (`cli/_args.py`).
- Counts are `num_<things>`, limits `max_<…>`/`min_<…>`, indices `index`/`indices`.
  Booleans ask about a state (`is_valid`, `has_header`), are `enable_<feature>` for a
  setting, name a flag's action (`overwrite`) or name the choice plainly (`outer_first`).
- Start functions with a verb (`fetch_user`), except properties and math maps (`exp`).
- A base class names the role (`Sampler`), variants prefix their distinction
  (`GreedySampler`), their module is plural (`samplers/`), a module of one type or format
  singular (`image.py`). `*Options` is a frozen group of settings, `*Error` an exception.
- Constants for a config key, suffix, directory or file name end in `_KEY`, `_SUFFIX`,
  `_DIR`, `_FILE`. Type parameters are `T` plus meaning: `TConfig`, never `ConfigT`.
- Reserve `load_*`/`save_*` for a file format, `get_*` for a value that needs arguments
  or a static accessor (`Clock.get_default()`), `validate_*` for a check that raises or
  returns `None`, paired with an `is_*`, `make_*` for building a new object, `find_*` for
  a search that may return `None`, `iter_*` for a generator, `resolve_*` for turning a
  reference into what it names.

## Types
- Annotate every parameter and return, `-> None` included; a local only where the checker
  cannot infer it (`rows: list[Row] = []`).
- Add a type alias only for a reused type whose name adds meaning.
- Annotate state shared by all instances `ClassVar[...]` and comment why it is shared.
- Write forward references unquoted, below Python 3.14 with
  `from __future__ import annotations`.
- A `@contextmanager` returns `Generator[T]`; other generators `Iterator[T]`.
- Give `Callable` its parameter types unless truly arbitrary; use `Any` only for values
  the code does not constrain, `cast` only for a type the code guarantees but the checker
  cannot see.

## Data structures
- Prefer frozen dataclasses, copied with `dataclasses.replace`, carrying only methods of
  their data.
- A hard-to-read return or element type (several `Any`, three or more slots not unpacked at
  once, slots whose
  types hide their meaning) becomes a private frozen dataclass, never a `NamedTuple` or a
  positional tuple.
- A constant sequence is a tuple, a constant set a `frozenset`, a built-up one a `list`.
- Use no `Enum` where a `Literal` suffices. Name a reused one by a `type` alias with its value
  set derived as its plural: `type Mode = Literal["train", "eval"]`, then
  `MODES: frozenset[Mode] = frozenset(get_args(Mode.__value__))`.
- Choose by the first row that fits:

  | The data is | Use |
  |---|---|
  | swappable behavior: a metric, a sampler | an abstract base with variants |
  | an interface of own classes that share code | an `ABC` |
  | an interface of unrelated classes or a module | a `Protocol` |
  | a mapping that stays a `dict`: keyword arguments, JSON records, a batch | a `TypedDict` |
  | keys to values of one type | `dict[K, V]` |
  | a closed set of options | a `Literal` |
  | a table of per-item values for analysis | a `DataFrame` |
  | two or three obvious slots unpacked at once: `lower, upper = bounds` | a tuple |
  | named fields read as attributes | a frozen dataclass |

## Functions
- Don't force keyword-only parameters with `*`, except `kw_only=True` on a dataclass with
  many or optional fields.
- Order parameters: subject, required inputs, options with defaults. An option whose
  default must be computed defaults to `None`, resolved in the body:
  `seed = secrets.randbits(63) if seed is None else seed`.
- Pass required arguments by position, arguments with a default by keyword:
  `fetch_user(user_id, timeout=5.0)`, except required ones whose order is not obvious:
  `resize(image, width=640, height=480)`.
- Take read-only parameters as abstract types (`Sequence`, `Mapping`), return concrete
  ones. `**kwargs: Any` only passes settings on.
- Define no function inside another, except a decorator and a closure an API requires
  (`optimizer.step(closure)`). A callback is a bound method of the state's owner
  (`on_step=recorder.record`) or a module-level function; a short lambda may be passed.
- Name the result of real work (a model, solver, query or service call) before passing it
  on, so that a debugger can inspect it: `predictions = model(batch)`. Cheap calls stay
  inline.
- Use `match` with a raising `case _:` for a closed set; merge dicts with `|`, `|=`.
- Stream results produced one at a time from a generator; the caller collects them.
- Put private helpers at module level, after the public functions that use them.
- Keep process-wide current state in a module-level `ContextVar`, never a `global`; an
  object that becomes current sets it in `__enter__`, resets it in `__exit__`.

## Classes
- Declare every attribute a class owns, typed in the class body, private ones too, and
  never redeclare inherited ones. Kept state is private unless callers read it.
- Order members: attributes (public, private); static methods, constructing class
  methods, static properties; `__init__`; abstract methods; properties; public methods;
  operators with logic (`__add__`, `__call__`); private methods; `__eq__`, `__repr__`.
- Make each setting a keyword argument of `__init__`, with a default where sensible,
  stored as a public attribute of the same name.
- A subclass takes only its own settings and passes its parent's on with
  `**kwargs: Any`, changing a parent default with `kwargs.setdefault(...)`; it calls
  `super().__init__`, then stores its own settings.
- A base subclasses `ABC`; its public methods run the shared procedure and call private
  `@abstractmethod` hooks (body `...`): `run()` calls `_step()`.
- A class that holds a resource is a context manager: `__enter__` returns `Self`,
  `__exit__` returns `Literal[False]`.

## Docstrings
- Use Google style, without notes, usage, examples, doctests, module docstrings or math markup.
  Backtick code and special values (`None`), in error messages too.
- Follow a closing backtick with a space or punctuation, never a letter: "the `$target`
  nodes", not "the `$target`s".
- The summary is imperative ("Load a config file."). Explanations go into a paragraph
  between the summary and the sections, never into an argument's entry.
- Document an argument by its name alone, as short as possible: what it is, its unit
  (in the docstring, not the name), range or format (`(w, x, y, z)`). End it with
  "Defaults to <default>.", adding its meaning only where not obvious: "Defaults to
  `None`, in which case it waits forever."
- A docstring with `Args:`, `Returns:` or `Raises:` documents every argument, even as
  `user: The user.`. `Returns:` starts with the description; `Raises:` gives each
  expected error and its condition.
- Private functions get a docstring only where unclear; a `TypedDict` none that restates
  its name.
- A class docstring, where needed, is one sentence of what it is ("A cache that evicts
  the least recently used entry.", not "Base class for all caches."). Document the
  constructor in `__init__` ("Initialize the cache."); an error class says which mistake
  it reports.
- Attributes and dataclass fields get no docstrings, a public property one line, a
  public constant one below it.

## Errors
- Write messages as full sentences that say what is wrong and how to fix it, with wrong
  values as `!r`: ``"Cannot <action> `<thing>`: <reason>."``,
  ``"Expected `<expected>`, but <what was given>."``,
  ``"`timeout` must be positive, not `-1`."``.
- Chain `from None` only when the original adds nothing but traceback, else `from error`.
- A broad `except Exception` says why in a comment and re-raises or translates. Library
  code never catches only to log and go on.
- Raise a library's own error classes where errors reach its public API, elsewhere a
  specific builtin.

## Modules and imports
- A subpackage holds one area, a module one concept, `utils/` only homeless small
  helpers, imported from its modules. Generic machinery knows nothing of the concrete code's domain, formats or
  libraries.
- Imports point one way, entry points → features → utilities; shared internals move down.
  Third-party connectors use the core's hooks; the core gains nothing for one extension.
- A package `__init__.py` re-exports its public names in `__all__`, except `utils/`;
  modules define no `__all__`. An application's subpackage may export only main names
  (`from pkg.data import image`, then `image.resize(...)`).
- Re-export a namespace of functions as a module, used qualified: `stats.mean(...)`.
- Import relatively within a subpackage, absolutely across. Import frequent names
  directly (`Path`); keep generic or colliding ones qualified (`np`, `dataclasses.replace`).
- Import an optional dependency at the top of its module, in a `try` whose
  `except ImportError as error` raises an `ImportError` saying what to install.

## Files
- Use the project's formats, loaders and records, never a second format for the same
  data; one module per format reads and writes it.
- A file never stores its own location; its paths are relative to it.
- `from_file` and `to_file` belong only to a type that is a file's whole content. Use a
  fitting third-party type (`PIL.Image.Image`) unwrapped.
- Accept `Path | str` through the project's `PathLike`, converted once at the top:
  `file_path = resolve_path(file_path)`.
- Write a file atomically: to a temporary file in the same directory, then `Path.replace`
  it into place; delete the temporary file on any exception.

## Security and suppressions
- Parse YAML with `yaml.safe_load`; unpickle only files the project wrote. Never pass
  interpolated input with `shell=True`. Read secrets from the environment, and keep them
  out of code, configs, logs and messages.
- Suppress a linter or type checker finding only where its rule is wrong for that line.

## Web services

Applies only to the code of a web service.

- Do no blocking I/O or CPU-heavy work in `async` code; use the async client or
  `asyncio.to_thread`.
- Give every network call an explicit timeout.
- Validate request input with the framework's models (pydantic); return typed
  responses.
- Read settings once, from the environment, into one settings object.
- Return errors to clients without secrets or tracebacks.
