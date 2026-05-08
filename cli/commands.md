# CLI Commands

This page gives an overview of the main Softadastra CLI commands.

The CLI is designed around a simple workflow:

```txt
inspect runtime
inspect node
write local data
read local data
inspect sync
tick sync
inspect peers
```

The command shape is:

```sh
softadastra <command> [subcommand] [arguments] [options]
```

Examples:

```sh
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra sync tick
softadastra peers
```

## Command groups

Softadastra CLI commands are organized by responsibility.

```txt
help       -> show help
version    -> show version
status     -> show runtime status
node       -> inspect or start a local node
store      -> read and write local values
sync       -> inspect or tick synchronization
peers      -> list known peers
```

## Global commands

### `softadastra help`

Shows available commands.

```sh
softadastra help
```

Expected usage:

```sh
softadastra help
softadastra help store
softadastra help sync
```

Use this when you do not remember a command or its arguments.

### `softadastra version`

Shows the CLI version.

```sh
softadastra version
```

This is useful for debugging and release verification.

Expected output style:

```txt
Softadastra 0.1.0
```

### `softadastra status`

Shows local runtime status.

```sh
softadastra status
```

The status command should give a quick view of the local Softadastra runtime.

It can include node status, store status, sync status, transport status, discovery status, and metadata status.

Example output style:

```txt
Softadastra status

Node
  id       : node-a
  version  : 0.1.0
  state    : healthy

Store
  entries  : 12

Sync
  outbox   : 3
  queued   : 3
  failed   : 0

Transport
  running  : no

Discovery
  running  : no
```

## Node commands

Node commands inspect or control the local Softadastra node.

```sh
softadastra node <subcommand>
```

### `softadastra node info`

Shows metadata about the local node.

```sh
softadastra node info
```

It should show node id, display name, hostname, operating system, version, uptime, and capabilities.

Example output style:

```txt
Node

  id           : node-a
  display name : Local Node
  hostname     : softadastra-dev
  os           : linux
  version      : 0.1.0
  uptime ms    : 12840
  capabilities : core, store, sync, transport, discovery, metadata
```

### `softadastra node start`

Starts a local Softadastra node if the node application is available.

```sh
softadastra node start
```

This command is useful when running a local node process for development or testing.

Example output style:

```txt
Softadastra node

  id       : node-a
  address  : 127.0.0.1:4041
  state    : running
```

## Store commands

Store commands read and write local key-value state.

```sh
softadastra store <subcommand>
```

The store command is local-first. A store write should not require a server or connected peer.

### `softadastra store put`

Writes a local value.

```sh
softadastra store put <key> <value>
```

Example:

```sh
softadastra store put app/name Softadastra
```

Expected output style:

```txt
Stored value

  key     : app/name
  value   : Softadastra
  created : yes
```

Conceptually:

```txt
store put
  ↓
local write
  ↓
WAL, if enabled
  ↓
store apply
  ↓
sync tracking
```

### `softadastra store get`

Reads a local value.

```sh
softadastra store get <key>
```

Example:

```sh
softadastra store get app/name
```

Expected output style:

```txt
Value

  key   : app/name
  value : Softadastra
```

If the key does not exist:

```txt
error: key not found
key: app/name
```

### `softadastra store remove`

Removes a local value.

```sh
softadastra store remove <key>
```

Example:

```sh
softadastra store remove app/name
```

Expected output style:

```txt
Removed value

  key     : app/name
  removed : yes
```

### `softadastra store list`

Lists local values if supported by the current CLI implementation.

```sh
softadastra store list
```

Example output style:

```txt
Key             Value
app/name        Softadastra
settings/theme  dark
```

If the command is not implemented yet, keep it out of the public reference until it is stable.

## Sync commands

Sync commands inspect and move the synchronization pipeline.

```sh
softadastra sync <subcommand>
```

The sync command is explicit. It should not hide important work behind invisible background behavior.

### `softadastra sync status`

Shows current sync state.

