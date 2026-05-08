# Sync Engine

The sync engine is the part of Softadastra that turns local operations into synchronization work.

It does not own the network. It does not discover peers. It does not replace the store. It coordinates how operations move between local state and other nodes.

The core rule is:

> Persist locally first. Sync later.

## Why Softadastra needs a sync engine

Softadastra is local-first.

That means a local write can happen before any remote peer is available:

```cpp
client.put("profile/name", "Ada");
```

But local-first applications still need synchronization.

At some point, the operation may need to move to another node:

```txt
local write
  ↓
local store
  ↓
sync operation
  ↓
outbox
  ↓
transport
  ↓
remote node
```

The sync engine coordinates that middle part.

It decides what should be tracked, what should be queued, what is ready to send, what is waiting for ACK, what should be retried, what remote operation can be applied, and what conflict policy should be used.

## Sync does not mean transport

A common mistake is to think sync and transport are the same thing. They are not.

```txt
Sync       -> operation propagation logic
Transport  -> message delivery
```

The sync engine prepares operations and tracks their lifecycle. The transport layer moves bytes between peers.

This separation matters because Softadastra should be able to support different delivery systems later: TCP, HTTP, WebSocket, LAN, P2P, store-and-forward, or custom transport.

The sync engine should not care how the message is delivered.

## Sync does not mean storage

Sync is also not the local store.

```txt
Store -> current local state
Sync  -> propagation of operations
```

The store answers: what is the current value of this key?

The sync engine answers: what local operations still need to be synchronized?

A local write can update the store and create sync work.

```txt
client.put()
  ↓
store operation
  ↓
store apply
  ↓
sync tracking
```

## The main sync flow

A simplified local sync flow looks like this:

```txt
local operation
  ↓
store apply
  ↓
sync operation created
  ↓
sync envelope created
  ↓
outbox entry added
  ↓
queue selects order
  ↓
next batch produced
  ↓
transport sends batch
  ↓
ACK received
  ↓
entry completed or retried
```

This is the flow the sync engine controls.

## Local operation submission

A local operation starts with application code.

At the SDK level:

```cpp
client.put("message/1", "hello");
```

At the engine level, this can become a store operation:

```cpp
auto operation = store::core::Operation::put(
    store::types::Key{"message/1"},
    store::types::Value::from_string("hello"));
```

Then the sync engine can submit it:

```cpp
auto submitted =
    engine.submit_local_operation(operation);
```

A submitted operation receives sync metadata.

## SyncOperation

A `SyncOperation` wraps a store operation with synchronization metadata.

Conceptually, it contains a sync id, origin node id, version, operation, timestamp, and direction.

The sync id uniquely identifies the operation in the sync pipeline. The origin node id tells where the operation came from. The version helps order operations. The direction tells whether the operation is `local` (created by this node) or `remote` (received from another node).

## SyncEnvelope

A `SyncEnvelope` wraps a `SyncOperation` with runtime state.

It tracks status, ACK status, retry count, last attempt time, and next retry time.

The operation is the data. The envelope is the pipeline state.

A sync operation may be: `pending`, `queued`, `in flight`, `acknowledged`, `applied`, or `failed`.

This makes the sync pipeline observable.

## Outbox

The outbox stores operations waiting for synchronization.

```txt
SyncOperation
  ↓
SyncEnvelope
  ↓
OutboxEntry
  ↓
Outbox
```

The outbox exists because network delivery may not be possible immediately.

A local operation can wait until transport starts, a peer connects, a retry interval passes, an ACK arrives, or completed entries are pruned.

The outbox is the memory of pending sync work.

## SyncQueue

The queue decides the order of work ready to send.

A deterministic queue matters because synchronization must be explainable.

Softadastra can order operations by version, timestamp, and sync id.

This avoids relying on random insertion order or unstable runtime behavior.

```txt
outbox contains tracked work
queue selects ready work
batch exposes sendable work
```

## Next batch

The sync engine exposes work through a batch.

At engine level:

```cpp
auto batch = engine.next_batch();
```

At SDK level, a manual tick can produce a batch-like result:

```cpp
auto tick = client.tick();

if (tick.is_ok())
{
    std::cout << "batch: "
              << tick.value().batch_size
              << "\n";
}
```

A batch contains operations that are ready for transport.

The sync engine does not send the batch by itself. Transport sends it.

## Manual sync tick

Softadastra exposes manual sync ticks because explicit synchronization is easier to test, debug, and control.

