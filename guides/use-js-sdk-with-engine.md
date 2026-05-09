# Use the JavaScript SDK with the Engine

This guide explains how the Softadastra JavaScript SDK maps to the internal Softadastra Engine model.

The goal is to understand what happens behind JavaScript SDK calls such as `Client`, `ClientOptions`, `put`, `get`, `syncStateInfo`, `tick`, `startTransport`, `startDiscovery`, and `refreshNodeInfo`.

The core rule is:

```txt
The JavaScript SDK follows the same local-first engine model with an async JavaScript API.
```

Most JavaScript applications should use the SDK first. The engine documentation explains the lower-level runtime internals.

## What you will learn

You will learn how the JavaScript SDK maps to these Softadastra concepts:

```txt
ClientOptions  -> runtime configuration
Client         -> SDK facade
put/get        -> local store
persistent     -> WAL-backed persistence
syncStateInfo  -> sync engine state
tick           -> sync scheduler
transport      -> peer delivery
discovery      -> peer finding
node info      -> metadata
Result         -> explicit error handling
```

The basic model is:

```txt
JavaScript app
  ↓
Softadastra JS SDK
  ↓
Softadastra runtime model
```

## Why this mapping matters

The JavaScript SDK gives a small public API for local-first applications.

Instead of thinking about every internal layer separately, an app can use:

```js
const client = new Client(
  ClientOptions.local("node-a"),
);
```

Then:

```js
await client.open();
await client.put("app/name", "Softadastra");
await client.syncStateInfo();
await client.tick();
await client.close();
```

The SDK keeps the API simple while still following the same Softadastra runtime model used by the C++ engine.

## SDK versus Engine

The SDK is the developer-facing layer.

The engine is the lower-level runtime layer.

```txt
SDK JS
  -> Client
  -> ClientOptions
  -> Value
  -> Peer
  -> NodeInfo
  -> Result
  -> SoftadastraError

Engine model
  -> core
  -> WAL
  -> store
  -> sync
  -> transport
  -> discovery
  -> metadata
```

Use the SDK when you are building a JavaScript or Node.js application.

Use the engine documentation when you want to understand the internal modules, C++ implementation, or low-level runtime behavior.

## Main SDK entry point

Most JavaScript applications should import:

```js
import {
  Client,
  ClientOptions,
} from "@softadastra/sdk";
```

Other public types can include:

- `Value`
- `Peer`
- `NodeInfo`
- `Result`
- `SoftadastraError`
- `SyncResult`
- `TickResult`

The JavaScript SDK uses `camelCase` for public fields and methods.

Examples:

- `enableWal`
- `walPath`
- `autoFlush`
- `syncStateInfo`
- `startTransport`
- `startDiscovery`
- `refreshNodeInfo`
- `outboxSize`
- `queuedCount`
- `failedCount`
- `batchSize`

## ClientOptions maps to runtime configuration

`ClientOptions` defines how the local runtime should behave.

Example:

```js
const options = ClientOptions.persistent(
  "node-a",
  "data/node-a.wal",
);

options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

options.enableDiscovery = false;

options.displayName = "Node A";
options.version = "0.1.0";
```

Conceptually, these options map to runtime configuration:

```txt
node id          -> metadata, sync, transport, discovery
wal path         -> WAL-backed persistence
auto flush       -> persistence durability behavior
transport host   -> transport bind host
transport port   -> transport bind port
discovery config -> discovery runtime
display name     -> metadata
version          -> metadata
```

The SDK hides the internal wiring.

## Client maps to the runtime facade

`Client` is the main SDK object.

```js
const client = new Client(options);
```

Conceptually, `Client` coordinates the runtime features selected by the options.

```txt
Client
  ↓
local store
persistence, if enabled
sync
transport, if enabled
discovery, if enabled
metadata
```

The application does not need to manually compose those pieces.

## open maps to runtime initialization

Before using the SDK, call:

```js
const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}
```

Conceptually, `open()` can initialize:

```txt
validate options
  ↓
initialize metadata
  ↓
open persistence, if enabled
  ↓
recover store from persistent history, if enabled
  ↓
initialize store
  ↓
initialize sync state
  ↓
prepare transport config, if enabled
  ↓
prepare discovery config, if enabled
  ↓
client ready
```

