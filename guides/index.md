# Guides

The guides section shows how to use Softadastra in practical workflows.

Concepts explain the model. SDK pages explain the APIs. Engine pages explain the internals. Guides connect everything into real usage.

The goal is to help you build, run, persist, synchronize, and prepare Softadastra-based applications step by step.

## What the guides are for

Use the guides when you want to move from isolated documentation pages to complete workflows.

The guides answer practical questions:

```txt
How do I build an offline-first app?
How do I run a local node?
How do I persist data locally?
How do I sync between nodes?
How do I use the C++ SDK with the engine?
How do I use the JavaScript SDK with the engine?
How do I prepare for production?
```

Each guide focuses on one workflow and keeps the same Softadastra model:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

## Recommended reading order

Read the guides in this order:

1. [Build an Offline-first App](./build-offline-first-app.md)
2. [Run a Local Node](./run-local-node.md)
3. [Persist Data Locally](./persist-data-locally.md)
4. [Sync Between Nodes](./sync-between-nodes.md)
5. [Use the C++ SDK with the Engine](./use-cpp-sdk-with-engine.md)
6. [Use the JavaScript SDK with the Engine](./use-js-sdk-with-engine.md)
7. [Production](./production.md)

This order starts with the simplest local-first workflow and moves gradually toward multi-node and production-oriented usage.

## 1. Build an Offline-first App

This guide shows how to build a small application that can work without the network.

You will learn how to:

- create a client
- open the runtime
- write local data
- read local data
- inspect local state
- close the runtime

The important idea is:

```txt
local work should not depend on network availability
```

Start here if you want to understand Softadastra from the application developer point of view.

Read: [Build an Offline-first App](./build-offline-first-app.md)

## 2. Run a Local Node

This guide shows how to run a local Softadastra node.

A local node can expose runtime identity, local store behavior, sync state, transport configuration, discovery configuration, and metadata.

You will learn how to:

- build the CLI
- start a node
- inspect node information
- check runtime status
- list peers
- run local commands

The important idea is:

```txt
a Softadastra node is useful even before it connects to another node
```

Read: [Run a Local Node](./run-local-node.md)

## 3. Persist Data Locally

This guide shows how to make local data recoverable after restart.

You will learn how to:

- enable WAL-backed persistence
- choose a WAL path
- create the data directory
- write local data
- restart the runtime
- recover local state

The important idea is:

```txt
write locally
persist locally
recover later
```

Use this guide when local writes must survive process restart, machine restart, or interrupted execution.

Read: [Persist Data Locally](./persist-data-locally.md)

## 4. Sync Between Nodes

This guide shows how to move local operations toward another node.

You will learn how to:

- run two local nodes
- use different ports
- write local data
- inspect sync state
- run sync ticks
- connect peers
- observe pending work

The important idea is:

```txt
sync is propagation
transport is delivery
discovery is peer finding
```

A local write can exist before sync completes. If no peer is available, sync work can remain pending and retry later.

Read: [Sync Between Nodes](./sync-between-nodes.md)

## 5. Use the C++ SDK with the Engine

This guide shows how the public C++ SDK maps to the internal engine.

You will learn how `Client` and `ClientOptions` connect to lower-level modules such as store, WAL, sync, transport, discovery, and metadata.

The guide is useful when you want to understand what happens behind SDK calls like:

```cpp
client.put("app/name", "Softadastra");
client.sync_state();
client.tick();
client.start_transport();
client.refresh_node_info();
```

The important idea is:

```txt
SDK C++ gives a stable public API over the engine
```

Read: [Use the C++ SDK with the Engine](./use-cpp-sdk-with-engine.md)

## 6. Use the JavaScript SDK with the Engine

This guide shows how the JavaScript SDK maps to the same Softadastra engine model.

You will learn how JavaScript APIs such as `put`, `get`, `syncStateInfo`, `tick`, `startTransport`, `startDiscovery`, and `refreshNodeInfo` correspond to engine concepts.

Example:

```js
await client.put("app/name", "Softadastra");
const state = await client.syncStateInfo();
await client.tick();
```

The important idea is:

```txt
SDK JS follows the same local-first model with an async JavaScript API
```

Read: [Use the JavaScript SDK with the Engine](./use-js-sdk-with-engine.md)

## 7. Production

This guide explains what changes when you move from local examples to production-oriented usage.

You will learn how to think about:

- stable node ids
- WAL paths
- data directories
- runtime configuration
- sync failure visibility
- transport ports
- discovery behavior
- logs
- backups
- deployment
- monitoring

The important idea is:

```txt
production reliability starts with explicit local state, durable history, observable sync, and clear failure behavior
```

Read: [Production](./production.md)

## How guides relate to concepts

The guides apply the concepts section.

| Concept | Used in guides |
|---|---|
| Offline-first | Build an Offline-first App |
| Local-first | Build an Offline-first App, Run a Local Node |
| Failure model | Persist Data Locally, Production |
| WAL | Persist Data Locally |
| Outbox | Sync Between Nodes |
| Sync engine | Sync Between Nodes |
| Convergence | Sync Between Nodes, Production |

If a guide mentions a concept you do not fully understand yet, read the matching concept page first.

## How guides relate to SDKs

The SDK pages explain individual APIs.

The guides show complete workflows.

For example, the SDK pages explain:

- `Client`
- `ClientOptions`
- local store
- persistent store
- sync
- transport
- discovery
- metadata
- errors

The guides combine those APIs into practical flows:

```txt
create client
configure persistence
write data
inspect sync
connect peers
recover after restart
prepare for production
```

Use the SDK pages as API references. Use the guides when you want to build something end to end.

## How guides relate to the engine

The engine pages explain internal modules.

The guides use the engine model without requiring you to manually wire every module.

For example:

```txt
client.put()
  ↓
store operation
  ↓
WAL, if enabled
  ↓
store apply
  ↓
sync tracking
```

The guide does not need to expose every internal class. It only shows enough engine behavior to make the workflow understandable.

## How guides relate to the CLI

The CLI is useful for testing and inspecting Softadastra behavior from the terminal.

Many guides use commands like:

```bash
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra peers
```

The CLI helps verify that the local runtime behaves correctly before you build larger applications.

## What to read next

Start with the first practical guide:

[Build an Offline-first App](./build-offline-first-app)
