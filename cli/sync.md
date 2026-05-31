# Sync

Sync commands let you inspect and move the local synchronization pipeline.

The command group is:

```sh
softadastra sync
```

## Commands

```sh
softadastra sync status
softadastra sync tick
```

## Show sync help

Run:

```sh
softadastra sync
```

Output:

```txt
Softadastra sync

Usage
  softadastra sync status
  softadastra sync tick

Commands
  status   Show sync engine state
  tick     Run one manual sync cycle
```

## Check sync status

Use `sync status` to see what the local sync pipeline is tracking.

```sh
softadastra sync status
```

Example output:

```txt
Softadastra sync status

Metric                       Value
node_id                      node-1
outbox_size                  1
queued_count                 1
in_flight_count              0
acknowledged_count           0
failed_count                 0
last_submitted_version       1
last_applied_remote_version  0
total_retries                0
```

The exact numbers depend on what happened locally.

## What the fields mean

`outbox_size` is the number of operations currently tracked for sync.

`queued_count` is the number of operations waiting to be selected for delivery.

`in_flight_count` is the number of operations currently being processed or waiting for acknowledgement.

`acknowledged_count` is the number of operations already acknowledged.

`failed_count` is the number of operations that failed according to the sync policy.

`last_submitted_version` is the latest local version submitted to sync.

`last_applied_remote_version` is the latest remote version applied locally.

`total_retries` is the total number of retry attempts recorded by sync.

## Run one sync tick

Use `sync tick` to move sync forward once.

```sh
softadastra sync tick
```

Example output:

```txt
Softadastra sync tick

Metric           Value
retried_count    0
batch_size       1
connected_peers  0
sent_count       0
pruned_count     0

No connected transport peers available.
```

A tick can retry expired work, produce a sync batch, and try to send that batch to connected transport peers.

## What tick output means

`retried_count` is the number of expired operations retried during this tick.

`batch_size` is the number of operations selected for the next sync batch.

`connected_peers` is the number of connected transport peers available for delivery.

`sent_count` is the number of sync items the CLI attempted to send through transport.

`pruned_count` is the number of completed entries pruned during the tick.

## No sync work

If there is nothing ready to send, `sync tick` can show:

```txt
No sync operations ready for delivery.
```

That is not an error.

It only means the sync pipeline had no batch ready at that moment.

## No connected peers

If a batch exists but no peer is connected, `sync tick` can show:

```txt
No connected transport peers available.
```

That is also normal.

It means local sync work exists, but there is no connected transport peer to receive it yet.

Local data is still safe locally.

## Sync after a local write

A simple sync test is:

```sh
softadastra store put message/1 hello
softadastra sync status
softadastra sync tick
softadastra sync status
```

What this does:

1. writes a value locally
2. checks what sync is tracking
3. runs one manual sync cycle
4. checks the state again

## Sync does not require peers to exist

Softadastra is local-first.

This should work even when there are no peers:

```sh
softadastra store put draft/1 hello
softadastra store get draft/1
softadastra sync status
```

Peers only matter when the local node needs to send work to another node.

If no peer is connected, sync work can stay pending until delivery becomes possible.

## Sync with peers

When peers are available, a useful flow is:

```sh
softadastra node start
softadastra peers
softadastra store put message/1 hello
softadastra sync status
softadastra sync tick
softadastra sync status
```

This starts local node services, checks peers, writes a local value, then moves sync forward once.

## Interactive mode

Inside interactive mode, do not repeat `softadastra`.

Start the CLI:

```sh
softadastra
```

Then run:

```txt
softadastra> node start
softadastra> store put message/1 hello
softadastra> sync status
softadastra> sync tick
softadastra> sync status
softadastra> exit
```

This is useful because node services stay available while you run several commands in the same CLI session.

## Common issues

### Unknown sync command

If you run an unsupported sync command:

```sh
softadastra sync unknown
```

The CLI returns:

```txt
Unknown sync command: unknown
Usage: sync <status|tick>
```

Use one of:

```sh
softadastra sync status
softadastra sync tick
```

### Tick produced no batch

If `batch_size` is `0`, there was no sync batch ready.

That can happen when there is no new local work.

Try:

```sh
softadastra store put message/1 hello
softadastra sync tick
```

### Tick produced a batch but sent nothing

If `batch_size` is greater than `0` and `sent_count` is `0`, there may be no connected transport peer.

Check peers:

```sh
softadastra peers
```

Then check status:

```sh
softadastra status
```

### Failed count is greater than zero

If `failed_count` is greater than zero, sync has operations that failed according to the current retry policy.

Check:

```sh
softadastra sync status
softadastra peers
softadastra status
```

A sync failure does not mean local data was deleted.

It means delivery or propagation failed.

## Good first sync test

Run:

```sh
softadastra store put message/1 hello
softadastra store get message/1
softadastra sync status
softadastra sync tick
softadastra sync status
```

This tests local write, local read, sync state, one manual tick, and sync state again.

## Summary

Use:

```sh
softadastra sync status
```

to inspect sync state.

Use:

```sh
softadastra sync tick
```

to run one manual sync cycle.

Sync is explicit. A local write can happen first, then sync can move that work later.

Next, continue with [Peers](./peers).
