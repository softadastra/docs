# Convergence

Convergence is the goal of synchronization.

In Softadastra, nodes can work locally first, then exchange operations later. During disconnection, their local states may temporarily diverge. After synchronization, they should move toward a coherent state according to deterministic rules.

The core rule is:

> Nodes may diverge temporarily, but synchronization should move them toward a deterministic result.

## Why convergence matters

Local-first systems allow work to happen before the network is available.

That means two nodes can update their local state independently.

```txt
node A writes locally
node B writes locally
network is unavailable
both nodes continue working
```

When the nodes reconnect, the system needs to decide how to merge or apply those operations. That process is what convergence is about.

## Divergence is normal

In a cloud-first system, the server often acts as the immediate source of truth.

```txt
client
  ↓
server
  ↓
database
```

In a local-first system, nodes can work independently.

```txt
node A local state
node B local state
node C local state
```

When nodes are disconnected, they may not have the same data.

This is not automatically a failure. It is a normal part of local-first execution.

## The Softadastra model

Softadastra accepts temporary divergence.

The model is:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

Convergence is the final part of that model. It means that after operations are exchanged and conflicts are resolved, nodes should move toward a coherent state.

## A simple example

Imagine two nodes.

Node A writes:

```txt
profile/name = Ada
```

Node B is offline.

At that moment:

```txt
node A -> profile/name = Ada
node B -> no value yet
```

The nodes are divergent.

Later, node B reconnects and receives the operation.

After sync:

```txt
node A -> profile/name = Ada
node B -> profile/name = Ada
```

The nodes have converged for that key.

## Convergence is eventual

Convergence does not mean every node is always identical immediately. That would require constant connectivity and strict coordination.

Softadastra is built for real-world conditions, so convergence is eventual:

```txt
local write now
sync later
retry if needed
apply remote operations
resolve conflicts
eventually reach a coherent state
```

The system must keep local work valid while synchronization is still pending.

## Convergence depends on deterministic rules

If two nodes receive the same operations, they should resolve them the same way.

That requires deterministic rules.

```txt
same input operations
same ordering rule
same conflict policy
same result
```

Without determinism, replay and synchronization can produce different states on different nodes. That makes recovery and debugging unsafe.

## Operation ordering

Softadastra sync operations carry metadata that can be used for stable ordering.

A deterministic ordering model can use version, timestamp, and sync id.

This helps avoid depending on unstable runtime behavior, random map order, or network arrival order.

The network may deliver messages in any order. The sync layer should still have enough metadata to reason about them.

## Out-of-order delivery

Messages can arrive out of order.

For example, node A sends operation 1, node A sends operation 2, and the network delivers operation 2 first.

A synchronization system must not assume the network preserves perfect order. It should use operation metadata to decide how to apply, delay, or resolve operations.

## Duplicate delivery

Retries can create duplicate delivery.

For example, node A sends operation X, node B applies it, the ACK is lost, node A retries, and node B receives operation X again.

This is normal in unreliable systems.

A convergence-oriented sync engine should identify operations by stable sync ids and avoid turning duplicate delivery into duplicate state changes.

## Conflict example

Conflicts happen when multiple nodes change the same logical data independently.

For example, node A writes `doc:1 = local`, node B writes `doc:1 = remote`, both nodes were offline, and both reconnect.

Now the system must decide what `doc:1` should become. This is not a transport problem. It is a state conflict.

## Conflict policies

Softadastra can use conflict policies to resolve conflicts.

Common policies include `LastWriteWins`, `KeepLocal`, `KeepRemote`, and `Manual`.

Each policy should be deterministic. The same conflict should produce the same result when replayed under the same conditions.

### LastWriteWins

`LastWriteWins` is a simple conflict policy.

It usually chooses the operation considered latest according to metadata such as timestamp or version.

For example, node A writes `doc:1` at time 100, node B writes `doc:1` at time 120, and `LastWriteWins` chooses node B.

This is simple and useful for early systems. But it is not always the right answer for every application. Some applications may need custom merge rules.

### KeepLocal

`KeepLocal` prefers the local state when a conflict is detected.

For example, local value is `local`, remote value is `remote`, policy is `KeepLocal`, and the result is `local`.

This can be useful when the local node owns the data or when remote operations should not override local state automatically.

### KeepRemote

`KeepRemote` prefers the remote operation when a conflict is detected.

For example, local value is `local`, remote value is `remote`, policy is `KeepRemote`, and the result is `remote`.

This can be useful when the remote node is trusted as the preferred source for that data.

### Manual

`Manual` means the system detects the conflict but does not automatically decide the final application-level meaning.

This can be useful for applications that need user choice or custom merge logic.

Manual conflict handling is more complex, but it can be necessary for important user data.

## Convergence and the WAL

The WAL helps convergence because it provides durable operation history.

```txt
operation
  ↓
WAL append
  ↓
replayable history
```

If a process restarts, valid WAL records can be replayed. This helps rebuild local state and continue synchronization.

Without durable history, a node may lose operations before they can be exchanged.

## Convergence and the store

The store holds current local state.

```txt
WAL history
  ↓
store replay/apply
  ↓
current state
```

Convergence is visible in the store because the store is where the current value lives.

The WAL records what happened. The store shows the current result.

## Convergence and the outbox

The outbox tracks local operations waiting to be synchronized.

