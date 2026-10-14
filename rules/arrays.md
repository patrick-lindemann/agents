# Arrays

## Annotations
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

## Values
- Use arrays that libraries return as they are; convert only where data is
  materialized or its dtype changes (reading a dataset, a list built in a loop).
- Pass a library values in the precision it works in, such as a float64 solver,
  converted at the boundary.
- Prefer vectorizing over batch axes to looping over items in Python.
- A validator over a batch names the indices of the bad elements.
- A NumPy function that draws takes `rng: numpy.random.Generator`, never calls
  `np.random` functions.
