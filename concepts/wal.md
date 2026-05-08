# Write-Ahead Log

The Write-Ahead Log, or WAL, is the durability layer of Softadastra.

Its core rule is:

> Write first. Apply later.

A WAL stores operations before they are applied, synchronized, or replayed. This makes local-first systems safer because accepted work can be recovered after a restart or crash.

## Why Softadastra needs a WAL

Softadastra is designed for systems where the network can fail, synchronization can be interrupted, peers can disappear, processes can restart, local writes must not be lost, and operations may need to be replayed later.

Without a WAL, a local operation can be accepted by the application but lost before it reaches durable storage or the network.

The WAL prevents that by recording the operation first.

```txt
operation accepted
  ↓
WAL append
  ↓
local apply
  ↓
sync tracking
```

## The core rule

The WAL rule is simple: persist the operation before depending on it.

In Softadastra, this means an operation should be appended to the WAL before it is treated as durable.

```txt
operation
  ↓
append to WAL
  ↓
assign sequence number
  ↓
apply to local state
  ↓
make available for sync
```

If the WAL append fails, the operation should not be considered durably accepted.

## What the WAL gives you

A WAL gives Softadastra durable local operations, ordered operation history, monotonic sequence numbers, deterministic replay, recovery after restart, safer sync tracking, and protection against partial execution.

The WAL does not make the system distributed by itself. It only guarantees that local operations can be stored and replayed in order.

## What the WAL does not do

The WAL does not handle network transport, peer discovery, conflict resolution, distributed consensus, application schemas, remote acknowledgements, filesystem watching, or sync retry policies.

Those belong to higher-level modules.

```txt
WAL        -> durable ordered records
Store      -> current local state
Sync       -> propagation logic
Transport  -> message delivery
Discovery  -> peer discovery
```

The WAL stores the history. Other layers decide what that history means.

## WAL and local-first systems

In a local-first system, local work matters.

When the application accepts a local write, the system should not lose it just because the network fails later.

With WAL-backed persistence:

```txt
local write
  ↓
WAL append
  ↓
store apply
  ↓
sync outbox
  ↓
retry later if needed
```

The network can be unavailable, but the operation remains locally durable.

## WAL and offline-first systems

Offline-first systems must survive long periods without network access.

During that time, the local node may continue to accept operations.

```txt
offline
  ↓
write locally
  ↓
append to WAL
  ↓
track for sync
  ↓
reconnect later
```

When the node reconnects, the sync layer can use the locally tracked operations to continue synchronization. The WAL makes this safer because operations are not only in memory.

## WAL records

A WAL record is a durable entry in the log.

Conceptually, a record contains a sequence number, type, status, timestamp, and payload.

The payload is binary data. The WAL does not need to understand the business meaning of the payload.

For example, a payload can represent a store operation, a filesystem event, a sync operation, a metadata mutation, a checkpoint, or an application command.

The WAL preserves order and durability. Higher-level modules interpret the payload.

## Sequence numbers

Every WAL record receives a monotonic sequence number.

```txt
record 1
record 2
record 3
record 4
```

This matters because replay must happen in the same order.

```txt
WAL order
  ↓
deterministic replay
  ↓
same materialized state
```

Without stable ordering, recovery can produce inconsistent results.

## WAL record types

Softadastra WAL records can represent logical operation types such as `Put`, `Update`, `Delete`, `Checkpoint`, and `Noop`.

These types help higher-level layers understand what kind of operation is stored. The exact meaning still belongs to the module that created the payload.

## WAL status

A WAL record can also have a lifecycle status.

Common statuses include `Pending`, `Persisted`, `Applied`, and `Failed`.

A typical flow is:

```txt
Pending
  ↓
Persisted
  ↓
Applied
```

## Basic write flow

A simplified WAL write flow looks like this:

```txt
create operation payload
  ↓
append record
  ↓
assign sequence
  ↓
flush if required
  ↓
return sequence
```

In C++ engine-level code, the flow looks like this:

```cpp
#include <softadastra/wal/Wal.hpp>

using namespace softadastra;

int main()
{
    wal::writer::WalWriter writer{
        wal::core::WalConfig::durable("data/wal.log")};

    wal::core::WalRecord::Payload payload{1, 2, 3, 4};

    auto result = writer.append(
        wal::types::WalRecordType::Put,
        std::move(payload));

    if (result.is_err())
    {
        return 1;
    }

    auto sequence = result.value();

    return sequence > 0 ? 0 : 1;
}
```

At the SDK level, you usually do not create a `WalWriter` manually. You enable persistence through `ClientOptions`.

## WAL through the SDK

For application developers, the SDK hides the low-level WAL module.

In C++:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/app.wal");

Client client{options};
```

Or manually:

```cpp
ClientOptions options =
    ClientOptions::local("node-persistent");

options.enable_wal = true;
options.wal_path = "data/app.wal";
options.auto_flush = true;
```

Then a normal write can be persisted:

```cpp
client.put("settings/theme", "dark");
```

The developer uses the SDK. The SDK wires the store, WAL, and sync pipeline internally.

## Durable mode

Durable mode is for production-like local persistence.

```cpp
auto config =
    wal::core::WalConfig::durable("data/wal.log");
```

Durable mode should prioritize safety. It is useful when accepted operations should survive restart or crash.

Use durable mode for offline-first applications, local-first applications with recovery, sync pipelines, user data, long-running nodes, and edge systems.

## Fast mode

Fast mode is useful for tests or benchmarks.

```cpp
auto config =
    wal::core::WalConfig::fast("data/wal.log");
```

Fast mode may reduce write overhead by relaxing automatic flush behavior. Use it when you need speed for controlled environments, but not as the default durability mode for important user data.

## Memory-only mode

When WAL is disabled, the system can still work locally, but it is not durable after restart.

```cpp
ClientOptions options =
    ClientOptions::local("node-memory");

options.enable_wal = false;
```

This is useful for tests, demos, temporary state, examples, and short-lived applications.

But memory-only mode should not be used when local writes must survive process restart.

## WAL and Store

The store uses the WAL to make local state recoverable.

The relationship is:

```txt
Operation
  ↓
encode operation
  ↓
append to WAL
  ↓
apply to store
  ↓
materialized state
```

The WAL is the operation history. The store is the current readable state.

```txt
WAL   -> what happened
Store -> current value
```

For example, given these operations: `Put user:1 = Ada`, `Put user:2 = Gaspard`, `Update user:1 = Ada Lovelace`, `Delete user:2` — after replay, the store can rebuild the current state.

## WAL and Sync

The sync layer depends on local operations being safe to track.

If an operation is durable locally, sync can retry later without relying only on memory.

```txt
local operation
  ↓
WAL
  ↓
store
  ↓
sync outbox
  ↓
transport later
```

The WAL does not send operations to peers. It gives the local node a durable foundation so sync can be retried after interruptions.

## WAL and recovery

Recovery means rebuilding state from durable records.

A recovery flow looks like this:

```txt
process starts
  ↓
open WAL
  ↓
read records in order
  ↓
stop at invalid trailing record
  ↓
replay valid records
  ↓
restore local state
```

The important rule is: recovery must be deterministic. The same valid WAL should produce the same replay result.

## WAL replay

Replay applies stored records in order.

```txt
record 1
  ↓
record 2
  ↓
record 3
  ↓
current state
```

Engine-level replay can look like this:

```cpp
wal::replay::WalReplayer replayer{"data/wal.log"};

auto result = replayer.replay(
    [](const wal::core::WalRecord &record)
    {
        // apply record deterministically
    });

if (result.is_err())
{
    return 1;
}
```

Replay is useful for recovery, rebuilding materialized state, snapshot creation, debugging, and deterministic tests.

## WAL reading

A WAL can be read all at once:

```cpp
wal::reader::WalReader reader{"data/wal.log"};

auto records = reader.read_all();

if (records.is_ok())
{
    for (const auto &record : records.value())
    {
        // inspect record
    }
}
```

For large logs, streaming is better:

```cpp
auto result = reader.for_each(
    [](const wal::core::WalRecord &record)
    {
        // process record
    });
