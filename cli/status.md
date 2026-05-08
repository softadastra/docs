# Status Command

The `status` command shows the current state of the local Softadastra runtime.

It is usually the first command to run when you want to know whether the local runtime is available, healthy, and ready to accept local work.

```sh
softadastra status
```

## Why status exists

Softadastra is local-first and modular.

A local runtime can include several layers: store, WAL, sync, transport, discovery, and metadata.

The status command gives a quick overview of these layers without requiring you to inspect each one manually.

It helps answer: is the runtime initialized, is the local node healthy, is the store available, is sync enabled, is there pending sync work, is transport running, is discovery running, and are peers available?

## Basic usage

Run:

```sh
softadastra status
```

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

## What status should show

The command should summarize the most important runtime areas.

```txt
Node       -> local identity and runtime state
Store      -> local data state
Sync       -> pending synchronization work
Transport  -> peer message delivery state
Discovery  -> peer discovery state
Peers      -> known peers, if available
```

The goal is not to show every internal detail. The goal is to give a fast diagnostic overview.

## Node status

The node section describes the local runtime identity.

Example:

```txt
Node
  id       : node-a
  version  : 0.1.0
  state    : healthy
```

Useful fields: id, display name, version, hostname, os, uptime, state, and capabilities.

For deeper node details, use:

```sh
softadastra node info
```

## Store status

The store section describes local data state.

Example:

```txt
Store
  entries  : 12
```

Useful fields: entries, empty, durable, and wal path.

The store should remain usable even when transport or discovery is disabled. A healthy store means local read and write operations can work.

## WAL status

If WAL is enabled, status can show persistence information.

Example:

```txt
WAL
  enabled  : yes
  path     : data/softadastra.wal
  durable  : yes
```

Useful fields: enabled, path, auto flush, last sequence, and durable mode.

The WAL is important because it makes accepted local operations recoverable after restart.

## Sync status

The sync section summarizes pending synchronization work.

Example:

```txt
Sync
  outbox       : 3
  queued       : 3
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0
```

Useful fields: outbox, queued, in flight, acknowledged, failed, last submitted version, last applied remote version, and total retries.

For deeper sync details, use:

```sh
softadastra sync status
```

## Transport status

The transport section shows whether peer message delivery is running.

Example:

```txt
Transport
  running  : yes
  bind     : 127.0.0.1:4041
```

Useful fields: running, host, port, connected peers, and faulted peers.

Transport is optional. If transport is not running, local store operations should still work.

```sh
softadastra store put draft/1 hello
```

## Discovery status

The discovery section shows whether peer discovery is running.

Example:

```txt
Discovery
  running  : yes
  bind     : 127.0.0.1:5051
  peers    : 2
```

Useful fields: running, host, port, broadcast host, broadcast port, known peers, stale peers, and expired peers.

Discovery is optional. If discovery is not running, the local node can still write and read local data.

## Peer status

If peer data is available, status can show a short peer summary.

Example:

```txt
Peers
  known     : 2
  connected : 1
  stale     : 1
  faulted   : 0
```

For a full peer list, use:

```sh
softadastra peers
```

## Healthy status

A healthy local runtime might look like this:

```txt
Softadastra status

Node
  id       : node-a
  version  : 0.1.0
  state    : healthy

Store
  entries  : 4

Sync
  outbox   : 0
  queued   : 0
  failed   : 0

Transport
  running  : no

Discovery
  running  : no
```

This means node metadata is available, store is available, sync has no failed work, and transport and discovery are disabled or stopped.

Transport and discovery being stopped does not automatically mean the runtime is unhealthy.

## Pending sync status

A runtime with pending sync work might show:

```txt
Softadastra status

Node
  id       : node-a
  version  : 0.1.0
  state    : healthy

Store
  entries  : 5

Sync
  outbox   : 2
  queued   : 2
  failed   : 0

Transport
  running  : no

Discovery
  running  : no
```

This means local work exists, but some operations still need synchronization.

Run:

```sh
softadastra sync tick
```

Then inspect again:

```sh
softadastra status
```

## Failed sync status

A runtime with failed sync work might show:

```txt
Softadastra status

Node
  id       : node-a
  version  : 0.1.0
  state    : degraded

Store
  entries  : 5

Sync
  outbox   : 3
  queued   : 0
  failed   : 3
  retries  : 9

Transport
  running  : yes

Discovery
  running  : yes
```

This means local data may still be valid, but synchronization has failed according to the current retry policy.

