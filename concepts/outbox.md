# Outbox

The outbox is the place where local operations wait before they are synchronized.

In Softadastra, a local write can succeed even when no peer is connected. The operation is applied locally first, then tracked for later synchronization.

The core rule is:

> Accept local work first. Deliver it later.

## Why Softadastra needs an outbox

Offline-first systems cannot assume that a peer is always reachable.

A user can write data while the network is unavailable, transport is stopped, discovery found no peers, the remote node is offline, an acknowledgement is delayed, or a previous send attempt failed.

If local work had to wait for the network, the application would not be offline-first.

The outbox solves this by keeping operations that still need synchronization.

```txt
local write
  ↓
store apply
  ↓
sync operation
  ↓
outbox
  ↓
send later
```

## The simple mental model

Think of the outbox like a reliable "to-send" list.

```txt
operation accepted locally
  ↓
operation waits in outbox
  ↓
sync tick selects work
  ↓
transport sends it
  ↓
ACK confirms it
  ↓
operation is completed
```

The outbox does not mean the operation is invalid. It means the operation is local and still waiting to be delivered or acknowledged.

## Outbox versus WAL

The WAL and the outbox are related, but they are not the same thing.

```txt
WAL    -> durable operation history
Outbox -> pending synchronization work
```

The WAL answers: what operations were accepted locally?

The outbox answers: what operations still need to be synchronized?

A durable local-first flow can look like this:

```txt
local write
  ↓
WAL append
  ↓
store apply
  ↓
sync operation created
  ↓
outbox entry added
```

The WAL protects durability. The outbox tracks delivery progress.

## Outbox versus queue

The outbox stores pending sync work. The queue decides the next send order.

```txt
outbox
  ↓
sync queue
  ↓
next batch
  ↓
transport
```

The outbox is the set of tracked work. The queue is the ordered view of work ready to send.

A stable send order matters because sync must be deterministic.

Softadastra can order sync operations by version, timestamp, and sync id.

## What the outbox stores

An outbox entry usually wraps a sync envelope.

A sync envelope tracks the sync operation, status, ACK status, retry count, last attempt time, and next retry time.

A sync operation contains the original store operation plus synchronization metadata: sync id, origin node id, version, timestamp, direction, and operation.

This metadata lets Softadastra know where the operation came from, whether it is local or remote, what version it has, whether it is ready to send, whether it is waiting for ACK, and whether it can be retried.

## Local operation flow

A local write can create outbox work.

```cpp
client.put("profile/name", "Ada");
```

Conceptually, this can produce:

```txt
store operation
  ↓
sync operation
  ↓
sync envelope
  ↓
outbox entry
```

Then the sync state can show pending work:

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

At SDK level, you do not manually create outbox entries. The SDK hides that wiring behind `Client`.

## Outbox and manual ticks

A sync tick moves the pipeline forward once.

```cpp
auto tick = client.tick();
```

A tick can retry expired operations, collect the next batch, prepare work for transport, and prune completed entries when requested.

Conceptually:

```txt
outbox
  ↓
next batch
  ↓
transport, if enabled
```

This makes the outbox observable and testable.

## Why not send immediately?

Softadastra does not require a network send to happen immediately after a local write. That is intentional.

Immediate send is not always possible: the device may be offline, the peer may not be known yet, transport may not be started, the application may want manual control, the runtime may be embedded, or tests may need deterministic behavior.

So the better model is: local write now, sync when possible.

This keeps local correctness separate from remote delivery.

## Outbox and transport

Transport is the delivery layer. The outbox does not connect to peers by itself.

```txt
outbox
  ↓
sync batch
  ↓
transport
  ↓
peer
```

Transport failure does not invalidate the outbox entry.

If send fails:

```txt
send attempt
  ↓
transport failure
  ↓
entry remains tracked
  ↓
retry later
```

The operation remains local and pending.

## Outbox and discovery

Discovery can help find peers, but the outbox does not depend on discovery.

If no peer is discovered, local operations can still wait in the outbox.

```txt
local write
  ↓
outbox
  ↓
no peer yet
  ↓
wait
```

Later:

```txt
peer discovered
  ↓
transport connects
  ↓
sync sends outbox work
```

This is what makes the outbox useful for offline-first systems.

## Outbox and acknowledgements

When an operation is sent, the system may wait for an acknowledgement.

A simplified lifecycle is:

```txt
queued
  ↓
in flight
  ↓
waiting for ACK
  ↓
acknowledged
  ↓
applied or completed
```

If the ACK does not arrive in time:

```txt
waiting for ACK
  ↓
timeout
  ↓
retry
```

This is why an outbox entry needs status, retry count, and timing metadata.

