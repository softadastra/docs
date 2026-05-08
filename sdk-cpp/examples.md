# Examples

This page gives the recommended learning path for the Softadastra C++ SDK examples.

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

## Why examples matter

The C++ SDK is the public developer-facing layer of Softadastra. The examples show how to use the SDK without manually wiring internal engine modules such as store, wal, sync, transport, discovery, and metadata.

Most application developers should start with the examples before reading the engine internals.

## Example list

The current C++ SDK examples are:

- `01_local_store.cpp`
- `02_persistent_store.cpp`
- `03_remove_value.cpp`
- `04_basic_sync.cpp`
- `05_tcp_peer_sync.cpp`
- `06_discovery.cpp`
- `07_node_metadata.cpp`

## Before running examples

```sh
cd ~/softadastra/sdk
mkdir -p data
vix build
```

If you use CMake directly:

```sh
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

After building, example binaries are usually under `build-ninja/examples/`.

If you are not sure where they are:

```sh
find build-ninja -type f -executable
```

## 1. Local Store

File: `examples/01_local_store.cpp`

```sh
./build-ninja/examples/01_local_store
```

This example shows the simplest local-only SDK usage. It teaches `ClientOptions::local`, `Client`, `open`, `put`, `get`, `size`, and `close`.

Expected output style:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

This proves the most important Softadastra rule: local work does not require the network. The example disables transport, discovery, and WAL, so the client works as a simple local memory store.

Code shape:

```cpp
ClientOptions options =
    ClientOptions::local("node-local");

options.enable_transport = false;
options.enable_discovery = false;
options.enable_wal = false;

Client client{options};

client.open();
client.put("app/name", "Softadastra SDK");
client.get("app/name");
client.close();
```

## 2. Persistent Store

File: `examples/02_persistent_store.cpp`

```sh
./build-ninja/examples/02_persistent_store
```

This example shows WAL-backed local persistence. It teaches `enable_wal`, `wal_path`, `auto_flush`, persistent local writes, and sync state after write.

Expected output style:

```txt
key          : settings/theme
value        : dark
wal path     : data/sdk-persistent-store.wal
store size   : 1
outbox size  : 1
```

The model is:

```txt
put
  ↓
WAL append
  ↓
store apply
  ↓
sync tracking
```

Persistent local state does not require transport or discovery.

Code shape:

```cpp
ClientOptions options =
    ClientOptions::local("node-persistent");

options.enable_transport = false;
options.enable_discovery = false;

options.enable_wal = true;
options.wal_path = "data/sdk-persistent-store.wal";
options.auto_flush = true;
```

Before running, make sure the directory exists:

```sh
mkdir -p data
```

## 3. Remove Value

File: `examples/03_remove_value.cpp`

```sh
./build-ninja/examples/03_remove_value
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

```cpp
client.put("cache/session", "temporary-data");

std::cout << client.contains("cache/session") << "\n";

client.remove("cache/session");

auto value = client.get("cache/session");

if (value.is_err())
{
    std::cout << value.error().code_string() << "\n";
}
```

## 4. Basic Sync

File: `examples/04_basic_sync.cpp`

```sh
./build-ninja/examples/04_basic_sync
```

This example shows manual sync state and sync ticks. It teaches `sync_state`, `outbox_size`, `queued_count`, `failed_count`, `tick`, `retried_count`, `pruned_count`, and `batch_size`.

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

after tick
  outbox : 1
  queued : 1
  failed : 0
```

Code shape:

```cpp
client.put("profile/name", "Softadastra");

auto before = client.sync_state();

auto tick = client.tick();

auto after = client.sync_state();
```

This example disables transport and discovery, so sync is shown without network delivery.

## 5. TCP Peer Sync

File: `examples/05_tcp_peer_sync.cpp`

```sh
./build-ninja/examples/05_tcp_peer_sync
```

This example enables transport and tries to connect to a peer. It teaches `enable_transport`, `transport_host`, `transport_port`, `start_transport`, `Peer`, `connect`, `transport_running`, and tick with transport enabled.

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

This proves that transport failure should not break local-first behavior. A peer can be unavailable, but local writes can still work.

Code shape:

```cpp
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

client.open();
client.start_transport();

Peer peer{"node-tcp-b", "127.0.0.1", 4042};
client.connect(peer);

