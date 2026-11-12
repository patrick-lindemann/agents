---
paths:
  - "src/**/*.py"
---
# Python libraries

Applies to the package code of a library; ignore it for an application.

## Public API
- Make every public name importable from the package root; keep the implementation in
  private packages (`_impl/`) where the public surface is small.
- Set `__version__` with `importlib.metadata.version` in the top-level `__init__.py`,
  and ship `py.typed`.
- Overload a function whose return type depends on its arguments' types or values, the
  implementation carrying the full union.
- Give a public function with overloads or a generic return typing tests in
  `tests/typing/`, read by the type checker, not run by pytest. A call that must be
  rejected carries its specific ignore, which fails as unused once the call is accepted:
  `parse(1)  # ty: ignore[invalid-argument-type]`.

## Errors
- Keep all error classes in one `errors.py` at the bottom of the import graph.
- Derive the base class from `Exception`, not from a dependency's error, and never raise
  it directly.
- Below it, add a few family classes that match how callers catch (one for loading, one
  for validation); raise a mistake as its family class with a specific message, not as a
  subclass per mistake.
- Add a builtin as second parent only where catching it as that builtin is natural:
  `FileNotFoundError`, `PermissionError`, `ImportError`.

## Packaging
- Locate packaged files with `importlib.resources`, never relative to the source tree.
- Use a private `random.Random()` for internal randomness.
- Bound dependencies below; cap one only at a known incompatibility, or a 0.x dependency
  at its next minor. Raise a bound by hand, once every check passes on the new version.
