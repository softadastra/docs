# Metadata

`metadata` is the node identity module of Softadastra Engine.

It describes a local node and, when needed, known remote nodes.

The core rule is:

```txt
Metadata describes nodes.
Store contains application state.
```

Metadata does not sync values.

Metadata does not connect peers.

Metadata tells the runtime who a node is, what it can do, and where it is running.

## Why metadata exists

Softadastra is local-first and peer-aware.

A node should be able to answer:

- who am I?
- what is my node id?
- what is my display name?
- what hostname am I running on?
- what operating system am I running on?
- what version am I running?
- what capabilities do I expose?
- how long have I been running?

This information is useful for:

- CLI status
- debug output
- dashboards
- peer inspection
- discovery enrichment
- transport diagnostics
- sync debugging
- runtime observability

Without metadata, peers are just raw node ids.

With metadata, nodes become understandable.

## What metadata provides

The `metadata` module provides:

- `NodeMetadata`
- `NodeCapabilities`
- `MetadataOptions`
- `MetadataService`
- `MetadataRegistry`
- `MetadataEncoder`
- `MetadataDecoder`
- `PlatformInfo`
- `Hostname`
- `VersionInfo`
- capabilities
- runtime info

It allows the engine to:

- create local node metadata
- refresh runtime information
- track node capabilities
- encode metadata
- decode metadata
- store known node metadata
- filter nodes by capability
- expose node identity to CLI and SDKs

## What metadata does not do

`metadata` must not:

- store application data
- sync values
- connect peers
- discover peers by itself
- decide conflicts
- own WAL durability
- own transport delivery
- own CLI parsing
- format all terminal output

The rule is:

```txt
Metadata describes nodes.
Discovery finds nodes.
Transport connects nodes.
Sync propagates operations.
Store keeps local state.
```

## Include

Use the top-level include:

```cpp
#include <softadastra/metadata/Metadata.hpp>
```

## Module location

The module lives in:

```txt
modules/metadata/
```

Typical structure:

```txt
modules/metadata/
├── include/
│   └── softadastra/metadata/
│       ├── backend/
│       ├── core/
│       ├── encoding/
│       ├── registry/
│       ├── service/
│       ├── types/
│       ├── utils/
│       └── Metadata.hpp
├── src/
├── examples/
├── tests/
├── README.md
├── CMakeLists.txt
└── CHANGELOG.md
```

The exact structure can evolve, but the responsibility should stay stable:

```txt
describe nodes and expose runtime identity
```

## Main concepts

The metadata module is built around these concepts:

- `MetadataOptions`
- `NodeMetadata`
- `NodeCapabilities`
- `MetadataRegistry`
- `MetadataService`
- `MetadataEncoder`
- `MetadataDecoder`
- `PlatformInfo`
- `Hostname`
- `VersionInfo`

The normal local flow is:

```txt
MetadataOptions
  ↓
NodeMetadata
  ↓
refresh runtime
  ↓
local metadata snapshot
  ↓
CLI / SDK / diagnostics
```

For remote nodes:

```txt
metadata received
  ↓
decode metadata
  ↓
MetadataRegistry
  ↓
query known nodes
```

## MetadataOptions

`MetadataOptions` configures metadata for the local node.

Example:

```cpp
auto options =
    metadata::MetadataOptions::local(
        "node-a",
        "0.1.0");
```

This defines:

- node id
- version
- display name, when configured
- refresh interval, when supported

## Metadata options example

```cpp
#include <iostream>

#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== METADATA MINIMAL EXAMPLE ==\n";

    auto options =
        metadata::MetadataOptions::local(
            "node-a",
            "0.1.0");

    if (!options.is_valid())
    {
        std::cerr << "invalid metadata options\n";
        return 1;
    }

    auto config =
        options.to_config();

    std::cout << "node id: "
              << config.node_id
              << "\n";

    std::cout << "display name: "
              << config.display_name
              << "\n";

    std::cout << "version: "
              << config.version
              << "\n";

    std::cout << "refresh interval ms: "
              << config.refresh_interval_ms()
              << "\n";

    return 0;
}
```

## Node id

The node id identifies the local node.

Good examples:

```txt
node-a
node-b
drive-client
drive-server
metadata-node
desktop-1
```

Avoid empty node ids.

A node id is used by:

- metadata
- sync operation origin
- transport messages
- discovery announcements
- CLI status
- SDK node info