At SDK level:

```cpp
auto tick = client.tick();
```

A tick can retry expired operations, collect the next batch, prepare work for delivery, and prune completed work when requested.

With pruning:

```cpp
auto tick = client.tick(true);
```

Manual ticking is useful for CLI commands, tests, embedded runtimes, deterministic demos, applications that own their event loop, and systems that avoid hidden background threads.

## Sync state

The sync engine exposes state.

At SDK level:

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

    std::cout << "in flight: "
              << state.value().in_flight_count
              << "\n";

    std::cout << "failed: "
              << state.value().failed_count
              << "\n";
}
```

This is important because synchronization should not be invisible.

A developer should be able to inspect pending work, queued work, in-flight work, acknowledged work, failed work, retry count, last submitted version, and last applied remote version.

## Acknowledgements

An acknowledgement, or ACK, confirms that sync work was received or processed.

A simplified lifecycle is:

```txt
queued
  ↓
in flight
  ↓
waiting for ACK
  ↓
acknowledged
```

If the ACK arrives, the operation is marked acknowledged. If the ACK does not arrive, a timeout triggers a retry.

The sync engine tracks ACK state so delivery uncertainty can be handled safely.

## AckTracker

The ACK tracker records operations waiting for acknowledgement.

Conceptually:

```txt
track sync id
  ↓
wait until timeout
  ↓
ack received or expired
```

A simple engine-level flow:

```cpp
sync::ack::AckTracker tracker;

tracker.track(
    "node-a-1",
    core::time::Duration::from_seconds(10));

tracker.ack("node-a-1");
```

The SDK usually hides this detail. The developer sees it through sync state and ticks.

## Retry

Retry is central to offline-first synchronization.

A sync operation may fail to send because the peer is unavailable, transport is stopped, the connection was reset, the ACK was lost, a timeout was reached, or the network is unstable.

A failed delivery attempt should not silently drop the operation.

The sync engine can retry expired work:

```cpp
auto retried = engine.retry_expired();
```

At SDK level:

```cpp
auto tick = client.tick();

if (tick.is_ok())
{
    std::cout << "retried: "
              << tick.value().retried_count
              << "\n";
}
```

Retry policy can include max retries, retry interval, ACK timeout, and require ACK.

## Failed sync work

If an operation exceeds its retry policy, it can become failed.

Failed sync work should be visible.

```cpp
auto state = client.sync_state();

if (state.is_ok() && state.value().has_failed())
{
    std::cout << "failed: "
              << state.value().failed_count
              << "\n";
}
```

A failed sync operation does not mean the local write disappeared. It means synchronization delivery failed according to the current policy.

## Remote operations

The sync engine also receives remote operations.

A remote operation flow looks like this:

```txt
transport receives message
  ↓
message dispatcher decodes sync operation
  ↓
sync engine receives remote operation
  ↓
validate
  ↓
resolve conflict if needed
  ↓
apply to local store
  ↓
send ACK
```

At engine level:

```cpp
auto result =
    engine.receive_remote_operation(remote_sync_operation);
```

Remote operations must be validated before they affect local state.

## Remote apply

Remote apply means taking an operation that came from another node and applying it locally.

This can involve checking operation validity, checking versions, detecting conflicts, applying the store operation, updating sync state, and returning a result.

A remote operation must not blindly mutate local state. It must go through the sync engine.

## Conflict handling

Conflicts are normal in local-first systems.

For example, node A writes `doc:1 = "local"`, node B writes `doc:1 = "remote"`, both reconnect later.

The sync engine can use a conflict policy. Common policies include `LastWriteWins`, `KeepLocal`, `KeepRemote`, and `Manual`.

The important rule is: conflict handling must be deterministic.

If the same inputs are replayed, the same conflict resolution should happen.

### Last-write-wins

`LastWriteWins` is a common default policy. It decides based on operation metadata such as timestamp or version.

This policy is simple and useful for early systems, but it may not be correct for every application. Some applications may later need custom merge logic.

## Sync and convergence

The sync engine is not only about sending data. It is about moving nodes toward convergence.

Convergence means: after peers exchange operations and conflicts are resolved deterministically, nodes move toward a coherent state.

The sync engine helps convergence by making operation propagation tracked, ordered, retryable, observable, and deterministic.

## Sync without transport

Sync can still exist without transport.

```cpp
ClientOptions options =
    ClientOptions::local("node-local");

