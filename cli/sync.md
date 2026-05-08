# Sync Commands

Sync commands let you inspect and move the Softadastra synchronization pipeline from the CLI.

The main command group is:

```sh
softadastra sync <subcommand>
```

The two most important commands are:

```sh
softadastra sync status
softadastra sync tick
```

## Why sync commands exist

Softadastra is local-first.

A local write can happen before any peer is connected:

```sh
softadastra store put message/1 hello
```

That write can update local state first. Synchronization happens later.

Sync commands let you inspect and move that later phase.

```txt
local write
  ↓
sync outbox
  ↓
sync queue
  ↓
sync tick
  ↓
transport batch
  ↓
remote peer, if available
```

## Command overview

```txt
softadastra sync status        -> show current sync state
softadastra sync tick          -> run one sync tick
softadastra sync tick --prune  -> tick and prune completed work, if supported
```

Future commands can include `softadastra sync retry`, `softadastra sync prune`, `softadastra sync failed`, and `softadastra sync outbox`.

But the stable first surface should stay focused on `status` and `tick`.

## Sync mental model

Sync does not mean network. Sync means operation propagation.

```txt
Store      -> current local state
Sync       -> tracks work that should be propagated
Transport  -> sends messages to peers
Discovery  -> finds peers
```

A store write can create sync work:

```txt
store put
  ↓
local state updated
  ↓
sync operation created
  ↓
outbox entry added
```

Then a sync tick can move work forward:

```txt
sync tick
  ↓
retry expired work
  ↓
produce next batch
  ↓
prepare delivery
```

## `softadastra sync status`

Shows the current synchronization state.

```sh
softadastra sync status
```

Expected output style:

```txt
Sync status

  outbox       : 3
  queued       : 3
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0
```

The command should answer: is there pending sync work, is work queued, is anything in flight, has anything failed, and how many retries happened?

### Sync status fields

A sync status output can expose these fields:

**`outbox`** — The outbox contains local operations waiting for synchronization.

```txt
outbox : 3
```

This means the local node has tracked sync work. It does not automatically mean the work has been delivered to peers.

**`queued`** — Queued operations are ready to be selected for sending.

```txt
queued : 3
```

A sync tick can collect queued work into a batch.

**`in flight`** — In-flight operations have been sent or prepared for delivery and may be waiting for acknowledgement.

```txt
in flight : 1
```

**`acknowledged`** — Acknowledged operations were confirmed by the remote side or marked as acknowledged by the sync layer.

```txt
acknowledged : 2
```

Acknowledged work may later be pruned when it is safe.

**`failed`** — Failed operations exceeded the current retry policy or encountered a non-retryable sync error.

```txt
failed : 1
```

Failed does not mean the local data disappeared. It means synchronization delivery failed according to the current sync policy.

**`retries`** — Shows how many retry attempts were recorded.

```txt
retries : 4
```

This helps debug unstable transport or missing acknowledgements.

## `softadastra sync tick`

Runs one synchronization tick.

```sh
softadastra sync tick
```

A tick moves the sync pipeline forward once. It can retry expired work, collect the next batch, prepare work for transport, and return batch size.

Expected output style:

```txt
Sync tick

  retried : 0
  pruned  : 0
  batch   : 1
```

### Tick result fields

**`retried`** — The number of expired operations retried during this tick.

```txt
retried : 1
```

**`pruned`** — The number of completed entries removed during this tick. If pruning is not enabled, this can be zero.

```txt
pruned : 2
```

**`batch`** — The number of operations produced in the next batch.

```txt
batch : 3
```

A batch is ready for transport delivery when transport and peers are available.

## `softadastra sync tick --prune`

If supported, this command runs a tick and removes completed sync work.

```sh
softadastra sync tick --prune
```

Expected output style:

```txt
Sync tick

  retried : 0
  pruned  : 2
  batch   : 0
```

Pruning should only remove work that is completed or safe to remove. It should not remove pending, queued, in-flight, or failed work unless the command explicitly asks for that behavior.

## Recommended sync workflow

Start by writing a local value:

```sh
softadastra store put message/1 hello
```

Inspect sync state:

```sh
softadastra sync status
```

Run one tick:

```sh
softadastra sync tick
```

Inspect again:

```sh
softadastra sync status
```

This workflow helps you see how local writes become sync work.

## Example session

```sh
softadastra store put message/1 hello
softadastra sync status
softadastra sync tick
softadastra sync status
```

Example output style:

```txt
Stored value

  key     : message/1
  value   : hello
  created : yes

Sync status

  outbox       : 1
  queued       : 1
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0

Sync tick

  retried : 0
  pruned  : 0
  batch   : 1
```

## Sync without transport

Sync can exist without transport.

This means a local write can still be tracked even when there is no peer connection.

```txt
store put
  ↓
sync outbox
  ↓
queued work
```

If transport is disabled, the operation may still appear in sync state.

Transport is the delivery layer. Sync is the tracking and propagation layer.

## Sync with transport

When transport is enabled, sync batches can be sent to peers.

```txt
sync batch
  ↓
transport message
  ↓
peer
```

Sync decides what should be sent. Transport sends it.