The node id should be stable when sync, peer identity, or diagnostics depend on it.

## Display name

The display name is a human-friendly label.

Example:

```txt
Softadastra SDK Node
```

A display name is useful for:

- dashboards
- CLI output
- debug tools
- peer lists
- logs

If no display name is available, the node id can be used as the fallback label.

## Version

The version describes the runtime or application version.

Example:

```txt
0.1.0
```

Version is useful when:

- nodes run different builds
- protocol compatibility matters
- debugging deployment issues
- inspecting peers

## NodeMetadata

`NodeMetadata` is the main metadata object.

It can contain:

- node id
- display name
- runtime info
- capabilities
- created timestamp
- updated timestamp

Runtime info can include:

- hostname
- operating system
- version
- uptime

The exact fields depend on the implementation.

The important idea is:

```txt
NodeMetadata = node identity + runtime description + capabilities
```

## Local metadata snapshot

A local metadata snapshot describes the current node.

Example:

```cpp
auto metadata_snapshot =
    metadata::core::NodeMetadata::foundation(
        "node-a",
        metadata::utils::Hostname::get(),
        metadata::utils::PlatformInfo::os_name(),
        metadata::utils::VersionInfo::current());
```

Then refresh runtime fields:

```cpp
metadata_snapshot.refresh_runtime();
```

## Local snapshot example

```cpp
#include <iostream>

#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== METADATA LOCAL SNAPSHOT EXAMPLE ==\n";

    auto metadata_snapshot =
        metadata::core::NodeMetadata::foundation(
            "node-a",
            metadata::utils::Hostname::get(),
            metadata::utils::PlatformInfo::os_name(),
            metadata::utils::VersionInfo::current());

    if (!metadata_snapshot.is_valid())
    {
        std::cerr << "invalid metadata snapshot\n";
        return 1;
    }

    metadata_snapshot.refresh_runtime();

    std::cout << "node id: "
              << metadata_snapshot.node_id()
              << "\n";

    std::cout << "label: "
              << metadata_snapshot.label()
              << "\n";

    std::cout << "hostname: "
              << metadata_snapshot.runtime.hostname
              << "\n";

    std::cout << "os: "
              << metadata_snapshot.runtime.os_name
              << "\n";

    std::cout << "version: "
              << metadata_snapshot.runtime.version
              << "\n";

    std::cout << "uptime ms: "
              << metadata_snapshot.runtime.uptime_ms()
              << "\n";

    std::cout << "capabilities: "
              << metadata_snapshot.capabilities.size()
              << "\n";

    return 0;
}
```

## Minimal metadata

A minimal metadata object can describe a node with fewer capabilities.

Conceptual use:

- node id
- hostname
- OS
- version
- minimal capability set

Foundation metadata is richer and usually includes core runtime capabilities.

## Label

A metadata label should return the most useful human-readable name.

Recommended behavior:

```txt
display name exists
  ↓
return display name

display name missing
  ↓
return node id
```

This makes CLI and dashboards cleaner.

## Runtime info

Runtime info describes where and how the node is running.

It can include:

- hostname
- operating system
- version
- start time
- uptime

This is useful for debugging distributed local-first systems.

Example output:

```txt
hostname : softadastra-dev
os       : linux
version  : 0.1.0
uptime   : 18420 ms
```

## Hostname

Hostname reads the local machine name.

Example:

```cpp
metadata::utils::Hostname::get()
```

The hostname helps identify where a node is running.

This is especially useful when multiple nodes run on different machines.

## PlatformInfo

`PlatformInfo` exposes platform data.

Example:

```cpp
metadata::utils::PlatformInfo::os_name()
```

It helps metadata answer:

- is this node running on Linux?
- is this node running on macOS?
- is this node running on Windows?

## VersionInfo

`VersionInfo` exposes the current runtime version.

Example:

```cpp
metadata::utils::VersionInfo::current()
```

Version information helps with debugging and compatibility checks.

## Uptime

Uptime describes how long the node runtime has been alive.

Example:

```cpp
metadata_snapshot.runtime.uptime_ms()
```

Uptime is useful for detecting:

- fresh starts
- unexpected restarts
- long-running nodes
- runtime lifecycle behavior

## NodeCapabilities

`NodeCapabilities` describes what the node supports.

Capabilities can include:

