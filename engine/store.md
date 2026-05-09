# Store

`store` is the local key-value state module of Softadastra Engine.

It represents the current local state of a node.

The core rule is:

```txt
WAL records history.
Store exposes current state.
```

The store is where local values become readable after operations are applied.

## Why store exists

Softadastra is local-first.

A local-first runtime needs a place where the current local state can be read and written without requiring the network.

The store provides that local state.

It allows the engine to:

- write values locally
- read values locally
- remove values locally
- recover state from WAL
- track entry versions
- build snapshots from operation history
- produce operations for sync

The store is used by higher-level systems such as the SDK, CLI, sync engine, and local-first applications.

## What store provides

The `store` module provides:

- `StoreEngine`
- `StoreConfig`
- `Key`
- `Value`
- `Entry`
- `Operation`
- `OperationEncoder`
- `OperationDecoder`
- `SnapshotBuilderStore`
- `put`
- `get`
- `remove`
- `entries`
- `size`
- recovery from WAL

It gives the engine a simple local key-value model:

```txt
Key -> Value
```

With operation history and version tracking.

## What store does not do

`store` must not:

- connect peers
- send network messages
- discover nodes
- own sync retry policy
- own transport delivery
- own CLI parsing
- decide peer availability
- hide WAL failures

The rule is:

```txt
store applies local operations.
sync tracks propagation.
transport sends messages.
discovery finds peers.
```

## Include

Use the top-level include:

```cpp
#include <softadastra/store/Store.hpp>
```

## Module location

The module lives in:

```txt
modules/store/
```

Typical structure:

```txt
modules/store/
├── include/
│   └── softadastra/store/
│       ├── core/
│       ├── encoding/
│       ├── engine/
│       ├── snapshot/
│       ├── types/
│       └── Store.hpp
├── src/
├── examples/
├── tests/
├── README.md
├── CMakeLists.txt
└── CHANGELOG.md
```

The exact structure can evolve, but the responsibility should stay stable:

```txt
store current local key-value state and recover it from operation history
```

## Main concepts

The store module is built around these concepts:

- `StoreConfig`
- `StoreEngine`
- `Key`
- `Value`
- `Entry`
- `Operation`
- `Snapshot`
- `Recovery`

The normal flow is:

```txt
StoreConfig
  ↓
StoreEngine
  ↓
put / get / remove
  ↓
current local state
```

With WAL enabled:

```txt
StoreConfig::durable
  ↓
StoreEngine
  ↓
operation encoded
  ↓
WAL append
  ↓
store apply
  ↓
recoverable local state
```

## StoreConfig

`StoreConfig` configures how the store runs.

The main modes are:

- memory-only
- durable WAL-backed

Memory-only is useful for temporary state.

Durable mode is useful when state must survive restart.

## Memory-only store

Memory-only mode keeps state in memory.

Example:

```cpp
store::engine::StoreEngine engine{
    store::core::StoreConfig::memory_only()};
```

This mode is useful for:

- tests
- temporary state
- small demos
- non-durable local tools

Memory-only state can be lost when the process exits.

## Durable store

Durable mode uses a WAL path.

Example:

```cpp
store::engine::StoreEngine engine{
    store::core::StoreConfig::durable("store.wal")};
```

This mode is useful when local operations must be recoverable.

The flow is:

```txt
put / remove
  ↓
operation written to WAL
  ↓
operation applied to store
```

On restart:

```txt
open store
  ↓
read WAL
  ↓
replay operations
  ↓
rebuild current state
```

## Key

`Key` identifies a value in the store.

Example:

```cpp
store::types::Key{"user:1"}
```

Good keys are:

- non-empty
- stable
- human-readable when possible
- structured by domain

Good examples:

```txt
user:1
settings:theme
profile:name
files/docs/readme.txt
session:1
product:1
```

Avoid empty keys.

## Value

`Value` stores the data associated with a key.

Example:

```cpp
store::types::Value::from_string("Gaspard")
```

A value can represent string data, and the module can evolve toward binary values when needed.

