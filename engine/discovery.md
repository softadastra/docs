# Discovery

`discovery` is the peer discovery module of Softadastra Engine.

It helps a local node find other nodes that may be reachable through transport.

The core rule is:

```txt
Discovery finds peers.
Transport connects peers.
Sync sends operations.
```

Discovery is not transport.
Discovery is not sync.
Discovery is the layer that makes peer discovery visible and structured.

## Why discovery exists

Softadastra is local-first and peer-aware.

A node can work alone:

```txt
local write
  ↓
store apply
  ↓
sync tracks operation
```

But when other nodes exist, the local node needs a way to know about them.

Without discovery, peers must be configured manually:

```cpp
transport::core::PeerInfo peer{
    "node-b",
    "127.0.0.1",
    7001};
```

That is useful for simple tests.

Discovery exists for the next step:

- which peers are available?
- where are they listening?
- which transport port do they expose?
- when were they last seen?
- are they stale or expired?

## What discovery provides

The `discovery` module provides:

- `DiscoveryConfig`
- `DiscoveryOptions`
- `DiscoveryContext`
- `DiscoveryAnnouncement`
- `DiscoveryMessage`
- `UdpDiscoveryBackend`
- `DiscoveryClient`
- `DiscoveryServer`
- `DiscoveryEngine`
- `DiscoveryService`
- `DiscoveryRegistry`
- announcement
- probe
- peer found callbacks
- peer stale tracking
- peer expiration

It allows the engine to:

- announce a local node
- probe for peers
- listen for discovery messages
- decode discovery datagrams
- track known peers
- mark peers stale
- mark peers expired
- prune expired peers
- expose available peers

## What discovery does not do

`discovery` must not:

- send sync operations
- apply store values
- decide conflicts
- own transport connections directly
- require local writes to work
- own WAL durability
- own CLI parsing
- format terminal output

The rule is:

```txt
Discovery finds peers.
Transport connects peers.
Sync sends operations.
Store applies state.
```

No discovered peer is a valid state.
It should not break local work.

## Include

Use the top-level include:

```cpp
#include <softadastra/discovery/Discovery.hpp>
```

## Module location

The module lives in:

```txt
modules/discovery/
```

Typical structure:

```txt
modules/discovery/
├── include/
│   └── softadastra/discovery/
│       ├── backend/
│       ├── client/
│       ├── core/
│       ├── encoding/
│       ├── engine/
│       ├── peer/
│       ├── server/
│       ├── types/
│       └── Discovery.hpp
├── src/
├── examples/
├── tests/
├── README.md
├── CMakeLists.txt
└── CHANGELOG.md
```

The exact structure can evolve, but the responsibility should stay stable:

```txt
discover peers and expose peer availability
```

## Main concepts

The discovery module is built around these concepts:

- `DiscoveryConfig`
- `DiscoveryOptions`
- `DiscoveryContext`
- `DiscoveryMessage`
- `DiscoveryAnnouncement`
- `UdpDiscoveryBackend`
- `DiscoveryClient`
- `DiscoveryServer`
- `DiscoveryEngine`
- `DiscoveryService`
- `DiscoveryRegistry`

The normal flow is:

```txt
DiscoveryConfig
  ↓
UdpDiscoveryBackend
  ↓
DiscoveryEngine
  ↓
announce / probe
  ↓
listen for messages
  ↓
update registry
  ↓
expose peers
```

## DiscoveryOptions

`DiscoveryOptions` is a developer-facing configuration helper.

Example:

```cpp
auto options =
    discovery::DiscoveryOptions::local(
        "node-a",
        9400,
        7000);
```

This defines:

- node id
- discovery bind port
- transport announce port

The node id identifies the local node.

The discovery port is used by the discovery backend.

The transport port is what peers can use later to connect through transport.

## Discovery options example

