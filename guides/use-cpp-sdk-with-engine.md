# Use the C++ SDK with the Engine

This guide explains how the Softadastra C++ SDK maps to the internal Softadastra Engine.

The goal is to understand what happens behind SDK calls such as `Client`, `ClientOptions`, `put`, `get`, `sync_state`, `tick`, `start_transport`, `start_discovery`, and `refresh_node_info`.

The core rule is:

```txt
The C++ SDK gives a stable public API over the engine.
```

Most applications should use the SDK first. The engine explains how the runtime works internally.

## What you will learn

You will learn how the C++ SDK maps to these engine modules:

```txt
ClientOptions -> engine configuration
Client        -> runtime facade
put/get       -> store
persistent    -> WAL + store
sync_state    -> sync
tick          -> sync scheduler
transport     -> transport
discovery     -> discovery
node info     -> metadata
Result        -> core error handling
```

The basic model is:

```txt
C++ app
  ↓
Softadastra SDK
  ↓
Softadastra Engine modules
```

## Why this mapping matters

The SDK is designed to hide most internal wiring.

Instead of manually creating store engines, WAL writers, sync contexts, transport engines, discovery engines, and metadata services, an application can use:

```cpp
Client client{
    ClientOptions::local("node-a")};
```

Then:

```cpp
client.open();
client.put("app/name", "Softadastra");
client.sync_state();
client.tick();
client.close();
```

The SDK keeps the public API small, while the engine remains modular internally.

## SDK versus Engine

The SDK is the developer-facing layer.

The engine is the lower-level runtime layer.

```txt
SDK C++
  -> Client
  -> ClientOptions
  -> Value
  -> Peer
  -> NodeInfo
  -> Result
  -> Error

Engine
  -> core
  -> wal
  -> store
  -> sync
  -> transport
  -> discovery
  -> metadata
```

Use the SDK when you are building an application.

Use the engine documentation when you want to understand or extend the runtime internals.

## Main SDK entry point

Most C++ applications should include:

```cpp
#include <softadastra/sdk.hpp>
```

Then use:

```cpp
using namespace softadastra::sdk;
```

This gives access to the main SDK types:

- `Client`
- `ClientOptions`
- `Value`
- `Peer`
- `NodeInfo`
- `Result`
- `Error`
- `SyncResult`
- `TickResult`

## ClientOptions maps to engine configuration

`ClientOptions` defines how the SDK should compose the runtime.

Example:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");

options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

options.enable_discovery = false;

options.display_name = "Node A";
options.version = "0.1.0";
```

Conceptually, these options map to several engine configurations:

```txt
node id          -> metadata, sync, transport, discovery
wal path         -> WAL and store persistence
auto flush       -> WAL durability behavior
transport host   -> transport bind host
transport port   -> transport bind port
discovery config -> discovery runtime
display name     -> metadata
version          -> metadata
```

The SDK hides the conversion from `ClientOptions` to lower-level engine config objects.

## Client maps to the runtime facade

`Client` is the main SDK object.

```cpp
Client client{options};
```

Conceptually, `Client` owns or coordinates the runtime modules needed by the selected options.

```txt
Client
  ↓
store
WAL, if enabled
sync
transport, if enabled
discovery, if enabled
metadata
```

The application does not need to create those modules manually.

## Open maps to runtime initialization

Before using the SDK, call:

```cpp
auto opened = client.open();

if (opened.is_err())
{
    std::cerr << opened.error().message() << "\n";
    return 1;
}
```

Conceptually, `open()` can initialize:

```txt
validate options
  ↓
initialize metadata
  ↓
open WAL, if enabled
  ↓
recover store from WAL, if enabled
  ↓
initialize store
  ↓
initialize sync state
  ↓
prepare transport config, if enabled
  ↓
prepare discovery config, if enabled
  ↓