options.enable_transport = false;
options.enable_discovery = false;
```

A local write can still update the store and create sync state.

```cpp
client.put("profile/name", "Ada");

auto state = client.sync_state();
```

This is useful for tests, offline-only apps, deterministic demos, and custom transports.

Transport is optional. Sync tracking can still be useful.

## Sync with WAL

For durable synchronization, WAL should be enabled.

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-sync",
        "data/sync.wal");
```

This means local operations can be persisted before they are synchronized.

The stronger flow is:

```txt
local write
  ↓
WAL append
  ↓
store apply
  ↓
sync operation
  ↓
outbox
```

If the process restarts, durable operations can be recovered and synchronization can continue.

## Sync with transport

When transport is enabled, the sync engine can hand batches to the transport layer.

```txt
sync next batch
  ↓
transport message
  ↓
peer
```

At SDK level:

```cpp
client.start_transport();

Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

client.connect(peer);

client.put("message/1", "hello");

client.tick();
```

If transport fails, the operation remains tracked for retry.

## Sync with discovery

Discovery can find peers. Transport can connect to them. Sync can then send operations.

```txt
Discovery finds peers
  ↓
Transport connects peers
  ↓
Sync sends operations
```

Discovery is not required for sync state to exist. It only helps the system find possible delivery targets.

## SDK view

The SDK exposes the sync engine through a small API.

C++:

```cpp
client.put("key", "value");
client.sync_state();
client.tick();
```

JavaScript:

```js
await client.put("key", "value");
const state = await client.syncStateInfo();
const tick = await client.tick();
```

Most application developers do not need to manually use `SyncEngine`, `SyncScheduler`, `Outbox`, `SyncQueue`, `AckTracker`, `RemoteApplier`, or `ConflictResolver`.

The SDK hides those details behind `Client`.

## Engine view

Inside the engine, sync is a focused module.

It includes `SyncConfig`, `SyncContext`, `SyncOperation`, `SyncEnvelope`, `SyncState`, `Outbox`, `SyncQueue`, `AckTracker`, `RemoteApplier`, `ConflictResolver`, `SyncEngine`, and `SyncScheduler`.

Each type has one responsibility. This separation keeps the sync pipeline testable and understandable.

## Common mistakes

### Treating sync as network

Sync is not network delivery. Transport sends bytes. Sync manages operation propagation.

### Treating sync as storage

Sync is not the store. The store holds current local state. Sync tracks what should be propagated.

### Hiding sync in background magic too early

A hidden background thread may be convenient, but it can make failures hard to debug. Manual ticks make the first SDK version easier to understand and test.

### Dropping work after one failed send

A failed send should not destroy sync work. Retry and failure state must be explicit.

### Ignoring ACK uncertainty

A missing ACK does not always mean the remote did not apply the operation. It means delivery state is uncertain. The sync engine must handle that safely.

## What the sync engine guarantees

The sync engine helps guarantee that local operations can be tracked, operations can be queued deterministically, batches can be produced for transport, ACKs can be tracked, expired work can be retried, remote operations can be applied locally, conflicts can be resolved deterministically, and sync state can be inspected.

## What the sync engine does not guarantee

The sync engine does not guarantee network delivery by itself, peer discovery, permanent persistence by itself, distributed consensus, conflict-free writes, or automatic global agreement.

Those responsibilities belong to other layers or higher-level application policy.

## The complete sync lifecycle

A complete lifecycle can look like this:

1. local write
2. store operation created
3. WAL append, if enabled
4. store apply
5. sync operation created
6. outbox entry added
7. operation queued
8. tick produces next batch
9. transport sends batch
10. remote node receives operation
11. remote node applies operation
12. remote node sends ACK
13. local node receives ACK
14. operation marked acknowledged
15. completed work is pruned

If transport fails:

```txt
send fails
  ↓
operation remains tracked
  ↓
retry interval passes
  ↓
tick retries
```

If a conflict appears:

```txt
remote operation received
  ↓
local state checked
  ↓
conflict policy applied
  ↓
deterministic result
```

## Summary

The sync engine is the operation propagation layer of Softadastra.

It provides sync metadata, outbox management, deterministic queueing, manual ticks, ACK tracking, retries, remote operation application, conflict resolution, and observable sync state.

Its core rule is:

> Persist locally first. Sync later.

## Next step

Continue with convergence:

[Go to Convergence](/concepts/convergence)
