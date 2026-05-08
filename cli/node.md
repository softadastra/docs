# Node Commands

Node commands are used to inspect or control the local Softadastra node.

The node represents the local runtime identity. It can expose metadata such as node id, display name, hostname, operating system, version, uptime, and capabilities.

The main command group is:

```sh
softadastra node <subcommand>
```

## Why node commands exist

Softadastra is local-first. That means every local runtime needs a clear identity.

Node commands answer questions like:

- who is this node?
- what version is it running?
- what platform is it running on?
- how long has it been running?
- what capabilities does it support?
- can it start a local runtime process?

The most important node command is:

```sh
softadastra node info
```

## Command overview

```txt
softadastra node info    -> show local node metadata
softadastra node start   -> start a local node runtime, if available
```

The exact list can grow over time, but the first stable commands should stay simple and clear.

## `softadastra node info`

Shows metadata about the local node.

```sh
softadastra node info
```

This command should display node id, display name, hostname, operating system, version, uptime, and capabilities.

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

## What node metadata means

Node metadata describes the local Softadastra runtime. It does not store application data.

It answers: who is this node, what is it running, what can it do, and how long has it been active?

This maps to the metadata layer of the engine.

```txt
metadata -> node identity, runtime info, capabilities
```

### Node id

The node id is the stable local identifier for the runtime.

Example:

```txt
id : node-a
```

The node id is used by sync, transport, discovery, and metadata to identify the local participant.

A good node id should be non-empty, stable, unique enough for the local network or deployment, and human-readable when possible.

### Display name

The display name is a human-friendly label.

Example:

```txt
display name : Local Node
```

If no display name is configured, the node id can be used as the fallback label.

### Hostname

The hostname identifies the local machine name when available.

Example:

```txt
hostname : softadastra-dev
```

This is useful for debugging, local dashboards, peer inspection, logs, and operator visibility.

### Operating system

The operating system tells where the node is running.

Example:

```txt
os : linux
```

This helps when debugging multiple nodes across different machines or platforms.

### Version

The version tells which Softadastra runtime version is active.

Example:

```txt
version : 0.1.0
```

This is useful when checking compatibility between nodes, SDKs, builds, and releases.

### Uptime

Uptime shows how long the local runtime has been active.

Example:

```txt
uptime ms : 18420
```

This can help detect restarts, crashes, or runtime lifecycle issues.

### Capabilities

Capabilities describe what the node supports.

Possible capabilities include: `core`, `fs`, `wal`, `store`, `sync`, `transport`, `discovery`, `metadata`, `app`, and `cli`.

Example:

```txt
capabilities : core, store, sync, transport, discovery, metadata
```

Capabilities are useful because not every node needs to support every layer.

For example:

- A local-only node might support: `core`, `store`, `metadata`
- A sync-capable node might support: `core`, `wal`, `store`, `sync`, `metadata`
- A peer-aware node might support: `core`, `wal`, `store`, `sync`, `transport`, `discovery`, `metadata`

## `softadastra node start`

Starts a local Softadastra node runtime if the node application is available.

```sh
softadastra node start
```

This command is useful when the build includes the node app from `apps/node`.

Example output style:

```txt
Softadastra node

  id       : node-a
  address  : 127.0.0.1:4041
  state    : running
```

### When to use node start

Use `node start` when you want to run a local Softadastra runtime process.

Common cases: local development, peer sync tests, transport tests, discovery tests, manual CLI demos, and local runtime experiments.

A running node can later expose transport, discovery, metadata, and sync behavior depending on its configuration.

## Node start versus node info

`node info` inspects local metadata.

```sh
softadastra node info
```

`node start` starts a local runtime process.

```sh
softadastra node start
```

```txt
node info  -> inspect
node start -> run
```

## Node and local-first behavior

The node is local-first.

That means the local node can exist and expose metadata even when no peer is connected, transport is disabled, discovery found no peers, or the network is unavailable.

Node identity is local runtime information. It should not depend on a remote server.

## Node and sync

The sync layer uses the node id to identify where operations come from.

A local operation can contain metadata like origin node id, sync id, version, and timestamp.

So if the local node id is `node-a`, then local sync operations can be identified as coming from `node-a`.

This is important when operations move between peers.

## Node and transport

Transport uses node identity when sending messages to peers.

A transport message can contain from node id, to node id, correlation id, message type, and payload.

The node id helps peers know who sent the message.

## Node and discovery

Discovery uses node identity when announcing or probing nodes.

A discovery announcement can say:

```txt
node-a is available at 127.0.0.1:4041
```

Then another peer can connect through transport.

The relationship is:

```txt
node metadata describes the node
discovery finds the node
transport connects to the node
sync exchanges operations with the node
```

## Node and metadata

Node commands map directly to metadata concepts.

At the SDK level, similar information is available through:

```cpp
auto info = client.refresh_node_info();
```

In JavaScript:

```js
const info = await client.refreshNodeInfo();
```

The CLI exposes that information without requiring application code.

## Example: inspect local node

Run:

```sh
softadastra node info
```

Expected output style:

```txt
Node

  id           : node-local
  display name : node-local
  hostname     : dev-machine
  os           : linux
  version      : 0.1.0
  uptime ms    : 2401
  capabilities : core, store, sync, metadata
```

This tells you the local runtime is available and can expose metadata.

## Example: start a node

Run:

```sh
softadastra node start
```

Expected output style:

```txt
Softadastra node

  id       : node-local
  address  : 127.0.0.1:4041
  state    : running
```

If the node app is not included in the current build, the CLI should fail clearly.

Example:

```txt
error: node app is not available in this build
hint: rebuild with SOFTADASTRA_BUILD_NODE_APP=ON
```

## Build with node app support

If `node start` is unavailable, rebuild the engine with the node app enabled.

```sh
cd ~/softadastra/softadastra

vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

Then run:

```sh
./softadastra node start
```

## Recommended node workflow

Use this workflow when testing node behavior:

```sh
softadastra status
softadastra node info
softadastra node start
softadastra peers
softadastra sync status
```

This checks runtime status, local node metadata, node runtime startup, known peers, and sync state.

## Error behavior

Node command errors should be specific.

Bad:

```txt
error: failed
```

Better:

```txt
error: failed to read node metadata
reason: client is not open
```

Better:

```txt
error: node app is not available in this build
hint: rebuild with SOFTADASTRA_BUILD_NODE_APP=ON
```

The user should understand what failed and what to do next.

## Common issues

### `node info` returns no metadata

Possible causes: runtime not initialized, metadata service unavailable, invalid node id, client not open, or internal metadata error.

Recommended checks:

```sh
softadastra status
softadastra node info
```

### `node start` does not exist

The node app may not be compiled.

Rebuild with:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

### No peers after starting node

This can be normal. Possible causes: no other node is running, discovery is disabled, transport is not listening, ports do not match, or network blocks local traffic.

Local node metadata can still work without peers.

## Output style

Node output should stay readable and stable.

Recommended format:

```txt
Node

  id           : node-a
  display name : Local Node
  hostname     : softadastra-dev
  os           : linux
  version      : 0.1.0
  uptime ms    : 18420
  capabilities : core, store, sync, metadata
```

Avoid printing raw internal structures unless debug mode is enabled.

## Summary

Node commands let you inspect and control the local Softadastra node.

They are used for local metadata, runtime identity, node startup, diagnostics, and peer-ready workflows.

The most important command is:

```sh
softadastra node info
```

It tells you who the local node is and what it can do.

## Next step

Continue with store commands:

[Go to Store Commands](/cli/store)
