# Discovery

Discovery is the part of the Softadastra JavaScript SDK that lets a local node find peers.

The core rule is:

```txt
Discovery finds peers.
Transport connects peers.
Sync sends operations.
```

Discovery is optional. A Softadastra client can still write, read, persist, and track sync work without discovery.

## Why discovery exists

Without discovery, peers must be configured manually:

```js
const peer = new Peer("node-b", "127.0.0.1", 4042);
```

Discovery exists to find peers dynamically, answering: which peers are available, where can I reach them, which node id do they use, and which transport port do they expose?

## Discovery is optional

```js
options.enableDiscovery = false;
```

The client can still `open`, `put`, `get`, `remove`, `syncStateInfo`, `tick`, `startTransport`, connect to manually configured peers, and `close`.

## Basic discovery configuration

```js
const options = ClientOptions.local("node-discovery-a");

options.enableWal = true;
options.walPath = "data/sdk-discovery.wal";
options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4051;

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
```

## Basic discovery example

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.local("node-discovery-a");

options.enableWal = true;
options.walPath = "data/sdk-discovery.wal";
options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4051;

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;

const client = new Client(options);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(`failed to open client: ${openResult.error().message}`);
  process.exit(1);
}

const discoveryResult = await client.startDiscovery();

if (discoveryResult.isErr()) {
  console.error(`failed to start discovery: ${discoveryResult.error().message}`);
  await client.close();
  process.exit(1);
}

const peersResult = await client.peers();

console.log("discovery");
console.log(`  running : ${client.discoveryRunning() ? "yes" : "no"}`);
console.log(`  bind    : ${options.discoveryHost}:${options.discoveryPort}`);
console.log(`  target  : ${options.discoveryBroadcastHost}:${options.discoveryBroadcastPort}`);

console.log("\npeers");

if (peersResult.isOk() && peersResult.value().length === 0) {
  console.log("  no peer discovered yet");
} else if (peersResult.isOk()) {
  for (const peer of peersResult.value()) {
    console.log(`  ${peer.nodeId} ${peer.host}:${peer.port}`);
  }
}

await client.close();
```

Expected output when no other node is running:

```txt
discovery
  running : yes
  bind    : 127.0.0.1:5051
  target  : 127.0.0.1:5052

peers
  no peer discovered yet
```

No discovered peer is normal. The local client can still write and read local data.

## Start discovery

```js
const result = await client.startDiscovery();

if (result.isErr()) {
  console.error(`failed to start discovery: ${result.error().message}`);
  await client.close();
  process.exit(1);
}
```

Snake_case alias, if exposed: `await client.start_discovery()`.

## Check discovery status

```js
if (client.discoveryRunning()) {
  console.log("discovery is running");
}
```

## List peers

```js
const peers = await client.peers();

if (peers.isOk()) {
  for (const peer of peers.value()) {
    console.log(`${peer.nodeId} ${peer.host}:${peer.port}`);
  }
}

if (peers.isOk() && peers.value().length === 0) {
  console.log("no peer discovered yet");
}
```

## Two-node discovery shape

Node A:

```js
options.discoveryPort = 5051;
options.discoveryBroadcastPort = 5052;
options.transportPort = 4051;
```

Node B:

```js
options.discoveryPort = 5052;
options.discoveryBroadcastPort = 5051;
options.transportPort = 4052;
```

Each node targets the other node's discovery listener.

## Discovery and transport together

```js
const peers = await client.peers();

if (peers.isOk()) {
  for (const peer of peers.value()) {
    const connected = await client.connect(peer);

    if (connected.isOk()) {
      console.log(`connected to ${peer.nodeId}`);
    }
  }
}
```

## Discovery API reference

| Method | Purpose |
|---|---|
| `startDiscovery()` | Start peer discovery |
| `start_discovery()` | Snake_case alias, if exposed |
| `stopDiscovery()` | Stop discovery, if exposed |
| `stop_discovery()` | Snake_case alias, if exposed |
| `discoveryRunning()` | Check discovery state |
| `discovery_running()` | Snake_case alias, if exposed |
| `peers()` | List known peers |

### Discovery option reference

| Option | Purpose |
|---|---|
| `enableDiscovery` | Enable discovery support |
| `discoveryHost` | Local discovery bind host |
| `discoveryPort` | Local discovery bind port |
| `discoveryBroadcastHost` | Discovery target host |
| `discoveryBroadcastPort` | Discovery target port |

### Peer reference

| Field | Purpose |
|---|---|
| `nodeId` | Peer node id |
| `host` | Peer transport host |
| `port` | Peer transport port |

## Common issues

### Port already in use

```sh
ss -lunp | grep 5051
```

Use another discovery port: `options.discoveryPort = 5053`.

### Wrong discovery target

For local two-node tests, check that each node targets the other node's discovery port.

### No peers found

Possible causes: no other node is running, other node uses a different discovery port, or discovery is disabled on the other node.

## Common mistakes

### Expecting discovery to connect peers

Discovery finds peers. Transport connects peers.

### Expecting peers immediately

If only one node is running, there may be no peers.

### Treating no peers as local failure

No peers only means no remote node is currently known. Local store can still work.

## Run the SDK example

```sh
cd ~/softadastra/sdk-js
npm install
mkdir -p data
npm run examples:discovery
```

## Summary

Discovery is the peer discovery layer of the JavaScript SDK.

It gives you `startDiscovery`, `discoveryRunning`, `peers`, and optional `stopDiscovery`.

The key idea is: discovery finds peers, transport connects peers, sync sends operations, and store remains local-first.

## Next step

Continue with metadata:

[Go to Metadata](/sdk-js/metadata)
