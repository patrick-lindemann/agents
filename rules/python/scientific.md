---
paths:
  - "**/*.py"
  - "**/*.ipynb"
---
# Scientific Python

These rules apply only to code that uses NumPy, PyTorch, JAX or jaxtyping arrays, or that
implements mathematics. Ignore them for other Python code.

## Array annotations
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

## Array values
- Use arrays that libraries return as they are; convert only where data is
  materialized or its dtype changes (reading a dataset, a list built in a loop).
- Pass a library values in the precision it works in, such as a float64 solver,
  converted at the boundary.
- Prefer vectorizing over batch axes to looping over items in Python.
- A validator over a batch names the indices of the bad elements.
- A NumPy function that draws takes `rng: numpy.random.Generator`, never calls
  `np.random` functions.

## PyTorch tensors
- Import `Tensor` from `torch`, `Device` from `torch.types`, `DType` as
  `from torch import dtype as DType`; the project's aliases win.
- New tensors take their dtype, device and `requires_grad` from the input tensors, not
  from global defaults.
- A function that creates tensors takes `size`, then `dtype: DType | None = None`,
  `device: Device = None` and `requires_grad: bool | None = None`, in this order across
  the module. Add a `*_like(tensor)` variant, which takes them from `tensor`, when a
  caller needs one.
- Return the result of `forward` or `sample` as an `*Output` dataclass, not a tuple.

## PyTorch modules and autograd
- Keep submodules in `nn.ModuleList` and `nn.ModuleDict`, never in plain lists or dicts.
- Register constants of a module as buffers (`register_buffer`), never as parameters;
  no constant requires gradients.
- Don't write in place into tensors that autograd differentiates through; build them
  with `torch.cat` and `torch.stack`.
- Evaluate after `model.eval()` and under `torch.inference_mode()`, unless gradients are
  needed (guided sampling, attribution); switch back with `model.train()`.
- Wrap only the forward pass and the loss in `torch.autocast`.

## PyTorch training runs
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

## Math modules
- Write a mathematical domain as a module of free functions (`so3.exp(phi)`), not a class
  (`SO3().exp(phi)`); where an object must stand for the domain, such as to swap groups
  at runtime, a thin class binds them: `exp = staticmethod(so3.exp)`.
- Overriding `python.md`, a math module has a module docstring that says what it
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

## Math conventions
- State each convention once, in the module or type docstring, and keep it everywhere:
  matrix layout; row (`x @ R.T`) or column (`R @ x`) vectors; quaternion order; tangent
  order (`[rho, phi]`); left or right perturbations and Jacobians; the frame a pose
  names.
- Convert a value from another convention, such as another library's quaternion order,
  once at the boundary, in a named function or constant.
- Document how a measured constant was measured, in its attribute docstring; never
  replace it by a nominal value.

## Math names and docstrings
- Overriding `python.md`, name quantities after the math: capitals for matrices and group
  elements (`R`, `Phi`, `Jl`), lowercase for vectors and scalars (`phi`, `theta`),
  subscripts as suffixes (`x_0`, `Jl_inv`, `theta2`). Coefficients may be `a`, `b`, `c`,
  with their expression in an end-of-line comment. Silence `E741` on `I` with
  `# noqa: E741`.
- Overriding `python.md`, write docstrings raw (`r"""..."""`) with LaTeX (`$...$`,
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

## Numerical stability
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

## Math tests
- Test every array-returning function for: output shapes over parametrized input shapes;
  `jaxtyping.TypeCheckError` on malformed shapes; preserved dtype over
  `[torch.float32, torch.float64]`; the input's device, under a CUDA skip marker;
  gradients, with a gradient-check helper.
- Check correctness too: boundary and no-op values exactly (`torch.equal`); closed forms
  and autograd cross-checks with `torch.allclose(..., atol=...)`, in float64 for tight
  tolerances; validity with `validate_<thing>(result)`; an independent reference where
  one exists (`torch.linalg.matrix_exp(hat(phi))` for `exp`).