client ready
```

Opening the client should not require a peer.

Opening the client should not require discovery.

Opening the client should not require transport to be connected.

The local runtime should be useful first.

## put maps to store, WAL, and sync

A normal write looks like this:

```cpp
auto result = client.put(
    "app/name",
    "Softadastra");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    client.close();
    return 1;
}
```

Conceptually:

```txt
client.put()
  ↓
validate key and value
  ↓
create store operation
  ↓
append to WAL, if enabled
  ↓
apply to store
  ↓
create sync operation, if sync tracking is enabled
  ↓
return Result
```

The store makes the value readable locally.

The WAL makes the operation recoverable when persistence is enabled.

The sync layer tracks the operation for later propagation.

## get maps to the local store

A read looks like this:

```cpp
auto result = client.get("app/name");

if (result.is_ok())
{
    std::cout << result.value().to_string() << "\n";
}
```

Conceptually:

```txt
client.get()
  ↓
store lookup
  ↓
return Value or Error
```

`get()` is local.

It should not require a server, peer, transport, discovery, or cloud access.

If the key is missing, the result should be an explicit error, not a crash.

```cpp
auto result = client.get("missing/key");

if (result.is_err())
{
    std::cout << result.error().code_string() << "\n";
}
```

Expected output style:

```txt
not_found
```

## remove maps to a store operation

A remove operation looks like this:

```cpp
auto result = client.remove("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
}
```

Conceptually:

```txt
client.remove()
  ↓
create delete operation
  ↓
append to WAL, if enabled
  ↓
apply delete to store
  ↓
track sync operation, if enabled
  ↓
return Result
```

A remove is still local-first.

Remote peers can learn about the delete later through sync.

## contains, size, and empty map to store state

These methods inspect current local state:

```cpp
client.contains("app/name");
client.size();
client.empty();
```

They map to the local store.

```txt
contains -> does this key exist locally?
size     -> how many local entries exist?
empty    -> is the local store empty?
```

They do not require transport or discovery.

## Persistent options map to WAL-backed store

Use persistent mode when local data should survive restart:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/node-persistent.wal");

options.auto_flush = true;
```

Conceptually:

```txt
ClientOptions::persistent
  ↓
enable WAL
  ↓
set WAL path
  ↓
open store with recovery
```

The persistent write path is:

```txt
put
  ↓
WAL append
  ↓
store apply
  ↓
sync tracking
```

The recovery path is:

```txt
client.open()
  ↓
read WAL
  ↓
replay valid operations
  ↓
restore local store
```

## sync_state maps to the sync engine

Use `sync_state()` to inspect pending synchronization work:

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

    std::cout << "failed: "
              << state.value().failed_count
              << "\n";
}
```

Conceptually:

```txt
client.sync_state()
  ↓
sync engine state
  ↓
outbox count
  ↓
queued count
  ↓
in-flight count
  ↓
acknowledged count
  ↓
failed count
  ↓
retry count
```

The sync state does not mean remote delivery has completed.

It shows what the local runtime knows about propagation work.

## tick maps to the sync scheduler

Use `tick()` to move the sync pipeline forward once:

```cpp
auto tick = client.tick();

if (tick.is_ok())
{
    std::cout << "retried: "
              << tick.value().retried_count
              << "\n";

    std::cout << "pruned: "
              << tick.value().pruned_count
              << "\n";

    std::cout << "batch: "
              << tick.value().batch_size
              << "\n";
}
```

Conceptually:

```txt
client.tick()
  ↓
retry expired work
  ↓
select queued operations
  ↓
produce next batch
  ↓
prepare delivery through transport, if enabled
  ↓
return TickResult
```

A tick is explicit.

This makes synchronization easier to test, debug, and control.

## tick with pruning

If supported:

```cpp
auto tick = client.tick(true);
```

Conceptually:

```txt
tick
  ↓
move sync pipeline
  ↓
remove completed entries, if safe
```

Pruning should only remove completed sync work.

It should not remove local store values.

## start_transport maps to the transport module

Transport is optional.

Enable it through options:

```cpp
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
```

Start it explicitly:

```cpp
auto result = client.start_transport();

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
}
```

Conceptually:

```txt
client.start_transport()
  ↓