Example usage:

```cpp
auto value =
    store::types::Value::from_string("Softadastra");
```

Read it back:

```cpp
value.to_string()
```

## Entry

`Entry` represents a value currently stored under a key.

An entry can contain:

- key
- value
- version
- timestamp, if supported
- metadata, if supported

Conceptually:

```cpp
Entry {
    key
    value
    version
}
```

The version changes when the entry is updated.

## Operation

`Operation` represents a store change.

Common operation types:

- put
- update
- delete

Example:

```cpp
auto operation = store::core::Operation::put(
    store::types::Key{"user:1"},
    store::types::Value::from_string("Gaspard"));
```

Operations are important because they can be:

- encoded
- written to WAL
- replayed
- tracked by sync
- sent to peers
- applied remotely

## StoreEngine

`StoreEngine` is the main runtime object of the store module.

It provides:

- `put`
- `get`
- `remove`
- `contains`, if exposed
- `entries`
- `size`
- last recovered sequence

It owns the current local state.

## Basic store example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== STORE BASIC EXAMPLE ==\n";

    const std::string wal_path = "basic_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine engine{
        store::core::StoreConfig::durable(wal_path)};

    auto put_result = engine.put(
        store::types::Key{"user:1"},
        store::types::Value::from_string("Gaspard"));

    if (put_result.is_err())
    {
        std::cerr << "put failed: "
                  << put_result.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Put version="
              << put_result.value().version
              << "\n";

    auto entry = engine.get(store::types::Key{"user:1"});

    if (!entry.has_value())
    {
        std::cerr << "entry not found\n";
        return 1;
    }

    std::cout << "Entry key="
              << entry->key.str()
              << " value="
              << entry->value.to_string()
              << " version="
              << entry->version
              << "\n";

    auto remove_result = engine.remove(
        store::types::Key{"user:1"});

    if (remove_result.is_err())
    {
        std::cerr << "remove failed: "
                  << remove_result.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Removed="
              << remove_result.value().deleted
              << "\n";

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Put flow

A put operation writes or updates a value.

Flow:

```txt
put requested
  ↓
validate key
  ↓
create Operation::Put
  ↓
encode operation, if WAL-backed
  ↓
append to WAL, if durable
  ↓
apply operation to current store
  ↓
create or update Entry
  ↓
return PutResult
```

The important rule is:

```txt
If WAL append fails in durable mode, do not pretend the write is durably accepted.
```

## Get flow

A get operation reads the current local state.

Flow:

```txt
get requested
  ↓
validate key
  ↓
lookup entry
  ↓
return entry or not found
```

A local read should not require:

- WAL
- sync
- transport
- discovery
- peer
- network

The store is local.

## Remove flow

A remove operation deletes a key.

Flow:

```txt
remove requested
  ↓
validate key
  ↓
create Operation::Delete
  ↓
append to WAL, if durable
  ↓
remove entry from current store
  ↓
return RemoveResult
```

After remove:

```txt
get(key) -> not found
```

If the remove operation is written to WAL, recovery should preserve the deleted state.

## Memory-only example

```cpp
#include <iostream>

#include <softadastra/store/Store.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== STORE MEMORY ONLY EXAMPLE ==\n";

    store::engine::StoreEngine engine{
        store::core::StoreConfig::memory_only()};

    auto result = engine.put(
        store::types::Key{"session:1"},
        store::types::Value::from_string("temporary-value"));

    if (result.is_err())
    {
        std::cerr << "put failed: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Created="
              << result.value().created
              << " version="
              << result.value().version
              << "\n";

    auto entry = engine.get(
        store::types::Key{"session:1"});

    if (entry.has_value())
    {
        std::cout << "session:1 => "
                  << entry->value.to_string()
                  << "\n";
    }

    return 0;
}
```

## Durable WAL example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== STORE WAL USAGE EXAMPLE ==\n";

    const std::string wal_path = "store_wal_usage.wal";
    std::filesystem::remove(wal_path);

    auto config =
        store::core::StoreConfig::durable(wal_path);

    store::engine::StoreEngine engine{config};

    auto first = engine.put(
        store::types::Key{"product:1"},
        store::types::Value::from_string("Laptop"));

    auto second = engine.put(
        store::types::Key{"product:2"},
        store::types::Value::from_string("Phone"));

    auto third = engine.put(
        store::types::Key{"product:1"},
        store::types::Value::from_string("Laptop Pro"));

    if (first.is_err() || second.is_err() || third.is_err())
    {
        std::cerr << "failed to write one or more entries\n";
        return 1;
    }

    std::cout << "Current store size: "
              << engine.size()
              << "\n";

    for (const auto &[key, entry] : engine.entries())
    {
        std::cout << key
                  << " => "
                  << entry.value.to_string()
                  << " version="
                  << entry.version
                  << "\n";
    }

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Recovery

Recovery rebuilds store state from WAL history.

Flow:

```txt
StoreEngine starts with durable config
  ↓
WAL is opened
  ↓
records are read
  ↓
operations are decoded
  ↓
operations are applied in sequence
  ↓
current state is rebuilt
```

Recovery must be deterministic.

```txt
same WAL
  ↓
same replay order
  ↓
same final store state
```

## Recovery example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== STORE RECOVERY DEMO ==\n";

    const std::string wal_path = "store_recovery_demo.wal";
    std::filesystem::remove(wal_path);

    {
        store::engine::StoreEngine engine{
            store::core::StoreConfig::durable(wal_path)};

        auto first = engine.put(
            store::types::Key{"user:1"},
            store::types::Value::from_string("Gaspard"));

        auto second = engine.put(
            store::types::Key{"user:2"},
            store::types::Value::from_string("Softadastra"));

        auto third = engine.put(
            store::types::Key{"user:1"},
            store::types::Value::from_string("Gaspard Kirira"));

        if (first.is_err() || second.is_err() || third.is_err())
        {
            std::cerr << "initial writes failed\n";
            return 1;
        }

        std::cout << "Before restart size: "
                  << engine.size()
                  << "\n";
    }

    {
        store::engine::StoreEngine recovered{
            store::core::StoreConfig::durable(wal_path)};

        std::cout << "After recovery size: "
                  << recovered.size()
                  << "\n";

        auto entry = recovered.get(
            store::types::Key{"user:1"});

        if (!entry.has_value())
        {
            std::cerr << "recovered entry missing\n";
            return 1;
        }

        std::cout << "Recovered user:1 => "
                  << entry->value.to_string()
                  << " version="
                  << entry->version
                  << "\n";

        std::cout << "Last recovered sequence: "
                  << recovered.last_recovered_sequence()
                  << "\n";
    }

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Snapshot from WAL

A store snapshot can be built from WAL history.

This is useful for diagnostics and recovery tests.

Flow:

```txt
read WAL
  ↓
decode store operations
  ↓
apply operations in sequence
  ↓
produce snapshot
```

## Snapshot example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== STORE SNAPSHOT FROM WAL EXAMPLE ==\n";

    const std::string wal_path = "snapshot_from_wal.wal";
    std::filesystem::remove(wal_path);

    {
        store::engine::StoreEngine engine{
            store::core::StoreConfig::durable(wal_path)};

        auto first = engine.put(
            store::types::Key{"item:1"},
            store::types::Value::from_string("alpha"));

        auto second = engine.put(
            store::types::Key{"item:2"},
            store::types::Value::from_string("beta"));

        auto third = engine.put(
            store::types::Key{"item:1"},
            store::types::Value::from_string("alpha-updated"));

        if (first.is_err() || second.is_err() || third.is_err())
        {
            std::cerr << "failed to write WAL-backed store entries\n";
            return 1;
        }
    }

    auto snapshot_result =
        store::snapshot::SnapshotBuilderStore::build(wal_path);

    if (snapshot_result.is_err())
    {
        std::cerr << "snapshot build failed: "
                  << snapshot_result.error().message()
                  << "\n";

        return 1;
    }

    auto snapshot = std::move(snapshot_result.value());

    std::cout << "Snapshot size: "
              << snapshot.size()
              << "\n";

    for (const auto &[key, value] : snapshot.all())
    {
        std::cout << key
                  << " => "
                  << value.to_string()
                  << "\n";
    }

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Operation encoding

Store operations can be encoded into payloads.

This is useful for:

- WAL records
- sync messages
- transport payloads
- replay
- diagnostics

## Operation codec example

```cpp
#include <iostream>

#include <softadastra/store/Store.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== STORE OPERATION CODEC EXAMPLE ==\n";

    auto operation = store::core::Operation::put(
        store::types::Key{"user:1"},
        store::types::Value::from_string("Gaspard"));

    auto payload =
        store::encoding::OperationEncoder::encode(operation);

    if (payload.empty())
    {
        std::cerr << "encoding failed\n";
        return 1;
    }

    auto decoded =
        store::encoding::OperationDecoder::decode(payload);

    if (!decoded.has_value())
    {
        std::cerr << "decoding failed\n";
        return 1;
    }

    std::cout << "Decoded operation type="
              << store::types::to_string(decoded->type)
              << " key="
              << decoded->key.str()
              << " value="
              << decoded->value.to_string()
              << "\n";

    return 0;
}
```

## Encoding flow

Encoding follows this model:

```txt
Operation
  ↓
validate operation
  ↓
serialize type
  ↓
serialize key
  ↓
serialize value, when present
  ↓
payload bytes
```

## Decoding flow

Decoding follows this model:

```txt
payload bytes
  ↓
parse operation type
  ↓
parse key
  ↓
parse value, when present
  ↓
Operation
```

Invalid payloads should not produce fake operations.

They should fail clearly.

## Store and WAL

Store and WAL work together in durable mode.

The relationship is:

```txt
WAL   -> operation history
Store -> current local state
```

Example sequence:

```txt
put user:1 = Gaspard
put user:2 = Softadastra
put user:1 = Gaspard Kirira
remove user:2
```

The WAL stores all operations.

The store exposes final state:

```txt
user:1 -> Gaspard Kirira
user:2 -> not found
```

## Store and sync

Sync tracks store operations for propagation.

The relationship is:

```txt
Store -> applies operation locally
Sync  -> tracks operation for remote propagation
```

A local operation can become a sync operation:

```txt
store Operation::Put
  ↓
sync SyncOperation
  ↓
outbox
  ↓
queue
```

The store does not own sync policy.

It only provides operations and current state.

## Store and transport

Transport should not be part of store logic.

Wrong:

```txt
StoreEngine sends TCP message
```

Better:

```txt
StoreEngine applies operation
SyncEngine tracks operation
Transport sends sync message
```

Transport failure should not corrupt store state.

## Store and discovery

Discovery is unrelated to local key-value state.

Discovery finds peers.

Store holds local values.

They should remain separate.

## Store and metadata

Metadata describes the node.

Store contains application state.

Example:

```txt
metadata.node_id -> node-a
store["profile/name"] -> Ada
```

These are different responsibilities.

## Store and CLI

CLI can expose store commands.

Correct direction:

```txt
CLI command
  ↓
StoreEngine
```

Wrong direction:

```txt
StoreEngine
  ↓
CLI output
```

Store should return structured data and errors.

The CLI should format them.

## Store and SDK

The SDK wraps `StoreEngine` behind a simple developer API.

C++ SDK:

```cpp
client.put()
client.get()
client.remove()
client.size()
```

JavaScript SDK:

```js
client.put()
client.get()
client.remove()
client.size()
```

The engine store is lower-level.

The SDK makes it easier to use.

## Local-first behavior

Store operations are local.

A put should not require:

- network
- peer
- transport
- discovery
- cloud server
- remote ACK

This is the core local-first behavior.

## Offline-first behavior

If the network is unavailable, the store can still work.

Flow:

```txt
network offline
  ↓
store put still works
  ↓
value readable locally
  ↓
sync can retry later
```

This is why store must remain independent from transport.

## Durability behavior

In durable mode, accepted operations should be recorded.

Flow:

```txt
put requested
  ↓
WAL append
  ↓
store apply
  ↓
return success
```

If WAL append fails, the store should return an error and avoid pretending the operation is safely accepted.

## Versioning

Entries can have versions.

Versioning helps with:

- updates
- sync ordering
- conflict detection
- diagnostics
- recovery checks

Example output:

```txt
Entry key=user:1 value=Gaspard version=1
```

After updating the same key:

```txt
Entry key=user:1 value=Gaspard Kirira version=2
```

The exact versioning policy depends on the implementation.

The important rule is:

```txt
updates should be observable
```

## Entry lifecycle

An entry can move through states:

```txt
missing
  ↓
created
  ↓
updated
  ↓
removed
```

Example:

```txt
get user:1 -> missing
put user:1 -> created
put user:1 again -> updated
remove user:1 -> removed
```

## Remove semantics

Remove should be explicit.

Possible result fields:

- deleted
- key
- version, if supported

If the key does not exist, the behavior should be documented.

Possible policies:

- return `deleted=false`
- or return `not_found` error

The important rule is:

```txt
missing key during remove should be clear
```

## Store errors

Store operations should return explicit errors.

Possible errors:

- invalid key
- key not found
- WAL append failed
- WAL flush failed
- operation encoding failed
- operation decoding failed
- recovery failed
- invalid payload
- permission denied
- IO error

Do not hide store errors.

## Invalid key

An empty key should be rejected.

Bad:

```cpp
store::types::Key{""}
```

Good:

```cpp
store::types::Key{"user:1"}
```

The error should explain the problem:

```txt
invalid key: key is empty
```

## Key not found

A missing key is normal.

Example:

```cpp
auto entry = engine.get(store::types::Key{"missing:key"});

if (!entry.has_value())
{
    std::cout << "not found\n";
}
```

This should not crash the application.

## WAL append failure

In durable mode, WAL append failure is serious.

Flow:

```txt
put requested
  ↓
WAL append fails
  ↓
return error
  ↓
do not report durable success
```

Possible causes:

- directory missing
- permission denied
- disk full
- invalid path
- write failed

## Recovery failure

Recovery can fail when:

- WAL file is corrupted
- operation payload cannot be decoded
- unsupported operation type
- read fails
- permission denied

The store should return a clear recovery error.

It should not silently apply invalid operations.

## Decode failure

Operation decoding should fail clearly for invalid payloads.

Bad:

```txt
invalid bytes
  ↓
fake default operation
```

Better:

```txt
invalid bytes
  ↓
decode failed
  ↓
return no operation or error
```

## Store API reference

### Main areas

| Area | Purpose |
|---|---|
| `core` | Store config, entry, operation |
| `types` | Key, Value, operation type |
| `engine` | StoreEngine |
| `encoding` | Operation encoding and decoding |
| `snapshot` | Snapshot building from WAL |

### Main types

| Type | Purpose |
|---|---|
| `StoreConfig` | Configures store behavior |
| `StoreEngine` | Owns current local state |
| `Key` | Identifies an entry |
| `Value` | Stores entry data |
| `Entry` | Current stored key-value entry |
| `Operation` | Store mutation |
| `OperationEncoder` | Encodes operations |
| `OperationDecoder` | Decodes operations |
| `SnapshotBuilderStore` | Builds store snapshot from WAL |

### Common methods

| Method | Purpose |
|---|---|
| `put(key, value)` | Write or update a value |
| `get(key)` | Read a value |
| `remove(key)` | Remove a value |
| `entries()` | Return current entries |
| `size()` | Return number of entries |
| `last_recovered_sequence()` | Return last recovered WAL sequence |

Only document a method as stable when it exists in the current public API.

## Examples

Current useful examples include:

- `basic_store.cpp`
- `memory_only.cpp`
- `operation_codec.cpp`
- `recovery_demo.cpp`
- `snapshot_from_wal.cpp`
- `wal_usage.cpp`

Recommended order:

1. `memory_only.cpp`
2. `basic_store.cpp`
3. `wal_usage.cpp`
4. `operation_codec.cpp`
5. `recovery_demo.cpp`
6. `snapshot_from_wal.cpp`

This order moves from simple local state to WAL-backed recovery.

## Run examples

From the engine repository:

```bash
cd ~/softadastra/softadastra
```

Build:

```bash
vix build
```

Or with CMake:

```bash
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

Find binaries:

```bash
find build-ninja -type f -executable
```

Run the relevant store example binary from the build output.

## Testing store

Store tests should verify:

- memory-only put
- memory-only get
- memory-only remove
- durable put
- durable update
- durable remove
- WAL append integration
- operation encoding
- operation decoding
- recovery from WAL
- snapshot from WAL
- invalid key behavior
- missing key behavior
- decode failure behavior

## Good store test flow

Memory-only test:

```txt
create memory store
put key
get key
expect value
remove key
get key
expect missing
```

Durable test:

```txt
create temp WAL path
create durable store
put values
destroy store
create store again with same WAL
get values
expect recovery
cleanup
```

Codec test:

```txt
create operation
encode operation
decode payload
expect same key and value
```

## Design rules

The store module should follow these rules:

1. Store owns current local state.
2. WAL owns operation history.
3. Store must not own transport.
4. Store must not own discovery.
5. Store must return explicit errors.
6. Durable mode must not hide WAL failures.
7. Recovery must be deterministic.
8. Operation encoding must be strict.
9. Store examples should stay small.
10. Store should be usable without network.

## Common mistakes

### Treating store as sync

Wrong:

```txt
StoreEngine sends operations to peers
```

Better:

```txt
StoreEngine applies local operations
SyncEngine tracks propagation
Transport sends messages
```

### Treating WAL as current state

Wrong:

```txt
read latest WAL record as current state directly
```

Better:

```txt
replay WAL operations into store state
then read current state
```

### Ignoring WAL errors

Wrong:

```cpp
engine.put(key, value);
std::cout << "saved\n";
```

Better:

```cpp
auto result = engine.put(key, value);

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}
```

### Using empty keys

Wrong:

```cpp
store::types::Key{""}
```

Better:

```cpp
store::types::Key{"settings:theme"}
```

### Making store depend on CLI

Wrong:

```txt
StoreEngine prints formatted terminal tables
```

Better:

```txt
StoreEngine returns entries
CLI formats table
```

### Making remove ambiguous

A remove should clearly say whether something was deleted or not.

## Recommended usage pattern

Memory-only:

```cpp
store::engine::StoreEngine engine{
    store::core::StoreConfig::memory_only()};

auto result = engine.put(
    store::types::Key{"session:1"},
    store::types::Value::from_string("temporary"));

if (result.is_err())
{
    return 1;
}
```

Durable:

```cpp
store::engine::StoreEngine engine{
    store::core::StoreConfig::durable("data/node-a.wal")};

auto result = engine.put(
    store::types::Key{"user:1"},
    store::types::Value::from_string("Gaspard"));

if (result.is_err())
{
    return 1;
}
```

Read:

```cpp
auto entry = engine.get(store::types::Key{"user:1"});

if (entry.has_value())
{
    std::cout << entry->value.to_string() << "\n";
}
```

Remove:

```cpp
auto removed = engine.remove(store::types::Key{"user:1"});

if (removed.is_err())
{
    return 1;
}
```

## Summary

`store` is the current local state module of Softadastra Engine.

It provides:

- `StoreEngine`
- `StoreConfig`
- `Key`
- `Value`
- `Entry`
- `Operation`
- `OperationEncoder`
- `OperationDecoder`
- `SnapshotBuilderStore`

The key idea is:

```txt
Store applies operations locally and exposes current state.
```

It does not sync data by itself, connect peers, discover nodes, or own transport.

## Next step

Continue with sync:

[Go to Sync](./sync)