```cpp
#include <iostream>
#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DISCOVERY MINIMAL EXAMPLE ==\n";

    auto options =
        discovery::DiscoveryOptions::local(
            "node-a",
            9400,
            7000);

    if (!options.is_valid())
    {
        std::cerr << "invalid discovery options\n";
        return 1;
    }

    auto config = options.to_config();

    std::cout << "node id: "
              << config.node_id
              << "\n";

    std::cout << "bind: "
              << config.bind_host
              << ":"
              << config.bind_port
              << "\n";

    std::cout << "announce: "
              << config.announce_host
              << ":"
              << config.announce_port
              << "\n";

    std::cout << "announce interval ms: "
              << config.announce_interval_ms()
              << "\n";

    std::cout << "peer ttl ms: "
              << config.peer_ttl_ms()
              << "\n";

    return 0;
}
```

## DiscoveryConfig

`DiscoveryConfig` is the lower-level configuration used by the discovery runtime.

It can define:

- node id
- bind host
- bind port
- broadcast host
- broadcast port
- announce host
- announce port
- announce interval
- probe interval
- peer TTL

Example:

```cpp
auto config =
    discovery::core::DiscoveryConfig::local(
        "node-a",
        9400,
        7000);
```

The important distinction is:

```txt
bind port      -> where this node listens for discovery messages
announce port  -> the transport port this node tells others to use
```

## Node id

Discovery messages need a node id.

Example:

```txt
node-a
```

The node id is used to identify the peer in registries and announcements.

Good node ids:

- `node-a`
- `node-b`
- `drive-client`
- `drive-server`
- `metadata-node`
- `desktop-1`

Avoid empty node ids.

## Bind host and port

The bind host and port define where discovery listens.

For local examples:

```txt
127.0.0.1:9400
```

The port must not already be in use.

If two nodes run locally, they should use different discovery bind ports.

Example:

```txt
node-a discovery -> 9400
node-b discovery -> 9401
```

## Announce host and port

The announce host and port describe where the node can be reached for transport.

Example:

```txt
node-a discovery listens on 9400
node-a transport listens on 7000
```

The discovery announcement should expose the transport address:

```txt
node-a 127.0.0.1:7000
```

This lets another node later connect through transport.

## DiscoveryAnnouncement

`DiscoveryAnnouncement` describes a node that is available.

It can contain:

- node id
- host
- port
- timestamp, if supported
- capabilities, later

Example:

```cpp
discovery::core::DiscoveryAnnouncement announcement{
    config.node_id,
    config.announce_host,
    config.announce_port};
```

The announcement tells other nodes:

- this node exists
- this is its node id
- this is where its transport can be reached

## DiscoveryMessage

`DiscoveryMessage` is the protocol message used by discovery.

Common message types can include:

- `Announce`
- `Probe`
- `ProbeReply`
- `Unknown`

A message can contain:

- type
- from node id
- to node id
- correlation id
- payload

The exact fields depend on the implementation.

## Announcement flow

An announcement flow looks like this:

```txt
local node
  ↓
create DiscoveryAnnouncement
  ↓
encode into DiscoveryMessage
  ↓
send datagram
  ↓
remote discovery listener receives
  ↓
remote registry upserts peer
```

An announcement does not connect peers.

It only tells others that a node exists.

## Probe flow

A probe asks if peers are available.

Flow:

```txt
local node sends probe
  ↓
remote discovery receives probe
  ↓
remote node can respond or announce
  ↓
local registry updates peer state
```

Probes are useful when a node wants to refresh peer availability.

## UdpDiscoveryBackend

`UdpDiscoveryBackend` is the UDP backend used by discovery.

It owns low-level UDP behavior:

- bind
- send datagram
- receive datagram
- stop

The public discovery model should remain stable even if more discovery backends are added later.

## DiscoveryClient

`DiscoveryClient` sends discovery messages.

It can:

- send announcements
- send probes
- send discovery datagrams

## Discovery announcer example

```cpp
#include <iostream>
#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DISCOVERY ANNOUNCER EXAMPLE ==\n";

    auto config =
        discovery::core::DiscoveryConfig::local(
            "node-announcer",
            9400,
            7000);

    discovery::backend::UdpDiscoveryBackend backend{config};

    if (!backend.start())
    {
        std::cerr << "failed to start UDP discovery backend\n";
        return 1;
    }

    discovery::core::DiscoveryAnnouncement announcement{
        config.node_id,
        config.announce_host,
        config.announce_port};

    std::vector<std::uint8_t> payload{
        announcement.node_id.begin(),
        announcement.node_id.end()};

    auto message =
        discovery::core::DiscoveryMessage::announce(
            config.node_id,
            payload);

    message.correlation_id = "announce-demo-1";

    discovery::client::DiscoveryClient client{backend};

    const bool sent =
        client.send_announce(
            config.broadcast_host,
            config.broadcast_port,
            config.node_id,
            payload);

    std::cout << "announcement sent: "
              << sent
              << "\n";

    backend.stop();
    return 0;
}
```

