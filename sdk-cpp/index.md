# SDK C++

The Softadastra C++ SDK is the official C++ developer interface for Softadastra.

It provides a small public API over the Softadastra engine, so C++ applications can use local-first storage, WAL-backed persistence, sync tracking, transport, discovery, and node metadata without manually wiring the internal modules.

The main entry point is:

```cpp
#include <softadastra/sdk.hpp>
```

The main public type is:

```cpp
softadastra::sdk::Client
```

## What the C++ SDK is for

Use the C++ SDK when you want to embed Softadastra into a native C++ application.

The SDK is designed for local-first applications, offline-first applications, WAL-backed local persistence, manual sync ticks, peer-aware applications, local node metadata, native tools, edge systems, desktop applications, and runtime services.

Instead of directly using low-level engine modules like `store`, `sync`, `transport`, `discovery`, and `metadata`, most applications should start with the SDK.

## The core model

The SDK follows the same Softadastra model:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

A local write should not require a server or peer:

```cpp
client.put("profile/name", "Ada");
```

Synchronization can happen later:

```cpp
client.tick();
```

## Minimal example

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-local");

    options.enable_transport = false;
    options.enable_discovery = false;
    options.enable_wal = false;

    Client client{options};

    auto open_result = client.open();

    if (open_result.is_err())
    {
        std::cerr << "failed to open client: "
                  << open_result.error().message()
                  << "\n";

        return 1;
    }

    auto put_result = client.put(
        "app/name",
        "Softadastra SDK");

    if (put_result.is_err())
    {
        std::cerr << "failed to store value: "
                  << put_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto value_result = client.get("app/name");

    if (value_result.is_err())
    {
        std::cerr << "failed to read value: "
                  << value_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    std::cout << "key   : app/name\n";
    std::cout << "value : "
              << value_result.value().to_string()
              << "\n";

    std::cout << "size  : "
              << client.size()
              << "\n";

    client.close();

    return 0;
}
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Main public types

The C++ SDK exposes these main types: `Client`, `ClientOptions`, `Key`, `Value`, `Peer`, `NodeInfo`, `Result`, `Error`, `SyncResult`, and `TickResult`.

These types are designed to be stable and developer-facing.

## Client

`Client` is the main object. It owns the SDK runtime from the application point of view.

Common operations:

```cpp
client.open();
client.close();

client.put("key", "value");
client.get("key");
client.remove("key");

client.contains("key");
client.size();
client.empty();

client.sync_state();
client.tick();

client.start_transport();
client.connect(peer);

client.start_discovery();
client.peers();

client.refresh_node_info();
```

## ClientOptions

`ClientOptions` configures the SDK.

Example:

```cpp
ClientOptions options =
    ClientOptions::local("node-a");

options.enable_wal = true;
options.wal_path = "data/node-a.wal";
options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

options.enable_discovery = false;
```

## Local store

The simplest SDK usage is local storage.

```cpp
client.put("settings/theme", "dark");

auto value = client.get("settings/theme");

if (value.is_ok())
{
    std::cout << value.value().to_string() << "\n";
}
```

Local store operations include `put`, `get`, `remove`, `contains`, `size`, and `empty`. The local store does not require transport, discovery, or peers.

## Persistent store

For WAL-backed local persistence, enable WAL:

```cpp
ClientOptions options =
    ClientOptions::local("node-persistent");

options.enable_wal = true;
options.wal_path = "data/sdk-store.wal";
options.auto_flush = true;
```

Or use the persistent helper:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/sdk-store.wal");
```

With persistence enabled, local operations can survive restart when the WAL is replayed by the runtime.

## Sync

The SDK exposes sync state and manual sync ticks.

```cpp
auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox : "
              << state.value().outbox_size
              << "\n";

    std::cout << "queued : "
              << state.value().queued_count
              << "\n";

    std::cout << "failed : "
              << state.value().failed_count
              << "\n";
}
```

Run one tick:

```cpp
auto tick = client.tick();

if (tick.is_ok())
{
    std::cout << "retried : "
              << tick.value().retried_count
              << "\n";

    std::cout << "pruned  : "
              << tick.value().pruned_count
              << "\n";

    std::cout << "batch   : "
              << tick.value().batch_size
              << "\n";
}
```

## Transport

Transport lets the client connect to peers.

```cpp
ClientOptions options =
    ClientOptions::local("node-a");

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

