# Failure Model

Softadastra is designed for systems where failure is normal.

The network can fail. Peers can disappear. Processes can restart. Acknowledgements can arrive late. Synchronization can be interrupted.

Softadastra does not try to pretend these failures do not exist. It builds the runtime model around them.

The core rule is:

> Failure should delay synchronization, not destroy local work.

## Why a failure model matters

A system that does not define its failure model usually behaves unpredictably when things go wrong.

For local-first and offline-first systems, this is dangerous because local work can happen before the network is available.

Softadastra needs clear answers to questions like:

```txt
What happens if the network fails after a local write?
What happens if the process restarts before sync completes?
What happens if a peer receives an operation but the ACK is lost?
What happens if two nodes edit the same key while disconnected?
What happens if discovery finds no peers?
```

The failure model defines how the system should behave in those cases.

## The basic assumption

Softadastra assumes that every external dependency can fail.

```txt
network      -> can fail
peer         -> can disappear
transport    -> can disconnect
discovery    -> can return no peers
sync         -> can be interrupted
process      -> can restart
disk write   -> can fail
remote ACK   -> can arrive late or never arrive
```

The system is designed so these failures are handled at the correct layer.

## Local writes must remain local

The most important rule is: a valid local write should not become invalid because the network failed later.

For example:

```cpp
client.put("draft/1", "hello");
```

If this write succeeds locally, a later transport failure should not erase it.

```txt
local write succeeds
  ↓
transport fails
  ↓
local state remains valid
```

Transport failure is a delivery problem. It is not a local state problem.

## Failure should be isolated

Each module has a specific responsibility.

```txt
store      -> local state
wal        -> durability
sync       -> operation tracking
transport  -> message delivery
discovery  -> peer discovery
metadata   -> node description
```

A failure in one layer should not automatically corrupt another layer.

For example, a discovery failure means no peers are found, but the local store still works. A transport failure means the message was not delivered, but sync can retry later. A sync failure means the operation remains tracked, but the local value remains readable.

This separation keeps failure understandable.

## Network failure

The network can fail at any moment.

It can fail before a message is sent:

```txt
operation queued
  ↓
transport unavailable
  ↓
operation stays pending
```

It can fail during send:

```txt
message in flight
  ↓
connection drops
  ↓
operation waits for retry
```

It can fail after the remote side receives the operation but before the local node receives an acknowledgement:

```txt
remote receives operation
  ↓
ACK lost
  ↓
local node retries
```

The sync layer must treat this as a retryable condition.

## Peer failure

A peer can disappear without warning.

```txt
peer connected
  ↓
peer stops responding
  ↓
transport marks peer unavailable
  ↓
sync keeps local work tracked
```

A peer disappearing should not affect local state. It only affects delivery. When the peer returns, sync can continue.

## Discovery failure

Discovery may find no peers. That is not fatal.

```txt
discovery starts
  ↓
no peer found
  ↓
local writes continue
```

Discovery answers which peers are available nearby. It does not answer whether this node can write local data. So discovery failure must not block local work.

## Transport failure

Transport moves bytes between peers.

It can fail because the peer is offline, the port is closed, the connection is refused, the socket closes, the network is unstable, or the frame cannot be delivered.

In Softadastra, transport failure should be handled as a delivery failure.

```txt
sync operation
  ↓
transport send fails
  ↓
operation remains tracked
  ↓
retry later
```

Transport does not decide whether the operation is valid. Sync owns operation meaning.

## ACK failure

An acknowledgement, or ACK, confirms that a peer received or processed sync work.

ACKs can fail in several ways: never sent, sent but lost, delayed, or arriving after retry.

The sync layer must not assume that a missing ACK means the original operation is invalid. It usually means delivery is uncertain.

That is why sync needs ACK tracking, timeouts, retry intervals, and retry counters.

A typical lifecycle is:

```txt
queued
  ↓
in flight
  ↓
waiting for ACK
  ↓
timeout
  ↓
retry
```

If the ACK arrives, the operation can be marked acknowledged. If not, the operation may be retried until the retry policy is exhausted.

## Process restart

A process can stop or restart before synchronization completes.

Without durability, in-memory state can be lost.

With WAL-backed persistence, the system can recover accepted operations.

```txt
operation accepted
  ↓
WAL append
  ↓
process restart
  ↓
WAL replay
  ↓
state restored
```

The stronger rule is: if an operation is accepted as durable, it must be recoverable after restart.

## Partial execution

A system can fail in the middle of a flow.

For example, a WAL append succeeds but the store apply fails. Or the store apply succeeds but the sync queue update fails.