```

This allows tools to process records without loading everything into memory at once.

## WAL and corrupted records

A crash can leave an incomplete trailing record.

The safe behavior is to read valid records, detect an invalid or incomplete record, stop safely, and not apply corrupted bytes.

Softadastra should recover known-good records without inventing state from corrupted data.

Possible invalid record causes include an incomplete write, unsupported version, invalid magic value, payload size too large, checksum mismatch, or truncated payload.

The goal is safety, not guessing.

## Checksums

A WAL can use checksums to detect corrupted payloads.

Conceptually:

```txt
payload
  ↓
checksum
  ↓
write record
```

During read:

```txt
read payload
  ↓
recompute checksum
  ↓
compare
  ↓
accept or reject
```

Checksums help avoid applying corrupted data during recovery.

## WAL and partial execution

Partial execution can happen if a process stops in the middle of a flow.

If the WAL append succeeds but the process stops before sync, after restart the WAL record can still be replayed.

If the WAL append fails, the operation should return an error and durability should not be claimed.

This is why explicit error handling matters.

## Error handling

The WAL API uses explicit result values.

```cpp
auto result = writer.flush();

if (result.is_err())
{
    const auto &error = result.error();

    std::cerr << error.message() << "\n";
}
```

This matches the broader Softadastra design: no hidden success, no silent durability claim, errors must be visible.

The caller should know whether the operation was accepted or not.

## WAL and filesystem events

The WAL can also persist filesystem events from the `fs` module.

For example, a file creation event becomes a WAL record that can be replayed later.

A filesystem event can be mapped to a WAL record type: `Created` → `Put`, `Updated` → `Update`, `Deleted` → `Delete`.

The WAL still only stores records. It does not decide how to synchronize files.

## WAL and snapshots

A WAL can grow over time.

Snapshots can be used to capture the current materialized state at a point in time.

```txt
WAL history
  ↓
replay into state
  ↓
snapshot
```

After a snapshot, a system can keep newer records separately and avoid replaying the full history forever.

In Softadastra, snapshot logic belongs to higher-level modules such as `store`.

## WAL and determinism

The WAL must support deterministic replay.

That means: same records, same order, same replay logic, same result.

This is important for recovery, debugging, sync correctness, tests, and convergence reasoning.

If replay depends on random order or hidden global state, recovery becomes unsafe.

## WAL in the full runtime flow

The WAL sits early in the runtime pipeline.

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
```

It comes before synchronization because synchronization can fail. The local node needs durability before depending on the network.

## What happens when WAL is disabled

When WAL is disabled:

```txt
local write
  ↓
store apply
  ↓
sync tracking, if enabled
```

This can be useful for memory-only demos and tests. But if the process restarts, memory-only state can be lost.

Use WAL-backed persistence when local data matters.

## What the SDK should hide

Application developers using the SDK should not need to manually create `WalWriter`, `WalReader`, `WalReplayer`, `WalRecord`, `Sequence`, or `WalConfig`.

Instead, they should choose a mode:

```cpp
ClientOptions::memory_only("node")
ClientOptions::local("node")
ClientOptions::persistent("node", "data/app.wal")
```

The SDK should wire the correct internal modules.

## Common mistakes

### Treating WAL as a database

The WAL is not the database. It is the operation log. The store provides current readable state.

```txt
WAL   -> history
Store -> current state
```

### Treating WAL as sync

The WAL does not send data to peers. Sync handles propagation.

```txt
WAL  -> durability
Sync -> propagation
```

### Treating memory-only as durable

Memory-only mode can work locally, but it does not survive restart. Use persistent mode when local writes must be recoverable.

### Ignoring WAL errors

If a WAL append fails, the caller must handle the error. Do not treat the operation as durably accepted.

## Summary

The WAL is the durability layer of Softadastra.

It provides ordered operation records, monotonic sequence numbers, durable local history, deterministic replay, recovery after restart, safer sync tracking, and protection against partial execution.

Its rule is:

> Write first. Apply later.

The WAL does not replace store, sync, transport, or discovery. It gives them a safe local foundation.

## Next step

Continue with the outbox:

[Go to Outbox](/concepts/outbox)
