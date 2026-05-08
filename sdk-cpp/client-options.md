# Client Options

`ClientOptions` configures the Softadastra C++ SDK client.

It tells the SDK which node id to use, whether WAL persistence is enabled, whether transport is enabled, whether discovery is enabled, and which metadata should describe the local node.

The main pattern is:

```cpp
ClientOptions options =
    ClientOptions::local("node-a");

Client client{options};
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

Without options, the SDK would not know which node id to use, whether to persist data, where the WAL file is, whether transport should run, which port transport should bind to, whether discovery should run, or what metadata to expose.

## Main option groups

`ClientOptions` can be understood in groups:

```txt
Identity
  node_id
  display_name
  version

WAL
  enable_wal
  wal_path
  auto_flush

Transport
  enable_transport
  transport_host
  transport_port

Discovery
  enable_discovery
  discovery_host
  discovery_port
  discovery_broadcast_host
  discovery_broadcast_port
```

## Identity options

Identity options describe the local SDK node. They are used by metadata, sync, transport, and discovery.

### node_id

The node id identifies the local node.

```cpp
ClientOptions options =
    ClientOptions::local("node-a");
```

A node id should be non-empty, stable, unique enough for your local network or deployment, and human-readable when possible.

Good examples: `node-a`, `node-local`, `desktop-1`, `drive-client`.

Avoid empty ids — they should be treated as invalid configuration.

### display_name

The display name is a human-friendly node label.

```cpp
options.display_name = "Softadastra SDK Node";
```

Useful for CLI output, dashboards, logs, and peer inspection. If no display name is set, the node id can be used as the fallback label.

### version

The version describes the local application or SDK node version.

```cpp
options.version = "0.1.0";
```

Useful for debugging, compatibility checks, and release diagnostics.

## WAL options

WAL options control local persistence.

### enable_wal

Enable or disable WAL-backed persistence.

```cpp
options.enable_wal = true;
```

When WAL is enabled:

```txt
local write
  ↓
WAL append
  ↓
store apply
  ↓
sync tracking
```

When WAL is disabled, the client works locally but state is memory-only.

Use WAL when local operations should survive restart.

### wal_path

The WAL path tells the SDK where to store the log.

```cpp
options.wal_path = "data/sdk-store.wal";
```

Recommended pattern: `data/<node-id>.wal`.

Make sure the directory exists first:

```sh
mkdir -p data
```

If the directory does not exist, opening the client or writing to the WAL may fail.

### auto_flush

Controls whether WAL writes should be flushed automatically.

```cpp
options.auto_flush = true;  // safer durability
options.auto_flush = false; // faster but weaker durability behavior
```

For normal persistent SDK examples, use `true`.

## Transport options

Transport options control peer communication. Transport is optional — it is only needed when this SDK node should connect to peers or send sync messages.

### enable_transport

```cpp
options.enable_transport = true;
```

If disabled, the client can still `open`, `put`, `get`, `remove`, `sync_state`, `tick`, and access metadata, but cannot connect to peers through the SDK transport layer.

### transport_host

The host to bind transport to.

```cpp
options.transport_host = "127.0.0.1";
```

Use loopback first for local examples.

### transport_port

The local transport port.

```cpp
options.transport_port = 4041;
```

## Discovery options

Discovery options control peer discovery. Discovery is optional and only helps the local node find peers automatically.

### enable_discovery

```cpp
options.enable_discovery = true;
```

If disabled, the client can still work locally. Discovery only matters when the node should find peers automatically.

### discovery_host

```cpp
options.discovery_host = "127.0.0.1";
```

### discovery_port

```cpp
options.discovery_port = 5051;
```

### discovery_broadcast_host

The target host used for discovery announcements or probes.

```cpp
options.discovery_broadcast_host = "127.0.0.1";
```

### discovery_broadcast_port

The target discovery port.

```cpp
options.discovery_broadcast_port = 5052;
```

## Factory helpers

`ClientOptions` exposes helper constructors for common configurations.

### ClientOptions::memory_only

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-memory");
```

Use for tests, demos, examples, temporary local state, and short-lived tools. Do not use when data must survive restart.

### ClientOptions::local

```cpp
ClientOptions options =
    ClientOptions::local("node-local");
```

The most flexible starting point. Then enable features manually.

### ClientOptions::persistent

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/sdk-store.wal");
```

Use when local writes should be backed by a WAL.

## Common configurations

### Local-only

No WAL, no transport, no discovery:

```cpp
ClientOptions options =
    ClientOptions::local("node-local");

options.enable_transport = false;
options.enable_discovery = false;
options.enable_wal = false;
```

### Persistent local

WAL-backed persistence without networking:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/sdk-persistent-store.wal");

options.enable_transport = false;
options.enable_discovery = false;
options.auto_flush = true;
```

### Transport-enabled

```cpp
ClientOptions options =
    ClientOptions::local("node-tcp-a");

options.enable_wal = true;
options.wal_path = "data/sdk-tcp-peer-sync.wal";
options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

options.enable_discovery = false;
```

### Discovery-enabled

```cpp
ClientOptions options =
    ClientOptions::local("node-discovery-a");

options.enable_wal = true;
options.wal_path = "data/sdk-discovery.wal";
options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
```

## Option reference

| Option | Type | Purpose |
|---|---|---|
| `node_id` | string | Local node id |
| `display_name` | string | Human-friendly node name |
| `version` | string | Node or app version |
| `enable_wal` | bool | Enable WAL-backed persistence |
| `wal_path` | string | Path to WAL file |
| `auto_flush` | bool | Flush WAL automatically |
| `enable_transport` | bool | Enable peer transport |
| `transport_host` | string | Transport bind host |
| `transport_port` | integer | Transport bind port |
| `enable_discovery` | bool | Enable peer discovery |
| `discovery_host` | string | Discovery bind host |
| `discovery_port` | integer | Discovery bind port |
| `discovery_broadcast_host` | string | Discovery target host |
| `discovery_broadcast_port` | integer | Discovery target port |

## Common mistakes

### Enabling WAL without a path

```cpp
// wrong
options.enable_wal = true;
options.wal_path = "";

// correct
options.enable_wal = true;
options.wal_path = "data/node-a.wal";
```

### Forgetting to create the data directory

```sh
mkdir -p data
```

### Enabling discovery without transport

Discovery can find peers, but transport is needed to connect to them.

```cpp
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
```

### Reusing the same port for two clients

Give each client different ports:

```cpp
// Node A
options.transport_port = 4041;

// Node B
options.transport_port = 4042;
```

### Using memory-only mode for important data

Use persistent mode when data matters:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");
```

## Summary

`ClientOptions` defines how the C++ SDK client starts.

It controls identity, metadata, WAL persistence, transport, and discovery.

Start simple, then enable features one by one.

## Next step

Continue with local store:

[Go to Local Store](/sdk-cpp/local-store)
