---
paths:
  - "**/*.py"
  - "**/*.ipynb"
---
# Python

## All Python code

### Tools
- Use uv, never `pip` or a bare `python`: `uv run`, `uv add`.
- Format and lint changed files with `uv run ruff format <paths>` and
  `uv run ruff check --fix <paths>`.

### Names
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
  boolean usually asks about a state (`is_valid`, `has_header`), is `enable_<feature>`
  for a setting, or names a flag's action (`overwrite`), and may also name the choice
  plainly where that reads better (`outer_first`).
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

### Types
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

### Data structures
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

### Functions
- Don't force keyword-only parameters with `*`, except `kw_only=True` on a dataclass with
  many or optional fields.
- Order parameters: subject, required inputs, options with defaults. An option whose
  default must be computed defaults to `None`, resolved in the body:
  `seed = secrets.randbits(63) if seed is None else seed`.
- Pass required arguments by position and arguments that have a default by keyword:
  `fetch_user(user_id, timeout=5.0, max_retries=3)`, not `fetch_user(user_id, 5.0, 3)`
  or `fetch_user(user_id=user_id)`, except that required arguments may go by keyword
  where their order is not obvious: `resize(image, width=640, height=480)`.
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

### Classes
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

### Docstrings
- Use Google style. No notes, usage, examples or doctests, no module docstrings, no math
  markup. Backtick code and special values (`None`), in error messages too.
- Follow a closing backtick with a space or punctuation, never a letter: "the
  `$target` nodes", not "the `$target`s", which Sphinx reads as markup without an end.
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
- Write no docstring such as `"""The config of an order."""` on
  `class OrderConfig(TypedDict)`. A docstring with `Args:`, `Returns:` or `Raises:` keeps
  its summary line and documents every argument, even where the entry only repeats the
  name (`user: The user.`), for consistency.