## DiscoveryServer

`DiscoveryServer` listens for discovery messages.

It can:

- start listener
- poll inbound messages
- return message and source address
- stop listener

## Discovery listener example

```cpp
#include <iostream>
#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DISCOVERY LISTENER EXAMPLE ==\n";

    auto config =
        discovery::core::DiscoveryConfig::local(
            "node-listener",
            9401,
            7001);

    discovery::backend::UdpDiscoveryBackend backend{config};
    discovery::server::DiscoveryServer server{backend};

    if (!server.start())
    {
        std::cerr << "failed to start discovery listener\n";
        return 1;
    }

    std::cout << "listener running on "
              << config.bind_host
              << ":"
              << config.bind_port
              << "\n";

    auto inbound =
        server.poll();

    if (!inbound.has_value())
    {
        std::cout << "no inbound discovery message available\n";
        server.stop();
        return 0;
    }

    std::cout << "received discovery message from: "
              << inbound->message.from_node_id
              << "\n";

    std::cout << "message type: "
              << discovery::types::to_string(inbound->message.type)
              << "\n";

    std::cout << "source: "
              << inbound->from_host
              << ":"
              << inbound->from_port
              << "\n";

    server.stop();
    return 0;
}
```

## Discovery encoding

Discovery messages must be encoded before they are sent as UDP datagrams.

Encoding flow:

```txt
DiscoveryMessage
  ↓
DiscoveryEncoder
  ↓
datagram bytes
  ↓
UDP backend send
```

Decoding flow:

```txt
datagram bytes
  ↓
DiscoveryDecoder
  ↓
DiscoveryMessage
  ↓
registry or engine
```

Invalid datagrams should fail clearly.

## Discovery codec example

```cpp
#include <iostream>
#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DISCOVERY CODEC EXAMPLE ==\n";

    std::vector<std::uint8_t> payload{'h', 'e', 'l', 'l', 'o'};

    auto message =
        discovery::core::DiscoveryMessage::announce(
            "node-a",
            payload);

    message.to_node_id = "node-b";
    message.correlation_id = "announce-1";

    auto encoded =
        discovery::encoding::DiscoveryEncoder::encode_message(message);

    if (encoded.empty())
    {
        std::cerr << "failed to encode discovery message\n";
        return 1;
    }

    auto decoded =
        discovery::encoding::DiscoveryDecoder::decode_message(encoded);

    if (!decoded.has_value())
    {
        std::cerr << "failed to decode discovery message\n";
        return 1;
    }

    std::cout << "encoded size: "
              << encoded.size()
              << "\n";

    std::cout << "decoded type: "
              << discovery::types::to_string(decoded->type)
              << "\n";

    std::cout << "payload size: "
              << decoded->payload_size()
              << "\n";

    return 0;
}
```

## Datagram roundtrip example

```cpp
#include <iostream>
#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DISCOVERY ROUNDTRIP DEMO ==\n";

    auto message =
        discovery::core::DiscoveryMessage::probe("node-a");

    message.to_node_id = "node-b";
    message.correlation_id = "probe-1";

    auto datagram =
        discovery::encoding::DiscoveryEncoder::make_datagram(
            message,
            "127.0.0.1",
            9400);

    if (!datagram.is_valid())
    {
        std::cerr << "failed to encode datagram\n";
        return 1;
    }

    auto decoded =
        discovery::encoding::DiscoveryDecoder::decode_datagram(datagram);

    if (!decoded.has_value())
    {
        std::cerr << "failed to decode datagram\n";
        return 1;
    }

    std::cout << "decoded type: "
              << discovery::types::to_string(decoded->type)
              << "\n";

    std::cout << "from: "
              << decoded->from_node_id
              << "\n";

    std::cout << "to: "
              << decoded->to_node_id
              << "\n";

    std::cout << "correlation: "
              << decoded->correlation_id
              << "\n";

    return 0;
}
```