transport config
  ↓
bind host and port
  ↓
start transport backend
  ↓
ready to connect peers
```

Transport is the delivery layer.

It does not decide what a sync operation means.

## connect maps to peer transport

A peer describes another node:

```cpp
Peer peer{
    "node-b",
    "127.0.0.1",
    4042};
```

Connect:

```cpp
auto connected = client.connect(peer);

if (connected.is_err())
{
    std::cout << "connection failed: "
              << connected.error().message()
              << "\n";
}
```

Conceptually:

```txt
client.connect(peer)
  ↓
transport connect
  ↓
peer registry update
  ↓
messages can be delivered, if connection succeeds
```

A connection failure should not invalidate local state.

```txt
transport failure
  ↓
sync work remains tracked
  ↓
local value remains readable
```

## start_discovery maps to discovery

Discovery is optional.

Enable it through options:

```cpp
options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
```

Start it explicitly:

```cpp
auto result = client.start_discovery();

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
}
```

Conceptually:

```txt
client.start_discovery()
  ↓
discovery config
  ↓
listen for discovery messages
  ↓
announce local node
  ↓
track discovered peers
```

Discovery finds peers.

Transport connects peers.

Sync sends operations.

## peers maps to discovery and peer registry

Use:

```cpp
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

Conceptually:

```txt
client.peers()
  ↓
known peer registry
  ↓
discovered or configured peers
```

No peers is a valid state.

A node can still read and write local data when no peer is known.

## refresh_node_info maps to metadata

Use:

```cpp
auto info = client.refresh_node_info();

if (info.is_ok())
{
    std::cout << info.value().node_id << "\n";
    std::cout << info.value().display_name << "\n";
    std::cout << info.value().hostname << "\n";
    std::cout << info.value().os_name << "\n";
    std::cout << info.value().version << "\n";
}
```

Conceptually:

```txt
client.refresh_node_info()
  ↓
metadata service
  ↓
node id
  ↓
display name
  ↓
hostname
  ↓
operating system
  ↓
version
  ↓
capabilities
  ↓
uptime
```

Metadata describes the node.

It does not store application data.

## Result maps to core error handling

Most SDK operations return explicit results.

```cpp
auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";
```

Conceptually:

```txt
operation
  ↓
Result<T>
  ↓
ok(value) or err(error)
```

The engine uses explicit errors because failure is normal in local-first systems.

Examples:

- missing key
- invalid WAL path
- transport failed
- peer unavailable
- discovery disabled
- sync failed
- metadata unavailable

The rule is:

```txt
Check the result before using the value.
```

## Complete C++ SDK flow

This example uses several SDK features and shows how they map to the engine.

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::persistent(
            "node-a",
            "data/node-a.wal");

    options.auto_flush = true;

    options.enable_transport = true;
    options.transport_host = "127.0.0.1";
    options.transport_port = 4041;

    options.enable_discovery = false;

    options.display_name = "Node A";
    options.version = "0.1.0";

    Client client{options};

    auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: "
                  << opened.error().message()
                  << "\n";

        return 1;
    }

    auto written = client.put(
        "app/name",
        "Softadastra");

    if (written.is_err())
    {
        std::cerr << "write failed: "
                  << written.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto value = client.get("app/name");

    if (value.is_ok())
    {
        std::cout << "value: "
                  << value.value().to_string()
                  << "\n";
    }

    auto state = client.sync_state();

    if (state.is_ok())
    {
        std::cout << "outbox: "
                  << state.value().outbox_size
                  << "\n";
    }

    auto tick = client.tick();

    if (tick.is_ok())
    {
        std::cout << "batch: "
                  << tick.value().batch_size
                  << "\n";
    }

    auto node = client.refresh_node_info();

    if (node.is_ok())
    {
        std::cout << "node: "
                  << node.value().node_id
                  << "\n";
    }

    client.close();

    return 0;
}
```

Expected output style:

```txt
value: Softadastra
outbox: 1
batch: 1
node: node-a
```

The exact sync numbers can differ depending on runtime configuration.

## Internal flow behind the example

The previous example maps to this engine flow:

```txt
ClientOptions::persistent
  ↓
