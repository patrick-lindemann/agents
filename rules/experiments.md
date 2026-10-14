# Experiments

## Configs and seeds
- Set in `configs/` what a run should be able to change, not in code. A run stores its
  resolved config, so that it reads without any other file.
- Make a run reproducible from its config, its seed and the commit: the same three give
  statistically equal results. Build no reproducibility machinery beyond that.
- An unseeded run draws its seed with `secrets.randbits(63)`, uses it and records it.
- Derive each item's stream from the seed and the item's identity
  (`SeedSequence(seed, spawn_key=(index,))` or a hash of the input), so that results
  don't depend on the order of items and a resumed run continues the same sequence.

## Data
- Store float data as `f4` unless precision matters.
- Record provenance (versions, seeds, hashes of the inputs, the config) in the file's
  metadata (HDF5 attributes, Parquet metadata).
- A partial or parameterized read is a free function returning an `*Bundle` whose fields
  are set only when requested: `load_image(file_path, fields=("pixels",))` returns an
  `ImageBundle`.
- Keep the directories of an application as constants in one module (`DATA_DIR`,
  `OUT_DIR`). Where manifests or records describe the data, reach it through them, not
  through file names of your own.
- Set a `DataFrame`'s dtypes explicitly with `astype`, with a `CategoricalDtype` for a
  closed set of strings.
- An optional integration, such as an experiment tracker, only mirrors results; no code
  depends on it.

## Runs that may be interrupted
- Make the run resumable: its outputs record what continuing needs (the seed, counters,
  a hash of each input, the config), and a rerun continues exactly where it stopped.
- A rerun refuses to continue an output made from different inputs and points to
  `--overwrite`.
- Handle `SIGTERM` by `sys.exit(128 + signum)`, and restore a replaced handler
  afterwards. On `KeyboardInterrupt`, log how to continue and re-raise.