client.put("sync/message", "hello from node-tcp-a");
client.tick();
```

## 6. Discovery

File: `examples/06_discovery.cpp`

```sh
./build-ninja/examples/06_discovery
```

This example enables discovery and lists known peers. It teaches `enable_discovery`, `discovery_host`, `discovery_port`, `discovery_broadcast_host`, `discovery_broadcast_port`, `start_discovery`, `discovery_running`, and `peers`.

Expected output style:

```txt
discovery
  running : yes
  bind    : 127.0.0.1:5051
  target  : 127.0.0.1:5052

peers
  no peer discovered yet
```

This proves that discovery can run even when no peer is discovered yet. No peers is a valid local development state.

Code shape:

```cpp
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;

client.open();
client.start_discovery();

auto peers = client.peers();
```

## 7. Node Metadata

File: `examples/07_node_metadata.cpp`

```sh
./build-ninja/examples/07_node_metadata
```

This example reads local node metadata. It teaches `display_name`, `version`, `refresh_node_info`, `NodeInfo`, `node_id`, `hostname`, `os_name`, `uptime_ms`, and `capabilities`.

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

```cpp
ClientOptions options =
    ClientOptions::local("node-metadata");

options.display_name = "Softadastra SDK Node";
options.version = "0.1.0";

Client client{options};

client.open();

auto node = client.refresh_node_info();

client.close();
```

## Full recommended run order

```sh
cd ~/softadastra/sdk
mkdir -p data
vix build

./build-ninja/examples/01_local_store
./build-ninja/examples/02_persistent_store
./build-ninja/examples/03_remove_value
./build-ninja/examples/04_basic_sync
./build-ninja/examples/05_tcp_peer_sync
./build-ninja/examples/06_discovery
./build-ninja/examples/07_node_metadata
```

## What each example adds

| Example | New idea |
|---|---|
| `01_local_store.cpp` | Local memory store |
| `02_persistent_store.cpp` | WAL-backed local persistence |
| `03_remove_value.cpp` | Remove and missing-key behavior |
| `04_basic_sync.cpp` | Sync state and manual tick |
| `05_tcp_peer_sync.cpp` | Transport and peer connection |
| `06_discovery.cpp` | Peer discovery and peer list |
| `07_node_metadata.cpp` | Local node metadata |

## Learning path

The learning path is progressive:

1. Can I write locally?
2. Can I persist locally?
3. Can I remove locally?
4. Can I observe sync work?
5. Can I start transport?
6. Can I discover peers?
7. Can I inspect node metadata?

This order matters because each step builds on the previous one.

## Error handling in examples

Every example should check results.

```cpp
// good
auto result = client.open();

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

// avoid
auto value = client.get("app/name").value();
```

## Expected normal failures

### Peer connection failure

`05_tcp_peer_sync.cpp` may print `peer connection failed`. This is normal if no peer is running on the target port. The example should still show that local writes and sync ticks continue.

### No discovered peers

`06_discovery.cpp` may print `no peer discovered yet`. This is normal if only one node is running.

### Missing key after remove

`03_remove_value.cpp` should show `not_found`. This is expected after removing a key.

## Troubleshooting

### Example binary not found

```sh
find build-ninja -type f -executable
```

### WAL path failed

```sh
mkdir -p data
```

### Transport port already in use

```sh
ss -ltnp | grep 4041
```

Use another port if needed.

### Discovery port already in use

```sh
ss -lunp | grep 5051
```

### No peer discovered

Check: is another node running, are discovery ports different, does node A target node B's discovery port, and does node B target node A's discovery port?

## How examples map to documentation

| Example | Documentation |
|---|---|
| `01_local_store.cpp` | [Local Store](/sdk-cpp/local-store) |
| `02_persistent_store.cpp` | [Persistent Store](/sdk-cpp/persistent-store) |
| `03_remove_value.cpp` | [Local Store](/sdk-cpp/local-store) |
| `04_basic_sync.cpp` | [Sync](/sdk-cpp/sync) |
| `05_tcp_peer_sync.cpp` | [Transport](/sdk-cpp/transport) |
| `06_discovery.cpp` | [Discovery](/sdk-cpp/discovery) |
| `07_node_metadata.cpp` | [Metadata](/sdk-cpp/metadata) |

## Minimal example template

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-example");

    Client client{options};

    auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().message() << "\n";
        return 1;
    }

    // example logic here

    client.close();

    return 0;
}
```

## Summary

The C++ SDK examples are the fastest way to understand Softadastra from an application developer point of view.

Read them in this order: Local Store, Persistent Store, Remove Value, Basic Sync, TCP Peer Sync, Discovery, Node Metadata.

The key idea is: start local, add durability, observe sync, then add peers.

## Next step

Continue with the JavaScript SDK:

[Go to SDK JS](/sdk-js/)