Opening the client should not require a peer.

Opening the client should not require discovery.

Opening the client should not require a server.

The local runtime should be useful first.

## put maps to store, persistence, and sync

A normal write looks like this:

```js
const result = await client.put(
  "app/name",
  "Softadastra",
);

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}
```

Conceptually:

```txt
client.put()
  ↓
validate key and value
  ↓
create store operation
  ↓
append to persistent log, if enabled
  ↓
apply to local store
  ↓
create sync operation, if sync tracking is enabled
  ↓
return Result
```

The store makes the value readable locally.

Persistence makes the operation recoverable when enabled.

Sync tracks the operation for later propagation.

## get maps to the local store

A read looks like this:

```js
const result = await client.get("app/name");

if (result.isOk()) {
  console.log(result.value().toString());
}
```

Conceptually:

```txt
client.get()
  ↓
local store lookup
  ↓
return Value or Error
```

`get()` is local.

It should not require a server, peer, transport, discovery, or cloud access.

If the key is missing, the result should be an explicit error.

```js
const result = await client.get("missing/key");

if (result.isErr()) {
  console.log(result.error().codeString());
}
```

Expected output style:

```txt
not_found
```

A missing key is a normal store result. It should not crash the app.

## remove maps to a store operation

A remove operation looks like this:

```js
const result = await client.remove("app/name");

if (result.isErr()) {
  console.error(result.error().message);
}
```

Conceptually:

```txt
client.remove()
  ↓
create delete operation
  ↓
append to persistent log, if enabled
  ↓
apply delete to store
  ↓
track sync operation, if enabled
  ↓
return Result
```

A remove is still local-first.

Remote peers can learn about the delete later through sync.

## contains, size, and empty map to store state

These methods inspect current local state:

```js
client.contains("app/name");
client.size();
client.empty();
```

They map to the local store.

```txt
contains -> does this key exist locally?
size     -> how many local entries exist?
empty    -> is the local store empty?
```

They do not require transport or discovery.

## Persistent options map to WAL-backed behavior

Use persistent mode when local data should survive restart:

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/node-persistent.wal",
);

options.autoFlush = true;
```

Conceptually:

```txt
ClientOptions.persistent
  ↓
enable persistence
  ↓
set WAL path
  ↓
open store with recovery
```

The persistent write path is:

```txt
put
  ↓
persistent log append
  ↓
store apply
  ↓
sync tracking
```

The recovery path is:

```txt
client.open()
  ↓
read persistent history
  ↓
replay valid operations
  ↓
restore local store
```

## syncStateInfo maps to the sync engine

Use `syncStateInfo()` to inspect pending synchronization work:

```js
const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox: ${state.value().outboxSize}`);
  console.log(`queued: ${state.value().queuedCount}`);
  console.log(`failed: ${state.value().failedCount}`);
}
```

Conceptually:

```txt
client.syncStateInfo()
  ↓
sync engine state
  ↓
outbox count
  ↓
queued count
  ↓
in-flight count
  ↓
acknowledged count
  ↓
failed count
  ↓
retry count
```

The sync state does not mean remote delivery has completed.

It shows what the local runtime knows about propagation work.

## tick maps to the sync scheduler

Use `tick()` to move the sync pipeline forward once:

```js
const tick = await client.tick();

if (tick.isOk()) {
  console.log(`retried: ${tick.value().retriedCount}`);
  console.log(`pruned: ${tick.value().prunedCount}`);
  console.log(`batch: ${tick.value().batchSize}`);
}
```

Conceptually:

```txt
client.tick()
  ↓
retry expired work
  ↓
select queued operations
  ↓
produce next batch
  ↓
prepare delivery through transport, if enabled
  ↓
return TickResult
```

A tick is explicit.

This makes synchronization easier to test, debug, and control.

## tick with pruning

If supported:

```js
const tick = await client.tick({
  prune: true,
});
```

Conceptually:

```txt
tick
  ↓
move sync pipeline
  ↓
remove completed entries, if safe
```

Pruning should only remove completed sync work.

It should not remove local store values.

## startTransport maps to transport