```sh
softadastra sync status
```

It should expose outbox size, queued count, in-flight count, acknowledged count, failed count, last submitted version, last applied remote version, and total retries.

Example output style:

```txt
Sync status

  outbox       : 3
  queued       : 3
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0
```

### `softadastra sync tick`

Runs one manual sync tick.

```sh
softadastra sync tick
```

A tick can retry expired work, collect the next batch, prepare transport delivery, and prune completed work if requested.

Example output style:

```txt
Sync tick

  retried : 0
  pruned  : 0
  batch   : 1
```

### `softadastra sync tick --prune`

Runs one sync tick and prunes completed work if the option is supported.

```sh
softadastra sync tick --prune
```

Example output style:

```txt
Sync tick

  retried : 0
  pruned  : 2
  batch   : 0
```

## Peers command

The peers command lists known peers.

```sh
softadastra peers
```

Peers can come from discovery or manual configuration.

Example output style:

```txt
Peers

Node ID        Host        Port    State
node-b         127.0.0.1   4042    available
node-c         127.0.0.1   4043    stale
```

If no peers are known:

```txt
Peers

  no peers found
```

This is not necessarily an error. In local development, a node can have no peers yet.

## Interactive mode commands

If interactive mode is enabled, run:

```sh
softadastra
```

Then use commands without repeating the binary name:

```txt
status
node info
store put app/name Softadastra
store get app/name
sync status
sync tick
peers
exit
```

Example session:

```txt
softadastra> status
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync tick
softadastra> exit
```

Interactive mode is useful for local debugging and demos.

## Command behavior principles

Softadastra CLI commands should follow these rules.

### Local-first behavior

Local commands should not require the network unless the command is explicitly about transport, discovery, or peers.

This should work without a peer:

```sh
softadastra store put draft/1 hello
```

### Clear errors

Errors should explain what failed and why.

Good:

```txt
error: failed to read key
reason: key not found
key: settings/theme
```

Bad:

```txt
error: invalid state
```

### Observable sync

Sync commands should expose state clearly. The user should be able to understand whether there is pending work, whether work is queued, whether retry happened, whether pruning happened, and whether anything failed.

### Stable output

For scripts, CLI output should stay stable. Prefer predictable keys and sections.

```txt
key   : app/name
value : Softadastra
```

## Command reference table

| Command | Purpose |
|---|---|
| `softadastra help` | Show available commands |
| `softadastra version` | Show CLI version |
| `softadastra status` | Show runtime status |
| `softadastra node info` | Show local node metadata |
| `softadastra node start` | Start a local node |
| `softadastra store put <key> <value>` | Write a local value |
| `softadastra store get <key>` | Read a local value |
| `softadastra store remove <key>` | Remove a local value |
| `softadastra sync status` | Show sync state |
| `softadastra sync tick` | Run one sync tick |
| `softadastra peers` | List known peers |

## Recommended first workflow

After installation, test the CLI with this flow:

```sh
softadastra help
softadastra version
softadastra status
```

Then test local store:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
```

Then check sync:

```sh
softadastra sync status
softadastra sync tick
```

Then inspect node and peers:

```sh
softadastra node info
softadastra peers
```

## How commands map to the engine

```txt
status
  -> runtime, store, sync, transport, discovery, metadata

node info
  -> metadata

store put/get/remove
  -> store, WAL if enabled, sync tracking

sync status/tick
  -> sync engine, outbox, queue, retries

peers
  -> discovery and transport peer state
```

This mapping helps you understand which part of Softadastra is being used.

## Summary

Softadastra CLI commands are organized around the local runtime:

```txt
status -> inspect runtime
node   -> inspect or start local node
store  -> read and write local data
sync   -> inspect and move sync
peers  -> inspect known peers
```

The CLI is the easiest way to observe Softadastra without writing C++ or JavaScript code.

## Next step

Continue with interactive mode:

[Go to Interactive Mode](/cli/interactive-mode)
