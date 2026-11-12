# Codex framework benchmark: Marionette 5.1.0 and peers

This dataset covers four functioning applications per framework: **24 applications**, **1,296 passing independent test-case executions**, and **720 numeric Lighthouse samples**. Each app has six mobile routes and five samples per route. Every build contributes equally.

- [Full comparison](report.md): all six routes, generation, native usage, source size and limitations.
- [Methodology](METHODOLOGY.md): task, native timing boundary, tools, containment, local API, HTTPS/HTTP2, and measurement configuration.
- [Machine-readable summary](summary.json) and [route metrics CSV](metrics.csv).
- [Normalized source analysis](analysis/loc/README.md): one pinned formatter policy across 221 selected source files; SvelteKit b2 is **946 source-only normalized lines**.
- [Actual Codex adapter and measurement patch](harness/README.md).
- [Redistribution and privacy scope](REDISTRIBUTION.md).

## Applications

| Framework | b1 | b2 | b3 | b4 |
|---|---|---|---|---|
| Marionette 5.1.0 with Vite | [b1](marionette/b1/) | [b2](marionette/b2/) | [b3](marionette/b3/) | [b4](marionette/b4/) |
| Vanilla | [b1](vanilla/b1/) | [b2](vanilla/b2/) | [b3](vanilla/b3/) | [b4](vanilla/b4/) |
| React Router | [b1](react-router/b1/) | [b2](react-router/b2/) | [b3](react-router/b3/) | [b4](react-router/b4/) |
| SvelteKit | [b1](sveltekit/b1/) | [b2](sveltekit/b2/) | [b3](sveltekit/b3/) | [b4](sveltekit/b4/) |
| Nuxt | [b1](nuxt/b1/) | [b2](nuxt/b2/) | [b3](nuxt/b3/) | [b4](nuxt/b4/) |
| Angular | [b1](angular/b1/) | [b2](angular/b2/) | [b3](angular/b3/) | [b4](angular/b4/) |

Each build contains `repo/app` source and lockfiles, an explicit source manifest, native timing/usage and tooling receipts, the independent test outcome/log, and all six routes' numeric samples. Detailed Lighthouse JSON is included where retained, with image payloads removed. Normalized copies are analytical outputs, not the measured apps.

## Verify without running an app or model

From the repository root:

```sh
python3 results/2026-11-codex/validate.py
```

This reads files, checks the publication manifest, recomputes five-sample medians and four-app aggregates, verifies native timing/usage and normalized file hashes/counts, and checks the 24-app scope. It does not install packages, contact providers or run benchmarks.

For app inspection/build reproduction, restore the supplied fixture stylesheet by reference first:

```sh
python3 results/2026-11-codex/restore-provided-styles.py
```

That copies the already-inherited `template/design/tokens.css` to the listed app paths after verifying its SHA-256. Dependency implementations and Pokémon assets/data are not vendored. Use the inherited fixture's data setup and local API for an authorized runtime reproduction. See the methodology and redistribution notes; source inspection and numeric reanalysis require no provider credentials.
