# Concepts

Softadastra is built around a simple idea:

> Local work must remain valid even when the network fails.

The concepts in this section explain the mental model behind Softadastra before you use the CLI, SDKs, or engine internals.

Softadastra is not just a key-value store. It is a local-first synchronization foundation built around durable local writes, explicit sync tracking, retryable delivery, peer discovery, and deterministic convergence.

## The core model

Softadastra follows this flow:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

This means a local operation should not depend on a server, cloud API, open socket, or discovered peer.

The local node should stay useful first. Synchronization happens after.

## Why concepts matter

Softadastra separates responsibilities carefully.

```txt
store      -> local state
wal        -> durable operation history
sync       -> operation propagation
transport  -> message delivery
discovery  -> peer discovery
metadata   -> node description
```

This separation keeps the system understandable.

For example:

- Sync decides what should be sent.
- Transport decides how bytes are delivered.
- Discovery decides which peers exist nearby.
- Metadata describes what each node is.

Each concept builds on the previous one.

## Concept map

```txt
Offline-first
  ↓
Local-first
  ↓
Failure model
  ↓
Write-Ahead Log
  ↓
Outbox
  ↓
Sync engine
  ↓
Convergence
```

This is the order you should read the section.

## 1. Offline-first

Offline-first means offline mode is not a special failure state.

The application should still accept local work when the internet is unavailable, the remote server cannot be reached, no peer is connected, discovery has not found any node yet, transport is disabled, or synchronization is delayed.

A local write should still be possible:

```cpp
client.put("profile/name", "Ada");
```

[Read: Offline-first](/concepts/offline-first)

## 2. Local-first

Local-first means the local node is a real source of work, not just a temporary cache.

The local node can accept writes, store local state, expose reads, track operations for later sync, and recover after restart when durability is enabled.

Local-first is the foundation that makes offline-first behavior useful.

[Read: Local-first](/concepts/local-first)

## 3. Failure model

Softadastra is designed around real failures.

It assumes network requests can fail, peers can disappear, acknowledgements can arrive late, processes can restart, sync can be interrupted, and local state must remain recoverable.

The system is designed so a failed network operation does not destroy a valid local operation.

[Read: Failure Model](/concepts/failure-model)

## 4. Write-Ahead Log

The Write-Ahead Log, or WAL, is the durability layer.

Its rule is:

> Write first. Apply later.

When WAL is enabled, an operation is persisted before the system relies on it for recovery or synchronization.

```txt
operation
  ↓
WAL append
  ↓
local apply
  ↓
sync tracking
```

[Read: Write-Ahead Log](/concepts/wal)

## 5. Outbox

The outbox stores operations waiting to be synchronized.

A local write can be accepted even when no peer is reachable. The sync operation remains tracked until it can be sent, retried, acknowledged, or completed.

```txt
local operation
  ↓
outbox
  ↓
queue
  ↓
transport batch
```

[Read: Outbox](/concepts/outbox)

## 6. Sync engine

The sync engine coordinates propagation.

It does not own network sockets. Instead, it prepares operations for delivery and receives remote operations from the transport layer.

It handles local operation submission, sync metadata, outbox tracking, deterministic queueing, acknowledgements, retries, remote operation application, and conflict policies.

[Read: Sync Engine](/concepts/sync-engine)

## 7. Convergence

Convergence is the goal of synchronization.

After nodes reconnect and exchange operations, they should move toward a coherent state according to deterministic rules.

Softadastra does not require the network for local correctness, but when synchronization succeeds, nodes should eventually agree according to the selected conflict policy.

[Read: Convergence](/concepts/convergence)

## How the concepts connect to the SDK

The SDK hides most internals, but the concepts still appear through the public API.

```cpp
client.put("key", "value");      // local write
client.sync_state();             // inspect tracked sync work
client.tick();                   // move sync forward
client.start_transport();        // enable delivery
client.start_discovery();        // find peers
client.refresh_node_info();      // inspect metadata
```

In JavaScript, the same ideas appear as:

```js
await client.put("key", "value");
const state = await client.syncStateInfo();
const tick = await client.tick();
await client.startTransport();
await client.startDiscovery();
const info = await client.refreshNodeInfo();
```

The API is small, but the mental model remains the same: local first, durable when needed, sync later, retry safely, converge eventually.

## How the concepts connect to the engine

The engine implements the same ideas as separate modules.

```txt
core       -> shared primitives
fs         -> filesystem observation
wal        -> durable record history
store      -> local materialized state
sync       -> operation propagation
transport  -> message delivery
discovery  -> peer discovery
metadata   -> node description
cli        -> interaction layer
```

Each module has a narrow responsibility.

This is important because Softadastra is designed to be extended without turning into one large hidden system.

## What to read next

Read the concepts in this order:

1. [Offline-first](/concepts/offline-first)
2. [Local-first](/concepts/local-first)
3. [Failure Model](/concepts/failure-model)
4. [Write-Ahead Log](/concepts/wal)
5. [Outbox](/concepts/outbox)
6. [Sync Engine](/concepts/sync-engine)
7. [Convergence](/concepts/convergence)

After that, continue with:

- [CLI](/cli/)
- [SDK C++](/sdk-cpp/)
- [SDK JS](/sdk-js/)
- [Engine](/engine/)