## DiscoveryRegistry

`DiscoveryRegistry` tracks peers discovered through announcements, probes, or service updates.

It can track:

- known peers
- available peers
- stale peers
- expired peers
- last seen time
- peer transport address

The registry answers:

- which peers are known?
- which peers are still available?
- which peers are stale?
- which peers should be removed?

## Discovery registry example

```cpp
#include <iostream>
#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DISCOVERY REGISTRY EXAMPLE ==\n";

    discovery::peer::DiscoveryRegistry registry;

    discovery::core::DiscoveryAnnouncement announcement{
        "node-b",
        "127.0.0.1",
        7001};

    registry.upsert_announcement(announcement);

    std::cout << "registry size: "
              << registry.size()
              << "\n";

    std::cout << "available peers: "
              << registry.available_peers().size()
              << "\n";

    registry.mark_stale("node-b");

    std::cout << "stale peers: "
              << registry.stale_peers().size()
              << "\n";

    registry.mark_expired("node-b");

    std::cout << "expired peers: "
              << registry.expired_peers().size()
              << "\n";

    const auto pruned =
        registry.prune_expired();

    std::cout << "pruned peers: "
              << pruned
              << "\n";

    return 0;
}
```

## Peer states

Discovery can track peer states such as:

- available
- stale
- expired

The exact enum values depend on the implementation.

The important idea is:

```txt
peer availability should be visible
```

A peer should not remain available forever if it is no longer seen.

## Stale peers

A stale peer is a peer that has not been seen recently.

Flow:

```txt
peer announced
  ↓
time passes
  ↓
no new announcement
  ↓
peer marked stale
```

A stale peer may still exist, but its availability is uncertain.

## Expired peers

An expired peer is a peer that has not been seen for too long.

Flow:

```txt
peer stale
  ↓
more time passes
  ↓
peer expires
  ↓
registry can prune it
```

This prevents old peers from staying in the registry forever.

## Pruning peers

Pruning removes expired peers from the registry.

Flow:

```txt
registry contains expired peers
  ↓
prune_expired()
  ↓
expired peers removed
  ↓
registry size decreases
```

Pruning should be explicit and observable.

## DiscoveryContext

`DiscoveryContext` wires discovery to transport.

Example:

```cpp
discovery::core::DiscoveryContext discovery_context{
    discovery_config,
    transport_engine};
```

Discovery can expose peers that transport may connect to.

The boundary stays clear:

```txt
Discovery finds.
Transport connects.
```

## DiscoveryEngine

`DiscoveryEngine` composes configuration, backend, registry, and transport integration.

It can:

- start discovery
- stop discovery
- announce now
- probe now
- poll one or many messages
- update registry
- return available transport peers

The exact methods depend on the implementation.

## Discovery engine setup example

```cpp
#include <filesystem>
#include <iostream>
#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>
#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DISCOVERY ENGINE SETUP EXAMPLE ==\n";

    const std::string wal_path = "discovery_engine_setup_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("node-engine");

    sync::core::SyncContext sync_context{store, sync_config};
    sync::engine::SyncEngine sync_engine{sync_context};

    auto transport_config =
        transport::core::TransportConfig::local(7010);

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
            "node-engine",
            9410,
            7010);

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

    discovery_engine.announce_now();
    discovery_engine.probe_now();

    const auto processed =
        discovery_engine.poll_many(4);

    std::cout << "processed discovery messages: "
              << processed
              << "\n";

    std::cout << "available transport peers: "
              << discovery_engine.available_transport_peers().size()
              << "\n";

    discovery_engine.stop();
    transport_engine.stop();
    std::filesystem::remove(wal_path);

    return 0;
}
```

## DiscoveryService

`DiscoveryService` is a higher-level service wrapper.

It can expose a simpler API:

- start
- stop
- announce_now
- probe_now
- poll_many
- peers
- on_peer_found

It is useful when application code wants peer discovery without manually operating lower-level components.

## Discovery service example

