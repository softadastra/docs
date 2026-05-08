# Client Options

`ClientOptions` configures the Softadastra JavaScript SDK client.

It tells the SDK which node id to use, whether persistent storage is enabled, whether transport is enabled, whether discovery is enabled, and which metadata should describe the local node.

The main pattern is:

```js
const options = ClientOptions.local("node-a");

const client = new Client(options);
```

## Why ClientOptions exists

`Client` is the main SDK object. `ClientOptions` tells `Client` how to start.

```txt
ClientOptions
  ↓
Client
  ↓
open
  ↓
runtime configured
```

## Main option groups

```txt
Identity
  nodeId
  displayName
  version

Persistence
  enableWal
  walPath
  autoFlush

Transport
  enableTransport
  transportHost
  transportPort

Discovery
  enableDiscovery
  discoveryHost
  discoveryPort
  discoveryBroadcastHost
  discoveryBroadcastPort
```

## Identity options

### nodeId

The node id identifies the local node.

```js
const options = ClientOptions.local("node-a");
```

A node id should be non-empty, stable, unique enough for your local network or deployment, and human-readable when possible.

Good examples: `node-a`, `node-local`, `desktop-1`, `drive-client`.

Avoid empty ids — they should be treated as invalid configuration.

### displayName

The display name is a human-friendly node label.

```js
options.displayName = "Softadastra SDK Node";
```

Useful for CLI output, dashboards, logs, and peer inspection.

### version

```js
options.version = "0.1.0";
```

Useful for debugging, compatibility checks, and release diagnostics.

## Persistence options

### enableWal

```js
options.enableWal = true;
```

When WAL is enabled:

```txt
local write
  ↓
WAL-backed record
  ↓
store apply
  ↓
sync tracking
```

Use WAL when local operations should survive restart.

### walPath

```js
options.walPath = "data/sdk-store.wal";
```

Recommended pattern: `data/<node-id>.wal`.

Make sure the directory exists:

```sh
mkdir -p data
```

### autoFlush

```js
options.autoFlush = true;  // safer persistence behavior
options.autoFlush = false; // less flush overhead, weaker durability
```

For normal persistent SDK examples, use `true`.

## Transport options

### enableTransport

```js
options.enableTransport = true;
```

If disabled, the client can still `open`, `put`, `get`, `remove`, `syncStateInfo`, `tick`, and access metadata, but cannot connect to peers.

### transportHost

```js
options.transportHost = "127.0.0.1";
```

Use loopback first for local examples.

### transportPort

```js
options.transportPort = 4041;
```

## Discovery options

### enableDiscovery

```js
options.enableDiscovery = true;
```

Discovery only matters when the node should find peers automatically. Local work does not require discovery.

### discoveryHost

```js
options.discoveryHost = "127.0.0.1";
```

### discoveryPort

```js
options.discoveryPort = 5051;
```

### discoveryBroadcastHost

```js
options.discoveryBroadcastHost = "127.0.0.1";
```

### discoveryBroadcastPort

```js
options.discoveryBroadcastPort = 5052;
```

## Factory helpers

### ClientOptions.local

```js
const options = ClientOptions.local("node-local");
```

The most flexible starting point. Then enable features manually.

### ClientOptions.persistent

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/sdk-store.wal",
);
```

Use when local writes should be backed by a WAL path.

### ClientOptions.memoryOnly

If available:

```js
const options = ClientOptions.memoryOnly("node-memory");
```

Use for tests, demos, examples, temporary local state, and short-lived tools.

## Common configurations

### Local-only

No WAL, no transport, no discovery:

```js
const options = ClientOptions.local("node-local");

options.enableTransport = false;
options.enableDiscovery = false;
options.enableWal = false;
```

### Persistent local

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/sdk-persistent-store.wal",
);

options.enableTransport = false;
options.enableDiscovery = false;
options.autoFlush = true;
```

### Transport-enabled

```js
const options = ClientOptions.local("node-tcp-a");

options.enableWal = true;
options.walPath = "data/sdk-tcp-peer-sync.wal";
options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

options.enableDiscovery = false;
```

### Discovery-enabled

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

## Option reference

| Option | Type | Purpose |
|---|---|---|
| `nodeId` | string | Local node id |
| `displayName` | string | Human-friendly node name |
| `version` | string | Node or app version |
| `enableWal` | boolean | Enable WAL-backed persistence |
| `walPath` | string | Path to WAL file |
| `autoFlush` | boolean | Flush persistent writes automatically |
| `enableTransport` | boolean | Enable peer transport |
| `transportHost` | string | Transport bind host |
| `transportPort` | number | Transport bind port |
| `enableDiscovery` | boolean | Enable peer discovery |
| `discoveryHost` | string | Discovery bind host |
| `discoveryPort` | number | Discovery bind port |
| `discoveryBroadcastHost` | string | Discovery target host |
| `discoveryBroadcastPort` | number | Discovery target port |

## Common mistakes

### Enabling WAL without a path

```js
// wrong
options.enableWal = true;
options.walPath = "";

// correct
options.enableWal = true;
options.walPath = "data/node-a.wal";
```

### Forgetting to create the data directory

```sh
mkdir -p data
```

### Enabling discovery without transport

Discovery can find peers, but transport is needed to connect to them.

### Reusing the same port for two clients

```js
// Node A
options.transportPort = 4041;

// Node B
options.transportPort = 4042;
```

## Summary

`ClientOptions` defines how the JavaScript SDK client starts. It controls identity, metadata, WAL persistence, transport, and discovery.

Start simple, then enable features one by one.

## Next step

Continue with local store:

[Go to Local Store](/sdk-js/local-store)