## Outbox and retries

Retry is one of the main reasons the outbox exists.

A retryable operation should not disappear after one failed send.

```txt
send fails
  ↓
entry remains in outbox
  ↓
retry interval passes
  ↓
operation becomes ready again
  ↓
send again
```

Retry policy can include max retries, retry interval, and ACK timeout.

At SDK level, this can be configured through client options when exposed: `max_retries`, `retry_interval_ms`, `ack_timeout_ms`, `require_ack`.

The principle is simple: delivery failure should not silently drop local work.

## Outbox and duplicate delivery

Retries can create duplicate delivery.

For example, an operation is sent, the remote applies it, the ACK is lost, the local node retries, and the remote receives the same operation again.

This is normal in unreliable networks.

The system should identify operations using stable sync ids and versions so duplicates can be handled safely.

## Outbox and pruning

Completed entries should not stay forever.

Once work is acknowledged and no longer needed, it can be pruned.

```cpp
auto tick = client.tick(true);
```

With pruning enabled, a tick can remove completed work.

Pruning should never remove work that still needs delivery.

## Outbox and failed entries

If an operation exceeds its retry policy, it may become failed.

```txt
queued
  ↓
send fails
  ↓
retry
  ↓
send fails again
  ↓
max retries reached
  ↓
failed
```

A failed entry should be observable.

```cpp
auto state = client.sync_state();

if (state.is_ok() && state.value().has_failed())
{
    std::cout << "failed: "
              << state.value().failed_count
              << "\n";
}
```

Failed does not mean local data is gone. It means synchronization delivery failed according to the current retry policy.

## Outbox and remote operations

The outbox mainly tracks local operations waiting to be sent.

Remote operations follow a different path:

```txt
receive remote operation
  ↓
validate
  ↓
resolve conflict if needed
  ↓
apply locally
  ↓
send ACK
```

Remote operations may create local state changes, but they are not the same as local outbound work.

## SDK view

In the SDK, the outbox is visible through sync state, not through a low-level outbox object.

C++:

```cpp
auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << state.value().outbox_size << "\n";
}
```

JavaScript:

```js
const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(state.value().outboxSize);
}
```

This is intentional. Application developers should not need to manually manage `Outbox`, `OutboxEntry`, `SyncEnvelope`, `SyncQueue`, or `AckTracker`.

They should use `put`, `sync_state`, `tick`, `transport`, and `discovery`.

## Engine view

Inside the engine, the outbox belongs to the sync module.

A simplified internal flow is:

```txt
Store operation
  ↓
SyncOperation
  ↓
SyncEnvelope
  ↓
OutboxEntry
  ↓
Outbox
  ↓
SyncQueue
  ↓
next_batch()
```

The outbox tracks work. The queue selects ordered work. Transport sends the resulting batch.

## Example lifecycle

A complete outbox lifecycle can look like this:

1. `client.put("message/1", "hello")`
2. Store applies local value
3. Sync operation is created
4. Outbox entry is added
5. Tick selects next batch
6. Transport sends batch
7. Remote applies operation
8. Remote sends ACK
9. Local node receives ACK
10. Outbox entry is marked acknowledged
11. Completed entry is pruned

If transport fails at step 6:

```txt
transport fails
  ↓
entry remains tracked
  ↓
retry interval passes
  ↓
tick retries operation
```

## What the outbox guarantees

The outbox helps guarantee that local work can wait for synchronization, send attempts can be retried, ACK state can be tracked, delivery progress is observable, pending sync work is not silently forgotten, and transport failure does not invalidate local work.

## What the outbox does not guarantee

The outbox does not guarantee network delivery, peer availability, conflict-free remote apply, distributed consensus, permanent persistence by itself, or transport connection.

Persistence belongs to WAL. Delivery belongs to transport. Conflict handling belongs to sync policy.

## Common mistakes

### Treating the outbox as storage

The outbox is not the application store. It tracks synchronization work. Use the store for current local state.

### Treating the outbox as transport

The outbox does not send bytes. Transport sends bytes.

### Treating an empty outbox as global convergence

An empty local outbox means the local node has no pending outbound work according to its current state. It does not automatically prove that every peer in the system has converged.

### Dropping entries after one failure

A failed send should not silently remove the operation. Retry and failure state must be explicit.

## Summary

The outbox is the pending synchronization layer.

It allows Softadastra to accept local work first, then deliver it later.

Its role is: track local operations until they are sent, acknowledged, failed, or completed.

The outbox is one of the key parts that makes Softadastra offline-first.

## Next step

Continue with the sync engine:

[Go to Sync Engine](/concepts/sync-engine)
