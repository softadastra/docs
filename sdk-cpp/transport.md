# Transport

Transport is the part of the Softadastra C++ SDK that allows a local node to connect to peers.

The core rule is:

> Sync decides what should be sent. Transport sends it.

Transport is optional. A Softadastra client can still write, read, persist, and track sync work without transport.

## Why transport exists

Softadastra is local-first. A local write can happen without any peer:

```cpp
client.put("message/1", "hello");
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

Transport does not own the meaning of the operation. It only moves messages.

## Transport is not sync

```txt
Sync       -> operation propagation logic
Transport  -> message delivery
```

This separation keeps the system flexible. A future Softadastra runtime can use different transport layers while keeping the same sync model.

## Transport is optional

Disabling transport:

```cpp
options.enable_transport = false;
```

The client can still `open`, `put`, `get`, `remove`, `sync_state`, `tick`, `refresh_node_info`, and `close`.

## Basic transport configuration

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

## Basic transport example

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-tcp-a");

    options.enable_wal = true;
    options.wal_path = "data/sdk-tcp-peer-sync.wal";
    options.auto_flush = true;

    options.enable_transport = true;
    options.transport_host = "127.0.0.1";
    options.transport_port = 4041;

    options.enable_discovery = false;

    Client client{options};

    auto open_result = client.open();

    if (open_result.is_err())
    {
        std::cerr << "failed to open client: "
                  << open_result.error().message()
                  << "\n";

        return 1;
    }

    auto transport_result = client.start_transport();

    if (transport_result.is_err())
    {
        std::cerr << "failed to start transport: "
                  << transport_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    Peer peer{
        "node-tcp-b",
        "127.0.0.1",
        4042};

    auto connect_result = client.connect(peer);

    if (connect_result.is_err())
    {
        std::cout << "peer connection failed\n";
        std::cout << "  peer    : "
                  << peer.node_id
                  << "\n";
        std::cout << "  address : "
                  << peer.host << ":" << peer.port
                  << "\n";
        std::cout << "  error   : "
                  << connect_result.error().message()
                  << "\n";
    }
    else
    {
        std::cout << "connected to peer: "
                  << peer.node_id
                  << "\n";
    }

    auto put_result = client.put(
        "sync/message",
        "hello from node-tcp-a");

    if (put_result.is_err())
    {
        std::cerr << "failed to submit sync value: "
                  << put_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto tick_result = client.tick();

    if (tick_result.is_ok())
    {
        std::cout << "\nsync tick\n";
        std::cout << "  retried : "
                  << tick_result.value().retried_count << "\n";
        std::cout << "  pruned  : "
                  << tick_result.value().pruned_count << "\n";
        std::cout << "  batch   : "
                  << tick_result.value().batch_size << "\n";
    }

    std::cout << "\ntransport\n";
    std::cout << "  running : "
              << (client.transport_running() ? "yes" : "no")
              << "\n";

    client.close();

    return 0;
}
```

If no peer is running on `127.0.0.1:4042`, the connection can fail cleanly. Local writes and sync ticks continue regardless.

## Start transport

After opening the client:

```cpp
auto result = client.start_transport();

if (result.is_err())
{
    std::cerr << "failed to start transport: "
              << result.error().message()
              << "\n";

    return 1;
}
```

## Check transport status

```cpp
if (client.transport_running())
{
    std::cout << "transport is running\n";
}
```

## Stop transport

If exposed:

```cpp
client.stop_transport();
```

If not yet exposed, `client.close()` should clean up transport resources.

## Peer

A peer describes another node.

```cpp
Peer peer{
    "node-tcp-b",
    "127.0.0.1",
    4042};
```

## Connect to a peer

```cpp
auto result = client.connect(peer);

if (result.is_err())
{
    std::cout << "peer connection failed: "
              << result.error().message()
              << "\n";
}
```

A failed connection should not make the local store unusable:

```cpp
client.put("draft/1", "still local");
```

## Transport and local writes

Transport is not required for local writes. Even if `client.connect(peer)` fails, `client.put()` should still work.

## Transport and sync tick

A local write creates sync work. A tick can produce a batch. Transport sends the batch to a peer when available.

```txt
local write
  ↓
sync outbox
  ↓
tick
  ↓
batch
  ↓
transport sends if peer is available
```

## Transport port configuration

Each local node needs a different transport port.

```cpp
// Node A
options.transport_port = 4041;

// Node B
options.transport_port = 4042;
```

## Two-node local shape

```txt
node-a
  transport: 127.0.0.1:4041
  WAL: data/node-a.wal

node-b
  transport: 127.0.0.1:4042
  WAL: data/node-b.wal
```

## Transport API reference

| Method | Purpose |
|---|---|
| `start_transport()` | Start the local transport layer |
| `stop_transport()` | Stop transport, if exposed |
| `transport_running()` | Check whether transport is running |
| `connect(peer)` | Connect to a peer |

### Transport option reference

| Option | Purpose |
|---|---|
| `enable_transport` | Enable transport support |
| `transport_host` | Local bind host |
| `transport_port` | Local bind port |

### Peer reference

| Field | Purpose |
|---|---|
| `node_id` | Remote node id |
| `host` | Remote host |
| `port` | Remote transport port |

## Common issues

### Port already in use

```sh
ss -ltnp | grep 4041
```

Use another port:

```cpp
options.transport_port = 4043;
```

### Transport disabled

If you call `start_transport()` but `enable_transport = false`, the SDK should return a clear error.

### Peer not running

This is common in local tests. The connection should fail cleanly. Local writes can continue.

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

This guide corresponds to `examples/05_tcp_peer_sync.cpp`.

```sh
cd ~/softadastra/sdk
vix build
mkdir -p data
./build-ninja/examples/05_tcp_peer_sync
```

If no peer is listening on `127.0.0.1:4042`, you may see a clean connection failure. That is acceptable.

## Summary

Transport is the peer communication layer of the C++ SDK.

It gives you `start_transport`, `transport_running`, `connect(peer)`, and optional `stop_transport`.

The key idea is: transport sends messages, sync decides what messages mean, and store remains local-first.

A transport failure should delay synchronization, not destroy local work.

## Next step

Continue with discovery:

[Go to Discovery](/sdk-cpp/discovery)