```txt
local operation
  ↓
outbox
  ↓
send later
```

If the outbox still contains pending work, the node may not have fully shared its local changes yet.

The outbox is one of the mechanisms that helps nodes move toward convergence after disconnection.

## Convergence and transport

Transport moves sync messages between peers.

```txt
sync batch
  ↓
transport message
  ↓
peer
```

Transport does not decide the final state. It delivers operations. The sync engine applies deterministic rules.

## Convergence and discovery

Discovery helps find peers.

```txt
discovery finds peer
  ↓
transport connects peer
  ↓
sync exchanges operations
  ↓
nodes move toward convergence
```

If discovery finds no peers, convergence with other nodes is delayed. Local work remains valid.

## Convergence and metadata

Metadata helps describe nodes.

It can answer: who is this node, what capabilities does it support, and what version is it running?

This matters because convergence may depend on knowing whether a peer supports sync, transport, metadata, or other capabilities.

Metadata does not resolve conflicts by itself. It helps the system understand participants.

## Convergence is not consensus

Convergence is not the same as distributed consensus.

Consensus usually means a group of nodes agrees on a value through a strict protocol before committing.

Softadastra is local-first. It allows local work first, then synchronizes and resolves later.

```txt
consensus:
agree first
commit after

Softadastra:
write locally first
sync and converge later
```

Softadastra is not trying to replace consensus systems. It focuses on local durability, retryable synchronization, and deterministic convergence.

## Convergence is not instant consistency

Convergence does not mean every node is always up to date.

A disconnected node can be behind.

```txt
node A has latest value
node B is offline
node B is temporarily stale
```

When node B reconnects and receives operations, it can catch up. This is expected in offline-first systems.

## Convergence and user expectations

Application developers must understand that local-first systems have temporary states.

A UI may need to show: saved locally, waiting to sync, sync failed, retrying, synced, or conflict detected.

Softadastra exposes sync state so applications can make this visible.

At SDK level:

```cpp
auto state = client.sync_state();

if (state.is_ok() && state.value().has_work())
{
    // show pending sync indicator
}
```

In JavaScript:

```js
const state = await client.syncStateInfo();

if (state.isOk() && state.value().hasWork()) {
  // show pending sync indicator
}
```

## Observability matters

Convergence should not be invisible magic.

Developers should be able to inspect outbox size, queued count, in-flight count, acknowledged count, failed count, last submitted version, last applied remote version, and retry count.

This helps debug why a node has not converged yet. Maybe no peer is connected. Maybe transport failed. Maybe ACKs are missing. Maybe the conflict policy kept local state. Maybe the retry limit was reached.

The system should expose enough information to explain the state.

## A complete convergence flow

A simple convergence flow can look like this:

1. Node A writes `key = value`
2. Node A appends operation to WAL
3. Node A applies operation to local store
4. Node A tracks operation in sync outbox
5. Node A discovers node B
6. Node A connects to node B
7. Node A sends sync batch
8. Node B receives operation
9. Node B validates operation
10. Node B checks for conflict
11. Node B applies operation
12. Node B sends ACK
13. Node A receives ACK
14. Node A marks operation acknowledged
15. Completed work is pruned
16. Both nodes now agree for that key

If the network fails at step 7:

```txt
transport failure
  ↓
operation remains tracked
  ↓
retry later
```

If a conflict appears at step 10:

```txt
conflict detected
  ↓
conflict policy applied
  ↓
deterministic result
```

## What convergence guarantees

Convergence helps guarantee that local divergence can be temporary, operations can be exchanged later, conflicts can be resolved deterministically, retries can continue after temporary failure, duplicate delivery can be handled safely, replay can produce stable results, and nodes can move toward coherent state after reconnection.

## What convergence does not guarantee

Convergence does not guarantee instant global consistency, permanent peer availability, network delivery by itself, conflict-free local writes, distributed consensus, that every application-level merge is automatic, or that all nodes are always online.

Those are different problems.

Softadastra gives the foundation for local-first synchronization. Application-specific policy may still be needed.

## Common mistakes

### Expecting instant consistency

In local-first systems, nodes can diverge temporarily. That is expected.

### Confusing convergence with consensus

Softadastra does not require global agreement before local writes. It allows local work first, then resolves later.

### Ignoring conflict policy

If two nodes can write the same data while disconnected, conflict policy matters.

### Assuming transport order is enough

Network arrival order is not enough for deterministic convergence. Use operation metadata.

### Hiding sync state from users

Applications should expose pending sync, retry, or conflict status when it matters.

## The mental model

The simplest way to understand convergence in Softadastra is:

```txt
local work can happen independently
operations are tracked
nodes exchange operations when possible
conflicts are resolved deterministically
state moves toward coherence
```

Or shorter:

```txt
diverge locally
sync later
resolve deterministically
converge eventually
```

## Summary

Convergence is the result Softadastra tries to reach after synchronization.

It means nodes that worked independently can later exchange operations and move toward a coherent state.

The key ideas are:

- divergence is normal
- convergence is eventual
- deterministic rules are required
- conflicts must be handled explicitly
- transport only delivers messages
- sync owns operation meaning
- WAL helps replay and recovery
- outbox helps retry pending work
- metadata helps describe participants

## Next step

Continue with the CLI:

[Go to CLI](/cli/)
