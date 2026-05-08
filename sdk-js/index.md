# SDK JS

The Softadastra JavaScript SDK is the official JavaScript developer interface for Softadastra.

It provides a small public API for building local-first and offline-first JavaScript applications with local key-value storage, WAL-style persistence options, manual sync ticks, optional transport, optional discovery, local node metadata, and explicit errors.

The main package is:

```txt
@softadastra/sdk
```

The main import is:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

## What the JavaScript SDK is for

Use the JavaScript SDK when you want to embed Softadastra behavior into a JavaScript or Node.js application.

It is designed for local-first apps, offline-first apps, Node.js tools, desktop apps, edge apps, local sync experiments, peer-aware apps, developer tools, and runtime services.

## The core model

The JavaScript SDK follows the same Softadastra model:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

A local write should not require a server or peer:

```js
await client.put("profile/name", "Ada");
```

Synchronization can happen later:

```js
await client.tick();
```

## Minimal example

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.local("node-local"),
);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(openResult.error().message);
  process.exit(1);
}

const putResult = await client.put(
  "app/name",
  "Softadastra SDK",
);

if (putResult.isErr()) {
  console.error(putResult.error().message);
  await client.close();
  process.exit(1);
}

const valueResult = await client.get("app/name");

if (valueResult.isErr()) {
  console.error(valueResult.error().message);
  await client.close();
  process.exit(1);
}

console.log("key   : app/name");
console.log(`value : ${valueResult.value().toString()}`);
console.log(`size  : ${client.size()}`);

await client.close();
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Main public types

The JavaScript SDK exposes: `Client`, `ClientOptions`, `Value`, `Peer`, `NodeInfo`, `Result`, `SoftadastraError`, `SyncResult`, and `TickResult`.

## Client

`Client` is the main SDK object. It owns the local SDK runtime from the application point of view.

Common methods:

```js
await client.open();
await client.close();

await client.put("key", "value");
await client.get("key");
await client.remove("key");

client.contains("key");
client.size();
client.empty();

await client.syncStateInfo();
await client.tick();

await client.startTransport();
await client.connect(peer);

await client.startDiscovery();
await client.peers();

await client.refreshNodeInfo();
```

## ClientOptions

`ClientOptions` configures the SDK. The JavaScript SDK uses camelCase for public fields.

```js
const options = ClientOptions.local("node-a");

options.enableWal = true;
options.walPath = "data/node-a.wal";
options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

options.enableDiscovery = false;
```

## Local store

```js
await client.put("settings/theme", "dark");

const value = await client.get("settings/theme");

if (value.isOk()) {
  console.log(value.value().toString());
}
```

Local store operations include `put`, `get`, `remove`, `contains`, `size`, and `empty`. The local store does not require transport, discovery, peers, or a server.

## Persistent store

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/sdk-store.wal",
);

options.autoFlush = true;
```

Or configure manually:

```js
options.enableWal = true;
options.walPath = "data/sdk-store.wal";
options.autoFlush = true;
```

## Sync

```js
const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(state.value().outboxSize);
  console.log(state.value().queuedCount);
  console.log(state.value().failedCount);
}
```

Run one tick:

```js
const tick = await client.tick();

if (tick.isOk()) {
  console.log(tick.value().retriedCount);
  console.log(tick.value().prunedCount);
  console.log(tick.value().batchSize);
}
```

## Transport

```js
const options = ClientOptions.local("node-a");

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

const client = new Client(options);

await client.open();
await client.startTransport();

const peer = new Peer("node-b", "127.0.0.1", 4042);

const connected = await client.connect(peer);
```

Transport is optional. If a peer is unavailable, local writes should still work.

## Discovery

```js
options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
```

```js
await client.startDiscovery();

const peers = await client.peers();

if (peers.isOk()) {
  for (const peer of peers.value()) {
    console.log(`${peer.nodeId} ${peer.host}:${peer.port}`);
  }
}
```

The model is: discovery finds peers, transport connects peers, sync sends operations.

## Metadata

```js
const nodeResult = await client.refreshNodeInfo();

if (nodeResult.isOk()) {
  const node = nodeResult.value();

  console.log(node.nodeId);
  console.log(node.displayName);
  console.log(node.hostname);
  console.log(node.osName);
  console.log(node.version);
}
```

## Error handling

```js
const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  process.exit(1);
}

console.log(result.value().toString());
```

Do not assume an operation succeeded without checking the result.

## CamelCase and snake_case

The JavaScript SDK primarily uses camelCase:

```js
await client.startDiscovery();
client.discoveryRunning();
await client.syncStateInfo();
await client.refreshNodeInfo();
```

Some APIs may expose snake_case aliases for compatibility. Prefer camelCase in JavaScript documentation.

## Example files

The JavaScript SDK examples are organized as a progressive path:

1. `01-local-store.js`
2. `02-persistent-store.js`
3. `03-remove-value.js`
4. `04-basic-sync.js`
5. `05-tcp-peer-sync.js`
6. `06-discovery.js`
7. `07-node-metadata.js`

Run examples from the JavaScript SDK repository:

```sh
cd ~/softadastra/sdk-js
npm install

npm run examples:local-store
npm run examples:persistent-store
npm run examples:remove-value
npm run examples:basic-sync
npm run examples:tcp-peer-sync
npm run examples:discovery
npm run examples:node-metadata
```

## Documentation structure

The JavaScript SDK documentation is organized as:

1. [Overview](/sdk-js/)
2. [Installation](/sdk-js/installation)
3. [First App](/sdk-js/first-app)
4. [Client](/sdk-js/client)
5. [Client Options](/sdk-js/client-options)
6. [Local Store](/sdk-js/local-store)
7. [Persistent Store](/sdk-js/persistent-store)
8. [Sync](/sdk-js/sync)
9. [Transport](/sdk-js/transport)
10. [Discovery](/sdk-js/discovery)
11. [Metadata](/sdk-js/metadata)
12. [Errors](/sdk-js/errors)
13. [Examples](/sdk-js/examples)

Read it in that order if you are new to the SDK.

## Summary

The Softadastra JavaScript SDK gives you `Client`, `ClientOptions`, local store, persistent store, sync state, manual ticks, transport, discovery, metadata, and explicit errors.

The key idea is: use `Client` first. Add persistence, sync, transport, and discovery only when needed.

## Next step

Install the JavaScript SDK:

[Go to SDK JS Installation](/sdk-js/installation)
