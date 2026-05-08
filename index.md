---
layout: home

hero:
  name: Softadastra
  text: The sync engine for the real world.
  tagline: Build local-first and offline-first applications that keep working when the network fails, the device restarts, or peers disappear.
  image:
    src: /assets/pwa/icon-192.png
    alt: Softadastra
  actions:
    - theme: brand
      text: Quick Start
      link: /quick-start
    - theme: alt
      text: What is Softadastra?
      link: /what-is-softadastra
    - theme: alt
      text: SDK C++
      link: /sdk-cpp/

features:
  - title: Local-first by design
    details: Applications can write locally first, without waiting for a server, cloud API, or remote peer.
  - title: Durable writes
    details: Accepted operations can be persisted through a Write-Ahead Log before synchronization is attempted.
  - title: Offline-capable sync
    details: Nodes can continue working offline, queue changes, retry later, and synchronize when peers become available.
  - title: SDKs for developers
    details: Use Softadastra from C++ or JavaScript through a small public API built around Client and ClientOptions.
  - title: Modular engine
    details: Core, WAL, store, sync, transport, discovery, metadata, and CLI are separated into focused runtime modules.
  - title: Built for real networks
    details: Softadastra is designed for unstable connectivity, local nodes, edge deployments, and systems that must recover.
---

# Softadastra Documentation

Softadastra is a **local-first and offline-first synchronization foundation** for building reliable applications under real-world network conditions.

It is built around one simple model:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

A local operation should not depend on the network. The network is useful, but it must not be required for local correctness.

## Start here

If this is your first time with Softadastra, follow this order:

<div class="softadastra-grid">

<div class="softadastra-card">

### 1. Understand the model

Learn what Softadastra is, why it exists, and how local-first synchronization works.

[Read: What is Softadastra?](/what-is-softadastra)

</div>

<div class="softadastra-card">

### 2. Install and run

Install the tools, create your first local client, and write your first value.

[Read: Quick Start](/quick-start)

</div>

<div class="softadastra-card">

### 3. Use the SDK

Use Softadastra from C++ or JavaScript without manually wiring the internal engine modules.

[Read: SDK C++](/sdk-cpp/)

[Read: SDK JS](/sdk-js/)

</div>

<div class="softadastra-card">

### 4. Explore the engine

Understand how the internal runtime works: WAL, store, sync, transport, discovery, and metadata.

[Read: Engine](/engine/)

</div>

</div>

## What Softadastra gives you

Softadastra provides the foundation for applications that need to keep working even when the network is not reliable.

It gives you:

- local key-value storage
- optional WAL-backed persistence
- explicit sync tracking
- manual sync ticks
- optional peer transport
- optional peer discovery
- local node metadata
- a modular engine for deeper integration

## Main entry points

### CLI

Use the Softadastra CLI to inspect and control local runtime state.

```sh
softadastra status
softadastra node info
softadastra store put name gaspard
softadastra store get name
softadastra sync status
softadastra sync tick
softadastra peers
```

[Read the CLI docs](/cli/)

### SDK C++

Use the official C++ SDK when building native applications.

```cpp
#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "node-1",
            "data/sdk.wal")};

    auto opened = client.open();

    if (opened.is_err())
    {
        return 1;
    }

    client.put("hello", "world");

    auto value = client.get("hello");

    client.close();

    return value.is_ok() ? 0 : 1;
}
```

[Read the SDK C++ docs](/sdk-cpp/)

### SDK JS

Use the official JavaScript SDK when building JavaScript applications.

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.persistent("node-1", "data/sdk.wal")
);

const opened = await client.open();

if (opened.isErr()) {
  process.exit(1);
}

await client.put("hello", "world");

const value = await client.get("hello");

await client.close();

process.exit(value.isOk() ? 0 : 1);
```

[Read the SDK JS docs](/sdk-js/)

## Engine overview

Softadastra is modular internally.

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

The main runtime flow looks like this:

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

[Read the engine docs](/engine/)

## Documentation structure

This documentation is organized like a book:

- Start Here
- Concepts
- CLI
- SDK C++
- SDK JS
- Engine
- Guides
- Reference
- Releases

Use **Concepts** to understand the model, **SDK C++** or **SDK JS** to build applications, and **Engine** when you want to understand the internals.

## Next step

Start with the quick start:

[Go to Quick Start](/quick-start)
