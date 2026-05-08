# Client

`Client` is the main public object of the Softadastra JavaScript SDK.

It gives JavaScript applications one stable interface for local storage, persistent options, sync state, sync ticks, transport, discovery, peers, and node metadata.

Most JavaScript applications should start with:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.local("node-a"),
);
```

## Why Client exists

Softadastra is modular internally. The SDK exposes a simpler public API so applications do not need to manually wire store, sync, transport, discovery, metadata, and errors.

`Client` gives you one entry point for all of these.

## Basic lifecycle

```txt
construct
  ↓
open
  ↓
use
  ↓
close
```

Example:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.local("node-a"),
);

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

await client.put("hello", "world");

await client.close();
```

## Create a client

```js
const options = ClientOptions.local("node-a");

options.enableWal = true;
options.walPath = "data/node-a.wal";
options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

options.enableDiscovery = false;

const client = new Client(options);
```

## Open the client

```js
const result = await client.open();

if (result.isErr()) {
  console.error(`failed to open client: ${result.error().message}`);
  process.exit(1);
}
```

Opening the client prepares the local SDK runtime. Opening does not automatically start transport or discovery — those are explicit operations.

## Close the client

```js
await client.close();
```

A good lifecycle is:

```js
const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

// use client

await client.close();
```

## Local store methods

These operations are local-first and should not require a server, peer, transport, discovery, or cloud access.

### put

```js
const result = await client.put("profile/name", "Ada");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}
```

### get

```js
const result = await client.get("profile/name");

if (result.isOk()) {
  console.log(result.value().toString());
}

if (result.isErr()) {
  console.log(result.error().codeString());
}
```

A missing key is a normal store error, not a crash.

### remove

```js
const result = await client.remove("profile/name");

if (result.isErr()) {
  console.error(result.error().message);
}
```

### contains

```js
if (client.contains("settings/theme")) {
  console.log("theme exists");
}
```

### size

```js
console.log(client.size());
```

### empty

```js
if (client.empty()) {
  console.log("store is empty");
}
```

## Working with values

The SDK accepts strings directly:

```js
await client.put("message", "hello");
```

You can also use `Value` explicitly:

```js
import { Value } from "@softadastra/sdk";

const value = Value.fromString("hello");

await client.put("message", value);
```

Read values can be converted back to strings:

```js
const result = await client.get("message");

if (result.isOk()) {
  console.log(result.value().toString());
}
```

## Sync methods

### syncStateInfo

```js
const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox : ${state.value().outboxSize}`);
  console.log(`queued : ${state.value().queuedCount}`);
  console.log(`failed : ${state.value().failedCount}`);
}
```

### tick

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

A tick can retry expired operations, produce the next batch, and prune completed work when requested.

If supported:

```js
const tick = await client.tick({ prune: true });
```

## Transport methods

### startTransport

```js
const result = await client.startTransport();

if (result.isErr()) {
  console.error(`failed to start transport: ${result.error().message}`);
  await client.close();
  process.exit(1);
}
```

Transport requires transport options:

```js
options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;
```

### transportRunning

```js
if (client.transportRunning()) {
  console.log("transport is running");
}
```

### connect

```js
import { Peer } from "@softadastra/sdk";

const peer = new Peer("node-b", "127.0.0.1", 4042);

const result = await client.connect(peer);

if (result.isErr()) {
  console.log(`peer connection failed: ${result.error().message}`);
}
```

A failed connection should not prevent local writes:

```js
await client.put("draft/1", "still local");
```

### stopTransport

If exposed:

```js
await client.stopTransport();
```

## Discovery methods

### startDiscovery

```js
const result = await client.startDiscovery();

if (result.isErr()) {
  console.error(`failed to start discovery: ${result.error().message}`);
  await client.close();
  process.exit(1);
}
```

### discoveryRunning

```js
if (client.discoveryRunning()) {
  console.log("discovery is running");
}
```

### peers

```js
const peers = await client.peers();

if (peers.isOk()) {
  for (const peer of peers.value()) {
    console.log(`${peer.nodeId} ${peer.host}:${peer.port}`);
  }
}
```

No peers is a valid state. Local writes should still work.

### stopDiscovery

If exposed:

```js
await client.stopDiscovery();
```

## Metadata methods

### refreshNodeInfo

```js
const result = await client.refreshNodeInfo();

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}

const node = result.value();

console.log(`node id      : ${node.nodeId}`);
console.log(`display name : ${node.displayName}`);
console.log(`hostname     : ${node.hostname}`);
console.log(`os           : ${node.osName}`);
console.log(`version      : ${node.version}`);
console.log(`uptime ms    : ${node.uptime_ms()}`);
```

### nodeInfo

If exposed, returns cached local node information without forcing a refresh:

```js
const info = await client.nodeInfo();
```

## Error handling pattern

```js
const result = await client.get("key");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}

const value = result.value();
```

Avoid assuming success:

```js
const value = (await client.get("key")).value(); // wrong — hides failure
```

Common result methods: `isOk()`, `isErr()`, `value()`, `error()`.

Common error fields: `message`, `codeString()`.

## Client method reference

| Method | Purpose |
|---|---|
| `open()` | Initialize the client runtime |
| `close()` | Close the client runtime |
| `put(key, value)` | Write a local value |
| `get(key)` | Read a local value |
| `remove(key)` | Remove a local value |
| `contains(key)` | Check if a key exists |
| `size()` | Return local store size |
| `empty()` | Check if local store is empty |
| `syncStateInfo()` | Return sync state |
| `tick()` | Run one sync tick |
| `startTransport()` | Start transport |
| `stopTransport()` | Stop transport, if available |
| `transportRunning()` | Check transport state |
| `connect(peer)` | Connect to a peer |
| `startDiscovery()` | Start discovery |
| `stopDiscovery()` | Stop discovery, if available |
| `discoveryRunning()` | Check discovery state |
| `peers()` | List known peers |
| `nodeInfo()` | Read cached node metadata, if available |
| `refreshNodeInfo()` | Refresh and read node metadata |

## CamelCase versus snake_case

Prefer JavaScript-style camelCase:

```js
await client.startDiscovery();
await client.syncStateInfo();
await client.refreshNodeInfo();
```

Use snake_case aliases only if you need compatibility with examples or internal naming:

```js
await client.start_discovery();
await client.sync_state_info();
await client.refresh_node_info();
```

## Common mistakes

### Forgetting open()

```js
// wrong
const client = new Client(options);
await client.put("key", "value");

// correct
const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  process.exit(1);
}

await client.put("key", "value");
```

### Ignoring result values

```js
// wrong
const value = await client.get("key");
console.log(value.value().toString());

// correct
const value = await client.get("key");

if (value.isErr()) {
  console.error(value.error().message);
  await client.close();
  process.exit(1);
}

console.log(value.value().toString());
```

### Expecting peers to be required for local writes

```js
// this should still work with no peers:
await client.put("draft/1", "hello");
await client.get("draft/1");
```

## Summary

`Client` is the main JavaScript SDK API.

It provides lifecycle, local store, sync state, manual ticks, transport, discovery, peers, metadata, and explicit errors.

The most important pattern is:

```js
const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  process.exit(1);
}

// use client

await client.close();
```

## Next step

Continue with client options:

[Go to Client Options](/sdk-js/client-options)
