# Commands

This page gives you the main Softadastra CLI commands.

The CLI is built around a simple workflow:

```txt
check status
inspect node
write local data
read local data
inspect sync
run one sync tick
inspect peers
```

The command shape is:

```sh
softadastra <command> [subcommand] [arguments]
```

Examples:

```sh
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra peers
```

## Main commands

Softadastra CLI commands are grouped by what you want to do.

| Command                               | Purpose                                         |
| ------------------------------------- | ----------------------------------------------- |
| `softadastra status`                  | Show the current local runtime status           |
| `softadastra node info`               | Show local node information                     |
| `softadastra node start`              | Start node services for the current CLI session |
| `softadastra store put <key> <value>` | Write a local value                             |
| `softadastra store get <key>`         | Read a local value                              |
| `softadastra sync status`             | Show sync state                                 |
| `softadastra sync tick`               | Run one manual sync cycle                       |
| `softadastra peers`                   | List discovery and transport peers              |

## Status

Use `status` when you want a quick view of the local runtime.

```sh
softadastra status
```

It shows the main parts of the runtime:

- node
- store
- sync
- transport
- discovery
- metadata

Example output:

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

Use this command first when you want to know what the local runtime looks like.

## Node

Node commands let you inspect the local node or start node services for the current CLI session.

```sh
softadastra node
```

This shows the node command help:

```txt
Softadastra node

Usage
  softadastra node info
  softadastra node start

Commands
  info     Show local node information
  start    Start local node services for this CLI session
```

## Node info

Use `node info` to inspect the local node.

```sh
softadastra node info
```

It can show:

- node id
- display name
- hostname
- operating system
- version
- start time
- uptime
- capabilities
- whether node services are running

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
node_running   no
```

If metadata is not available yet, the CLI can still show basic information:

```txt
Softadastra node

Field          Value
node_id        node-1
node_running   no
metadata       unavailable
```

## Node start

Use `node start` to start local node services for the current CLI session.

```sh
softadastra node start
```

When it succeeds, it shows which services are running.

Example output:

```txt
Starting Softadastra node

✓ Softadastra node services started for this CLI session.
node_id    node-1
transport  running
discovery  running
metadata   running
```

This starts:

- transport
- discovery
- metadata

It does not turn the CLI into a permanent background daemon.

For a long-running node, use the Softadastra node app.

## Store

Store commands let you write and read local key/value data.

```sh
softadastra store
```

This shows the store command help:

```txt
Softadastra store

Usage
  softadastra store put <key> <value>
  softadastra store get <key>

Commands
  put      Write a key/value pair
  get      Read one key
```

## Store put

Use `store put` to write a local value.

```sh
softadastra store put <key> <value>
```

Example:

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

If the key already exists, the status can be `updated`.

```sh
softadastra store put app/name "Softadastra Runtime"
```

Example output:

```txt
✓ Stored value.

Field    Value
key      app/name
version  2
status   updated
```

## Store get

Use `store get` to read one local value.

```sh
softadastra store get <key>
```

Example:

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

If the key does not exist:

```txt
Key not found: app/name
```

## Sync

Sync commands let you inspect and move the local sync pipeline.

```sh
softadastra sync
```

This shows the sync command help:

```txt
Softadastra sync

Usage
  softadastra sync status
  softadastra sync tick

Commands
  status   Show sync engine state
  tick     Run one manual sync cycle
```

## Sync status

Use `sync status` to inspect sync state.

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

This tells you whether there is pending sync work, failed work, or retry activity.

## Sync tick

Use `sync tick` to run one manual sync cycle.

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

A tick can retry expired work, produce a batch, and try to send that batch to connected transport peers.

If no peer is connected, local data is still safe locally.

## Peers

Use `peers` to list known discovery and transport peers.

```sh
softadastra peers
```

Example output when no peers are known:

```txt
Softadastra peers

discovery  no
transport  no

Discovery peers
No discovery peers found.

Transport peers
No transport peers found.
```

If peers exist, the CLI can show discovery peers:

```txt
Discovery peers

Node     Host        Port   Last seen
node-2   127.0.0.1   9500   1760000000000
```

and transport peers:

```txt
Transport peers

Node     Host        Port   State       Connected   Last seen       Errors
node-2   127.0.0.1   9500   Connected   yes         1760000000000   0
```

No peers is a valid state. Local store commands can still work.

## Interactive mode

Run the CLI without a command:

```sh
softadastra
```

Then type commands without repeating `softadastra`.

Example session:

```txt
softadastra> status
softadastra> node info
softadastra> node start
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> exit
```

Inside interactive mode, this is correct:

```txt
softadastra> status
```

This is wrong:

```txt
softadastra> softadastra status
```

## Recommended first workflow

After installation, start with:

```sh
softadastra status
softadastra node info
```

Then test local store:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
```

Then inspect sync:

```sh
softadastra sync status
softadastra sync tick
softadastra sync status
```

Then inspect node services and peers:

```sh
softadastra node start
softadastra peers
softadastra status
```

## Local-first behavior

Local store commands do not need peers.

This should work even when transport is stopped, discovery is stopped, and no peer is available:

```sh
softadastra store put draft/1 hello
softadastra store get draft/1
```

Sync and peers matter when the local node needs to exchange data with another node.

They are not required for local reads and writes.

## Common errors

### Unknown store command

If you run a store command that does not exist:

```sh
softadastra store remove app/name
```

The CLI returns:

```txt
Unknown store command: remove
Usage: store <put|get>
```

Use:

```sh
softadastra store put <key> <value>
softadastra store get <key>
```

### Unknown sync command

If you run an unsupported sync command:

```sh
softadastra sync prune
```

The CLI returns:

```txt
Unknown sync command: prune
Usage: sync <status|tick>
```

Use:

```sh
softadastra sync status
softadastra sync tick
```

### Missing store value

If you run:

```sh
softadastra store put app/name
```

The CLI returns:

```txt
Missing key or value argument.
Usage: store-put <key> <value>
```

Fix it:

```sh
softadastra store put app/name Softadastra
```

### Missing store key

If you run:

```sh
softadastra store get
```

The CLI returns:

```txt
Missing key argument.
Usage: store-get <key>
```

Fix it:

```sh
softadastra store get app/name
```

### Key not found

If the key does not exist:

```sh
softadastra store get missing/key
```

The CLI returns:

```txt
Key not found: missing/key
```

This is a normal store result, not a runtime crash.

## Command reference

| Command                               | Purpose                                         |
| ------------------------------------- | ----------------------------------------------- |
| `softadastra status`                  | Show local runtime status                       |
| `softadastra node`                    | Show node command help                          |
| `softadastra node info`               | Show local node information                     |
| `softadastra node start`              | Start node services for the current CLI session |
| `softadastra store`                   | Show store command help                         |
| `softadastra store put <key> <value>` | Write a local value                             |
| `softadastra store get <key>`         | Read a local value                              |
| `softadastra sync`                    | Show sync command help                          |
| `softadastra sync status`             | Show sync state                                 |
| `softadastra sync tick`               | Run one manual sync cycle                       |
| `softadastra peers`                   | List discovery and transport peers              |

## Summary

Softadastra CLI commands are organized around the local runtime:

```txt
status  -> inspect runtime
node    -> inspect or start local node services
store   -> write and read local data
sync    -> inspect and move sync
peers   -> inspect known peers
```

The CLI is the fastest way to observe and test Softadastra from the terminal.

Next, continue with [Interactive Mode](./interactive-mode).