WAL path configured

client.open()
  ↓
metadata initialized
  ↓
WAL opened
  ↓
store recovered
  ↓
sync initialized
  ↓
transport prepared

client.put()
  ↓
store operation
  ↓
WAL append
  ↓
store apply
  ↓
sync operation created

client.sync_state()
  ↓
sync state read

client.tick()
  ↓
sync scheduler moves pipeline

client.refresh_node_info()
  ↓
metadata refreshed

client.close()
  ↓
runtime cleanup
```

The SDK gives one clean API over that flow.

## When to use the SDK directly

Use the SDK directly when you want to:

- build an application
- store local data
- add offline-first behavior
- persist local operations
- inspect sync state
- connect peers
- use Softadastra without manual engine wiring

For most applications, the SDK is the right level.

## When to use engine modules directly

Use engine modules directly when you are:

- developing Softadastra internals
- adding a new storage mode
- testing WAL internals
- building a new sync strategy
- building a new transport backend
- building a new discovery backend
- debugging low-level runtime behavior

Engine-level code gives more control, but it requires more wiring.

## SDK and CLI relationship

The SDK and CLI both sit above the engine.

```txt
C++ SDK
  ↓
engine modules

CLI
  ↓
engine modules
```

They expose similar concepts in different forms.

SDK:

```cpp
client.put("app/name", "Softadastra");
client.sync_state();
client.tick();
```

CLI:

```bash
softadastra store put app/name Softadastra
softadastra sync status
softadastra sync tick
```

Both follow the same model.

## SDK and local-first behavior

The SDK should preserve Softadastra's local-first rules.

A local write should not require:

- remote server
- connected peer
- transport
- discovery
- cloud access

A transport failure should not delete local state.

A discovery failure should not block store access.

A sync failure should not make a local value unreadable.

This is the practical meaning of local-first behavior in the SDK.

## Common mistakes

### Using the engine when the SDK is enough

If your goal is to build an application, start with:

```cpp
#include <softadastra/sdk.hpp>
```

Do not manually wire internal modules unless you need low-level control.

### Forgetting to open the client

Wrong:

```cpp
Client client{options};
client.put("app/name", "Softadastra");
```

Correct:

```cpp
Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

client.put("app/name", "Softadastra");
```

### Assuming put means remote delivery

`put()` writes locally.

It can create sync work, but it does not guarantee another node already received the operation.

Inspect sync:

```cpp
auto state = client.sync_state();
```

Run a tick:

```cpp
auto tick = client.tick();
```

### Assuming transport is required for local store

Transport is optional.

This should still work:

```cpp
options.enable_transport = false;

client.put("local/key", "value");
client.get("local/key");
```

### Sharing a WAL path between nodes

Each node should have its own WAL path.

Good:

```txt
node-a -> data/node-a.wal
node-b -> data/node-b.wal
```

Bad:

```txt
node-a -> data/shared.wal
node-b -> data/shared.wal
```

## Debugging with CLI

Use the CLI to inspect the same runtime concepts:

```bash
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra peers
```

This helps confirm that SDK behavior matches the runtime model.

## Summary

The C++ SDK is a stable public API over Softadastra Engine.

The mapping is:

```txt
ClientOptions -> runtime configuration
Client        -> SDK facade
put/get       -> store
persistent    -> WAL + store recovery
sync_state    -> sync state
tick          -> sync scheduler
transport     -> peer delivery
discovery     -> peer finding
metadata      -> node identity
Result        -> explicit error handling
```

The SDK lets you build local-first applications without manually wiring every engine module.

## Next step

Continue with:

[Use the JavaScript SDK with the Engine](./use-js-sdk-with-engine)
