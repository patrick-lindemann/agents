# Numerics

## Module structure
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

## Conventions
- State each convention once, in the module or type docstring, and keep it everywhere:
  matrix layout; row (`x @ R.T`) or column (`R @ x`) vectors; quaternion order; tangent
  order (`[rho, phi]`); left or right perturbations and Jacobians; the frame a pose
  names.
- Convert a value from another convention, such as another library's quaternion order,
  once at the boundary, in a named function or constant.
- Document how a measured constant was measured, in its attribute docstring; never
  replace it by a nominal value.

## Names and docstrings
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

## Numerics
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

## Tests
- Test every array-returning function for: output shapes over parametrized input shapes;
  `jaxtyping.TypeCheckError` on malformed shapes; preserved dtype over
  `[torch.float32, torch.float64]`; the input's device, under a CUDA skip marker;
  gradients, with a gradient-check helper.
- Check correctness too: boundary and no-op values exactly (`torch.equal`); closed forms
  and autograd cross-checks with `torch.allclose(..., atol=...)`, in float64 for tight
  tolerances; validity with `validate_<thing>(result)`; an independent reference where
  one exists (`torch.linalg.matrix_exp(hat(phi))` for `exp`).