- A class docstring, where one is needed, is one sentence of what it is ("A cache that
  evicts the least recently used entry.", not "Base class for all caches."). Document
  the constructor in `__init__` ("Initialize the cache."); an error class says which
  mistake it reports.
- Attributes and dataclass fields get no docstrings, a public property one line, a public
  constant one below it: `DEFAULT_TIMEOUT = 30.0`, then
  `"""The request timeout in seconds when none is given."""`.

### Errors
- Write messages as full sentences that say what is wrong and how to fix it, with wrong
  values as `!r`: ``"Cannot <action> `<thing>`: <reason>."``,
  ``"Expected `<expected>`, but <what was given>."``,
  ``"`timeout` must be positive, not `-1`."``.
- Chain `from None` only when the original adds nothing but traceback, else `from error`.
- A broad `except Exception` says why in a comment and re-raises or translates. Library
  code never catches only to log and go on.
- Raise a library's own classes where errors reach its public API, elsewhere a specific
  builtin.

### Modules and imports
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

### Files
- Use the project's formats, loaders and records, never a second format for the same
  data; one module per format reads and writes it.
- A file never stores its own location; its paths are relative to it.
- `from_file` and `to_file` belong only to a type that is a file's whole content. Use a
  fitting third-party type (`PIL.Image.Image`) unwrapped.
- Accept `Path | str` through the project's `PathLike`, converted once at the top:
  `file_path = resolve_path(file_path)`.
- Write a file atomically: to a temporary file in the same directory, then `Path.replace`
  it into place; delete the temporary file on any exception.

### Security and suppressions
- Parse YAML with `yaml.safe_load`; unpickle only files the project wrote. Pass
  subprocesses an argument list, never `shell=True` with interpolated input. Keep secrets
  out of code, configs, logs and messages; read them from the environment.
- Fix what a linter or type checker reports; suppress it only where its rule is wrong for
  that line.

## Libraries

Applies to the package code of a library, under `src/`.

### Public API
- Make every public name importable from the package root, so that users never import
  from its modules. Keep the implementation in private packages (`_impl/`) where the
  public surface is small.
- Set `__version__ = version("<package>")` in the top-level `__init__.py`, with
  `importlib.metadata.version`.
- Ship `py.typed`.
- Overload a function whose return type depends on the types or values of its
  arguments, overloads first, the implementation carrying the full union.
- Give a public function with overloads or a generic return typing tests: modules in
  `tests/typing/` that the type checker reads and pytest does not run. A call that must
  be rejected carries its specific ignore, which fails as unnecessary once the call is
  accepted: `parse("1")` beside `parse(1)  # ty: ignore[invalid-argument-type]`.

### Errors
- Keep all error classes in one `errors.py` at the bottom of the import graph.
- Derive the base class from `Exception`, not from a dependency's error, and never
  raise it directly.
- Below the base, add a few family classes that match how callers catch, such as one for
  everything loading raises and one for everything validation raises; raise a mistake
  as its family class with a specific message, not as a subclass per mistake.
- Add a builtin as second parent only where catching it as that builtin is natural:
  `FileNotFoundError`, `PermissionError`, `ImportError`.

### Packaging
- Locate packaged files with `importlib.resources`, never with paths relative to the
  source tree.
- Use a private `random.Random()` where randomness is needed internally.
- Bound dependencies below; cap one only at a known incompatibility, or a 0.x
  dependency at its next minor. Raise a bound by hand, once every check passes on the
  new version.

## Tests

Applies to `tests/` and `conftest.py`.

### Layout
- Use pytest under `tests/`, mirroring the package: the tests of
  `src/<package>/<area>/<module>.py` live in `tests/<area>/test_<module>.py`, except a
  library may split `tests/unit/` and `tests/integration/`.
- Put shared fixtures in `conftest.py` (at the root or per area), shared assertions and
  skip markers in `tests/helpers.py`, and the test doubles and factories of an area in
  `tests/<area>/helpers.py`.
- Give every feature unit tests in its own module. Test interactions by named scenarios
  through the public entry points, not by a matrix of combinations.

### Writing tests
- Write no docstrings in tests.
- Check one property per test and name the test after it: `test_resize_shapes` in a
  suite over an API, a sentence for behavior (`test_later_values_override_earlier_ones`).
- Parametrize cases instead of looping in the body. Prefer subjects from fixtures; sweep
  every variant with a fixture parametrized from an `{id: instance}` dict
  (`params=SUBJECTS.values(), ids=SUBJECTS.keys()`).
- Build inputs and check results through the subject's own public API, not by
  re-implementing it in the test.
- Check errors with `pytest.raises(SomeError, match="...")`, never the exact text of
  notes or tracebacks.
- Don't mutate parameters or shared fixtures before the assertion.
- Keep fixture code in real modules that the linter and type checker read, not in
  strings. Mark tests that need time (`slow`), a GPU or an optional dependency.

### What to test
- Test stable, observable behavior: invariants, results and their shapes, the
  integration of parts, the errors a caller can expect, and appropriate failure, such as
  a search that finds nothing.
- Don't test exact defaults, private details, helper structure, precise random samples
  or incidental constants.

## Scripts and command-line tools

Applies to `scripts/`, a `cli/` or `_cli/` package, and `__main__.py`.

### Scripts
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

### Commands of a package
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

### Errors and output
- Raise a mistake in the arguments as `ArgumentError(None, "<message>")`, which `main`
  turns into `parser.error(...)`, exit status 2. Overriding "All Python code", its message is
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

## Experiments

Applies to the code and configs of experiment runs, in `scripts/` and `configs/`.

### Configs and seeds
- Set in `configs/` what a run should be able to change, not in code. A run stores its
  resolved config, so that it reads without any other file.
- Make a run reproducible from its config, its seed and the commit: the same three give
  statistically equal results. Build no reproducibility machinery beyond that.
- An unseeded run draws its seed with `secrets.randbits(63)`, uses it and records it.
- Derive each item's stream from the seed and the item's identity
  (`SeedSequence(seed, spawn_key=(index,))` or a hash of the input), so that results
  don't depend on the order of items and a resumed run continues the same sequence.

### Data
- Store float data as `f4` unless precision matters.
- Record provenance (versions, seeds, hashes of the inputs, the config) in the file's
  metadata (HDF5 attributes, Parquet metadata).
- A partial or parameterized read is a free function returning an `*Bundle` whose fields
  are set only when requested: `load_image(file_path, fields=("pixels",))` returns an
  `ImageBundle`.
- Keep the directories of an application as constants in one module (`DATA_DIR`,
  `OUT_DIR`). Where manifests or records describe the data, reach it through them, not
  through file names of your own.
- Set a `DataFrame`'s dtypes explicitly with `astype`, with a `CategoricalDtype` for a
  closed set of strings.
- An optional integration, such as an experiment tracker, only mirrors results; no code
  depends on it.

### Runs that may be interrupted
- Make the run resumable: its outputs record what continuing needs (the seed, counters,
  a hash of each input, the config), and a rerun continues exactly where it stopped.
- A rerun refuses to continue an output made from different inputs and points to
  `--overwrite`.
- Handle `SIGTERM` by `sys.exit(128 + signum)`, and restore a replaced handler
  afterwards. On `KeyboardInterrupt`, log how to continue and re-raise.

## Web services

Applies only to the code of a web service.

- Do no blocking I/O or CPU-heavy work in `async` code; use the async client or
  `asyncio.to_thread`.
- Give every network call an explicit timeout.
- Validate request input at the boundary with the framework's models (pydantic), and
  return typed responses.
- Read settings once, from the environment, into one settings object.
- Return errors to clients without secrets or tracebacks.

## Scientific code

Applies only to code that uses NumPy, PyTorch, JAX or jaxtyping arrays, or that implements mathematics.

### Array annotations
- Annotate every array and tensor, dataclass fields included, with a jaxtyping dtype
  and shape, never a bare `ndarray` or `Tensor`: `pixels: Float[ndarray, "height width 3"]`.
  The dtype is `Float`, `Int`, `UInt` or `Bool`, or `Shaped` for any dtype.
- Write each axis as a number (`"3"`, `"4 4"`) or a readable name: `num_<things>` for a
  count, `batch` for one batch axis, `*batch_shape` or `...` for any number of them, `#`
  for a broadcastable axis (`#batch`), its meaning otherwise (`embedding_dim`). A scalar
  is `""`.
- Arguments and results whose sizes agree share the axis name. An axis given by an
  attribute uses a jaxtyping expression: `Float[Tensor, "batch {self.in_channels}"]`.
- Type a NumPy dtype parameter `DTypeLike` from `numpy.typing`; never use
  `numpy.typing.NDArray` unparameterized. The project's aliases for sizes, dtypes and
  devices win.
- A shape string that ruff reads as a name (`"num_items"`, `F821`) gets a leading space
  (`" num_items"`) or `# noqa: F821`.
- State the shape in `Args:` and `Returns:` even though the annotation carries it,
  always as a tuple of the axis names: "The images with shape `(batch, height, width, 3)`."

### Array values
- Use arrays that libraries return as they are; convert only where data is
  materialized or its dtype changes (reading a dataset, a list built in a loop).
- Pass a library values in the precision it works in, such as a float64 solver,
  converted at the boundary.
- Prefer vectorizing over batch axes to looping over items in Python.
- A validator over a batch names the indices of the bad elements.
- A NumPy function that draws takes `rng: numpy.random.Generator`, never calls
  `np.random` functions.

### PyTorch tensors
- Import `Tensor` from `torch`, `Device` from `torch.types`, `DType` as
  `from torch import dtype as DType`; the project's aliases win.
- New tensors take their dtype, device and `requires_grad` from the input tensors, not
  from global defaults.
- A function that creates tensors takes `size`, then `dtype: DType | None = None`,
  `device: Device = None` and `requires_grad: bool | None = None`, in this order across
  the module. Add a `*_like(tensor)` variant, which takes them from `tensor`, when a
  caller needs one.
- Return the result of `forward` or `sample` as an `*Output` dataclass, not a tuple.

### PyTorch modules and autograd
- Keep submodules in `nn.ModuleList` and `nn.ModuleDict`, never in plain lists or dicts.
- Register constants of a module as buffers (`register_buffer`), never as parameters;
  no constant requires gradients.
- Don't write in place into tensors that autograd differentiates through; build them
  with `torch.cat` and `torch.stack`.
- Evaluate after `model.eval()` and under `torch.inference_mode()`, unless gradients are
  needed (guided sampling, attribution); switch back with `model.train()`.
- Wrap only the forward pass and the loss in `torch.autocast`.

### PyTorch training runs
- Save checkpoints as `state_dict`s with the metadata needed to rebuild the model; load
  them with `torch.load(path, weights_only=True)`.
- A function that draws takes `generator: torch.Generator | None = None`. A `DataLoader`
  gets a seeded `generator` and a `worker_init_fn` that seeds each worker.
- In distributed runs, write files, logs and checkpoints on rank 0 only.
- Prefer loops over steps that don't synchronize with the host, as `.item()`,
  `.nonzero()` and boolean indexing do; log scalars with `.item()` once per logging
  step, not once per training step.
- Mark tests that need CUDA with a shared skip marker (`requires_cuda`) and check
  gradients with a shared helper (`check_gradients(output, *inputs)`).

### Math modules
- Write a mathematical domain as a module of free functions (`so3.exp(phi)`), not a class
  (`SO3().exp(phi)`); where an object must stand for the domain, such as to swap groups
  at runtime, a thin class binds them: `exp = staticmethod(so3.exp)`.
- Overriding "All Python code", a math module has a module docstring that says what it
  implements and which conventions it follows from which source, with `References:`.
- Order a module: types; `is_*` and `validate_*` pairs; constructors (`identity`,
  `identity_like`); core maps (`hat`, `vee`, `exp`, `log`); derived quantities (adjoints,
  Jacobians); composition and distances; sampling; private helpers.
- Give each kind of quantity `is_<thing>(tensor, atol=None) -> bool` and
  `validate_<thing>(tensor, atol=None)`, raising a `ValueError` that says what is wrong;
  the default tolerance depends on the dtype, looser for lower precision.
- Annotate with plain jaxtyping types, except that a math library may give its quantities
  a `Tensor` subclass whose `__class_getitem__` returns the jaxtyping type
  (`so3.Element["batch"]` is `Float[Tensor, "batch 3 3"]`) and use it in its own API.

### Math conventions
- State each convention once, in the module or type docstring, and keep it everywhere:
  matrix layout; row (`x @ R.T`) or column (`R @ x`) vectors; quaternion order; tangent
  order (`[rho, phi]`); left or right perturbations and Jacobians; the frame a pose
  names.
- Convert a value from another convention, such as another library's quaternion order,
  once at the boundary, in a named function or constant.
- Document how a measured constant was measured, in its attribute docstring; never
  replace it by a nominal value.

### Math names and docstrings
- Overriding "All Python code", name quantities after the math: capitals for matrices and group
  elements (`R`, `Phi`, `Jl`), lowercase for vectors and scalars (`phi`, `theta`),
  subscripts as suffixes (`x_0`, `Jl_inv`, `theta2`). Coefficients may be `a`, `b`, `c`,
  with their expression in an end-of-line comment. Silence `E741` on `I` with
  `# noqa: E741`.
- Overriding "All Python code", write docstrings raw (`r"""..."""`) with LaTeX (`$...$`,
  `$$...$$`): the formula, its symbols, the special cases (`theta = 0`, near `pi`), and
  the source as `[1]`. `References:` is a numbered list of author, title, venue, year and
  link.

  ```python
  r"""Map a tangent vector to a rotation matrix.

  Rodrigues' formula [1] gives $R = I + a \Phi + b \Phi^2$ with
  $a = \sin\theta / \theta$, $b = (1 - \cos\theta) / \theta^2$, $\theta = \|\phi\|$
  and $\Phi = \phi^\wedge$. The null vector maps to the identity.
  """
  ```

### Numerical stability
- Write each formula in a form stable over its whole domain, with the identity behind it
  at the line's end: `a = torch.sinc(theta / torch.pi)  # = sin(theta) / theta`.
- Guard a removable singularity without breaking autograd: replace the bad value before
  dividing (`torch.where(near_zero, one, theta**2)`), and switch to a Taylor expansion
  below a threshold where the closed form loses precision.
- Clamp inputs of `acos`, `sqrt` and `log`; compute angles with `atan2(sin, cos)`.
- Explain a numerical edge case briefly where it is handled, a longer derivation in the
  docstring.
- A matrix written element by element may keep its alignment between `# fmt: off` and
  `# fmt: on`.
- Support any number of batch axes (`*batch_shape`) and broadcasting where the operation
  allows.

### Math tests
- Test every array-returning function for: output shapes over parametrized input shapes;
  `jaxtyping.TypeCheckError` on malformed shapes; preserved dtype over
  `[torch.float32, torch.float64]`; the input's device, under a CUDA skip marker;
  gradients, with a gradient-check helper.
- Check correctness too: boundary and no-op values exactly (`torch.equal`); closed forms
  and autograd cross-checks with `torch.allclose(..., atol=...)`, in float64 for tight
  tolerances; validity with `validate_<thing>(result)`; an independent reference where
  one exists (`torch.linalg.matrix_exp(hat(phi))` for `exp`).