Recommended next commands:

```sh
softadastra sync status
softadastra peers
softadastra node info
```

## No peers status

If no peers are available:

```txt
Peers
  known     : 0
  connected : 0
```

This is not necessarily an error. It only means the local runtime currently does not know about another node.

Local store commands should still work:

```sh
softadastra store put local/message hello
softadastra store get local/message
```

## Status and local-first behavior

The status command should reflect Softadastra's local-first model.

A runtime can be useful even when transport is not running, discovery is not running, no peer is connected, and sync has pending work.

The most important question is: can the local node still accept and read local state? If yes, the local-first layer is still useful.

## Status and sync

If status shows pending sync work:

```txt
Sync
  outbox   : 3
  queued   : 3
  failed   : 0
```

Run:

```sh
softadastra sync status
softadastra sync tick
```

`status` gives the overview. `sync status` gives deeper sync details.

## Status and node metadata

If node metadata looks wrong, run:

```sh
softadastra node info
```

The node command should provide more detailed fields: node id, display name, hostname, os, version, uptime, and capabilities.

## Status and peers

If status shows no peers or faulted peers, run:

```sh
softadastra peers
```

Then inspect sync:

```sh
softadastra sync status
```

This helps separate peer availability from sync state.

## Interactive mode

Inside interactive mode:

```txt
softadastra> status
softadastra> sync status
softadastra> peers
```

Do not repeat the binary name:

```txt
softadastra> softadastra status
```

Use:

```txt
softadastra> status
```

## JSON output

If supported, status can expose machine-readable output:

```sh
softadastra status --json
```

Example shape:

```json
{
  "node": {
    "id": "node-a",
    "version": "0.1.0",
    "state": "healthy"
  },
  "store": {
    "entries": 12
  },
  "sync": {
    "outbox": 3,
    "queued": 3,
    "in_flight": 0,
    "acknowledged": 0,
    "failed": 0,
    "retries": 0
  },
  "transport": {
    "running": false
  },
  "discovery": {
    "running": false
  }
}
```

Only expose `--json` as stable when the JSON schema is stable.

## Exit codes

Recommended behavior:

| Exit code | Meaning |
|---|---|
| `0` | Status was read successfully |
| `1` | Failed to read runtime status |
| `2` | Invalid usage or invalid options |

No peers should not normally be an error. Pending sync work should not normally be an error. Failed sync work may still return `0` if the status command successfully reported it — the runtime state can be degraded while the command itself succeeds.

## Error handling

Errors should explain which part of status failed.

### Runtime unavailable

```txt
error: failed to read status
reason: runtime is not initialized
```

### Store unavailable

```txt
error: failed to read store status
reason: store is not available
```

### Sync unavailable

```txt
error: failed to read sync status
reason: sync is not initialized
```

### Metadata unavailable

```txt
error: failed to read node metadata
reason: metadata service is not available
```

## Output style

Status output should be grouped and readable.

Recommended format:

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

Avoid dumping raw internal structs unless debug mode is enabled.

## Common mistakes

### Treating stopped transport as failure

Transport can be stopped while local-first behavior still works.

### Treating no peers as failure

No peers is normal in local development.

### Treating pending sync as failure

Pending sync means work is waiting to be delivered. It does not mean local data is invalid.

### Expecting status to replace detailed commands

Use status for overview. Use these for detail:

```sh
softadastra node info
softadastra sync status
softadastra peers
```

## Recommended first status workflow

Run:

```sh
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra sync status
softadastra sync tick
softadastra status
```

This tests runtime overview, node metadata, local write, sync state, manual tick, and status refresh.

## How status maps to the SDK

CLI:

```sh
softadastra status
```

C++ SDK equivalents:

```cpp
auto node = client.refresh_node_info();
auto sync = client.sync_state();
auto peers = client.peers();
```

JavaScript SDK equivalents:

```js
const node = await client.refreshNodeInfo();
const sync = await client.syncStateInfo();
const peers = await client.peers();
```

The CLI combines these ideas into one overview.

## How status maps to the engine

```txt
status
  -> metadata
  -> store
  -> sync
  -> transport
  -> discovery
  -> peer registries
```

The command should summarize the engine without exposing unnecessary internal complexity.

## Summary

The status command is the main diagnostic overview command.

It helps you see node identity, store state, sync state, transport state, discovery state, and peer summary.

The key idea is: status tells you what the local runtime looks like right now.

## Next step

Continue with node commands:

[Go to Node Commands](/cli/node)
