---
paths:
  - "**/*.py"
---
# PyTorch

## Types and creation
- Import `Tensor` from `torch`, `Device` from `torch.types`, `DType` as
  `from torch import dtype as DType`; the project's aliases win.
- New tensors take their dtype, device and `requires_grad` from the input tensors, not
  from global defaults.
- A function that creates tensors takes `size`, then `dtype: DType | None = None`,
  `device: Device = None` and `requires_grad: bool | None = None`, in this order across
  the module. Add a `*_like(tensor)` variant, which takes them from `tensor`, when a
  caller needs one.
- Return the result of `forward` or `sample` as an `*Output` dataclass, not a tuple.

## Modules and autograd
- Keep submodules in `nn.ModuleList` and `nn.ModuleDict`, never in plain lists or dicts.
- Register constants of a module as buffers (`register_buffer`), never as parameters;
  no constant requires gradients.
- Don't write in place into tensors that autograd differentiates through; build them
  with `torch.cat` and `torch.stack`.
- Evaluate after `model.eval()` and under `torch.inference_mode()`, unless gradients are
  needed (guided sampling, attribution); switch back with `model.train()`.
- Wrap only the forward pass and the loss in `torch.autocast`.

## Training runs
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