```cpp
#include <filesystem>
#include <iostream>
#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>
#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DISCOVERY SERVICE EXAMPLE ==\n";

    const std::string wal_path = "discovery_service_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("node-a");

    sync::core::SyncContext sync_context{store, sync_config};
    sync::engine::SyncEngine sync_engine{sync_context};

    auto transport_config =
        transport::core::TransportConfig::local(7000);

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

    auto options =
        discovery::DiscoveryOptions::local(
            "node-a",
            9400,
            7000);

    discovery::DiscoveryService service{
        options,
        transport_engine};

    service.on_peer_found(
        [](const discovery::Peer &peer)
        {
            std::cout << "peer found: "
                      << peer.node_id
                      << " "
                      << peer.host
                      << ":"
                      << peer.port
                      << "\n";
        });

    if (!service.start())
    {
        std::cerr << "failed to start discovery service\n";
        transport_engine.stop();
        std::filesystem::remove(wal_path);
        return 1;
    }

    service.announce_now();
    service.probe_now();
    service.poll_many(4);

    std::cout << "known peers: "
              << service.peers().size()
              << "\n";

    service.stop();
    transport_engine.stop();
    std::filesystem::remove(wal_path);

    return 0;
}
```

## Peer found callback

A peer found callback lets applications react when discovery sees a peer.

Conceptual flow:

```txt
discovery message received
  ↓
registry updated
  ↓
peer becomes available
  ↓
on_peer_found callback runs
```

Example:

```cpp
service.on_peer_found(
    [](const discovery::Peer &peer)
    {
        std::cout << "peer found: "
                  << peer.node_id
                  << "\n";
    });
```

The callback should stay small.

Connection and sync behavior should still be handled carefully.

## Discovery and transport

Discovery and transport work together.

Discovery produces transport peer information.

Transport uses that information to connect.

Flow:

```txt
discovery announcement received
  ↓
DiscoveryRegistry stores peer
  ↓
available_transport_peers()
  ↓
TransportEngine::connect_peer(peer)
```

Discovery does not own the connection.
Transport does.

## Discovery and sync

Discovery does not send sync operations.

The full flow is:

```txt
Discovery finds peer
  ↓
Transport connects peer
  ↓
Sync produces batch
  ↓
Transport sends batch
```

No peer means sync work may remain queued or pending.

That is normal.

## Discovery and store

Discovery should not write application state.

Wrong:

```txt
Discovery receives peer
  ↓
StoreEngine.put(application data)
```

Better:

```txt
Discovery receives peer
  ↓
DiscoveryRegistry updates peer state
  ↓
Transport may connect later
```

Store is for application state.

Discovery is for peer availability.

## Discovery and WAL

Discovery should not own WAL durability.

WAL records operation history.
Discovery finds peers.

A higher-level diagnostic feature could record discovery events later, but the generic discovery module should not be coupled to WAL.

## Discovery and metadata

Metadata describes nodes.
Discovery finds nodes.

They can work together later.

Example:

```txt
Discovery finds node-b
  ↓
Metadata tells node-b version and capabilities
```

Discovery should not own the metadata service.

Metadata should not own the discovery transport.

They should integrate through clear service boundaries.

## Discovery and CLI

CLI can expose discovery or peer commands.

Correct direction:

```txt
CLI command
  ↓
DiscoveryService
  ↓
DiscoveryRegistry
```

Wrong direction:

```txt
Discovery module
  ↓
CLI formatted output
```

Discovery should return structured peer data.
CLI should format it.

## Discovery and SDK

The SDK wraps discovery behind simpler methods.

C++ SDK:

```cpp
client.start_discovery();
client.discovery_running();
client.peers();
```

JavaScript SDK:

```js
client.startDiscovery();
client.discoveryRunning();
client.peers();
```

The engine discovery module is lower-level.

The SDK makes discovery easier for application developers.

## Local-first behavior

Discovery must not be required for local writes.

Correct behavior:

```txt
discovery disabled
  ↓
store put still works
  ↓
sync work can remain pending
```

Wrong behavior:

```txt
no discovered peers
  ↓
local writes fail
```

Discovery is optional.

## Offline behavior

When offline:

```txt
discovery may find no peers
  ↓
peer list may be empty
  ↓
local store remains usable
  ↓
sync waits for later transport
```

