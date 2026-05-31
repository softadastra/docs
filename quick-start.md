# Quick Start

This page gives you the fastest way to try Softadastra.

You will:

- check the local runtime
- write a local value
- read it back
- inspect sync state
- run one sync tick
- start node services
- inspect peers

## 1. Check Softadastra

Run:

```sh
softadastra status
```

You should see the local runtime status.

Example:

```txt
Softadastra status

Component   Metric        Value
node        id            node-1
node        running       no
store       entries       0
sync        outbox        0
sync        queued        0
sync        in_flight     0
sync        acknowledged  0
sync        failed        0
transport   running       no
transport   peers         0
discovery   running       no
discovery   peers         0
metadata    running       no
```

If this command works, Softadastra is installed and the CLI is available.

## 2. Write a local value

Run:

```sh
softadastra store put app/name Softadastra
```

Example output:

```txt
✓ Stored value.

Field    Value
key      app/name
version  1
status   created
```

This writes a value locally.

No server is required.

No peer is required.

No network is required.

## 3. Read the value

Run:

```sh
softadastra store get app/name
```

Example output:

```txt
Store entry

Field      Value
key        app/name
value      Softadastra
version    1
timestamp  1760000000000
```

You have now written and read local data with Softadastra.

## 4. Inspect sync

Run:

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

This shows what Softadastra is tracking for synchronization.

A local write can create sync work.

That does not mean the data is lost or waiting for the network to be useful. The value is already local.

## 5. Run one sync tick

Run:

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

This is normal if no peer is connected.

Softadastra can keep local work and move sync forward later when peers are available.

## 6. Start node services

Run:

```sh
softadastra node start
```

Example output:

```txt
Starting Softadastra node

✓ Softadastra node services started for this CLI session.
node_id    node-1
transport  running
discovery  running
metadata   running
```

This starts transport, discovery, and metadata for the current CLI session.

For a long-running node, use the Softadastra node app.

## 7. Inspect the local node

Run:

```sh
softadastra node info
```

Example output:

```txt
Softadastra node

Field          Value
node_id        node-1
display_name   Softadastra Node
hostname       local-machine
os             linux
version        0.1.0
started_at     1760000000000
uptime_ms      1250
capabilities   6
node_running   yes
```

The exact values depend on your machine.

## 8. Check peers

Run:

```sh
softadastra peers
```

If no other node is available, you may see:

```txt
Softadastra peers

discovery  yes
transport  yes

Discovery peers
No discovery peers found.

Transport peers
No transport peers found.
```

No peers is not an error.

Local reads and writes still work.

## The full first flow

You can copy this whole flow:

```sh
softadastra status

softadastra store put app/name Softadastra
softadastra store get app/name

softadastra sync status
softadastra sync tick

softadastra node start
softadastra node info
softadastra peers

softadastra status
```

## Interactive mode

You can also run the same flow inside one session:

```sh
softadastra
```

Then type:

```txt
softadastra> status
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> node start
softadastra> node info
softadastra> peers
softadastra> status
softadastra> exit
```

Inside interactive mode, do not repeat `softadastra`.

Use:

```txt
softadastra> status
```

not:

```txt
softadastra> softadastra status
```

## What you just learned

You used Softadastra to:

- write data locally
- read data locally
- inspect sync state
- run one sync tick
- start node services
- inspect the local node
- check peers

The important idea is simple:

```txt
local work comes first
network synchronization can happen later
```

## Next step

Continue with [CLI](./cli/) to learn the command line interface.

Or continue with [SDKs](./sdks) if you want to use Softadastra inside your own application.
