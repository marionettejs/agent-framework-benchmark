# Source-only normalized LOC

This analysis covers the same 24 applications as the results dataset. Normalized copies are analytical files and were not used for runtime measurement. The original application source remains under each framework/build `repo/app`.

Pins: **Prettier 3.9.10**, **prettier-plugin-svelte 4.1.1**, **Svelte 5.57.3**. Tool runtime recorded for the supplied analysis: Node 24.19.0, npm 11.17.0, macOS ARM64. All 221 included original-file hashes and formatted-file hashes were checked against the selected app sources and bundle. Every file's nonblank count was independently recounted. SvelteKit b2 is **946 lines**, excluding **69** formatted lines of supplied tokens.css.

`policy.json` defines the source extensions, directory/test/generated-marker exclusions, supplied-CSS hash, parser mapping and explicit formatter options. `source-selection.json` records inclusion and exclusion of current-app files. `inputs.json` points only at the selected app source. `metrics.json` retains original/normalized bytes, hashes, per-file counts and stability checks. `summary.json` retains all four counts per framework. The provided formatter bundle SHA-256 was `d758ff488e886f4bd843dec299f1b8beabdd618644361f2419bb2a38ad926b06`.

To reproduce normalization, after explicitly choosing to install the pinned formatter dependencies:

```sh
cd results/2026-11-codex/analysis/loc
npm ci --ignore-scripts --no-audit --no-fund
node normalize.mjs --input inputs.json --output normalized-check --metrics metrics-check.json --policy policy.json
```

This runs the formatter on source copies, not the apps or model. It loads the pinned Svelte plugin for every file, with no app configuration/editorconfig/ignore-file loading. Compare output file hashes and counts with `metrics.json`; tool runtime metadata can differ across hosts. Do not overwrite the measured app source with formatted copies. The no-install `validate.py` at the results root verifies the retained outputs and their counts.
