# Offline-first

Offline-first means an application can continue working when the network is unavailable.

In Softadastra, offline mode is not treated as an exceptional state. It is part of the normal runtime model.

A local operation should be able to succeed even when the internet is down, no server is reachable, no peer is connected, discovery has not found any peer, transport is disabled, or synchronization is delayed.

The core rule is:

> Local work must not depend on network availability.

## The problem with network-first systems

Many applications are designed around this flow:

```txt
user action
  ↓
network request
  ↓
server accepts
  ↓
database changes
  ↓
local UI updates
```

This works when the network is stable.

But when the network fails, the application often becomes unusable:

```txt
user action
  ↓
network unavailable
  ↓
request fails
  ↓
work is blocked
```

For many real-world systems, this is not acceptable.

Applications may need to run in places where connectivity is unstable, slow, expensive, or temporarily unavailable.

## The Softadastra model

Softadastra reverses the dependency.

Instead of requiring the network first, it starts locally:

```txt
user action
  ↓
local write
  ↓
local state update
  ↓
sync later
```

The network becomes a synchronization path, not the source of local correctness.

A local write can happen first:

```cpp
client.put("profile/name", "Ada");
```

Then synchronization can happen later:

```cpp
client.tick();
```

This separation is the foundation of offline-first behavior.

## Offline-first does not mean offline-only

Offline-first does not mean the application ignores the network.

It means the application does not collapse when the network is missing.

When the network is available, Softadastra can use it for peer communication, synchronization, acknowledgements, discovery, retries, and convergence.

When the network is unavailable, the local node can still keep working.

```txt
network available
  ↓
sync now

network unavailable
  ↓
write locally
  ↓
sync later
```

## Local writes come first

In Softadastra, a local write should be possible before transport or discovery is running.

For example, this is valid:

```cpp
#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-offline");

    options.enable_transport = false;
    options.enable_discovery = false;
    options.enable_wal = false;

    Client client{options};

    if (client.open().is_err())
    {
        return 1;
    }

    auto written = client.put("note/title", "Offline note");

    client.close();

    return written.is_ok() ? 0 : 1;
}
```

This example does not require a server, a peer, a socket, discovery, transport, or cloud access.

The client can still write locally.

## Offline-first with durability

Offline-first becomes stronger when local writes are durable.

Without durability, a memory-only write can work offline, but it may not survive a restart.

With WAL-backed persistence, accepted operations can be recovered later.

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-offline",
        "data/offline.wal");
```

The flow becomes:

```txt
local write
  ↓
WAL append
  ↓
local store update
  ↓
sync tracking
  ↓
retry later
```

This is important because offline-first systems must handle more than network failure. They must also handle process restarts, crashes, and interrupted execution.

## Offline-first and sync

Offline-first does not remove synchronization. It delays synchronization until it becomes possible.

A local write can create sync work:

```cpp
client.put("message/1", "hello");
```

Then you can inspect the sync state:

```cpp
auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: "
              << state.value().outbox_size
              << "\n";

    std::cout << "queued: "
              << state.value().queued_count
              << "\n";
}
```

And move the sync pipeline forward manually:

```cpp
auto tick = client.tick();
```

This keeps synchronization explicit and observable.

## Why manual ticks matter

Softadastra exposes manual sync ticks because hidden background behavior can make offline systems harder to debug.

A manual tick makes the pipeline clear: retry expired work, collect next batch, prepare transport delivery, prune completed work if requested.

The developer can decide when to tick:

```cpp
while (running)
{
    client.tick(true);

    std::this_thread::sleep_for(
        std::chrono::seconds(1));
}
```

This is useful for tests, embedded applications, CLI tools, deterministic demos, and systems that need strict control over background work.

## Offline-first and transport

Transport is optional.

Transport connects peers and moves sync messages, but it should not be required for local writes.

```txt
local store
  ↓
sync outbox
  ↓
transport, if available
```

If a peer is unavailable, the local operation should remain valid.

```cpp
Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

auto connected = client.connect(peer);

if (connected.is_err())
{
    // Peer is unavailable.
    // Local writes can still continue.
}

client.put("local/key", "still works");
```

The failure to connect is a transport failure, not a local write failure.

## Offline-first and discovery

Discovery is also optional.

Discovery helps find peers, but local work should not depend on discovery.

```txt
discovery finds peers
transport connects peers
sync sends operations
```

If discovery is disabled or no peer is found, the local node can still write and read local data.

```cpp
options.enable_discovery = false;

client.put("profile/name", "Ada");
```

Discovery improves synchronization. It does not define whether the local node can work.

## Offline-first and metadata

Metadata describes the local node.

Even in offline mode, the node can still know its node id, display name, hostname, operating system, version, capabilities, and uptime.

```cpp
auto info = client.refresh_node_info();
```

This is useful for CLI status, local diagnostics, logs, and dashboards.

## What offline-first guarantees

Offline-first design gives these practical guarantees:

- local writes can happen without network
- local reads can happen without network
- sync can happen later
- network failure does not erase local state
- peer failure does not invalidate local work
- transport is optional
- discovery is optional

When WAL is enabled, Softadastra can also provide stronger durability: accepted local operations can be replayed after restart.

## What offline-first does not guarantee

Offline-first does not mean every node instantly has the same data.

When nodes are disconnected, they may temporarily diverge.

```txt
node A writes locally
node B is offline
node B does not see the write yet
```

Convergence happens later, after synchronization.

Offline-first also does not remove the need for conflict handling. If multiple nodes change the same logical data while disconnected, the system needs deterministic conflict rules.

## Offline-first versus cloud-first

Cloud-first means network first, server first, local state after server response.

Offline-first means local first, durability first when enabled, sync after, network as optimization.

The difference is not only technical. It changes the way the application behaves under failure.

In cloud-first systems, failure often blocks work. In offline-first systems, failure delays synchronization, but local work continues.

## The mental model

The most important mental model is: local correctness first, network synchronization second.

Softadastra is designed around that model.

A local write should be treated as real work. The sync system then carries that work to other nodes when possible.

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

## Summary

Offline-first means Softadastra applications can keep working without reliable network access.

The key ideas are:

- offline is normal
- local writes come first
- WAL can make local work durable
- sync happens later
- transport is optional
- discovery is optional
- convergence is eventual
- network failure must not destroy local work

## Next step

Continue with local-first:

[Go to Local-first](/concepts/local-first)
