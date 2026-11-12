---
paths:
  - "**/tests/**/*.py"
  - "**/test_*.py"
  - "**/*_test.py"
  - "**/conftest.py"
---
# Python tests

## Layout
- Use pytest under `tests/`, mirroring the package: `src/<package>/<area>/<module>.py` is
  tested in `tests/<area>/test_<module>.py`; a library may split `tests/unit/` and
  `tests/integration/`.
- Put shared fixtures in `conftest.py`, shared assertions and skip markers in
  `tests/helpers.py`, an area's test doubles and factories in `tests/<area>/helpers.py`.
- Give every feature unit tests in its own module; test interactions by named scenarios
  through the public entry points, not by a matrix of combinations.

## Writing tests
- Write no docstrings in tests.
- Check one property per test and name the test after it: `test_resize_shapes`, or a
  sentence for behavior (`test_later_values_override_earlier_ones`).
- Parametrize instead of looping in the body. Prefer subjects from fixtures; sweep every variant with a fixture
  parametrized from an `{id: instance}` dict (`params=SUBJECTS.values(),
  ids=SUBJECTS.keys()`).
- Build inputs and check results through the subject's public API, not by
  re-implementing it.
- Check errors with `pytest.raises(SomeError, match="...")`, never the exact text of notes
  or tracebacks.
- Don't mutate parameters or shared fixtures before the assertion.
- Keep fixture code in real modules, not in strings. Mark tests that need time (`slow`),
  a GPU or an optional dependency.

## What to test
- Test stable, observable behavior: invariants, results and their shapes, the
  integration of parts, expected errors and appropriate failure (a search that finds
  nothing).
- Don't test exact defaults, private details, helper structure, precise random samples
  or incidental constants.
