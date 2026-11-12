# Codex and measurement adaptations

Base: inherited harness commit `b95ada03930ca3670c8ff6377c3af815df0ac040`.

`generation-adapter.cjs` is the actual Codex native app-server adapter used for the published Marionette 5.1.0 apps; it is copied without content changes and its hash is in `source-provenance.json`. It initializes the CLI, checks the first-party subscription route privately, reads native config, starts an ephemeral gpt-6.1-sol thread with unset effort/tier, inventories the bundled skill and hosted MCP, waits for the owner admission signal, times turn/start through root completion, and saves native cumulative usage. It distinguishes preflight catalog probes from model invocation. Account/config RPC results that contain private context are suppressed from emitted public output.

The adapter expects an already prepared unprivileged disposable container, user-owned native subscription login, fresh HOME/CODEX_HOME, installed Codex 0.166.0, an empty cloud-skill snapshot, the app fixture and bundled release skill. It is not a complete turnkey host controller or a credential-provisioning script. Review these preconditions before any live use; numeric evidence verification requires none of them.

The actual child interface is:

```text
codex app-server --listen stdio:// --cloud-skills-snapshot $LOCAL_RUN_TASK/empty-cloud-skills.json
node generation-adapter.cjs <fixture-work> <prompt-file> <evidence-dir> <arm-json>
```

The outer owner must validate serial ownership, AC/disk, exact package bytes, 4 CPU / 8 GiB limits, intended session exposure and billing route before writing `ADMIT` to adapter stdin. The arm identifies the `marionette` skill, `marionette-docs` server, release source revision and skill SHA-256. A successful CLI exit alone does not prove container cleanup. The owner verifies exact container state/start epoch, exports source and logs, runs independent acceptance/measurement serially, removes only verified exited owned stages, and stops/verifies the VM. Unknown state must stop admission. The live private orchestration and authentication material are not distributed.

`measurement-image.patch` is the actual source delta for scoped Caddy CA trust and HTTPS/HTTP2 qualification, including its libnss3-tools prerequisite. To review/apply it in a separate reproduction checkout of the exact base:

```sh
git apply --check results/2026-11-codex/harness/measurement-image.patch
git apply results/2026-11-codex/harness/measurement-image.patch
```

No patch was applied to the inherited harness in this publication. Review the base `bench/container` recipes, pin Node 24.22.1 / Playwright 1.64.1 and the recorded browser/measurement versions, and supply the fixture's local data mirror. The distribution image/package repositories are not a fully frozen environment. The original Claude-oriented launcher alone does not reproduce this Codex adaptation, and stochastic model regeneration is not promised identical.

The measured stage was structurally:

```text
podman create --cpus=4 --memory=8g --userns=keep-id:uid=1000,gid=1000 \
  --add-host=api.localhost:127.0.0.1 \
  -v <owned-repo>:/repo:Z -v <owned-results>:/results:Z \
  --entrypoint /bin/bash pokedex-measure -c \
  'exec node /home/agent/bench/measure.mjs /repo/app /results --runs 5'
```

This documents a command shape, not a request to run it against unrelated data. Own and verify the resulting exact ID, preserve the original source/lock and each result, and keep trust confined to the disposable measurement environment. Per-build primary receipts are authoritative for the recorded settings; the method notes identify peer hostname/deadline differences.
