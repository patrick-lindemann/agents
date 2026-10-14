# Library

## Public API
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
  accepted: `parse("1")` beside `parse(1)  # pyright: ignore[reportArgumentType]`.

## Errors
- Keep all error classes in one `errors.py` at the bottom of the import graph.
- Derive the base class from `Exception`, not from a dependency's error, and never
  raise it directly.
- Below the base, add a few family classes that match how callers catch, such as one for
  everything loading raises and one for everything validation raises; raise a mistake
  as its family class with a specific message, not as a subclass per mistake.
- Add a builtin as second parent only where catching it as that builtin is natural:
  `FileNotFoundError`, `PermissionError`, `ImportError`.

## Packaging
- Locate packaged files with `importlib.resources`, never with paths relative to the
  source tree.
- Use a private `random.Random()` where randomness is needed internally.
- Bound dependencies below; cap one only at a known incompatibility, or a 0.x
  dependency at its next minor. Raise a bound by hand, once every check passes on the
  new version.