- `Core`
- `FS`
- `WAL`
- `Store`
- `Sync`
- `Transport`
- `Discovery`
- `Metadata`
- `CLI`
- `App`

The exact enum values depend on the implementation.

The important idea is:

```txt
capabilities tell what this node can do
```

## Capabilities example

```cpp
#include <iostream>

#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== METADATA CAPABILITIES EXAMPLE ==\n";

    metadata::core::NodeCapabilities capabilities;

    capabilities.add(metadata::types::CapabilityType::Core);
    capabilities.add(metadata::types::CapabilityType::Store);
    capabilities.add(metadata::types::CapabilityType::Sync);
    capabilities.add(metadata::types::CapabilityType::Transport);
    capabilities.add(metadata::types::CapabilityType::Metadata);

    std::cout << "capability count: "
              << capabilities.size()
              << "\n";

    std::cout << "has sync: "
              << capabilities.has(metadata::types::CapabilityType::Sync)
              << "\n";

    std::cout << "has foundation capability: "
              << capabilities.has_foundation_capability()
              << "\n";

    std::cout << "has user-facing capability: "
              << capabilities.has_user_facing_capability()
              << "\n";

    for (const auto capability : capabilities.values)
    {
        std::cout << "- "
                  << metadata::types::to_string(capability)
                  << "\n";
    }

    return 0;
}
```

## Foundation capabilities

Foundation capabilities describe low-level runtime abilities.

Examples:

- core
- wal
- store
- sync
- transport
- discovery
- metadata

A foundation node may be a runtime node used for synchronization and storage.

## User-facing capabilities

User-facing capabilities describe higher-level application abilities.

Examples:

- app
- cli
- dashboard
- sdk

The current implementation may only support a subset.

The useful rule is:

```txt
foundation capabilities describe the runtime
user-facing capabilities describe the interface
```

## Capability checks

Capability checks are useful for filtering.

Examples:

```cpp
capabilities.has(metadata::types::CapabilityType::Sync)
```

or:

```cpp
capabilities.has_foundation_capability()
```

or:

```cpp
capabilities.has_user_facing_capability()
```

This helps decide what kind of node is being inspected.

## MetadataRegistry

`MetadataRegistry` stores metadata for known nodes.

It can:

- insert node metadata
- update node metadata
- find metadata by node id
- erase metadata
- list all metadata
- filter by capability
- list foundation nodes
- list user-facing nodes

The registry is useful when a node knows about multiple peers.

## Registry example

```cpp
#include <iostream>

#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== METADATA REGISTRY DEMO ==\n";

    metadata::registry::MetadataRegistry registry;

    auto node_a =
        metadata::core::NodeMetadata::foundation(
            "node-a",
            "host-a",
            "linux",
            "1.0.0");

    auto node_b =
        metadata::core::NodeMetadata::minimal(
            "node-b",
            "host-b",
            "linux",
            "1.0.0");

    registry.upsert(node_a);
    registry.upsert(node_b);

    std::cout << "registry size: "
              << registry.size()
              << "\n";

    auto found =
        registry.get("node-a");

    if (found.has_value())
    {
        std::cout << "found node: "
                  << found->node_id()
                  << "\n";
    }

    registry.erase("node-b");

    std::cout << "registry size after erase: "
              << registry.size()
              << "\n";

    return 0;
}
```

## Registry filter example

```cpp
#include <iostream>

#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== METADATA REGISTRY FILTER EXAMPLE ==\n";

    metadata::registry::MetadataRegistry registry;

    auto foundation_node =
        metadata::core::NodeMetadata::foundation(
            "node-foundation",
            "foundation-host",
            "linux",
            "1.0.0");

    auto app_node =
        metadata::core::NodeMetadata::minimal(
            "node-app",
            "app-host",
            "linux",
            "1.0.0");

    app_node.capabilities.add(
        metadata::types::CapabilityType::App);

    registry.upsert(foundation_node);
    registry.upsert(app_node);

    const auto sync_nodes =
        registry.with_capability(
            metadata::types::CapabilityType::Sync);

    const auto foundation_nodes =
        registry.foundation_nodes();

    const auto user_facing_nodes =
        registry.user_facing_nodes();

    std::cout << "registry size: "
              << registry.size()
              << "\n";

    std::cout << "sync nodes: "
              << sync_nodes.size()
              << "\n";

    std::cout << "foundation nodes: "
              << foundation_nodes.size()
              << "\n";

    std::cout << "user-facing nodes: "
              << user_facing_nodes.size()
              << "\n";

    return 0;
}
```

