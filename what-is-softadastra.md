# What is Softadastra?

Softadastra is a **local-first and offline-first synchronization foundation** for building applications that keep working under real-world network conditions.

It is designed for systems where the network can fail, devices can restart, peers can disappear, and local work must still remain durable.

Softadastra is not only a storage library. It is a modular runtime made of an engine, a CLI, and SDKs.

## The short version

Softadastra lets an application follow this model:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

The network is useful, but it must not be required for local correctness.

A user should be able to create, update, or remove data locally even when the server is unreachable or no peer is available.

## Why Softadastra exists

Most applications are built around a cloud-first assumption:

```txt
application
  ↓
network
  ↓
server
  ↓
database
```

That model works only when the network is stable and the server is reachable.

But real systems often run under conditions like:

- unstable connectivity
- intermittent internet access
- local networks without reliable cloud access
- edge devices
- mobile devices moving between networks
- offline-first workflows
- peer-to-peer environments
- recovery after crash or restart

Softadastra exists for this reality.

It treats local state as important, durable, and synchronizable.

## The core idea

Softadastra is built around one rule:

> A write accepted locally should not be lost because the network failed.

That means local operations should be:

- accepted locally
- persisted if durability is enabled
- applied to local state
- tracked for synchronization
- retried later if sending fails
- reconciled when peers become available

This makes the local node useful even when disconnected.

## Softadastra is local-first

Local-first means the local node can work without waiting for a remote server.

For example, this should be valid:

```cpp
client.put("profile/name", "Ada");
```

The operation should not require:

- a remote API
- an active peer
- an open socket
- discovery
- cloud availability

The local write happens first. Synchronization is a later step.

## Softadastra is offline-first

Offline-first means offline mode is not treated as an error state.
The application should keep operating locally, then synchronize later.

A network failure should not destroy local work.

```txt
network unavailable
  ↓
write locally
  ↓
persist locally
  ↓
queue for sync
  ↓
retry later
```

This is the foundation of Softadastra.

## Softadastra is durable

Softadastra can use a Write-Ahead Log, also called WAL, to persist operations before they are synchronized.

The durability model is:

```txt
operation
  ↓
WAL append
  ↓
local apply
  ↓
sync tracking
```

The WAL allows valid operations to be replayed after restart or crash.

This is important because synchronization can fail, but accepted local work should remain recoverable.

## Softadastra is synchronizable

Softadastra tracks local operations as sync work.

A local write can update:

- local store
- WAL
- sync outbox
- sync queue

Then a manual tick can move work forward:

```cpp
auto tick = client.tick();
```

This keeps synchronization explicit and observable.

Softadastra avoids hiding too much behavior in background magic. The developer can see the sync state, run ticks, inspect queues, and understand what is happening.

## Softadastra is transport-aware, not transport-dependent

Softadastra separates sync from transport.

```txt
sync       -> decides what should be propagated
transport  -> moves messages between peers
```

This separation matters.

The sync engine does not need to know whether messages are sent through TCP, HTTP, WebSocket, LAN, P2P, or another transport later.

Transport is a delivery layer. Sync owns the meaning of operations.

## Softadastra can discover peers

Softadastra also provides a discovery layer.

- **Discovery** answers: Which peers are available nearby?
- **Transport** answers: How do I connect to this peer?
- **Sync** answers: What should I send to this peer?

So the relationship is:

```txt
Discovery finds peers
  ↓
Transport connects peers
  ↓
Sync sends operations
  ↓
Store applies operations
```

## Softadastra describes nodes

Softadastra includes metadata for local nodes.

Metadata answers:

- Who is this node?
- What version is it running?
- What platform is it on?
- What capabilities does it support?
- How long has it been running?

This is useful for CLI status, dashboards, diagnostics, peer inspection, logs, and runtime monitoring.

## The runtime model

A complete local write flow looks like this:

