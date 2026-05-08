# Examples

This page gives the recommended learning path for the Softadastra JavaScript SDK examples.

The examples are designed to be read in order. Each one introduces one new SDK capability while keeping the previous model stable.

The core learning path is:

```txt
local store
persistent store
remove value
sync
transport
discovery
metadata
```

## Example list

- `01-local-store.js`
- `02-persistent-store.js`
- `03-remove-value.js`
- `04-basic-sync.js`
- `05-tcp-peer-sync.js`
- `06-discovery.js`
- `07-node-metadata.js`

## Before running examples

```sh
cd ~/softadastra/sdk-js
npm install
mkdir -p data
```

## Package scripts

The repository should expose scripts in `package.json`:

```json
{
  "scripts": {
    "test": "node --test",
    "examples:local-store": "node examples/01-local-store.js",
    "examples:persistent-store": "node examples/02-persistent-store.js",
    "examples:remove-value": "node examples/03-remove-value.js",
    "examples:basic-sync": "node examples/04-basic-sync.js",
    "examples:tcp-peer-sync": "node examples/05-tcp-peer-sync.js",
    "examples:discovery": "node examples/06-discovery.js",
    "examples:node-metadata": "node examples/07-node-metadata.js"
  }
}
```

## Full recommended run order

```sh
cd ~/softadastra/sdk-js
npm install
mkdir -p data

npm run examples:local-store
npm run examples:persistent-store
npm run examples:remove-value
npm run examples:basic-sync
npm run examples:tcp-peer-sync
npm run examples:discovery
npm run examples:node-metadata
```

## 1. Local Store

File: `examples/01-local-store.js`

```sh
npm run examples:local-store
```

This example shows the simplest local-only SDK usage. It teaches `ClientOptions.local`, `Client`, `open`, `put`, `get`, `size`, and `close`.

Expected output style:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

This proves the most important Softadastra rule: local work does not require the network.

Code shape:

```js
import { Client, ClientOptions } from "../src/index.js";

const client = new Client(ClientOptions.local("node-local"));

await client.open();

await client.put("app/name", "Softadastra SDK");

const valueResult = await client.get("app/name");

if (valueResult.isOk()) {
  console.log("key   : app/name");
  console.log(`value : ${valueResult.value().toString()}`);
  console.log(`size  : ${client.size()}`);
}

await client.close();
```

## 2. Persistent Store

File: `examples/02-persistent-store.js`

```sh
npm run examples:persistent-store
```

This example shows WAL-backed local persistence. It teaches `ClientOptions.persistent`, `enableWal`, `walPath`, `autoFlush`, and sync state after write.

Expected output style:

```txt
key          : settings/theme
value        : dark
wal path     : data/sdk-persistent-store.wal
store size   : 1
outbox size  : 1
```

Code shape:

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/sdk-persistent-store.wal",
);

options.autoFlush = true;
```

Before running: `mkdir -p data`.

## 3. Remove Value

File: `examples/03-remove-value.js`

```sh
npm run examples:remove-value
```

This example shows how to remove a local value. It teaches `put`, `contains`, `remove`, `get` for a missing key, and the `not_found` error.

Expected output style:

```txt
before remove
  contains : yes
after remove
  contains : no
read result: not_found
```

Code shape:

```js
await client.put("cache/session", "temporary-data");

console.log(`before remove: ${client.contains("cache/session") ? "yes" : "no"}`);

await client.remove("cache/session");

console.log(`after remove: ${client.contains("cache/session") ? "yes" : "no"}`);

const valueResult = await client.get("cache/session");

if (valueResult.isErr()) {
  console.log(`read result: ${valueResult.error().codeString()}`);
}
```

## 4. Basic Sync

File: `examples/04-basic-sync.js`

```sh
npm run examples:basic-sync
```

This example shows manual sync state and sync ticks. It teaches `syncStateInfo`, `outboxSize`, `queuedCount`, `failedCount`, `tick`, `retriedCount`, `prunedCount`, and `batchSize`.

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

Code shape:

```js
await client.put("profile/name", "Softadastra");

const before = await client.syncStateInfo();

if (before.isOk()) {
  console.log("before tick");
  console.log(`  outbox : ${before.value().outboxSize}`);
  console.log(`  queued : ${before.value().queuedCount}`);
  console.log(`  failed : ${before.value().failedCount}`);
}

const tickResult = await client.tick();

if (tickResult.isOk()) {
  console.log("\ntick result");
  console.log(`  retried : ${tickResult.value().retriedCount}`);
  console.log(`  pruned  : ${tickResult.value().prunedCount}`);
  console.log(`  batch   : ${tickResult.value().batchSize}`);
}
```

## 5. TCP Peer Sync

File: `examples/05-tcp-peer-sync.js`

```sh
npm run examples:tcp-peer-sync
```

This example enables transport and tries to connect to a peer. It teaches `enableTransport`, `transportHost`, `transportPort`, `startTransport`, `Peer`, `connect`, and `transportRunning`.

Expected output style when no peer is running:

```txt
peer connection failed
  peer    : node-tcp-b
  address : 127.0.0.1:4042
  error   : ...

sync tick
  retried : 0
  pruned  : 0
  batch   : 1

transport
  running : yes
```

This proves that transport failure should not break local-first behavior.

Code shape:

```js
import { Client, ClientOptions, Peer } from "../src/index.js";

const options = ClientOptions.local("node-tcp-a");

options.enableWal = true;
options.walPath = "data/sdk-tcp-peer-sync.wal";
options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

const client = new Client(options);

await client.open();
await client.startTransport();

const peer = new Peer("node-tcp-b", "127.0.0.1", 4042);

const connectResult = await client.connect(peer);

