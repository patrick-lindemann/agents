---
paths:
  - "**/tests/**"
  - "**/conftest.py"
---
# Tests

## Layout
- Use pytest under `tests/`, mirroring the package: the tests of
  `src/<package>/<area>/<module>.py` live in `tests/<area>/test_<module>.py`, except a
  library may split `tests/unit/` and `tests/integration/`.
- Put shared fixtures in `conftest.py` (at the root or per area), shared assertions and
  skip markers in `tests/helpers.py`, and the test doubles and factories of an area in
  `tests/<area>/helpers.py`.
- Give every feature unit tests in its own module. Test interactions by named scenarios
  through the public entry points, not by a matrix of combinations.

## Writing tests
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

## What to test
- Test stable, observable behavior: invariants, results and their shapes, the
  integration of parts, the errors a caller can expect, and appropriate failure, such as
  a search that finds nothing.
- Don't test exact defaults, private details, helper structure, precise random samples
  or incidental constants.
