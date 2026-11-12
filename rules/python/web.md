---
paths:
  - "**/*.py"
---
# Python web services

These rules apply only to code of a web service. Ignore them for other Python code.

<!-- A starter set; grow it from failures that are observed. -->

- Do no blocking I/O or CPU-heavy work in `async` code; use the async client or
  `asyncio.to_thread`.
- Give every network call an explicit timeout.
- Validate request input at the boundary with the framework's models (pydantic), and
  return typed responses.
- Read settings once, from the environment, into one settings object.
- Return errors to clients without secrets or tracebacks.
