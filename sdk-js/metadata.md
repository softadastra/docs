# Metadata

Metadata is the part of the Softadastra JavaScript SDK that describes the local node.

It gives your application information such as node id, display name, hostname, operating system, version, uptime, and capabilities.

The core rule is:

> Metadata tells you who the local node is.

Metadata is local. It does not require a peer, transport, discovery, or network access.

## Why metadata exists

When a node participates in a local-first system, it needs an identity.

Metadata answers questions like: which node is this, what is its display name, what version is it running, which operating system is it on, how long has it been running, and which capabilities does it support?

This is useful for CLI status, debug logs, dashboards, peer inspection, runtime diagnostics, sync visibility, and local node identity.

## Basic metadata configuration

```js
const options = ClientOptions.local("node-metadata");

options.displayName = "Softadastra SDK Node";
options.version = "0.1.0";

options.enableWal = false;
options.enableTransport = false;
options.enableDiscovery = false;
```

## Basic metadata example

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.local("node-metadata");

options.displayName = "Softadastra SDK Node";
options.version = "0.1.0";

options.enableWal = false;
options.enableTransport = false;
options.enableDiscovery = false;

const client = new Client(options);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(`failed to open client: ${openResult.error().message}`);
  process.exit(1);
}

const nodeResult = await client.refreshNodeInfo();

if (nodeResult.isErr()) {
  console.error(`failed to read node metadata: ${nodeResult.error().message}`);
  await client.close();
  process.exit(1);
}

const node = nodeResult.value();

console.log("node metadata");
console.log(`  node id      : ${node.nodeId}`);
console.log(`  display name : ${node.displayName}`);
console.log(`  hostname     : ${node.hostname}`);
console.log(`  os           : ${node.osName}`);
console.log(`  version      : ${node.version}`);
console.log(`  uptime ms    : ${node.uptime_ms()}`);
console.log(
  `  capabilities : ${
    node.capabilities.length === 0 ? "none" : node.capabilities.join(", ")
  }`,
);

await client.close();
```

Expected output style:

```txt
node metadata
  node id      : node-metadata
  display name : Softadastra SDK Node
  hostname     : ...
  os           : linux
  version      : 0.1.0
  uptime ms    : ...
  capabilities : core, store, sync, metadata
```

## `refreshNodeInfo`

```js
const result = await client.refreshNodeInfo();

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}

const node = result.value();

console.log(`uptime ms: ${node.uptime_ms()}`);
```

Snake_case alias, if exposed: `await client.refresh_node_info()`.

## `nodeInfo`

If exposed, returns cached metadata without forcing a refresh:

```js
const nodeResult = await client.nodeInfo();
```

## NodeInfo fields

**`nodeId`** — The node identifier from `ClientOptions.local()`.

**`displayName`** — Human-friendly label. Falls back to node id if not set.

**`hostname`** — The machine name. Useful when running multiple nodes across machines.

**`osName`** — Operating system. Useful for debugging and multi-platform tests.

**`version`** — Configured with `options.version = "0.1.0"`. Useful when nodes may run different builds.

**`uptime_ms()`** — Runtime uptime in milliseconds. Useful for detecting restarts and fresh starts.

**`capabilities`** — What the node supports. Possible values: `core`, `fs`, `wal`, `store`, `sync`, `transport`, `discovery`, `metadata`, `app`, `cli`.

### Capability checks

```js
if (node.capabilities.includes("sync")) {
  console.log("sync supported");
}
```

## Metadata does not require WAL, transport, or discovery

```js
options.enableWal = false;
options.enableTransport = false;
options.enableDiscovery = false;
```

The client can still expose node metadata.

## Metadata API reference

| Method | Purpose |
|---|---|
| `refreshNodeInfo()` | Refresh and return local node metadata |
| `refresh_node_info()` | Snake_case alias, if exposed |
| `nodeInfo()` | Return cached node metadata, if exposed |
| `node_info()` | Snake_case alias, if exposed |

### NodeInfo reference

| Field | Purpose |
|---|---|
| `nodeId` | Local node identifier |
| `displayName` | Human-friendly node label |
| `hostname` | Machine hostname |
| `osName` | Operating system name |
| `version` | Node or app version |
| `capabilities` | Supported runtime capabilities |
| `uptime_ms()` | Runtime uptime in milliseconds |

### ClientOptions metadata reference

| Option | Purpose |
|---|---|
| `nodeId` | Local node id, set through `ClientOptions.local()` |
| `displayName` | Human-friendly node label |
| `version` | Node or app version |

## Common errors

### Client not open

```js
// wrong
const client = new Client(options);
const node = await client.refreshNodeInfo();

// correct
const opened = await client.open();
if (opened.isErr()) { process.exit(1); }
const node = await client.refreshNodeInfo();
```

### Empty node id

```js
// wrong
const options = ClientOptions.local("");

// correct
const options = ClientOptions.local("node-a");
```

## Common mistakes

### Treating metadata as application data

Metadata describes the node. Store contains application data.

### Expecting metadata to discover or connect peers

Discovery finds peers. Transport connects peers. Metadata only provides identity and runtime information.

## Run the SDK example

```sh
cd ~/softadastra/sdk-js
npm install
npm run examples:node-metadata
```

## Summary

Metadata describes the local Softadastra JavaScript SDK node.

It gives you node id, display name, hostname, operating system, version, uptime, and capabilities.

The key idea is: metadata makes the local node visible and understandable.

## Next step

Continue with errors:

[Go to Errors](/sdk-js/errors)
