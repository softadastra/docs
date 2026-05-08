# CLI Reference

This page is the compact reference for the Softadastra CLI.

Use it when you already know the command you need and want the exact shape quickly.

For explanations and examples, read the dedicated pages:

- [CLI Overview](/cli/)
- [CLI Commands](/cli/commands)
- [Interactive Mode](/cli/interactive-mode)
- [Node Commands](/cli/node)
- [Store Commands](/cli/store)
- [Sync Commands](/cli/sync)
- [Peers](/cli/peers)

## Command shape

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

## Global commands

| Command | Description |
|---|---|
| `softadastra help` | Show available commands |
| `softadastra version` | Show CLI version |
| `softadastra status` | Show local runtime status |
| `softadastra` | Start interactive mode, if enabled |

### `softadastra help`

Show CLI help.

```sh
softadastra help
```

Help for a command group:

```sh
softadastra help node
softadastra help store
softadastra help sync
```

Expected use: show available commands, show command usage, show subcommands, show arguments.

### `softadastra version`

Show the current Softadastra CLI version.

```sh
softadastra version
```

Example output style:

```txt
Softadastra 0.1.0
```

### `softadastra status`

Show local runtime status.

```sh
softadastra status
```

Expected output may include node status, store status, sync status, transport status, discovery status, and metadata status.

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

```sh
softadastra node <subcommand>
```

| Command | Description |
|---|---|
| `softadastra node info` | Show local node metadata |
| `softadastra node start` | Start a local node runtime, if available |

### `softadastra node info`

Show metadata for the local node.

```sh
softadastra node info
```

Expected fields: node id, display name, hostname, operating system, version, uptime, and capabilities.

Example output style:

```txt
Node

  id           : node-a
  display name : Local Node
  hostname     : softadastra-dev
  os           : linux
  version      : 0.1.0
  uptime ms    : 18420
  capabilities : core, store, sync, transport, discovery, metadata
```

### `softadastra node start`

Start a local Softadastra node runtime, if the node app is available.

```sh
softadastra node start
```

Example output style:

```txt
Softadastra node

  id       : node-a
  address  : 127.0.0.1:4041
  state    : running
```

If unavailable:

```txt
error: node app is not available in this build
hint: rebuild with SOFTADASTRA_BUILD_NODE_APP=ON
```

## Store commands

```sh
softadastra store <subcommand>
```

| Command | Description |
|---|---|
| `softadastra store put <key> <value>` | Write a local value |
| `softadastra store get <key>` | Read a local value |
| `softadastra store remove <key>` | Remove a local value |
| `softadastra store list` | List local values, if supported |

### `softadastra store put`

Write a local value.

```sh
softadastra store put <key> <value>
```

Example:

```sh
softadastra store put app/name Softadastra
```

With a value containing spaces:

```sh
softadastra store put app/title "Softadastra Runtime"
```

Example output style:

```txt
Stored value

  key     : app/name
  value   : Softadastra
  created : yes
```

Possible errors: `error: missing key`, `error: missing value`, `error: invalid key`, `error: store unavailable`.

### `softadastra store get`

Read a local value.

```sh
softadastra store get <key>
```

Example:

```sh
softadastra store get app/name
```

Example output style:

```txt
Value

  key   : app/name
  value : Softadastra
```

If missing:

```txt
error: key not found
key: app/name
```

### `softadastra store remove`

Remove a local value.

```sh
softadastra store remove <key>
```

Example:

```sh
softadastra store remove app/name
```

Example output style:

```txt
Removed value

  key     : app/name
  removed : yes
```

If the key does not exist:

```txt
Removed value

  key     : app/name
  removed : no
  reason  : key not found
```

### `softadastra store list`

List local values, if supported by the current CLI implementation.

```sh
softadastra store list
```

Example output style:

```txt
Store

Key             Value
app/name        Softadastra
settings/theme  dark
message/1       hello
```

If empty:

```txt
Store

  no values found
```

If not implemented yet, do not expose it as stable public behavior.

## Sync commands

```sh
softadastra sync <subcommand>
```

| Command | Description |
|---|---|
| `softadastra sync status` | Show sync state |
| `softadastra sync tick` | Run one sync tick |
| `softadastra sync tick --prune` | Run one tick and prune completed work, if supported |

### `softadastra sync status`

Show current synchronization state.

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

Expected fields: outbox, queued, in flight, acknowledged, failed, last submitted version, last applied remote version, and total retries.

### `softadastra sync tick`

Run one manual sync tick.

```sh
softadastra sync tick
```

A tick can retry expired work, collect the next batch, prepare transport delivery, and return batch size.

Example output style:

```txt
Sync tick

  retried : 0
  pruned  : 0
  batch   : 1
```

### `softadastra sync tick --prune`

Run one sync tick and prune completed work, if supported.

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

Pruning should only remove work that is completed or safe to remove.

## Peers command

| Command | Description |
|---|---|
| `softadastra peers` | List known peers |

### `softadastra peers`

List peers known to the local runtime.

```sh
softadastra peers
```

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

This is not necessarily an error. Local store commands can still work without peers.

## Interactive mode

Start interactive mode:

```sh
softadastra
```

Then run commands without the binary name:

```txt
softadastra> status
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> exit
```

Exit:

```txt
exit
```

or:

```txt
quit
```

### Interactive command mapping

Normal mode:

```sh
softadastra store get app/name
```

Interactive mode:

```txt
softadastra> store get app/name
```

Do not repeat the binary name inside interactive mode.

Wrong:

```txt
softadastra> softadastra store get app/name
```

Correct:

```txt
softadastra> store get app/name
```

## Options