## Metadata encoding

Metadata can be encoded for transport, storage, or diagnostics.

Encoding flow:

```txt
NodeMetadata
  ↓
MetadataEncoder
  ↓
payload bytes
```

Decoding flow:

```txt
payload bytes
  ↓
MetadataDecoder
  ↓
NodeMetadata
```

Invalid metadata payloads should fail clearly.

## Encode decode example

```cpp
#include <iostream>

#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== METADATA ENCODE DECODE DEMO ==\n";

    auto original =
        metadata::core::NodeMetadata::foundation(
            "node-a",
            metadata::utils::Hostname::get(),
            metadata::utils::PlatformInfo::os_name(),
            "1.0.0");

    if (!original.is_valid())
    {
        std::cerr << "invalid original metadata\n";
        return 1;
    }

    auto encoded =
        metadata::encoding::MetadataEncoder::encode(original);

    if (encoded.empty())
    {
        std::cerr << "failed to encode metadata\n";
        return 1;
    }

    auto decoded =
        metadata::encoding::MetadataDecoder::decode(encoded);

    if (!decoded.has_value())
    {
        std::cerr << "failed to decode metadata\n";
        return 1;
    }

    std::cout << "encoded size: "
              << encoded.size()
              << "\n";

    std::cout << "decoded node id: "
              << decoded->node_id()
              << "\n";

    std::cout << "decoded hostname: "
              << decoded->runtime.hostname
              << "\n";

    std::cout << "decoded capabilities: "
              << decoded->capabilities.size()
              << "\n";

    return 0;
}
```

## Encoding rule

Metadata encoding should be strict.

Bad:

```txt
invalid payload
  ↓
fake default metadata
```

Better:

```txt
invalid payload
  ↓
decode failure
  ↓
registry unchanged
```

Never register invalid metadata as a real node.

## Custom metadata provider

A metadata provider can produce local metadata from a custom source.

This is useful when metadata must be generated by application logic or another runtime layer.

## Custom provider example

```cpp
#include <iostream>
#include <optional>

#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

class DemoMetadataProvider final
    : public metadata::backend::IMetadataProvider
{
public:
    std::optional<metadata::core::NodeMetadata>
    local_metadata() const override
    {
        return metadata_;
    }

    std::optional<metadata::core::NodeMetadata>
    refresh_local_metadata() override
    {
        metadata_ =
            metadata::core::NodeMetadata::foundation(
                "provider-node",
                "provider-host",
                metadata::utils::PlatformInfo::os_name(),
                "2.0.0");

        metadata_->refresh_runtime();

        return metadata_;
    }

private:
    std::optional<metadata::core::NodeMetadata> metadata_{};
};

int main()
{
    std::cout << "== METADATA CUSTOM PROVIDER EXAMPLE ==\n";

    DemoMetadataProvider provider;

    auto metadata_snapshot =
        provider.refresh_local_metadata();

    if (!metadata_snapshot.has_value())
    {
        std::cerr << "provider failed to produce metadata\n";
        return 1;
    }

    std::cout << "provider node id: "
              << metadata_snapshot->node_id()
              << "\n";

    std::cout << "provider hostname: "
              << metadata_snapshot->runtime.hostname
              << "\n";

    std::cout << "provider version: "
              << metadata_snapshot->runtime.version
              << "\n";

    return 0;
}
```

## MetadataService

`MetadataService` is the higher-level metadata runtime service.

It can:

- start metadata service
- stop metadata service
- refresh local metadata
- return local metadata
- store known metadata
- return all known metadata
- integrate with discovery

The exact methods depend on the implementation.

## Metadata service flow

A service flow can look like this:

```txt
MetadataOptions
  ↓
MetadataService
  ↓
start
  ↓
local_or_refresh
  ↓
NodeMetadata
  ↓
registry
  ↓
stop
```

When integrated with discovery:

```txt
Discovery finds peer
  ↓
MetadataService can track or expose metadata
```

The boundary should stay clear.

Discovery finds nodes.

Metadata describes nodes.