No peers is not a crash.

It is a normal offline state.

## Discovery failure behavior

Discovery can fail for normal reasons:

- port already in use
- invalid host
- socket failure
- permission denied
- invalid datagram
- network unavailable
- no peers found

Each failure should be visible.

Do not hide discovery errors.

## No peers found

No peers found is not automatically an error.

It can simply mean:

- only one node is running
- other nodes are offline
- wrong discovery port
- wrong broadcast target
- network blocks UDP
- peer TTL expired

The local runtime can still operate.

## Port already in use

If discovery cannot bind:

```txt
address already in use
```

Use another port or stop the existing process.

On Linux:

```bash
ss -lunp | grep 9400
```

## Invalid datagram

If a datagram cannot be decoded:

```txt
datagram received
  ↓
decode failed
  ↓
return explicit error or ignore with diagnostics
  ↓
do not register fake peer
```

Invalid discovery data must not become a valid peer.

## Stale registry data

Peers can become stale when they are no longer seen.

The registry should make this visible.

```txt
available peer
  ↓
no refresh
  ↓
stale
  ↓
expired
  ↓
pruned
```

This prevents old peer state from misleading the runtime.

## Discovery API reference

Main areas:

| Area | Purpose |
| --- | --- |
| `core` | Config, context, messages, announcements |
| `backend` | UDP backend |
| `client` | Sends discovery messages |
| `server` | Receives discovery messages |
| `engine` | Composed discovery runtime |
| `service` | Higher-level discovery API |
| `encoding` | Discovery encoding and decoding |
| `peer` | Discovery registry |
| `types` | Message types and peer state |

## Main types

| Type | Purpose |
| --- | --- |
| `DiscoveryOptions` | User-friendly discovery config |
| `DiscoveryConfig` | Runtime discovery config |
| `DiscoveryContext` | Wires discovery to transport |
| `DiscoveryAnnouncement` | Peer announcement data |
| `DiscoveryMessage` | Discovery protocol message |
| `UdpDiscoveryBackend` | UDP backend |
| `DiscoveryClient` | Sends discovery messages |
| `DiscoveryServer` | Receives discovery messages |
| `DiscoveryEngine` | Main discovery runtime |
| `DiscoveryService` | Higher-level service wrapper |
| `DiscoveryRegistry` | Tracks discovered peers |

## Common methods

| Method | Purpose |
| --- | --- |
| `start()` | Start discovery backend, engine, or service |
| `stop()` | Stop discovery |
| `announce_now()` | Send a discovery announcement |
| `probe_now()` | Probe for peers |
| `poll_many(count)` | Process multiple discovery messages |
| `available_transport_peers()` | Return peers that transport can connect to |
| `peers()` | Return known peers from service |
| `on_peer_found(callback)` | Register peer found callback |

Only document a method as stable when it exists in the current public API.

## Examples

Current useful examples include:

- `discovery_minimal.cpp`
- `discovery_codec.cpp`
- `discovery_roundtrip_demo.cpp`
- `discovery_registry.cpp`
- `discovery_announcer.cpp`
- `discovery_listener.cpp`
- `discovery_engine_setup.cpp`
- `discovery_service.cpp`

Recommended order:

1. `discovery_minimal.cpp`
2. `discovery_codec.cpp`
3. `discovery_roundtrip_demo.cpp`
4. `discovery_registry.cpp`
5. `discovery_announcer.cpp`
6. `discovery_listener.cpp`
7. `discovery_engine_setup.cpp`
8. `discovery_service.cpp`

This order moves from configuration and encoding to full service integration.

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

Run the relevant discovery example binary from the build output.

For listener and announcer examples, start the listener first in one terminal, then run the announcer in another terminal.

## Two-terminal example

Terminal 1:

```bash
./path/to/discovery_listener
```

Terminal 2:

```bash
./path/to/discovery_announcer
```

Use the actual binary paths from your build output.

## Testing discovery

Discovery tests should verify:

- valid options
- invalid options
- config conversion
- message encoding
- message decoding
- datagram roundtrip
- registry insert
- registry available peers
- mark stale
- mark expired
- prune expired
- server start failure
- client send failure
- invalid datagram behavior
- service callback behavior