if (connectResult.isErr()) {
  console.log("peer connection failed");
  console.log(`  peer    : ${peer.nodeId}`);
  console.log(`  address : ${peer.host}:${peer.port}`);
  console.log(`  error   : ${connectResult.error().message}`);
}

await client.put("sync/message", "hello from node-tcp-a");

const tickResult = await client.tick();

if (tickResult.isOk()) {
  console.log("\nsync tick");
  console.log(`  retried : ${tickResult.value().retriedCount}`);
  console.log(`  pruned  : ${tickResult.value().prunedCount}`);
  console.log(`  batch   : ${tickResult.value().batchSize}`);
}

console.log("\ntransport");
console.log(`  running : ${client.transportRunning() ? "yes" : "no"}`);

await client.close();
```

## 6. Discovery

File: `examples/06-discovery.js`

```sh
npm run examples:discovery
```

This example enables discovery and lists known peers. It teaches `enableDiscovery`, `discoveryHost`, `discoveryPort`, `discoveryBroadcastHost`, `discoveryBroadcastPort`, `startDiscovery`, `discoveryRunning`, and `peers`.

Expected output style:

```txt
discovery
  running : yes
  bind    : 127.0.0.1:5051
  target  : 127.0.0.1:5052

peers
  no peer discovered yet
```

Code shape:

```js
const options = ClientOptions.local("node-discovery-a");

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4051;

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;

const client = new Client(options);

await client.open();
await client.startDiscovery();

const peersResult = await client.peers();

console.log("discovery");
console.log(`  running : ${client.discoveryRunning() ? "yes" : "no"}`);
console.log(`  bind    : ${options.discoveryHost}:${options.discoveryPort}`);
console.log(`  target  : ${options.discoveryBroadcastHost}:${options.discoveryBroadcastPort}`);

console.log("\npeers");

if (peersResult.isOk() && peersResult.value().length === 0) {
  console.log("  no peer discovered yet");
}

await client.close();
```

## 7. Node Metadata

File: `examples/07-node-metadata.js`

```sh
npm run examples:node-metadata
```

This example reads local node metadata. It teaches `displayName`, `version`, `refreshNodeInfo`, `NodeInfo`, `nodeId`, `hostname`, `osName`, `uptime_ms`, and `capabilities`.

Expected output style:

```txt
node metadata
  node id      : node-metadata
  display name : Softadastra SDK Node
  hostname     : ...
  os           : ...
  version      : 0.1.0
  uptime ms    : ...
  capabilities : ...
```

Code shape:

```js
const options = ClientOptions.local("node-metadata");

options.displayName = "Softadastra SDK Node";
options.version = "0.1.0";

options.enableWal = false;
options.enableTransport = false;
options.enableDiscovery = false;

const client = new Client(options);

await client.open();

const nodeResult = await client.refreshNodeInfo();

if (nodeResult.isOk()) {
  const node = nodeResult.value();

  console.log("node metadata");
  console.log(`  node id      : ${node.nodeId}`);
  console.log(`  display name : ${node.displayName}`);
  console.log(`  hostname     : ${node.hostname}`);
  console.log(`  os           : ${node.osName}`);
  console.log(`  version      : ${node.version}`);
  console.log(`  uptime ms    : ${node.uptime_ms()}`);
}

await client.close();
```

## What each example adds

| Example | New idea |
|---|---|
| `01-local-store.js` | Local memory store |
| `02-persistent-store.js` | WAL-backed local persistence |
| `03-remove-value.js` | Remove and missing-key behavior |
| `04-basic-sync.js` | Sync state and manual tick |
| `05-tcp-peer-sync.js` | Transport and peer connection |
| `06-discovery.js` | Peer discovery and peer list |
| `07-node-metadata.js` | Local node metadata |

## Learning path

1. Can I write locally?
2. Can I persist locally?
3. Can I remove locally?
4. Can I observe sync work?
5. Can I start transport?
6. Can I discover peers?
7. Can I inspect node metadata?

## Expected normal failures

### Peer connection failure

`05-tcp-peer-sync.js` may print `peer connection failed`. This is normal if no peer is running on the target port. The example should still show that local writes and sync ticks continue.

### No discovered peers

`06-discovery.js` may print `no peer discovered yet`. This is normal if only one node is running.

### Missing key after remove

`03-remove-value.js` should show `not_found`. This is expected after removing a key.

## Troubleshooting

### ESM import error

```sh
npm pkg set type=module
```

### WAL path failed

```sh
mkdir -p data
```

### Transport port already in use

```sh
ss -ltnp | grep 4041
```

### Discovery port already in use

```sh
ss -lunp | grep 5051
```

## How examples map to documentation

| Example | Documentation |
|---|---|
| `01-local-store.js` | [Local Store](/sdk-js/local-store) |
| `02-persistent-store.js` | [Persistent Store](/sdk-js/persistent-store) |
| `03-remove-value.js` | [Local Store](/sdk-js/local-store) |
| `04-basic-sync.js` | [Sync](/sdk-js/sync) |
| `05-tcp-peer-sync.js` | [Transport](/sdk-js/transport) |
| `06-discovery.js` | [Discovery](/sdk-js/discovery) |
| `07-node-metadata.js` | [Metadata](/sdk-js/metadata) |

## Minimal example template

```js
import { Client, ClientOptions } from "../src/index.js";

const options = ClientOptions.local("node-example");

const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

// example logic here

await client.close();
```

For published package examples:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

## Summary

The JavaScript SDK examples are the fastest way to understand Softadastra from an application developer point of view.

Read them in this order: Local Store, Persistent Store, Remove Value, Basic Sync, TCP Peer Sync, Discovery, Node Metadata.

The key idea is: start local, add durability, observe sync, then add peers.

## Next step

Continue with the engine documentation:

[Go to Engine](/engine/)