Transport is optional.

Enable it through options:

```js
options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;
```

Start it explicitly:

```js
const result = await client.startTransport();

if (result.isErr()) {
  console.error(result.error().message);
}
```

Conceptually:

```txt
client.startTransport()
  ↓
transport config
  ↓
bind host and port
  ↓
start transport backend
  ↓
ready to connect peers
```

Transport is the delivery layer.

It does not decide what a sync operation means.

## connect maps to peer transport

A peer describes another node:

```js
const peer = new Peer(
  "node-b",
  "127.0.0.1",
  4042,
);
```

Connect:

```js
const connected = await client.connect(peer);

if (connected.isErr()) {
  console.log(`connection failed: ${connected.error().message}`);
}
```

Conceptually:

```txt
client.connect(peer)
  ↓
transport connect
  ↓
peer registry update
  ↓
messages can be delivered, if connection succeeds
```

A connection failure should not invalidate local state.

```txt
transport failure
  ↓
sync work remains tracked
  ↓
local value remains readable
```

## startDiscovery maps to discovery

Discovery is optional.

Enable it through options:

```js
options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
```

Start it explicitly:

```js
const result = await client.startDiscovery();

if (result.isErr()) {
  console.error(result.error().message);
}
```

Conceptually:

```txt
client.startDiscovery()
  ↓
discovery config
  ↓
listen for discovery messages
  ↓
announce local node
  ↓
track discovered peers
```

Discovery finds peers.

Transport connects peers.

Sync sends operations.

## peers maps to discovery and peer registry

Use:

```js
const peers = await client.peers();

if (peers.isOk()) {
  for (const peer of peers.value()) {
    console.log(`${peer.nodeId} ${peer.host}:${peer.port}`);
  }
}
```

Conceptually:

```txt
client.peers()
  ↓
known peer registry
  ↓
discovered or configured peers
```

No peers is a valid state.

A node can still read and write local data when no peer is known.

## refreshNodeInfo maps to metadata

Use:

```js
const info = await client.refreshNodeInfo();

if (info.isOk()) {
  const node = info.value();

  console.log(node.nodeId);
  console.log(node.displayName);
  console.log(node.hostname);
  console.log(node.osName);
  console.log(node.version);
}
```

Conceptually:

```txt
client.refreshNodeInfo()
  ↓
metadata service
  ↓
node id
  ↓
display name
  ↓
hostname
  ↓
operating system
  ↓
version
  ↓
capabilities
  ↓
uptime
```

Metadata describes the node.

It does not store application data.

## Result maps to explicit error handling

Most SDK operations return explicit results.

```js
const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}

console.log(result.value().toString());
```

Conceptually:

```txt
operation
  ↓
Result
  ↓
ok(value) or err(error)
```

The SDK uses explicit errors because failure is normal in local-first systems.

Examples:

- missing key
- invalid WAL path
- transport failed
- peer unavailable
- discovery disabled
- sync failed
- metadata unavailable

The rule is:

```txt
Check the result before using the value.
```

## Complete JavaScript SDK flow

This example uses several SDK features and shows how they map to the engine model.

```js
import {
  Client,
  ClientOptions,
} from "@softadastra/sdk";

const options = ClientOptions.persistent(
  "node-a",
  "data/node-a.wal",
);

options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

options.enableDiscovery = false;

options.displayName = "Node A";
options.version = "0.1.0";

const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  console.error(`open failed: ${opened.error().message}`);
  process.exit(1);
}

const written = await client.put(
  "app/name",
  "Softadastra",
);

if (written.isErr()) {
  console.error(`write failed: ${written.error().message}`);
  await client.close();
  process.exit(1);
}

const value = await client.get("app/name");

if (value.isOk()) {
  console.log(`value: ${value.value().toString()}`);
}

const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox: ${state.value().outboxSize}`);
}

const tick = await client.tick();

if (tick.isOk()) {
  console.log(`batch: ${tick.value().batchSize}`);
}

const node = await client.refreshNodeInfo();

if (node.isOk()) {
  console.log(`node: ${node.value().nodeId}`);
}