## Sync with discovery

Discovery can find peers. Transport can connect to them. Sync can then send operations.

```txt
discovery finds peers
  ↓
transport connects peers
  ↓
sync sends operations
```

If no peer is discovered, sync work can remain pending. That is normal in offline-first systems.

## Sync and ACKs

If acknowledgements are enabled, sync can wait for confirmation.

A typical lifecycle is:

```txt
queued
  ↓
in flight
  ↓
waiting for ACK
  ↓
acknowledged
```

If the ACK does not arrive:

```txt
timeout
  ↓
retry later
```

This is why sync status should expose in-flight, acknowledged, failed, and retry counts.

## Sync and retries

Retries happen when delivery is uncertain or failed.

Possible causes: peer unavailable, transport stopped, connection failed, ACK missing, timeout reached, or network unstable.

A retryable operation should remain tracked until it succeeds, fails according to policy, or is explicitly removed.

## Sync and failed work

Failed sync work should be visible.

Example:

```txt
Sync status

  outbox       : 4
  queued       : 0
  in flight    : 0
  acknowledged : 0
  failed       : 4
  retries      : 12
```

This tells the user that the local state may still be valid, but synchronization did not complete.

A good CLI should make this distinction clear.

## Sync and local data

A sync failure should not delete local data.

Example:

```sh
softadastra store put draft/1 hello
softadastra sync tick
```

If sync fails, this should still be possible:

```sh
softadastra store get draft/1
```

The local value remains local state. Sync failure is a delivery or propagation issue.

## Sync and WAL

When WAL is enabled, local operations can be persisted before sync.

```txt
local write
  ↓
WAL append
  ↓
store apply
  ↓
sync tracking
```

This gives sync a stronger foundation because accepted operations can be recovered after restart.

## Sync and convergence

Sync moves nodes toward convergence. Convergence means nodes eventually reach a coherent state after operations are exchanged and conflicts are resolved.

```txt
local divergence
  ↓
sync exchange
  ↓
conflict policy
  ↓
convergence
```

The CLI does not need to expose every internal detail, but it should make the sync state observable.

## Interactive mode

Inside interactive mode, run sync commands without the binary name.

```txt
softadastra> sync status
softadastra> sync tick
softadastra> sync tick --prune
```

Recommended interactive flow:

```txt
softadastra> store put message/1 hello
softadastra> sync status
softadastra> sync tick
softadastra> sync status
```

## Error handling

Sync command errors should explain what failed and why.

### Sync unavailable

```txt
error: sync unavailable
reason: runtime is not initialized
```

### Invalid subcommand

Command:

```sh
softadastra sync unknown
```

Expected output:

```txt
error: unknown sync command: unknown
hint: run `softadastra help sync`
```

### Tick failed

Expected output style:

```txt
error: sync tick failed
reason: failed to retry expired operation
```

The error should include enough context to debug the failing stage.

## Output style

Use grouped, stable output.

Good:

```txt
Sync status

  outbox       : 1
  queued       : 1
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0
```

Good:

```txt
Sync tick

  retried : 0
  pruned  : 0
  batch   : 1
```

Avoid noisy internal structures unless debug mode is enabled.

## Script usage

For scripts, sync commands should have predictable exit codes.

- `exit 0` — command completed
- `exit 1` — command failed

If the command succeeds but there is no sync work, it should normally still return success.

Example:

```txt
Sync tick

  retried : 0
  pruned  : 0
  batch   : 0
```

No work is not necessarily an error.

## Common mistakes

### Expecting sync tick to always send data

A tick moves the sync pipeline. If no peer is connected, transport delivery may not happen.

### Expecting sync to create local data by itself

The store creates or holds local data. Sync tracks and propagates operations.

### Treating failed sync as lost local data

Failed sync means delivery failed. Local state can still exist.

### Expecting no peers to be an error

No peer means synchronization with other nodes is delayed. Local work can continue.

### Hiding sync status

For offline-first applications, pending sync state is important. Use `sync status` to make it visible.

## How sync commands map to the SDK

CLI:

```sh
softadastra sync status
softadastra sync tick
```

C++ SDK:

```cpp
auto state = client.sync_state();
auto tick = client.tick();
```

JavaScript SDK:

```js
const state = await client.syncStateInfo();
const tick = await client.tick();
```

The model is the same across CLI, C++ SDK, and JavaScript SDK.

## How sync commands map to the engine

```txt
sync status
  -> SyncState, Outbox, SyncQueue, AckTracker

sync tick
  -> SyncScheduler, retry_expired, next_batch, prune_completed
```

The CLI should expose the result clearly without leaking too much internal structure.

## Recommended first sync test

Run:

```sh
softadastra store put message/1 hello
softadastra sync status
softadastra sync tick
softadastra sync status
```

This tests local write, sync outbox, queued work, manual tick, batch production, and sync observability.

## Summary

Sync commands let you inspect and advance the synchronization pipeline.

They provide `sync status`, `sync tick`, and optional pruning.

The key idea is: sync is explicit and observable. A local write can happen first. Sync moves that work later.

## Next step

Continue with peers:

[Go to Peers](/cli/peers)
