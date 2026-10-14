# Python

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
- Counts are `num_<things>`, limits `max_<…>`/`min_<…>`, indices `index`/`indices`; a
  boolean asks about a state (`is_valid`, `has_header`), is `enable_<feature>` for a
  setting, or names a flag's action (`overwrite`).
- Start functions with a verb (`fetch_user`), except properties and math maps (`exp`).
- A base class names the role (`Sampler`), variants prefix their distinction
  (`GreedySampler`), their module is plural (`samplers/`), a module of one type or format
  singular (`image.py`). `*Options` is a frozen group of settings, `*Error` an exception.
- Constants for a config key, suffix, directory or file name end in `_KEY`, `_SUFFIX`,
  `_DIR`, `_FILE`. Type parameters are `T` plus meaning: `TConfig`, never `ConfigT`.
- Reserve `load_*`/`save_*` for reading and writing a file format, `get_*` for a value
  that needs arguments or a static accessor (`Clock.get_default()`), `validate_*` for a
  check that raises or returns `None`, paired with an `is_*`, `make_*` for building a new
  object, `find_*` for a search that returns `None` when nothing is found, `iter_*` for a
  generator and `resolve_*` for turning a reference into what it names.

## Types
- Annotate every parameter and return, `-> None` included; a local only where the checker
  cannot infer it (`rows: list[Row] = []`, `count: int = untyped_api.count()`,
  `reason: str | None`).
- Add a type alias only for a reused type whose name adds meaning.
- Annotate state shared by all instances `ClassVar[...]` and comment why it is shared.
- Write forward references unquoted, below Python 3.14 with
  `from __future__ import annotations`.
- A `@contextmanager` returns `Generator[T]`; other generators `Iterator[T]`.
- Give `Callable` its parameter types (`Callable[[Request], Response]`) unless truly
  arbitrary; use `Any` only for values the code does not constrain, `cast` only for a
  type the code guarantees but the checker cannot see.

## Data structures
- Prefer frozen
  dataclasses, copied with `dataclasses.replace`, carrying only methods of their data.
- A hard-to-read return or element type (several `Any`, three or more slots not unpacked
  at once, slots whose types hide their meaning) becomes a private frozen dataclass; never
  a `NamedTuple` or a positional tuple as a record.
- A constant sequence is a tuple, a constant set a `frozenset`, a built-up one a `list`.
- Name a reused `Literal` by a `type` alias, with its value set derived and named as its
  plural; no `Enum` where a `Literal` suffices: `type Mode = Literal["train", "eval"]`,
  then `MODES: frozenset[Mode] = frozenset(get_args(Mode.__value__))`.
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
- Take read-only parameters as abstract types (`Sequence`, `Mapping`), return concrete
  ones (`list`, `dict`). `**kwargs: Any` only passes settings on.
- Define no function inside another, except a decorator and a closure an API requires
  (`optimizer.step(closure)`). A callback is a bound method of the state's owner
  (`on_step=recorder.record`) or a module-level function; a short lambda may be passed.
- Name the result of real work (a model, solver, query or service call) before passing it
  on, so that a debugger can inspect it: `predictions = model(batch)`, then
  `evaluate(predictions, labels)`. Cheap calls (`len`, getters, conversions) stay inline.
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
- A subclass takes only its own settings, passing its parent's on with `**kwargs: Any`;
  it changes a parent default with `kwargs.setdefault(...)`, calls `super().__init__`,
  then stores its own settings.
- A base subclasses `ABC`; its public methods run the shared procedure and call private
  `@abstractmethod` hooks (body `...`): `run()` calls `_step()`.
- A class that holds a resource is a context manager: `__enter__` returns `Self`,
  `__exit__` takes three exception arguments and returns `Literal[False]`.

## Docstrings and comments
- Use Google style. State the contract concisely (inputs, result, errors), not the
  implementation; no notes, usage, examples or doctests, no module docstrings, no math
  markup. Backtick code and special values (`None`), in error messages too.
- Write docstrings and comments as plain sentences, without semicolons: split joined
  clauses into sentences.
- The summary is imperative with a period ("Load a config file."), alone or followed by
  every applicable section. What needs explaining goes into a paragraph between the
  summary and the sections, never into an argument's entry.
- Document an argument by its name alone, as short as possible: what it is, its unit,
  range or format (`(w, x, y, z)`), and its default. Put units in the
  docstring, not the name.
- End the entry of an argument that has a default with "Defaults to <default>.", adding
  what it means only where that is not obvious, in one short clause: "The request
  timeout in seconds. Defaults to `None`, in which case it waits forever."
- `Returns:` starts with the description; `Raises:` gives each expected error and its
  condition. Private functions get a docstring only where unclear.
- A class docstring is one sentence of what it is ("A cache that evicts the least
  recently used entry.", not "Base class for all caches."). Document the constructor in
  `__init__` ("Initialize the cache."); an error class says which mistake it reports.
- Attributes and dataclass fields get no docstrings, a public property one line, a public
  constant one below it: `DEFAULT_TIMEOUT = 30.0`, then
  `"""The request timeout in seconds when none is given."""`.
- Comment only reasons the code cannot show, as a full sentence above the code, except a
  terse label over a section of a long body or a short identity at the line's end; never
  mention modules the code is independent of:
  `# Checked before the first request, so that nothing is sent for an invalid config`

## Errors
- Write messages as full sentences that say what is wrong and how to fix it, with wrong
  values as `!r`: ``"Cannot <action> `<thing>`: <reason>."``,
  ``"Expected `<expected>`, but <what was given>."``,
  ``"`timeout` must be positive, not `-1`."``.
- Chain `from None` only when the original adds nothing but traceback, else `from error`.
- A broad `except Exception` says why in a comment and re-raises or translates. Library
  code never catches only to log and go on.
- Raise a library's own classes where errors reach its public API, elsewhere a specific
  builtin.

## Modules and imports
- A subpackage holds one area, a module one concept, `utils/` only homeless small
  helpers, imported from its modules. Generic machinery knows nothing of the concrete
  code's domain, formats or libraries.
- Imports point one way, entry points → features → utilities; shared internals move down.
  Third-party connectors use the core's hooks; the core gains nothing for one extension.
- A package `__init__.py` re-exports its public names in `__all__`, except `utils/`;
  modules define no `__all__`. An application's subpackage may export only main names
  (`from pkg.data import image`, then `image.resize(...)`).
- Re-export a namespace of functions as a module, used qualified:
  `from pkg import stats`, then `stats.mean(...)`.
- Import relatively within a subpackage, absolutely across (`from .image import Image`,
  `from pkg.io import load_image`). Import frequent names directly (`Path`); keep generic
  or colliding ones qualified (`np`, `pd`, `dataclasses.replace`).
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
- Parse YAML with `yaml.safe_load`; unpickle only files the project wrote. Pass
  subprocesses an argument list, never `shell=True` with interpolated input. Keep secrets
  out of code, configs, logs and messages; read them from the environment.
- Fix what a linter or type checker reports; suppress it only where its rule is wrong for
  that line.
