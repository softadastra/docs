# Configuration Reference

This page is the compact reference for Softadastra configuration.

Use it when you need to quickly check runtime option names, SDK field names, CLI-related settings, WAL paths, transport ports, discovery ports, metadata fields, or production configuration rules.

The core rule is:

```txt
Configuration decides how the local runtime starts.

Softadastra configuration should be explicit, readable, stable, and easy to inspect.

What configuration controls

Configuration can control:

node identity
local persistence
WAL path
auto flush behavior
local store mode
sync behavior
transport host and port
discovery host and port
discovery target
metadata fields
runtime version
CLI behavior
production paths

The same model appears across the C++ SDK, JavaScript SDK, CLI, and engine.

Configuration layers

Softadastra has several configuration surfaces:

SDK C++ ClientOptions
SDK JS ClientOptions
CLI runtime configuration
Engine module configuration
Production deployment configuration

The SDKs expose the easiest public configuration surface.

The engine exposes lower-level module configuration.

The CLI uses configuration to decide which runtime behavior to expose.

Core configuration model

The most important configuration groups are:

Identity
  node id
  display name
  version

Persistence
  WAL enabled
  WAL path
  auto flush

Transport
  enabled
  host
  port

Discovery
  enabled
  host
  port
  broadcast host
  broadcast port

Sync
  retry policy
  ACK behavior
  batch behavior

Metadata
  node info
  capabilities
  runtime fields
Identity configuration

Identity tells Softadastra which local node is running.

Node id

The node id identifies the local runtime.

C++:

ClientOptions options =
    ClientOptions::local("node-a");

JavaScript:

const options = ClientOptions.local("node-a");

Good node ids:

node-a
node-b
node-local
drive-client
edge-store-kampala-01
sync-agent-prod-01

A node id should be:

non-empty
stable
unique enough for the deployment
human-readable when possible
consistent across restarts when persistence or sync depends on it

Avoid:

empty node id
random id every start
shared id for unrelated nodes
Display name

The display name is a human-friendly node label.

C++:

options.display_name = "Node A";

JavaScript:

options.displayName = "Node A";

Use it for:

CLI output
dashboards
logs
peer inspection
debugging

If no display name is configured, the node id can be used as the fallback label.

Version

The version describes the runtime, SDK, node, or application version.

C++:

options.version = "0.1.0";

JavaScript:

options.version = "0.1.0";

Use version for:

debugging
compatibility checks
release diagnostics
peer inspection
production support
Persistence configuration

Persistence controls whether local operations can survive restart.

The main persistence fields are:

enable WAL
WAL path
auto flush
WAL enabled

C++:

options.enable_wal = true;

JavaScript:

options.enableWal = true;

When WAL is enabled:

local write
  ↓
WAL append
  ↓
store apply
  ↓
sync tracking

When WAL is disabled, local state may be memory-only.

Use WAL when accepted local operations must be recoverable after restart.

WAL path

C++:

options.wal_path = "data/node-a.wal";

JavaScript:

options.walPath = "data/node-a.wal";

Good WAL paths:

data/node-a.wal
data/node-b.wal
data/sdk-persistent-store.wal
/var/lib/softadastra/node-a/node.wal

A WAL path should be:

non-empty
inside an existing directory
writable by the runtime process
stable across restarts
unique per node
not manually edited

Create the directory first:

mkdir -p data

Avoid:

empty path
same WAL path for multiple nodes
temporary path for important data
unwritable directory
Auto flush

C++:

options.auto_flush = true;

JavaScript:

options.autoFlush = true;

Recommended for normal persistent examples:

auto flush = true

Auto flush favors safer durability behavior.

If auto flush is disabled, performance may improve, but durability can become weaker depending on implementation and operating system behavior.

C++ ClientOptions reference

The C++ SDK uses snake_case.

C++ identity fields
Field	Purpose
node_id	Local node identifier
display_name	Human-friendly node label
version	Runtime or application version

Example:

ClientOptions options =
    ClientOptions::local("node-a");

options.display_name = "Node A";
options.version = "0.1.0";
C++ WAL fields
Field	Purpose
enable_wal	Enable WAL-backed persistence
wal_path	WAL file path
auto_flush	Flush WAL writes automatically when configured

Example:

options.enable_wal = true;
options.wal_path = "data/node-a.wal";
options.auto_flush = true;
C++ transport fields
Field	Purpose
enable_transport	Enable transport configuration
transport_host	Local transport bind host
transport_port	Local transport bind port

Example:

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
C++ discovery fields
Field	Purpose
enable_discovery	Enable discovery configuration
discovery_host	Local discovery bind host
discovery_port	Local discovery bind port
discovery_broadcast_host	Discovery target host
discovery_broadcast_port	Discovery target port

Example:

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
JavaScript ClientOptions reference

The JavaScript SDK uses camelCase.

JavaScript identity fields
Field	Purpose
nodeId	Local node identifier
displayName	Human-friendly node label
version	Runtime or application version

Example:

const options = ClientOptions.local("node-a");

options.displayName = "Node A";
options.version = "0.1.0";
JavaScript persistence fields
Field	Purpose
enableWal	Enable WAL-backed persistence
walPath	WAL file path
autoFlush	Flush WAL writes automatically when configured

Example:

options.enableWal = true;
options.walPath = "data/node-a.wal";
options.autoFlush = true;
JavaScript transport fields
Field	Purpose
enableTransport	Enable transport configuration
transportHost	Local transport bind host
transportPort	Local transport bind port

Example:

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;
JavaScript discovery fields
Field	Purpose
enableDiscovery	Enable discovery configuration
discoveryHost	Local discovery bind host
discoveryPort	Local discovery bind port
discoveryBroadcastHost	Discovery target host
discoveryBroadcastPort	Discovery target port

Example:

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
Factory helpers

Factory helpers create common configurations.

Local configuration

C++:

ClientOptions options =
    ClientOptions::local("node-local");

JavaScript:

const options = ClientOptions.local("node-local");

Use local configuration as a flexible starting point.

Then enable features manually.

Persistent configuration

C++:

ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/node-persistent.wal");

options.auto_flush = true;

JavaScript:

const options = ClientOptions.persistent(
  "node-persistent",
  "data/node-persistent.wal",
);

options.autoFlush = true;

Use persistent configuration when local operations should survive restart.

Memory-only configuration

If exposed:

C++:

ClientOptions options =
    ClientOptions::memory_only("node-memory");

JavaScript:

const options = ClientOptions.memoryOnly("node-memory");

Use memory-only configuration for:

tests
demos
temporary local state
short-lived tools
first examples

Do not use memory-only mode when data must survive restart.

Common configuration recipes
Local-only

No WAL, no transport, no discovery.

C++:

ClientOptions options =
    ClientOptions::local("node-local");

options.enable_wal = false;
options.enable_transport = false;
options.enable_discovery = false;

JavaScript:

const options = ClientOptions.local("node-local");

options.enableWal = false;
options.enableTransport = false;
options.enableDiscovery = false;

Use for:

first app
tests
temporary state
simple demos
local-only tools
Persistent local

WAL enabled, no transport, no discovery.

C++:

ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/node-persistent.wal");

options.auto_flush = true;
options.enable_transport = false;
options.enable_discovery = false;

JavaScript:

const options = ClientOptions.persistent(
  "node-persistent",
  "data/node-persistent.wal",
);

options.autoFlush = true;
options.enableTransport = false;
options.enableDiscovery = false;

Use when local data must survive restart.

Transport-enabled node

Transport enabled, discovery disabled.

C++:

ClientOptions options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");

options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

options.enable_discovery = false;

JavaScript:

const options = ClientOptions.persistent(
  "node-a",
  "data/node-a.wal",
);

options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

options.enableDiscovery = false;

Use when peers are configured manually.

Discovery-enabled node

Transport and discovery enabled.

C++:

ClientOptions options =
    ClientOptions::persistent(
        "node-discovery-a",
        "data/node-discovery-a.wal");

options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;

JavaScript:

const options = ClientOptions.persistent(
  "node-discovery-a",
  "data/node-discovery-a.wal",
);

options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4051;

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;

Use when the node should find peers automatically.

Two-node local configuration

Use separate node ids, WAL paths, and transport ports.

node-a
  WAL       : data/node-a.wal
  transport : 127.0.0.1:4041

node-b
  WAL       : data/node-b.wal
  transport : 127.0.0.1:4042

C++ Node A:

ClientOptions node_a =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");

node_a.auto_flush = true;
node_a.enable_transport = true;
node_a.transport_host = "127.0.0.1";
node_a.transport_port = 4041;
node_a.enable_discovery = false;

C++ Node B:

ClientOptions node_b =
    ClientOptions::persistent(
        "node-b",
        "data/node-b.wal");

node_b.auto_flush = true;
node_b.enable_transport = true;
node_b.transport_host = "127.0.0.1";
node_b.transport_port = 4042;
node_b.enable_discovery = false;

JavaScript Node A:

const nodeA = ClientOptions.persistent(
  "node-a",
  "data/node-a.wal",
);

nodeA.autoFlush = true;
nodeA.enableTransport = true;
nodeA.transportHost = "127.0.0.1";
nodeA.transportPort = 4041;
nodeA.enableDiscovery = false;

JavaScript Node B:

const nodeB = ClientOptions.persistent(
  "node-b",
  "data/node-b.wal",
);

nodeB.autoFlush = true;
nodeB.enableTransport = true;
nodeB.transportHost = "127.0.0.1";
nodeB.transportPort = 4042;
nodeB.enableDiscovery = false;
Transport configuration

Transport is the peer delivery layer.

It should be enabled only when the node needs to connect to peers or send sync messages.

Transport host

For local development:

127.0.0.1

For a node that should listen on all interfaces:

0.0.0.0

Be careful with public bind addresses. Production exposure should be protected by firewall rules, authentication, and deployment policy when those layers exist.

Transport port

Each local node needs a unique transport port.

Good:

node-a -> 4041
node-b -> 4042

Bad:

node-a -> 4041
node-b -> 4041

Check whether a port is already in use:

ss -ltnp | grep 4041
Discovery configuration

Discovery finds peers.

Discovery is optional.

It should be enabled only when the node should discover peers automatically.

Discovery bind host and port

The bind host and port define where the local discovery listener runs.

Example:

127.0.0.1:5051
Discovery broadcast host and port

The broadcast host and port define where discovery messages are sent.

Example:

127.0.0.1:5052

For two local nodes:

node-a discovery bind       : 127.0.0.1:5051
node-a discovery target     : 127.0.0.1:5052

node-b discovery bind       : 127.0.0.1:5052
node-b discovery target     : 127.0.0.1:5051

Each node targets the other node's discovery listener.

Sync configuration

The SDK exposes sync through sync_state / syncStateInfo and tick.

Lower-level engine configuration can include:

node id
auto queue behavior
ACK requirement
ACK timeout
retry interval
maximum retries
conflict policy
batch size

These fields may belong to engine-level configuration rather than the public SDK surface.

The important reference model is:

sync config decides how propagation is tracked
transport config decides how messages are delivered
discovery config decides how peers are found
Metadata configuration

Metadata describes the local node.

Common metadata inputs:

node id
display name
hostname
operating system
version
capabilities
uptime

Configured by user:

node id
display name
version

Detected by runtime:

hostname
operating system
uptime
capabilities

C++:

options.display_name = "Softadastra Node";
options.version = "0.1.0";

JavaScript:

options.displayName = "Softadastra Node";
options.version = "0.1.0";

Read metadata through:

C++:

auto info = client.refresh_node_info();

JavaScript:

const info = await client.refreshNodeInfo();

CLI:

softadastra node info
CLI configuration

The CLI can be configured through build options, runtime defaults, environment variables, or config files depending on the implementation.

Common CLI-related configuration areas:

binary path
working directory
data directory
node id
WAL path
transport port
discovery port
log level
output format

Stable CLI behavior should not depend on hidden configuration when production use is expected.

Operators should be able to answer:

which node id is running?
where is the data directory?
which WAL file is used?
which transport port is used?
is discovery enabled?
which version is running?
Build configuration

The engine repository can be built with Vix:

vix build

For release:

vix build --preset release

If apps are behind CMake options:

vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON

If the node app is needed:

vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON

CMake directly:

cmake --preset dev-ninja
cmake --build --preset build-ninja
Production configuration checklist

Before production, verify:

node id is stable
WAL is enabled for important data
WAL path is unique per node
data directory exists
data directory is writable
auto flush is enabled when durability matters
transport host and port are explicit
discovery behavior is intentional
sync failure is observable
runtime version is known
logs can identify the node
backups include the data directory
restart recovery is tested
Environment variables

If your application supports environment variables, keep names explicit.

Possible shapes:

SOFTADASTRA_NODE_ID
SOFTADASTRA_DATA_DIR
SOFTADASTRA_WAL_PATH
SOFTADASTRA_TRANSPORT_HOST
SOFTADASTRA_TRANSPORT_PORT
SOFTADASTRA_DISCOVERY_HOST
SOFTADASTRA_DISCOVERY_PORT
SOFTADASTRA_LOG_LEVEL

Only document environment variables as stable when they are implemented and supported.

Config files

If a config file is supported later, a possible shape can be:

{
  "node": {
    "id": "node-a",
    "display_name": "Node A",
    "version": "0.1.0"
  },
  "persistence": {
    "enable_wal": true,
    "wal_path": "data/node-a.wal",
    "auto_flush": true
  },
  "transport": {
    "enabled": true,
    "host": "127.0.0.1",
    "port": 4041
  },
  "discovery": {
    "enabled": false,
    "host": "127.0.0.1",
    "port": 5051,
    "broadcast_host": "127.0.0.1",
    "broadcast_port": 5052
  }
}

Do not present a config file schema as stable until it is implemented and versioned.

Configuration errors

Common configuration errors:

empty node id
empty WAL path
missing data directory
permission denied
port already in use
invalid port
discovery target wrong
same WAL path reused by multiple nodes
same transport port reused by multiple nodes
transport enabled but start_transport not called
discovery enabled but start_discovery not called

Configuration errors should return explicit errors.

They should not be hidden.

Local-first configuration rule

Configuration should preserve local-first behavior.

This should work without transport or discovery:

C++:

options.enable_transport = false;
options.enable_discovery = false;

client.put("draft/1", "hello");
client.get("draft/1");

JavaScript:

options.enableTransport = false;
options.enableDiscovery = false;

await client.put("draft/1", "hello");
await client.get("draft/1");

A local store operation should not require:

remote server
connected peer
transport
discovery
cloud access
Stable versus experimental configuration

Only document configuration as stable when it is implemented and intended to remain supported.

Recommended rule:

stable SDK field       -> include here
stable CLI option      -> include here
stable environment var -> include here
experimental setting   -> mention carefully or keep out
internal-only setting  -> document in engine docs, not public reference
Summary

Softadastra configuration controls how the local runtime starts.

The main configuration groups are:

identity
persistence
transport
discovery
sync
metadata
CLI
production deployment

The most important rule is:

make local-first behavior explicit

A good configuration makes it clear which node is running, where local data is persisted, how sync is tracked, and how peers are reached.

Related pages
CLI Reference
C++ API Reference
JavaScript API Reference
Errors Reference
Production Guide
Client Options C++
Client Options JS
