# Status

The `status` command shows the current state of the local Softadastra runtime.
Run it when you want a quick overview of what is happening locally.

```sh
softadastra status
```

## What status shows

`softadastra status` gives one view of the main runtime pieces:

- node
- store
- sync
- transport
- discovery
- metadata

It is usually the first command to run when you want to know if the local runtime is ready, if the node is running, if the store has entries, or if sync has pending work.

## Basic usage

```sh
softadastra status
```

Example output:

```txt
Softadastra status

Component   Metric       Value
node        id           node-1
node        running      no
store       entries      0
sync        outbox       0
sync        queued       0
sync        in_flight    0
sync        acknowledged 0
sync        failed       0
transport   running      no
transport   peers        0
discovery   running      no
discovery   peers        0
metadata    running      no
```

The exact values depend on your local runtime state.

## Node status

The node fields tell you which local node the runtime is using.

```txt
Component   Metric   Value
node        id       node-1
node        running  no
```

`id` is the local node id.
`running` tells you whether node services are running in the current CLI session.
To see more node information, run:

```sh
softadastra node info
```

## Store status

The store field shows how many local entries are currently stored.

```txt
Component   Metric   Value
store       entries  2
```

If entries is `0`, the local store is empty.

You can write and read values with:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
```

Then run status again:

```sh
softadastra status
```

## Sync status

The sync fields show what the synchronization pipeline is tracking.

```txt
Component   Metric        Value
sync        outbox        1
sync        queued        1
sync        in_flight     0
sync        acknowledged  0
sync        failed        0
```

`outbox` shows how much local work is tracked for sync.
`queued` shows work waiting to be selected for delivery.
`in_flight` shows work currently being processed or waiting for acknowledgement.
`acknowledged` shows completed sync work.
`failed` shows work that failed according to the sync policy.

For more detail, run:

```sh
softadastra sync status
```

## Transport status

Transport is the network layer used to communicate with peers.

```txt
Component   Metric   Value
transport   running  no
transport   peers    0
```

`running` tells you whether transport is running.
`peers` tells you how many transport peers are known.
Transport can be stopped and local storage can still work. That is normal.

## Discovery status

Discovery is used to find peers.

```txt
Component   Metric   Value
discovery   running  no
discovery   peers    0
```

`running` tells you whether discovery is running.
`peers` tells you how many discovery peers are known.
If discovery is not running or no peers are found, local store commands can still work.

## Metadata status

Metadata provides local node information such as hostname, operating system, version, and uptime.

```txt
Component   Metric   Value
metadata    running  yes
metadata    hostname local-machine
metadata    os       linux
metadata    version  0.1.0
metadata    uptime_ms 1250
```

If metadata is available, `status` can show extra metadata fields.

For more detail, run:

```sh
softadastra node info
```

## Start node services

If transport, discovery, and metadata are stopped, start node services for the current CLI session:

```sh
softadastra node start
```

Then run:

```sh
softadastra status
```

You should see something closer to:

```txt
Component   Metric   Value
node        running  yes
transport   running  yes
discovery   running  yes
metadata    running  yes
```

## A good first workflow

Try this after installing Softadastra:

```sh
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra status
```

This checks the runtime, node metadata, local write, local read, sync state, one manual sync cycle, and status again.

## Status and local-first behavior

No peers is not an error.
Stopped transport is not always an error.
Stopped discovery is not always an error.
Softadastra can still accept local work:

```sh
softadastra store put draft/1 hello
softadastra store get draft/1
```

Peers and networking matter when you want to synchronize with another node. They are not required for local reads and writes.

## Interactive mode

Inside interactive mode, run:

```txt
softadastra> status
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> sync status
softadastra> sync tick
softadastra> status
softadastra> exit
```

Do not repeat the binary name inside interactive mode.

Use:

```txt
softadastra> status
```

not:

```txt
softadastra> softadastra status
```

## Common issues

### Store entries stay at zero

Write a value first:

```sh
softadastra store put app/name Softadastra
```

Then run:

```sh
softadastra status
```

### Transport is not running

Start node services:

```sh
softadastra node start
```

Then check status again:

```sh
softadastra status
```

### Discovery has no peers

That can be normal. It usually means no other node is running or discoverable yet.

Check:

```sh
softadastra peers
```

### Sync has failed work

If `sync failed` is greater than `0`, inspect sync and peers:

```sh
softadastra sync status
softadastra peers
```

Local data can still exist even when sync delivery fails.

## Summary

Use:

```sh
softadastra status
```

to get a quick overview of the local runtime.
Use it first, then go deeper with:

```sh
softadastra node info
softadastra sync status
softadastra peers
```

Next, continue with [Node](./node).