Softadastra avoids hiding these cases by using explicit results.

At SDK level, operations return result values:

```cpp
auto result = client.put("key", "value");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
}
```

Failures should be visible to the caller.

## Disk failure

If WAL persistence is enabled, disk writes can fail.

Possible causes include a missing directory, permission error, full disk, invalid path, interrupted write, or filesystem error.

When the WAL cannot persist an operation, the operation should not be treated as durably accepted.

```txt
operation
  ↓
WAL append fails
  ↓
return error
  ↓
caller decides what to do
```

This prevents the system from claiming durability it does not have.

## Corrupted WAL

A WAL file can contain an incomplete or corrupted trailing record after a crash or interrupted write.

The safe behavior is to read valid records, stop at the first invalid record, and not apply corrupted trailing data.

The goal is to recover everything that is known to be valid, without inventing state from corrupted bytes.

## Remote operation failure

A remote operation can fail when applied locally.

Reasons may include an invalid operation, invalid key, invalid payload, conflict, unsupported version, or local policy rejection.

The sync layer must treat remote operations carefully:

```txt
receive remote operation
  ↓
validate
  ↓
resolve conflict if needed
  ↓
apply or reject
  ↓
ack or report failure
```

A remote operation must not blindly corrupt local state.

## Conflict failure

Conflicts are normal in local-first systems.

For example, node A writes `doc:1 = "local"`, node B writes `doc:1 = "remote"`, both were offline, and both reconnect.

This is not a transport failure. It is a state conflict.

Softadastra should resolve it using a deterministic policy such as `LastWriteWins`, `KeepLocal`, `KeepRemote`, or `Manual`.

The important rule is: conflict handling must be deterministic and explainable.

## Duplicate delivery

Because retries are possible, the same operation may be delivered more than once.

This can happen when an operation is sent, the remote applies it, the ACK is lost, the local node retries, and the remote sees it again.

The system should be designed so duplicate delivery does not create invalid state. Sync IDs, versions, idempotent deletes, and deterministic application rules help with this.

## Out-of-order delivery

Network messages may arrive out of order.

Softadastra sync operations carry metadata such as versions, timestamps, and sync ids. This helps the sync layer process operations deterministically.

The queue should not depend only on arrival order. A stable ordering model is important: version, timestamp, sync id.

## No hidden correctness from the network

Softadastra should not rely on the network to make local state correct.

The network helps nodes exchange operations. It should not be required for local write, local read, local metadata, local sync tracking, or local recovery.

This is why the system is built around local correctness first.

## What should happen under failure

The expected behavior is:

- local write succeeds → local state remains valid
- WAL append succeeds → operation can be recovered
- transport send fails → operation remains tracked
- ACK does not arrive → operation can be retried
- discovery finds no peers → local work continues
- peer disappears → delivery waits
- process restarts → durable state is replayed
- conflict appears → deterministic policy resolves it

## What should not happen

Softadastra should avoid these behaviors:

- network failure deletes local data
- missing peer blocks local write
- discovery failure makes store unusable
- transport failure corrupts sync state
- ACK loss silently drops operation
- restart loses durable accepted operation
- conflict resolution depends on random order

These are the kinds of problems the failure model is designed to prevent.

## Failure and observability

Failures must be observable.

The SDK exposes results and state:

```cpp
auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: "
              << state.value().outbox_size
              << "\n";

    std::cout << "failed: "
              << state.value().failed_count
              << "\n";

    std::cout << "retries: "
              << state.value().total_retries
              << "\n";
}
```

A developer should be able to inspect queued work, in-flight work, acknowledged work, failed work, retry count, peer state, and node metadata.

If the system fails, it should explain where the failure happened.

## The failure model in one flow

```txt
Local write
  ↓
WAL append, if enabled
  ↓
Store apply
  ↓
Sync outbox
  ↓
Sync queue
  ↓
Transport send
  ↓
ACK wait
  ↓
Retry if needed
  ↓
Remote apply
  ↓
Converge later
```

Failures can happen at each step. The system should preserve what has already been safely accepted and expose what still needs to happen.

## Summary

Softadastra assumes failure is normal.

Its failure model is based on these rules:

- local work should survive network failure
- transport failure is not local state failure
- discovery failure is not local store failure
- missing ACK means delivery is uncertain
- retry must be safe
- WAL-backed accepted operations must be recoverable
- remote operations must be validated
- conflicts must be deterministic
- failures must be observable

## Next step

Continue with the Write-Ahead Log:

[Go to Write-Ahead Log](/concepts/wal)
