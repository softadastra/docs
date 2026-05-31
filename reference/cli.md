# CLI Reference

This is the compact reference for the Softadastra CLI.

Use this page when you already know what you want to do and need the exact command quickly.

For explanations, read the CLI pages first:

- [CLI Overview](/cli/)
- [CLI Commands](/cli/commands)
- [Interactive Mode](/cli/interactive-mode)
- [Node](/cli/node)
- [Store](/cli/store)
- [Sync](/cli/sync)
- [Peers](/cli/peers)

## Command shape

```sh
softadastra <command> [subcommand] [arguments]
```

Examples:

```sh
softadastra status
softadastra node info
softadastra node start
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra peers
```

## Main commands

| Command                               | Purpose                                         |
| ------------------------------------- | ----------------------------------------------- |
| `softadastra status`                  | Show local runtime status                       |
| `softadastra node`                    | Show node command help                          |
| `softadastra node info`               | Show local node information                     |
| `softadastra node start`              | Start node services for the current CLI session |
| `softadastra store`                   | Show store command help                         |
| `softadastra store put <key> <value>` | Write a local value                             |
| `softadastra store get <key>`         | Read one local value                            |
| `softadastra sync`                    | Show sync command help                          |
| `softadastra sync status`             | Show sync state                                 |
| `softadastra sync tick`               | Run one manual sync cycle                       |
| `softadastra peers`                   | List discovery and transport peers              |
| `softadastra`                         | Start interactive mode                          |

## Status

Show the current local runtime status.

```sh
softadastra status
```

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

Use this first when you want to see what the local runtime looks like.

## Node

Show node command help.

```sh
softadastra node
```

Output:

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

Show information about the local node.

```sh
softadastra node info
```

Example output when metadata is available:

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

Example output when metadata is not available yet:

```txt
Softadastra node

Field          Value
node_id        node-1
node_running   no
metadata       unavailable
```

## Node start

Start local node services for the current CLI session.

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

If the node is already running:

```txt
Softadastra node is already running.
node_id  node-1
```

`node start` starts services only for the current CLI runtime.

It is especially useful in interactive mode, because the services stay available while you run the next commands.

For a long-running node, use the Softadastra node app.

## Store

Show store command help.

```sh
softadastra store
```

Output:

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

Write a local value.

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

If the value did not change, the status can be `unchanged`.

## Store get

Read one local value.

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

A missing key is a normal store result. It does not mean the runtime crashed.

## Sync

Show sync command help.

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

## Sync status

Show the current sync state.

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

Use this when you want to know what sync is tracking locally.

## Sync tick

Run one manual sync cycle.

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

If no peer is connected, local data is still safe locally.

## Peers

List discovery and transport peers.

```sh
softadastra peers
```

Example output when no peers are available:

```txt
Softadastra peers

discovery  no
transport  no

Discovery peers
No discovery peers found.

Transport peers
No transport peers found.
```

Example discovery peer output:

```txt
Discovery peers

Node     Host        Port   Last seen
node-2   127.0.0.1   9500   1760000000000
```

Example transport peer output:

```txt
Transport peers

Node     Host        Port   State       Connected   Last seen       Errors
node-2   127.0.0.1   9500   Connected   yes         1760000000000   0
```

No peers is a valid state.

Local store commands can still work without peers.

## Interactive mode

Start the CLI without a command:

```sh
softadastra
```

Then run commands without repeating `softadastra`.

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

Exit with:

```txt
exit
```

or:

```txt
quit
```

## Local-first behavior

Local store commands do not need a peer.

This works even if transport is stopped, discovery is stopped, and no peer is available:

```sh
softadastra store put draft/1 hello
softadastra store get draft/1
```

Sync and peers matter when the local node needs to exchange data with another node.

They are not required for local reads and writes.

## Common errors

## Unknown store command

Command:

```sh
softadastra store remove app/name
```

Output:

```txt
Unknown store command: remove
Usage: store <put|get>
```

Use:

```sh
softadastra store put <key> <value>
softadastra store get <key>
```

## Unknown sync command

Command:

```sh
softadastra sync prune
```

Output:

```txt
Unknown sync command: prune
Usage: sync <status|tick>
```

Use:

```sh
softadastra sync status
softadastra sync tick
```

## Unknown node command

Command:

```sh
softadastra node something
```

Output:

```txt
Unknown node command: something
Usage: node <info|start>
```

Use:

```sh
softadastra node info
softadastra node start
```

## Missing store value

Command:

```sh
softadastra store put app/name
```

Output:

```txt
Missing key or value argument.
Usage: store-put <key> <value>
```

Fix:

```sh
softadastra store put app/name Softadastra
```

## Missing store key

Command:

```sh
softadastra store get
```

Output:

```txt
Missing key argument.
Usage: store-get <key>
```

Fix:

```sh
softadastra store get app/name
```

## Empty key

Command:

```sh
softadastra store put "" value
```

Output:

```txt
Key cannot be empty.
```

Use a non-empty key:

```sh
softadastra store put app/name value
```

## Key not found

Command:

```sh
softadastra store get missing/key
```

Output:

```txt
Key not found: missing/key
```

This is a normal store result. It only means that key is not in the local store.

## Good first workflow

Run this after installation:

```sh
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra node start
softadastra peers
softadastra status
```

This checks status, node info, local write, local read, sync state, one manual tick, node services, peers, and status again.

## Full quick reference

```sh
softadastra status

softadastra node
softadastra node info
softadastra node start

softadastra store
softadastra store put <key> <value>
softadastra store get <key>

softadastra sync
softadastra sync status
softadastra sync tick

softadastra peers
```

Interactive mode:

```txt
softadastra
softadastra> status
softadastra> node info
softadastra> node start
softadastra> store put <key> <value>
softadastra> store get <key>
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> exit
```

## Summary

The CLI reference is the compact command map for Softadastra.

Use:

```sh
softadastra status
```

to inspect the runtime.

Use:

```sh
softadastra store put <key> <value>
softadastra store get <key>
```

to test local data.

Use:

```sh
softadastra sync status
softadastra sync tick
```

to inspect and move sync.

Use:

```sh
softadastra node start
softadastra peers
```

to work with node services and peers.

## Next step

Continue with [SDKs](/sdks).