## Metadata service example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>
#include <softadastra/discovery/Discovery.hpp>
#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== METADATA SERVICE DEMO ==\n";

    const std::string wal_path = "metadata_service_demo.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("metadata-node");

    sync::core::SyncContext sync_context{
        store,
        sync_config};

    sync::engine::SyncEngine sync_engine{
        sync_context};

    auto transport_config =
        transport::core::TransportConfig::local(7300);

    transport::core::TransportContext transport_context{
        transport_config,
        sync_engine};

    transport::backend::TcpTransportBackend transport_backend{
        transport_config};

    transport::engine::TransportEngine transport_engine{
        transport_context,
        transport_backend};

    if (!transport_engine.start())
    {
        std::cerr << "failed to start transport engine\n";
        std::filesystem::remove(wal_path);
        return 1;
    }

    auto discovery_config =
        discovery::core::DiscoveryConfig::local(
            "metadata-node",
            9500,
            7300);

    discovery::core::DiscoveryContext discovery_context{
        discovery_config,
        transport_engine};

    discovery::backend::UdpDiscoveryBackend discovery_backend{
        discovery_config};

    discovery::engine::DiscoveryEngine discovery_engine{
        discovery_context,
        discovery_backend};

    if (!discovery_engine.start())
    {
        std::cerr << "failed to start discovery engine\n";
        transport_engine.stop();
        std::filesystem::remove(wal_path);
        return 1;
    }

    auto metadata_options =
        metadata::MetadataOptions::local(
            "metadata-node",
            "1.0.0");

    metadata::MetadataService metadata_service{
        metadata_options,
        discovery_engine};

    if (!metadata_service.start())
    {
        std::cerr << "failed to start metadata service\n";
        discovery_engine.stop();
        transport_engine.stop();
        std::filesystem::remove(wal_path);
        return 1;
    }

    auto local =
        metadata_service.local_or_refresh();

    if (local.has_value())
    {
        std::cout << "local metadata node id: "
                  << local->node_id()
                  << "\n";

        std::cout << "hostname: "
                  << local->runtime.hostname
                  << "\n";

        std::cout << "os: "
                  << local->runtime.os_name
                  << "\n";

        std::cout << "capabilities: "
                  << local->capabilities.size()
                  << "\n";
    }

    std::cout << "registry entries: "
              << metadata_service.all().size()
              << "\n";

    metadata_service.stop();
    discovery_engine.stop();
    transport_engine.stop();

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Metadata and discovery

Discovery finds peers.

Metadata describes peers.

Relationship:

```txt
Discovery finds node-b
  ↓
Metadata can describe node-b
  ↓
CLI or SDK can show richer peer info
```

Discovery should not own metadata behavior.

Metadata should not own discovery behavior.

They should integrate through explicit service boundaries.

## Metadata and transport

Transport moves messages.

Metadata describes nodes.

A transport message may include node ids.

Metadata can later provide richer information about those node ids.

Relationship:

```txt
transport message from node-b
  ↓
metadata registry can describe node-b
```

Transport should not depend on metadata to move basic messages.

## Metadata and sync

Sync uses node identity.

Metadata describes node identity.

Example:

```txt
metadata node id = node-a
sync operation origin = node-a
```

Sync can use metadata for diagnostics, but sync should not depend on metadata to apply basic local operations.

## Metadata and store

Store contains application state.

Metadata describes the runtime node.

Example:

```txt
metadata.node_id = node-a
store["profile/name"] = Ada
```

These are separate.

Do not store application values in metadata.

Do not store node identity as normal app data unless the application intentionally mirrors it.

## Metadata and WAL

WAL records operation history.

Metadata describes nodes.

They are separate.

A diagnostic view may show:

- node id
- WAL path
- last sequence

But the generic metadata module should not own WAL writing.

## Metadata and CLI

CLI can expose metadata through commands such as:

- `node info`
- `status`
- `peers`

Correct direction:

```txt
CLI command
  ↓
MetadataService
  ↓
NodeMetadata
```

Wrong direction:

```txt
MetadataService
  ↓
CLI formatted output
```

Metadata should return structured data.

CLI should format it.

## Metadata and SDK

The SDK wraps metadata behind simpler methods.

C++ SDK:

```cpp
client.refresh_node_info()
client.node_info()
```

JavaScript SDK:

```js
client.refreshNodeInfo()
client.nodeInfo()
```

The SDK exposes a simplified `NodeInfo` object for application developers.

The engine metadata module remains lower-level.

## Local-first behavior