await client.close();
```

Expected output style:

```txt
value: Softadastra
outbox: 1
batch: 1
node: node-a
```

The exact sync numbers can differ depending on runtime configuration.

## Internal flow behind the example

The previous example maps to this runtime flow:

```txt
ClientOptions.persistent
  ↓
WAL path configured

client.open()
  ↓
metadata initialized
  ↓
persistent history opened
  ↓
store recovered
  ↓
sync initialized
  ↓
transport prepared

client.put()
  ↓
store operation
  ↓
persistent log append
  ↓
store apply
  ↓
sync operation created

client.syncStateInfo()
  ↓
sync state read

client.tick()
  ↓
sync scheduler moves pipeline

client.refreshNodeInfo()
  ↓
metadata refreshed

client.close()
  ↓
runtime cleanup
```

The SDK gives one clean async API over that flow.

## When to use the JavaScript SDK

Use the JavaScript SDK when you want to:

- build a Node.js application
- build a local-first JavaScript tool
- store local data
- add offline-first behavior
- persist local operations
- inspect sync state
- connect peers
- use Softadastra without manual engine wiring

For JavaScript applications, the SDK is the right level.

## When to read the engine docs

Read the engine docs when you want to:

- understand the C++ runtime internals
- extend a low-level module
- debug WAL behavior
- debug sync behavior
- understand transport
- understand discovery
- understand metadata
- compare SDK behavior with engine design

The engine section is lower-level and more technical.

## SDK and CLI relationship

The SDK and CLI both sit above the same Softadastra runtime model.

```txt
JS SDK
  ↓
runtime model

CLI
  ↓
runtime model
```

They expose similar concepts in different forms.

SDK:

```js
await client.put("app/name", "Softadastra");
await client.syncStateInfo();
await client.tick();
```

CLI:

```bash
softadastra store put app/name Softadastra
softadastra sync status
softadastra sync tick
```

Both follow the same model.

## SDK and local-first behavior

The SDK should preserve Softadastra's local-first rules.

A local write should not require:

- remote server
- connected peer
- transport
- discovery
- cloud access

A transport failure should not delete local state.

A discovery failure should not block store access.

A sync failure should not make a local value unreadable.

This is the practical meaning of local-first behavior in the JavaScript SDK.

## Common mistakes

### Forgetting ESM setup

The JavaScript SDK uses modern JavaScript modules.

Your `package.json` should include:

```json
{
  "type": "module"
}
```

Then you can use:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

### Forgetting to open the client

Wrong:

```js
const client = new Client(options);
await client.put("app/name", "Softadastra");
```

Correct:

```js
const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

await client.put("app/name", "Softadastra");
```

### Forgetting await

Wrong:

```js
const result = client.put("app/name", "Softadastra");
```

Correct:

```js
const result = await client.put("app/name", "Softadastra");
```

Most runtime operations are async.

### Assuming put means remote delivery

`put()` writes locally.

It can create sync work, but it does not guarantee another node already received the operation.

Inspect sync:

```js
const state = await client.syncStateInfo();
```

Run a tick:

```js
const tick = await client.tick();
```

### Assuming transport is required for local store

Transport is optional.

This should still work:

```js
options.enableTransport = false;

await client.put("local/key", "value");
await client.get("local/key");
```

### Sharing a WAL path between nodes

Each node should have its own WAL path.

Good:

```txt
node-a -> data/node-a.wal
node-b -> data/node-b.wal
```

Bad:

```txt
node-a -> data/shared.wal
node-b -> data/shared.wal
```

## Debugging with CLI

Use the CLI to inspect the same runtime concepts:

```bash
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra peers
```

This helps confirm that JavaScript SDK behavior matches the runtime model.

## Summary

The JavaScript SDK is a stable async API over the Softadastra runtime model.

The mapping is:

```txt
ClientOptions  -> runtime configuration
Client         -> SDK facade
put/get        -> store
persistent     -> WAL-backed recovery
syncStateInfo  -> sync state
tick           -> sync scheduler
transport      -> peer delivery
discovery      -> peer finding
metadata       -> node identity
Result         -> explicit error handling
```

The SDK lets you build local-first JavaScript applications without manually wiring every engine module.

## Next step

Continue with:

[Production](./production)