```txt
Local write
  ↓
Store operation
  ↓
WAL append
  ↓
Store apply
  ↓
Sync operation
  ↓
Outbox
  ↓
Sync queue
  ↓
Transport batch
  ↓
Remote peer
  ↓
Remote apply
  ↓
Ack
  ↓
Retry or complete
```

Each part has a clear responsibility.

## Softadastra engine modules

Softadastra Engine is modular.

```txt
core       -> primitives, Result, Error, IDs, time, config
fs         -> filesystem observation, snapshots, diffs, watchers
wal        -> durable Write-Ahead Log
store      -> WAL-backed local key-value state
sync       -> outbox, queue, ACK tracking, retries, conflicts
transport  -> peer message delivery
discovery  -> local peer discovery
metadata   -> node identity, runtime info, capabilities
cli        -> command-line framework and interaction layer
```

The modules are separated so each layer stays focused.

## Softadastra SDKs

Application developers should not need to manually wire every internal module. That is why Softadastra provides SDKs.

### C++ SDK

The C++ SDK exposes:

```cpp
#include <softadastra/sdk.hpp>

using namespace softadastra::sdk;

Client client{
    ClientOptions::persistent(
        "node-1",
        "data/sdk.wal")};
```

The main public type is `Client`. It gives access to:

- `open`
- `close`
- `put`
- `get`
- `remove`
- `contains`
- `size`
- `sync_state`
- `tick`
- `start_transport`
- `connect`
- `start_discovery`
- `peers`
- `node_info`
- `refresh_node_info`

### JavaScript SDK

The JavaScript SDK exposes the same model for JavaScript applications:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.persistent("node-1", "data/sdk.wal")
);
```

It keeps the same concepts: `Client`, `ClientOptions`, `Value`, `Peer`, `NodeInfo`, `SyncResult`, `TickResult`.

The JavaScript SDK uses camelCase methods and also provides snake_case aliases where useful.

## Softadastra CLI

Softadastra also provides a command-line interface.

The CLI is used to inspect and control local runtime state.

```sh
softadastra status
softadastra node info
softadastra store put name gaspard
softadastra store get name
softadastra sync status
softadastra sync tick
softadastra peers
```

The CLI is the product-level entry point for humans, scripts, local operations, and diagnostics.

## What Softadastra is not

Softadastra is not a traditional cloud database. It is not designed around a model where all correctness depends on a central server.

Softadastra is also not only a key-value store. The store is one part of the system, but the full foundation includes durability, sync tracking, transport, discovery, metadata, CLI, and SDKs.

Softadastra is not distributed consensus. It does not try to replace consensus systems. It focuses on local-first durability, retryable synchronization, peer communication, and deterministic convergence policies.

## The most important distinction

A normal cloud-first application often works like this:

```txt
send request
wait for server
server accepts
local UI updates
```

Softadastra works like this:

```txt
local write
local durability
local state update
sync later
retry if needed
converge eventually
```

This is the mental model.

## When to use Softadastra

Use Softadastra when you need:

- local-first applications
- offline-capable workflows
- durable local writes
- sync after reconnection
- peer-aware systems
- edge or LAN-first applications
- recovery after interruption
- explicit sync state
- SDK-level integration in C++ or JavaScript

Softadastra is especially useful when network failure should not stop local work.

## When not to use Softadastra

Softadastra may not be the right tool if your application is only a simple cloud API client with no local state, no offline requirement, no recovery requirement, and no need for synchronization.

If all correctness must happen only on a central server, Softadastra is probably more foundation than you need.

## Summary

Softadastra is a foundation for reliable local-first software.

It gives you:

- local writes
- optional WAL-backed durability
- local materialized state
- sync tracking
- retries
- transport integration
- peer discovery
- node metadata
- C++ and JavaScript SDKs
- a product-level CLI
- a modular engine

The goal is simple:

> Build software that keeps working when the network does not.

## Next step

Continue with installation:

[Go to Installation](/installation)