Metadata should not be required for local store writes.

Correct behavior:

```txt
metadata unavailable
  ↓
store put can still work
```

Metadata failure should affect diagnostics, node description, or peer visibility, not basic local state.

## Offline behavior

Metadata is local.

It can work offline because it reads local runtime information:

- node id
- hostname
- OS
- version
- uptime
- capabilities

Remote metadata may be unavailable while offline.

That should not break local metadata.

## Metadata failure behavior

Metadata can fail for normal reasons:

- invalid node id
- invalid version
- platform info unavailable
- hostname unavailable
- metadata decode failed
- provider failed
- service not started

Each failure should be visible.

Do not hide metadata failures behind generic messages.

## Invalid node id

An empty node id should be rejected.

Bad:

```txt
""
```

Good:

```txt
node-a
```

The error should be clear:

```txt
invalid metadata options: node id is empty
```

## Invalid metadata payload

If decoding fails:

```txt
payload bytes
  ↓
decode failed
  ↓
return failure
  ↓
do not insert metadata into registry
```

Invalid metadata should not become a fake node.

## Provider failure

If a metadata provider cannot produce metadata:

```txt
refresh provider
  ↓
no metadata returned
  ↓
return failure or empty result
```

The caller should decide how to handle it.

## Service not started

If a service method requires a started service, the error should explain the lifecycle issue.

Example:

```txt
metadata service is not running
```

## Metadata API reference

### Main areas

| Area | Purpose |
|---|---|
| `core` | Node metadata and capabilities |
| `types` | Capability types and metadata types |
| `registry` | Known node metadata registry |
| `encoding` | Metadata encode and decode |
| `backend` | Metadata providers |
| `utils` | Hostname, platform, version utilities |
| `service` | Metadata service |

### Main types

| Type | Purpose |
|---|---|
| `MetadataOptions` | User-facing metadata options |
| `NodeMetadata` | Node identity and runtime info |
| `NodeCapabilities` | Supported node capabilities |
| `CapabilityType` | Capability enum |
| `MetadataRegistry` | Stores known node metadata |
| `MetadataEncoder` | Encodes metadata |
| `MetadataDecoder` | Decodes metadata |
| `IMetadataProvider` | Provider interface |
| `MetadataService` | Higher-level metadata service |

### Common methods

| Method | Purpose |
|---|---|
| `NodeMetadata::foundation(...)` | Create foundation node metadata |
| `NodeMetadata::minimal(...)` | Create minimal node metadata |
| `refresh_runtime()` | Refresh runtime fields |
| `node_id()` | Return node id |
| `label()` | Return display label |
| `is_valid()` | Validate metadata |
| `capabilities.add(...)` | Add capability |
| `capabilities.has(...)` | Check capability |
| `registry.upsert(...)` | Insert or update metadata |
| `registry.get(...)` | Get metadata by node id |
| `registry.with_capability(...)` | Filter by capability |
| `MetadataEncoder::encode(...)` | Encode metadata |
| `MetadataDecoder::decode(...)` | Decode metadata |

Only document a method as stable when it exists in the current public API.

## Examples

Current useful examples include:

- `metadata_minimal.cpp`
- `metadata_local_snapshot.cpp`
- `metadata_capabilities.cpp`
- `metadata_registry_demo.cpp`
- `metadata_registry_filter.cpp`
- `metadata_encode_decode_demo.cpp`
- `metadata_custom_provider.cpp`
- `metadata_service_demo.cpp`

Recommended order:

1. `metadata_minimal.cpp`
2. `metadata_local_snapshot.cpp`
3. `metadata_capabilities.cpp`
4. `metadata_registry_demo.cpp`
5. `metadata_registry_filter.cpp`
6. `metadata_encode_decode_demo.cpp`
7. `metadata_custom_provider.cpp`
8. `metadata_service_demo.cpp`

This order moves from local identity to registry, encoding, provider, and service integration.

## Run examples

From the engine repository:

```bash
cd ~/softadastra/softadastra
```

Build:

```bash
vix build
```

Or with CMake:

```bash
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

Find binaries:

```bash
find build-ninja -type f -executable
```

Run the relevant metadata example binary from the build output.

## Testing metadata

Metadata tests should verify:

- valid metadata options
- invalid metadata options
- local metadata creation
- minimal metadata creation
- foundation metadata creation
- runtime refresh
- capability add
- capability has
- foundation capability check
- user-facing capability check
- registry upsert
- registry get
- registry erase
- registry filter by capability
- metadata encode
- metadata decode
- invalid payload decode failure
- custom provider refresh
- service start and stop

## Good metadata test flow

Options test:

```txt
create local metadata options
validate options
convert to config
expect node id and version
```

Capability test:

```txt
create NodeCapabilities
add Sync
expect has Sync
expect capability count = 1
```

Registry test:

```txt
create registry
upsert node-a metadata
get node-a
expect found
erase node-a
expect missing
```

Codec test:

```txt
create NodeMetadata
encode metadata
decode payload
expect same node id
```

Invalid decode test:

```txt
provide invalid bytes
decode
expect failure
registry unchanged
```

Service test:

```txt
create service
start service
refresh local metadata
expect local node id
stop service
```

## Design rules

The metadata module should follow these rules:

1. Describe nodes, not application data.
2. Keep node identity explicit.
3. Keep capabilities inspectable.
4. Keep metadata encoding strict.
5. Do not create fake metadata from invalid payloads.
6. Do not make local writes depend on metadata.
7. Keep discovery integration clean.
8. Keep transport integration clean.
9. Return explicit failures.
10. Keep examples small and focused.

## Common mistakes

### Storing application data in metadata

Wrong:

```txt
metadata.profile_name = "Ada"
```

Better:

```txt
store["profile/name"] = "Ada"
```

Metadata describes the node.

Store contains app data.

### Making metadata discover peers

Wrong:

```txt
MetadataService scans LAN for peers
```

Better:

```txt
DiscoveryService finds peers
MetadataService describes nodes
```

### Making metadata connect peers

Wrong:

```txt
MetadataService opens TCP connection
```

Better:

```txt
TransportEngine connects peers
Metadata describes the peer
```

### Ignoring invalid metadata payloads

Wrong:

```txt
decode failed
  ↓
insert default node
```

Better:

```txt
decode failed
  ↓
return failure
  ↓
registry unchanged
```

### Making metadata required for local writes

Wrong:

```txt
metadata refresh failed
  ↓
store put fails
```

Better:

```txt
metadata refresh failed
  ↓
diagnostics unavailable
  ↓
store can still work
```

### Mixing CLI formatting into metadata

Wrong:

```txt
NodeMetadata prints terminal tables
```

Better:

```txt
NodeMetadata returns data
CLI formats output
```

## Recommended usage pattern

Create local metadata options:

```cpp
auto options =
    metadata::MetadataOptions::local(
        "node-a",
        "0.1.0");

if (!options.is_valid())
{
    return 1;
}
```

Create a local metadata snapshot:

```cpp
auto snapshot =
    metadata::core::NodeMetadata::foundation(
        "node-a",
        metadata::utils::Hostname::get(),
        metadata::utils::PlatformInfo::os_name(),
        metadata::utils::VersionInfo::current());

if (!snapshot.is_valid())
{
    return 1;
}

snapshot.refresh_runtime();
```

Add capabilities:

```cpp
snapshot.capabilities.add(
    metadata::types::CapabilityType::Store);

snapshot.capabilities.add(
    metadata::types::CapabilityType::Sync);
```

Use a registry:

```cpp
metadata::registry::MetadataRegistry registry;

registry.upsert(snapshot);

auto found = registry.get("node-a");

if (found.has_value())
{
    std::cout << found->node_id() << "\n";
}
```

Encode metadata:

```cpp
auto encoded =
    metadata::encoding::MetadataEncoder::encode(snapshot);

if (encoded.empty())
{
    return 1;
}
```

Decode metadata:

```cpp
auto decoded =
    metadata::encoding::MetadataDecoder::decode(encoded);

if (!decoded.has_value())
{
    return 1;
}
```

## Summary

`metadata` is the node identity module of Softadastra Engine.

It provides:

- `NodeMetadata`
- `NodeCapabilities`
- `MetadataOptions`
- `MetadataService`
- `MetadataRegistry`
- `MetadataEncoder`
- `MetadataDecoder`
- `PlatformInfo`
- `Hostname`
- `VersionInfo`

The key idea is:

```txt
Metadata makes nodes understandable.
```

It does not store application data, sync values, connect peers, or discover peers by itself.

## Next step

Continue with CLI:

[Go to CLI](./cli.md)