Client client{options};

client.open();
client.start_transport();

Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

auto connected = client.connect(peer);
```

Transport is optional. If a peer is unavailable, local writes should still work.

## Discovery

Discovery lets the client discover peers.

```cpp
ClientOptions options =
    ClientOptions::local("node-discovery-a");

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
```

Start discovery and list peers:

```cpp
client.start_discovery();

auto peers = client.peers();

if (peers.is_ok())
{
    for (const auto &peer : peers.value())
    {
        std::cout << peer.node_id << " "
                  << peer.host << ":"
                  << peer.port << "\n";
    }
}
```

The model is: discovery finds peers, transport connects peers, sync sends operations.

## Metadata

The SDK exposes local node metadata.

```cpp
auto node_result = client.refresh_node_info();

if (node_result.is_ok())
{
    const auto &node = node_result.value();

    std::cout << "node id      : " << node.node_id << "\n";
    std::cout << "display name : " << node.display_name << "\n";
    std::cout << "hostname     : " << node.hostname << "\n";
    std::cout << "os           : " << node.os_name << "\n";
    std::cout << "version      : " << node.version << "\n";
}
```

## Error handling

The SDK uses explicit result values.

```cpp
auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";
```

Do not assume an operation succeeded without checking the result.

## SDK versus engine

The SDK is the public C++ interface. The engine is the internal runtime foundation.

```txt
SDK C++
  ↓
Client
  ↓
store
sync
transport
discovery
metadata
WAL
core
```

Application developers usually start with `#include <softadastra/sdk.hpp>`. Engine contributors may work directly with internal headers.

## Example files

The C++ SDK examples are organized as a progressive path:

1. `01_local_store.cpp`
2. `02_persistent_store.cpp`
3. `03_remove_value.cpp`
4. `04_basic_sync.cpp`
5. `05_tcp_peer_sync.cpp`
6. `06_discovery.cpp`
7. `07_node_metadata.cpp`

Run examples from the SDK repository:

```sh
cd ~/softadastra/sdk
vix build

./build-ninja/examples/01_local_store
./build-ninja/examples/02_persistent_store
./build-ninja/examples/03_remove_value
./build-ninja/examples/04_basic_sync
./build-ninja/examples/05_tcp_peer_sync
./build-ninja/examples/06_discovery
./build-ninja/examples/07_node_metadata
```

## Documentation structure

The C++ SDK documentation is organized as:

1. [Overview](/sdk-cpp/)
2. [Installation](/sdk-cpp/installation)
3. [First App](/sdk-cpp/first-app)
4. [Client](/sdk-cpp/client)
5. [Client Options](/sdk-cpp/client-options)
6. [Local Store](/sdk-cpp/local-store)
7. [Persistent Store](/sdk-cpp/persistent-store)
8. [Sync](/sdk-cpp/sync)
9. [Transport](/sdk-cpp/transport)
10. [Discovery](/sdk-cpp/discovery)
11. [Metadata](/sdk-cpp/metadata)
12. [Errors](/sdk-cpp/errors)
13. [Examples](/sdk-cpp/examples)

Read it in that order if you are new to the SDK.

## When to use the C++ SDK

Use the SDK when you want a stable public C++ API, simple local storage, WAL-backed local persistence, manual sync ticks, optional transport, optional discovery, node metadata, clean error handling, and less manual engine wiring.

## When to use engine modules directly

Use the engine modules directly when you are developing Softadastra internals, building a custom runtime, testing a specific module, implementing a new transport, working on discovery internals, or debugging WAL or sync behavior deeply.

For normal applications, start with the SDK.

## Summary

The Softadastra C++ SDK is the recommended C++ interface for application developers.

It gives you `Client`, `ClientOptions`, local store, persistent store, sync state, manual ticks, transport, discovery, metadata, and explicit errors.

The key idea is: use `Client` first. Go to engine modules only when you need internals.

## Next step

Install the C++ SDK:

[Go to SDK C++ Installation](/sdk-cpp/installation)
