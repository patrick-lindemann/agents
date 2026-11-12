---
paths:
  - "**/*.py"
  - "**/*.ipynb"
---
# Scientific Python

Applies only to code that uses NumPy, PyTorch, JAX or jaxtyping arrays, or implements
mathematics; ignore it elsewhere. It overrides the general Python rules where stated.

## Arrays
- Annotate every array and tensor, dataclass fields included, with a jaxtyping dtype
  (`Float`, `Int`, `UInt`, `Bool`, `Shaped`) and shape, never a bare `ndarray` or
  `Tensor`: `pixels: Float[ndarray, "height width 3"]`.
- Write each axis as a number or a readable name: `num_<things>` for a count, `batch` for
  one batch axis, `*batch_shape` or `...` for several, `#batch` for broadcastable, else
  its meaning (`embedding_dim`); a scalar is `""`. Sizes that agree share the name; an
  attribute's size is an expression: `"batch {self.in_channels}"`.
- Type a NumPy dtype parameter `DTypeLike`; never use `NDArray` unparameterized. The
  project's aliases for sizes, dtypes and devices win.
- Give a shape string that ruff reads as a name (`F821`) a leading space (`" num_items"`) or
  `# noqa: F821`.
- State the shape in `Args:` and `Returns:` as a tuple of axis names: "The images with
  shape `(batch, height, width, 3)`."
- Use arrays that libraries return as they are; convert only where data is materialized
  or its dtype changes. Pass a library values in its working precision (a float64
  solver), converted at the boundary.
- Vectorize over batch axes rather than loop over items; a batch validator names the
  indices of the bad elements.
- A NumPy function that draws takes `rng: numpy.random.Generator`, never calls
  `np.random`.

## PyTorch
- Import `Tensor` from `torch`, `Device` from `torch.types`, and
  `from torch import dtype as DType`.
- New tensors take their dtype, device and `requires_grad` from the input tensors, not
  from global defaults.
- A function that creates tensors takes `size`, then `dtype: DType | None = None`,
  `device: Device = None`, `requires_grad: bool | None = None`, in this order across the module; add a
  `*_like(tensor)` variant when a caller needs one.
- Return the result of `forward` or `sample` as an `*Output` dataclass, not a tuple.
- Keep submodules in `nn.ModuleList`/`nn.ModuleDict`; register constants as buffers,
  never as parameters.
- Don't write in place into tensors autograd differentiates through; build them with
  `torch.cat` and `torch.stack`.
- Evaluate after `model.eval()` under `torch.inference_mode()` unless gradients are
  needed, then switch back with `model.train()`. Wrap only the forward pass and the loss
  in `torch.autocast`.
- Save checkpoints as `state_dict`s with the metadata to rebuild the model; load them
  with `weights_only=True`.
- A function that draws takes `generator: torch.Generator | None = None`. A `DataLoader`
  gets a seeded `generator` and a `worker_init_fn` that seeds each worker.
- In distributed runs, write files, logs and checkpoints on rank 0 only.
- Avoid host syncs in step loops (`.item()`, `.nonzero()`, boolean indexing); log
  scalars with `.item()` once per logging step.
- Mark CUDA tests with a shared skip marker (`requires_cuda`) and check gradients with a
  shared helper (`check_gradients(output, *inputs)`).

## Math modules
- Write a mathematical domain as a module of free functions (`so3.exp(phi)`), not a class;
  where an object must stand for the domain (to swap groups at runtime), a thin class
  binds them: `exp = staticmethod(so3.exp)`.
- Overriding the general Python rules, a math module has a module docstring: what it
  implements and which conventions it follows from which source, with `References:`.
- Order a module: types; `is_*`/`validate_*` pairs; constructors (`identity`,
  `identity_like`); core maps (`hat`, `vee`, `exp`, `log`); derived quantities
  (adjoints, Jacobians); composition and distances; sampling; private helpers.
- Give each kind of quantity `is_<thing>(tensor, atol=None) -> bool` and
  `validate_<thing>(tensor, atol=None)`, raising a `ValueError`; the default tolerance
  is looser for lower precision.
- A math library may give its quantities a `Tensor` subclass whose `__class_getitem__`
  returns the jaxtyping type (`so3.Element["batch"]` is `Float[Tensor, "batch 3 3"]`).
- State each convention once, in the module or type docstring, and keep it everywhere:
  matrix layout; row (`x @ R.T`) or column (`R @ x`) vectors; quaternion order; tangent
  order (`[rho, phi]`); left or right perturbations and Jacobians; the frame a pose names.
- Convert a value from another convention once at the boundary, in a named function or
  constant.
- Document how a measured constant was measured, in its attribute docstring; never replace it by a nominal value.
- Overriding the general Python rules, name quantities after the math: capitals for
  matrices and group elements (`R`, `Phi`, `Jl`), lowercase for vectors and scalars
  (`phi`, `theta`), subscripts as suffixes (`x_0`, `Jl_inv`). Coefficients may be `a`,
  `b`, `c`, with their expression in an end-of-line comment. Silence `E741` on `I`
  with `# noqa: E741`.
- Overriding the general Python rules, write docstrings raw (`r"""..."""`) with LaTeX
  (`$...$`): the formula, its symbols, the special cases (`theta = 0`, near `pi`), and the
  source as `[1]`. `References:` is a numbered list of author, title,
  venue, year and link.

## Numerical stability
- Write each formula in a form stable over its whole domain, with the identity at the
  line's end: `a = torch.sinc(theta / torch.pi)  # = sin(theta) / theta`.
- Guard a removable singularity without breaking autograd: replace the bad value before
  dividing (`torch.where(near_zero, one, theta**2)`), and switch to a Taylor expansion
  where the closed form loses precision.
- Clamp inputs of `acos`, `sqrt` and `log`; compute angles with `atan2(sin, cos)`.
- Explain a numerical edge case briefly where it is handled, a derivation in the
  docstring.
- A matrix written element by element may keep its alignment between `# fmt: off` and
  `# fmt: on`.
- Support any number of batch axes and broadcasting where the operation allows.

## Math tests
- Test every array-returning function for output shapes over parametrized input shapes,
  `jaxtyping.TypeCheckError` on malformed shapes, dtype preserved over float32 and
  float64, the input's device (CUDA-marked), and gradients.
- Check correctness: boundary and no-op values exactly (`torch.equal`); closed forms and
  autograd cross-checks with `torch.allclose`, in float64 for tight tolerances; validity
  with `validate_<thing>(result)`; an independent reference where one exists
  (`torch.linalg.matrix_exp(hat(phi))` for `exp`).