The first stable CLI surface should keep options minimal.

Common option patterns can include `--help`, `--prune`, `--json`, `--verbose`, and `--quiet`.

Only document an option publicly when it is implemented and stable.

### `--help`

Show help for a command, if supported.

```sh
softadastra store --help
softadastra sync --help
softadastra node --help
```

### `--prune`

Used with sync tick, if supported.

```sh
softadastra sync tick --prune
```

Meaning: run one sync tick and remove completed sync work when safe.

### `--json`

If supported, output machine-readable JSON.

```sh
softadastra status --json
softadastra sync status --json
softadastra peers --json
```

This is useful for scripts and dashboards.

Example shape:

```json
{
  "sync": {
    "outbox": 3,
    "queued": 3,
    "in_flight": 0,
    "acknowledged": 0,
    "failed": 0,
    "retries": 0
  }
}
```

Do not expose `--json` as stable until the JSON schema is stable.

## Exit codes

Recommended exit code behavior:

| Exit code | Meaning |
|---|---|
| `0` | Command completed successfully |
| `1` | Command failed |
| `2` | Invalid usage or invalid arguments |

Examples:

- `softadastra status` → `0` if status was read successfully
- `softadastra store get missing/key` → `1` if key not found is treated as command failure
- `softadastra store put app/name` → `2` because value argument is missing

The exact policy can evolve, but it should remain predictable.

## Stable output principles

CLI output should be readable for humans and stable enough for scripts.

Recommended style:

```txt
Section

  key   : value
  field : value
```

For tables:

```txt
Node ID        Host        Port    State
node-b         127.0.0.1   4042    available
```

For errors:

```txt
error: failed to read key
reason: key not found
key: settings/theme
```

## Error reference

| Error | Meaning |
|---|---|
| `unknown command` | The command does not exist |
| `unknown subcommand` | The command group exists, but the subcommand does not |
| `missing argument` | A required argument was not provided |
| `invalid key` | The provided key is invalid |
| `key not found` | The requested key does not exist |
| `store unavailable` | The local store is not available |
| `sync unavailable` | The sync runtime is not available |
| `node unavailable` | The local node runtime is not available |
| `discovery unavailable` | Discovery is disabled or not running |
| `transport unavailable` | Transport is disabled or not running |
| `peer unavailable` | A peer cannot be reached or used |

### Unknown command

Example:

```sh
softadastra unknown
```

Expected output:

```txt
error: unknown command: unknown
hint: run `softadastra help`
```

### Missing argument

Example:

```sh
softadastra store put app/name
```

Expected output:

```txt
error: missing value
usage: softadastra store put <key> <value>
```

### Key not found

Example:

```sh
softadastra store get missing/key
```

Expected output:

```txt
error: key not found
key: missing/key
```

### Sync unavailable

```txt
error: sync unavailable
reason: runtime is not initialized
```

### Discovery unavailable

```txt
error: failed to read peers
reason: discovery is not enabled
```

## Command lifecycle

A command should generally follow this internal lifecycle:

1. parse arguments
2. validate command
3. open runtime context
4. execute operation
5. format result
6. return exit code

For store commands: parse key/value, validate key, execute local store operation, format result, return exit code.

For sync commands: parse sync subcommand, read sync state or run tick, format sync result, return exit code.

For peer commands: read discovery or transport peer registry, format peers, return exit code.

## Command to engine mapping

| CLI command | Engine layer |
|---|---|
| `status` | runtime, store, sync, transport, discovery, metadata |
| `node info` | metadata |
| `node start` | node app, transport, discovery, sync |
| `store put` | store, WAL if enabled, sync tracking |
| `store get` | store |
| `store remove` | store, WAL if enabled, sync tracking |
| `sync status` | sync state, outbox, queue, ACK tracking |
| `sync tick` | sync scheduler |
| `peers` | discovery registry, transport peer registry |

## Command to SDK mapping

| CLI | C++ SDK | JavaScript SDK |
|---|---|---|
| `store put` | `client.put()` | `client.put()` |
| `store get` | `client.get()` | `client.get()` |
| `store remove` | `client.remove()` | `client.remove()` |
| `sync status` | `client.sync_state()` | `client.syncStateInfo()` |
| `sync tick` | `client.tick()` | `client.tick()` |
| `peers` | `client.peers()` | `client.peers()` |
| `node info` | `client.refresh_node_info()` | `client.refreshNodeInfo()` |

## Recommended first commands

Run these after installation:

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

Then inspect sync:

```sh
softadastra sync status
softadastra sync tick
```

Then inspect node and peers:

```sh
softadastra node info
softadastra peers
```

## Full quick reference

```sh
softadastra help
softadastra version
softadastra status

softadastra node info
softadastra node start

softadastra store put <key> <value>
softadastra store get <key>
softadastra store remove <key>
softadastra store list

softadastra sync status
softadastra sync tick
softadastra sync tick --prune

softadastra peers
```

Interactive mode:

```txt
softadastra
softadastra> status
softadastra> node info
softadastra> store put <key> <value>
softadastra> store get <key>
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> exit
```

## Stability note

This reference describes the intended stable CLI surface.

If a command is not implemented yet in the current build, do not present it as stable in release notes until it is available and tested.

The core stable CLI should prioritize: `help`, `version`, `status`, `node info`, `store put`, `store get`, `store remove`, `sync status`, `sync tick`, and `peers`.

## Summary

The CLI reference is the compact command map for Softadastra.

The most important workflow is:

```sh
softadastra status
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra node info
softadastra peers
```

## Next step

Continue with the SDK C++ overview:

[Go to SDK C++](/sdk-cpp/)