## Good discovery test flow

Options test:

```txt
create local options
validate options
convert to config
expect node id and ports
```

Codec test:

```txt
create discovery message
encode message
decode message
expect same type and ids
```

Registry test:

```txt
insert announcement
expect available peer
mark stale
expect stale peer
mark expired
prune
expect removed peer
```

Invalid datagram test:

```txt
provide invalid bytes
decode datagram
expect failure
registry unchanged
```

Service callback test:

```txt
register callback
simulate peer found
expect callback called
```

## Design rules

The discovery module should follow these rules:

1. Find peers, do not connect them.
2. Do not send sync operations.
3. Do not apply store values.
4. Keep peer states visible.
5. Return explicit failures.
6. Keep datagram decoding strict.
7. Treat no peers as a valid state.
8. Keep transport integration clean.
9. Do not make local writes depend on discovery.
10. Keep examples small and focused.

## Common mistakes

### Making discovery connect peers directly

Wrong:

```txt
DiscoveryEngine connects TCP peer automatically
```

Better:

```txt
DiscoveryEngine returns available peer
TransportEngine connects peer
```

### Treating no peers as fatal

Wrong:

```txt
no peer found
  ↓
runtime failed
```

Better:

```txt
no peer found
  ↓
local runtime continues
```

### Making discovery send sync operations

Wrong:

```txt
DiscoveryMessage carries store operation
```

Better:

```txt
DiscoveryMessage carries peer availability
TransportMessage carries sync payloads
```

### Registering fake peers from invalid datagrams

Wrong:

```txt
decode failed
  ↓
insert peer anyway
```

Better:

```txt
decode failed
  ↓
return error or ignore safely
  ↓
registry unchanged
```

### Making discovery depend on CLI

Wrong:

```txt
DiscoveryRegistry prints formatted table
```

Better:

```txt
DiscoveryRegistry returns peers
CLI formats table
```

### Forgetting peer expiration

Without expiration, old peers can stay available forever.

That makes diagnostics and connection attempts misleading.

## Recommended usage pattern

Create store and sync:

```cpp
store::engine::StoreEngine store{
    store::core::StoreConfig::durable("data/node-a.wal")};

    auto sync_config =
        sync::core::SyncConfig::durable("node-a");

sync::core::SyncContext sync_context{store, sync_config};
sync::engine::SyncEngine sync_engine{sync_context};
```

Create transport:

```cpp
auto transport_config =
    transport::core::TransportConfig::local(7000);

transport::core::TransportContext transport_context{
    transport_config,
    sync_engine};

transport::backend::TcpTransportBackend transport_backend{
    transport_config};

transport::engine::TransportEngine transport_engine{
    transport_context,
    transport_backend};
```

Start transport:

```cpp
if (!transport_engine.start())
{
    return 1;
}
```

Create discovery:

```cpp
auto discovery_options =
    discovery::DiscoveryOptions::local(
        "node-a",
        9400,
        7000);

    discovery::DiscoveryService service{
        discovery_options,
        transport_engine};
```

Register callback:

```cpp
service.on_peer_found(
    [](const discovery::Peer &peer)
    {
        std::cout << "peer found: "
                  << peer.node_id
                  << "\n";
    });
```

Start discovery:

```cpp
if (!service.start())
{
    transport_engine.stop();
    return 1;
}
```

Announce and probe:

```cpp
service.announce_now();
service.probe_now();
service.poll_many(4);
```

Stop:

```cpp
service.stop();
transport_engine.stop();
```

## Summary

`discovery` is the peer discovery module of Softadastra Engine.

It provides:

- `DiscoveryOptions`
- `DiscoveryConfig`
- `DiscoveryContext`
- `DiscoveryAnnouncement`
- `DiscoveryMessage`
- `UdpDiscoveryBackend`
- `DiscoveryClient`
- `DiscoveryServer`
- `DiscoveryEngine`
- `DiscoveryService`
- `DiscoveryRegistry`

The key idea is:

```txt
Discovery makes peers visible without owning communication or synchronization.
```

It does not connect peers directly, send sync operations, apply store values, or make local work depend on the network.

## Next step

Continue with metadata:

[Go to Metadata](./metadata)
