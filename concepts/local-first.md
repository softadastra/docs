# Local-first

Local-first means the local node is a real place where work can happen.

In Softadastra, the local node is not only a temporary cache for remote data. It can accept writes, serve reads, track changes, persist operations, and synchronize later.

The core rule is:

> Local state is real state.

## Local-first versus cache-first

A cache is usually secondary.

In a cache-first system, the local copy often depends on a remote source of truth:

```txt
server database
  ↓
local cache
  ↓
application reads
```

If the cache is invalidated, missing, or expired, the application usually needs the server again.

Softadastra uses a different model:

```txt
local node
  ↓
local store
  ↓
sync later
```

The local node can accept useful work even before synchronization.

## The local node

A Softadastra node can have local identity, a local store, a local WAL, a sync outbox, a sync queue, transport state, discovery state, and metadata.

Not every application needs all of these layers.

For example, a simple memory-only client may only need a `Client`, a local store, and metadata.

A durable offline-first client may use a `Client`, store, WAL, sync, and metadata.

A peer-aware client may also add transport and discovery.

## Local writes

A local write is the first step in the Softadastra model.

```cpp
client.put("profile/name", "Ada");
```

This operation should be able to update local state without waiting for a server response, a remote database, a connected peer, discovery, transport, or cloud availability.

That is the difference between local-first and network-first.

## Local reads

Local-first also means reads can happen locally.

```cpp
auto result = client.get("profile/name");

if (result.is_ok())
{
    std::cout << result.value().to_string() << "\n";
}
```

The application does not need to ask a server for every read.

If the local state contains the value, the application can use it immediately.

## Local state is materialized

Softadastra keeps local state in a materialized store.

At the SDK level, this appears as simple methods:

```cpp
client.put("key", "value");
client.get("key");
client.remove("key");
client.contains("key");
client.size();
```

Internally, the engine can use the store module to maintain current state.

The store turns operations into readable local state:

```txt
operation history
  ↓
materialized local state
```

This matters because the WAL is a history of operations, but applications usually need the current value.

## Local-first with memory-only state

The simplest local-first setup is memory-only.

```cpp
#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("node-memory")};

    if (client.open().is_err())
    {
        return 1;
    }

    client.put("session/value", "temporary");

    auto value = client.get("session/value");

    client.close();

    return value.is_ok() ? 0 : 1;
}
```

This is useful for tests, demos, temporary local state, examples, and applications that do not need persistence.

Memory-only state is local-first, but not durable after process restart.

## Local-first with persistence

For durable local-first behavior, use WAL-backed persistence.

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/app.wal");
```

With persistence enabled, a local write can be recorded before the application depends on it later.

```txt
local write
  ↓
WAL append
  ↓
store apply
  ↓
sync tracking
```

This means local work can survive restart when the WAL is enabled and recovery is supported.

## Local-first with sync

Local-first does not mean each node stays isolated.

It means each node can work independently first, then synchronize later.

A write can be local and synchronizable:

```cpp
client.put("note/1", "hello");
```

Then the sync state can show pending work:

```cpp
auto state = client.sync_state();

if (state.is_ok() && state.value().has_work())
{
    client.tick();
}
```

The local write is valid before sync completes. Sync is the propagation phase.

## Why local-first improves reliability

Network-first systems often fail at the point of user action.

```txt
user action
  ↓
network request fails
  ↓
action fails
```

Local-first systems keep the action local:

```txt
user action
  ↓
local write succeeds
  ↓
sync later
```

That makes applications more resilient under intermittent connectivity, mobile networks, local edge environments, remote locations, unreliable infrastructure, and temporary peer failures.

## Local-first and conflicts

Local-first systems can create conflicts.

For example, node A updates `doc:1` while offline, node B updates `doc:1` while offline, and both reconnect later.

Softadastra treats this as a synchronization problem, not a reason to block local work.

The sync engine can use conflict policies to decide what happens when remote operations meet local state. Examples of policies include `LastWriteWins`, `KeepLocal`, `KeepRemote`, and `Manual`.

The important point is that local-first accepts local work first, then resolves conflicts deterministically later.

## Local-first and metadata

Every local node needs identity.

Metadata gives the local node a description: node id, display name, hostname, operating system, version, uptime, and capabilities.

At the SDK level:

```cpp
auto info = client.refresh_node_info();

if (info.is_ok())
{
    std::cout << info.value().node_id << "\n";
}
```

This makes local nodes observable, even before they connect to any peer.

## Local-first and discovery

Discovery helps local nodes find other nodes nearby.

But discovery is not required for local work.

```txt
local write
  ↓
sync later if peers are found
```

Discovery answers which peers are available. It does not decide whether the local store can accept writes.

## Local-first and transport

Transport connects peers and moves messages.

But transport is also optional for local work.

If transport fails, local work should still be valid.

```cpp
auto connected = client.connect(peer);

if (connected.is_err())
{
    client.put("draft/1", "still local");
}
```

The connection failure is a delivery problem, not a local state problem.

## The SDK view

The SDK presents local-first behavior through one main object: `Client`.

A typical local-first flow is:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");

Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

client.put("profile/name", "Ada");

auto value = client.get("profile/name");

auto state = client.sync_state();

auto tick = client.tick();

client.close();
```

The API is small, but the model is clear: write locally, read locally, sync later.

## The engine view

Inside the engine, local-first behavior is split across modules.

```txt
core       -> shared primitives
wal        -> durable operation log
store      -> current local state
sync       -> operation tracking and propagation
transport  -> optional message delivery
discovery  -> optional peer discovery
metadata   -> local node description
```

The separation keeps the local-first model understandable.

## What local-first guarantees

Local-first design gives these practical guarantees:

- local writes can happen before sync
- local reads can happen without a server
- the local node can remain useful offline
- synchronization can happen later
- transport is optional
- discovery is optional
- metadata can describe the local node
- persistence can make local work recoverable

## What local-first does not guarantee

Local-first does not mean every node instantly has the same state.

If nodes are disconnected, they may temporarily diverge.

Local-first also does not remove the need for conflict handling. It means local work is allowed first, then synchronization and convergence happen later.

## The mental model

The best way to understand local-first in Softadastra is:

> The local node is not a cache. The local node is a participant.

A local node can accept work, keep state, track sync, and later exchange operations with other nodes.

## Summary

Local-first means:

- local state is real state
- local writes are valid work
- local reads do not require a server
- WAL can make local work durable
- sync moves local work later
- transport and discovery are optional
- convergence happens after synchronization

## Next step

Continue with the failure model:

[Go to Failure Model](/concepts/failure-model)
