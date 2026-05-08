# Transport

Transport is the part of the Softadastra JavaScript SDK that allows a local node to connect to peers.

The core rule is:

> Sync decides what should be sent. Transport sends it.

Transport is optional. A Softadastra client can still write, read, persist, and track sync work without transport.

## Why transport exists

A local write can happen without any peer:

```js
await client.put("message/1", "hello");
```

But when a peer is available, the node may need to send sync work to that peer. Transport exists for that delivery step.

```txt
local write
  ↓
store
  ↓
sync outbox
  ↓
sync batch
  ↓
transport
  ↓
peer
```

## Transport is optional

```js
options.enableTransport = false;
```

The client can still `open`, `put`, `get`, `remove`, `syncStateInfo`, `tick`, `refreshNodeInfo`, and `close`.

## Basic transport example

```js
import { Client, ClientOptions, Peer } from "@softadastra/sdk";

const options = ClientOptions.local("node-tcp-a");

options.enableWal = true;
options.walPath = "data/sdk-tcp-peer-sync.wal";
options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

options.enableDiscovery = false;

const client = new Client(options);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(`failed to open client: ${openResult.error().message}`);
  process.exit(1);
}

const transportResult = await client.startTransport();

if (transportResult.isErr()) {
  console.error(`failed to start transport: ${transportResult.error().message}`);
  await client.close();
  process.exit(1);
}

const peer = new Peer("node-tcp-b", "127.0.0.1", 4042);

const connectResult = await client.connect(peer);

if (connectResult.isErr()) {
  console.log("peer connection failed");
  console.log(`  peer    : ${peer.nodeId}`);
  console.log(`  address : ${peer.host}:${peer.port}`);
  console.log(`  error   : ${connectResult.error().message}`);
} else {
  console.log("connected to peer");
}

const putResult = await client.put("sync/message", "hello from node-tcp-a");

if (putResult.isErr()) {
  console.error(`failed to submit sync value: ${putResult.error().message}`);
  await client.close();
  process.exit(1);
}

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

If no peer is running on `127.0.0.1:4042`, the connection can fail cleanly. Local writes and sync ticks continue regardless.

## Start transport

```js
const result = await client.startTransport();

if (result.isErr()) {
  console.error(`failed to start transport: ${result.error().message}`);
  await client.close();
  process.exit(1);
}
```

Snake_case alias, if exposed: `await client.start_transport()`.

## Check transport status

```js
if (client.transportRunning()) {
  console.log("transport is running");
}
```

## Stop transport

If exposed:

```js
await client.stopTransport();
```

## Peer

```js
const peer = new Peer("node-tcp-b", "127.0.0.1", 4042);
```

## Connect to a peer

```js
const result = await client.connect(peer);

if (result.isErr()) {
  console.log("peer connection failed");
  console.log(`  peer    : ${peer.nodeId}`);
  console.log(`  address : ${peer.host}:${peer.port}`);
  console.log(`  error   : ${result.error().message}`);
}
```

A failed connection should not make the local store unusable:

```js
await client.put("draft/1", "still local");
```

## Transport and local writes

Transport is not required for local writes. Even if `client.connect(peer)` fails, `client.put()` should still work.

## Transport port configuration

Each local node needs a different transport port:

```js
// Node A
options.transportPort = 4041;

// Node B
options.transportPort = 4042;
```

## Transport API reference

| Method | Purpose |
|---|---|
| `startTransport()` | Start the local transport layer |
| `start_transport()` | Snake_case alias, if exposed |
| `stopTransport()` | Stop transport, if exposed |
| `stop_transport()` | Snake_case alias, if exposed |
| `transportRunning()` | Check whether transport is running |
| `transport_running()` | Snake_case alias, if exposed |
| `connect(peer)` | Connect to a peer |

### Transport option reference

| Option | Purpose |
|---|---|
| `enableTransport` | Enable transport support |
| `transportHost` | Local bind host |
| `transportPort` | Local bind port |

### Peer reference

| Field | Purpose |
|---|---|
| `nodeId` | Remote node id |
| `host` | Remote host |
| `port` | Remote transport port |

## Common issues

### Port already in use

```sh
ss -ltnp | grep 4041
```

Use another port: `options.transportPort = 4043`.

### Transport disabled

If you call `startTransport()` but `enableTransport = false`, the SDK should return a clear error.

## Common mistakes

### Expecting transport to be required for local writes

Transport is optional. Local writes work without it.

### Confusing transport with sync

Transport sends messages. Sync tracks operations.

### Confusing transport with discovery

Discovery finds peers. Transport connects to peers.

### Reusing the same port

Use unique ports for each local node.

## Run the SDK example

```sh
cd ~/softadastra/sdk-js
npm install
mkdir -p data
npm run examples:tcp-peer-sync
```

## Summary

Transport is the peer communication layer of the JavaScript SDK.

It gives you `startTransport`, `transportRunning`, `connect(peer)`, and optional `stopTransport`.

The key idea is: transport sends messages, sync decides what messages mean, and store remains local-first.

A transport failure should delay synchronization, not destroy local work.

## Next step

Continue with discovery:

[Go to Discovery](/sdk-js/discovery)
