# Sync

Sync is the part of the Softadastra JavaScript SDK that tracks local operations and moves them toward synchronization.

A local write can happen first:

```js
await client.put("profile/name", "Ada");
```

Then sync can inspect and move pending work:

```js
await client.syncStateInfo();
await client.tick();
```

The core rule is:

> Write locally first. Sync later.

## Why sync exists

Softadastra is local-first. That means an application can accept local writes before a peer, server, or transport connection is available.

But local-first applications still need a way to propagate local work later. Sync exists for that.

```txt
local write
  ↓
local store
  ↓
sync operation
  ↓
outbox
  ↓
queue
  ↓
tick
  ↓
transport batch, if transport is enabled
```

## Sync is not transport

```txt
Sync       -> tracks and prepares operations
Transport  -> sends messages to peers
```

You can use sync without transport:

```js
options.enableTransport = false;
options.enableDiscovery = false;
```

## Basic sync example

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.local("node-basic-sync");

options.enableTransport = false;
options.enableDiscovery = false;

options.enableWal = true;
options.walPath = "data/sdk-basic-sync.wal";
options.autoFlush = true;

const client = new Client(options);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(`failed to open client: ${openResult.error().message}`);
  process.exit(1);
}

const putResult = await client.put("profile/name", "Softadastra");

if (putResult.isErr()) {
  console.error(`failed to submit local value: ${putResult.error().message}`);
  await client.close();
  process.exit(1);
}

const before = await client.syncStateInfo();

if (before.isOk()) {
  console.log("before tick");
  console.log(`  outbox : ${before.value().outboxSize}`);
  console.log(`  queued : ${before.value().queuedCount}`);
  console.log(`  failed : ${before.value().failedCount}`);
}

const tickResult = await client.tick();

if (tickResult.isErr()) {
  console.error(`failed to tick sync pipeline: ${tickResult.error().message}`);
  await client.close();
  process.exit(1);
}

console.log("\ntick result");
console.log(`  retried : ${tickResult.value().retriedCount}`);
console.log(`  pruned  : ${tickResult.value().prunedCount}`);
console.log(`  batch   : ${tickResult.value().batchSize}`);

await client.close();
```

Expected output style:

```txt
before tick
  outbox : 1
  queued : 1
  failed : 0

tick result
  retried : 0
  pruned  : 0
  batch   : 1
```

## `syncStateInfo`

```js
const state = await client.syncStateInfo();

if (state.isErr()) {
  console.error(state.error().message);
  await client.close();
  process.exit(1);
}

console.log(`outbox : ${state.value().outboxSize}`);
console.log(`queued : ${state.value().queuedCount}`);
console.log(`failed : ${state.value().failedCount}`);
```

Snake_case alias, if exposed: `await client.sync_state_info()`.

### Sync state fields

**`outboxSize`** — Local operations waiting for synchronization. Does not mean work has been delivered to a peer.

**`queuedCount`** — Operations ready to be selected for sending.

**`inFlightCount`** — Operations sent or prepared for delivery, possibly waiting for ACK.

**`acknowledgedCount`** — Operations confirmed by the remote side.

**`failedCount`** — Operations that exceeded the retry policy. Failed sync does not mean the local value disappeared.

**`totalRetries`** — Total retry attempts. Helps debug unstable transport or missing ACKs.

## `tick`

```js
const tick = await client.tick();

if (tick.isErr()) {
  console.error(tick.error().message);
  await client.close();
  process.exit(1);
}

console.log(`retried : ${tick.value().retriedCount}`);
console.log(`pruned  : ${tick.value().prunedCount}`);
console.log(`batch   : ${tick.value().batchSize}`);
```

### Tick result fields

**`retriedCount`** — Operations retried during this tick.

**`prunedCount`** — Completed entries removed during this tick.

**`batchSize`** — Operations produced in the current sync batch.

### Tick with pruning

If supported:

```js
const tick = await client.tick({ prune: true });
```

## Sync without transport

```js
options.enableTransport = false;
options.enableDiscovery = false;
```

You can still call `syncStateInfo()` and `tick()`. Transport is only needed for delivery to peers.

## Sync with transport

```js
options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;
```

Then:

```js
await client.open();
await client.startTransport();

const peer = new Peer("node-b", "127.0.0.1", 4042);
await client.connect(peer);

await client.put("message/1", "hello");
await client.tick();
```

## Sync and failed work

If sync work fails, local data can still exist:

```js
await client.put("draft/1", "hello");
const tick = await client.tick();

// Even if sync fails:
const value = await client.get("draft/1"); // still readable locally
```

## Sync API reference

| Method | Purpose |
|---|---|
| `syncStateInfo()` | Read current sync state |
| `sync_state_info()` | Snake_case alias, if exposed |
| `tick()` | Run one sync tick |
| `tick(true)` | Run one tick and prune, if supported |
| `tick({ prune: true })` | Run one tick and prune, if supported |

### SyncResult fields

| Field | Purpose |
|---|---|
| `outboxSize` | Number of tracked sync entries |
| `queuedCount` | Number of queued entries |
| `inFlightCount` | Number of in-flight entries |
| `acknowledgedCount` | Number of acknowledged entries |
| `failedCount` | Number of failed entries |
| `totalRetries` | Total retry attempts |

### TickResult fields

| Field | Purpose |
|---|---|
| `retriedCount` | Operations retried during the tick |
| `prunedCount` | Completed entries pruned |
| `batchSize` | Operations produced in the tick batch |

## Run the SDK example

```sh
cd ~/softadastra/sdk-js
npm install
mkdir -p data
npm run examples:basic-sync
```

## Common mistakes

### Expecting sync to mean immediate network delivery

Sync tracks and prepares operations. Transport delivers them.

### Treating failed sync as lost local data

Failed sync means propagation failed. Local store data can still exist.

### Forgetting to check results

Always check `isErr()` before reading `value()`.

## Summary

Sync in the JavaScript SDK gives you `syncStateInfo`, `tick`, outbox visibility, queued work, failed work, retry visibility, and batch visibility.

The key idea is: local writes happen first. Sync makes them observable and movable later.

## Next step

Continue with transport:

[Go to Transport](/sdk-js/transport)
