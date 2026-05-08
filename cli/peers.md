# Peers

The `peers` command lists peers known to the local Softadastra runtime.

Peers are other nodes that the local node may be able to connect to, synchronize with, or inspect.

The command is:

```sh
softadastra peers
```

## Why peers matter

Softadastra is local-first, but it can also synchronize with other nodes.

To synchronize with another node, the local runtime needs to know which peers exist, where they are reachable, whether they are available, and whether transport can connect to them.

The peers command makes that visible.

## Peer discovery model

Softadastra separates peer discovery from transport and sync.

```txt
Discovery  -> finds peers
Transport  -> connects peers
Sync       -> sends operations
```

This separation is important.

- **Discovery** only answers: which peers are known?
- **Transport** answers: can I connect to this peer?
- **Sync** answers: what operations should I send?

## Basic usage

Run:

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

This is not necessarily an error. A local Softadastra node can still write and read local data without peers.

## What a peer represents

A peer usually contains node id, host, port, state, last seen time, and capabilities when available.

A minimal peer can be:

```txt
node-b 127.0.0.1:4042
```

At SDK level, a peer maps to a public structure like:

```cpp
Peer peer{
    "node-b",
    "127.0.0.1",
    4042};
```

In JavaScript:

```js
const peer = new Peer("node-b", "127.0.0.1", 4042);
```

## Peer states

A peer can have different states depending on discovery and transport.

Common states: `available`, `connected`, `stale`, `expired`, `faulted`, `unknown`.

### `available`

The peer is known and may be reachable.

```txt
node-b 127.0.0.1:4042 available
```

This usually means discovery or configuration knows about the peer.

### `connected`

The local transport has an active connection to the peer.

```txt
node-b 127.0.0.1:4042 connected
```

This means the peer is a candidate for synchronization.

### `stale`

The peer was seen before, but has not been refreshed recently.

```txt
node-b 127.0.0.1:4042 stale
```

This does not always mean the peer is offline. It means the local node has not seen a fresh announcement or confirmation recently.

### `expired`

The peer has passed its time-to-live and should no longer be considered available.

```txt
node-b 127.0.0.1:4042 expired
```

Expired peers can be pruned by the discovery layer.

### `faulted`

The peer is known, but transport reported an error.

```txt
node-b 127.0.0.1:4042 faulted
```

This can happen when the connection was refused, a timeout occurred, the socket closed, an invalid frame was received, or the peer stopped responding.

A faulted peer may become available again later.

## Peers and local-first behavior

Peers are not required for local work.

This should work even when `softadastra peers` returns no peers:

```sh
softadastra store put draft/1 hello
softadastra store get draft/1
```

A local write should not depend on a peer, transport, discovery, or cloud availability.

Peers only matter when local work needs to be synchronized with other nodes.

## Peers and discovery

Discovery is one way to find peers.

The discovery layer can announce the local node and listen for other nodes.

Conceptually:

```txt
node A announces itself
node B receives announcement
node B adds node A to peer registry
```

Then `softadastra peers` can show discovered peers.

## Peers and transport

Transport connects to peers.

The flow is:

```txt
peer known
  ↓
transport connect
  ↓
peer connected
  ↓
sync can send operations
```

If transport fails, the peer may be marked faulted or unavailable. This should not remove local data.

## Peers and sync

Sync uses peers as possible delivery targets.

```txt
sync outbox
  ↓
next batch
  ↓
transport
  ↓
peer
```

If no peer is available, sync work can remain pending.

```txt
local operation
  ↓
outbox
  ↓
no peer available
  ↓
retry later
```

That is normal in offline-first systems.

## Example: no peers yet

Run:

```sh
softadastra peers
```

Output:

```txt
Peers

  no peers found
```

This means the runtime currently has no known peer.

You can still run:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
```

The sync state may show pending local work, but delivery to another node is delayed.

## Example: peer available

Output:

```txt
Peers

Node ID        Host        Port    State
node-b         127.0.0.1   4042    available
```

This means the local runtime knows about `node-b`.

It does not automatically guarantee that sync has completed. Check sync state:

```sh
softadastra sync status
```

Then move the sync pipeline:

```sh
softadastra sync tick
```

## Example: peer faulted

Output:

```txt
Peers

Node ID        Host        Port    State
node-b         127.0.0.1   4042    faulted
```

This usually means transport could not connect or the connection failed.

The correct behavior is: peer delivery failed, sync work remains tracked, and local data remains valid.

You can inspect sync:

```sh
softadastra sync status
```

## Interactive mode

Inside interactive mode:

```txt
softadastra> peers
softadastra> sync status
softadastra> sync tick
```

Do not repeat the binary name:

```txt
softadastra> softadastra peers
```

Use only:

```txt
softadastra> peers
```

## Recommended peer workflow

A useful workflow is:

```sh
softadastra status
softadastra node info
softadastra peers
softadastra sync status
```

If peers are available:

```sh
softadastra sync tick
softadastra sync status
```

If no peers are available:

```sh
softadastra store put draft/1 hello
softadastra sync status
```

This verifies that local-first behavior still works without peer availability.

## Output style

Peer output should be readable and stable.

Recommended table style:

```txt
Peers

Node ID        Host        Port    State
node-b         127.0.0.1   4042    available
node-c         127.0.0.1   4043    stale
```

For no peers:

```txt
Peers

  no peers found
```

For errors:

```txt
error: failed to read peers
reason: discovery service is not running
```

## Error handling

Peer errors should clearly explain whether the issue is with discovery, transport, or runtime state.

### Discovery unavailable

```txt
error: failed to read peers
reason: discovery is not enabled
```

This should not imply the local store is broken.

### Runtime unavailable

```txt
error: failed to read peers
reason: runtime is not initialized
```

### Invalid peer data

```txt
error: invalid peer entry
reason: missing node id
```

## Common mistakes

### Expecting peers to be required for local writes

Peers are not required for local writes. Local store commands should continue working.

### Assuming peers means connected

A listed peer may be available, stale, or known from discovery. It is not always actively connected.

### Assuming no peers is an error

No peers is a valid state in local development.

### Assuming sync completed because a peer exists

A peer being known does not mean all sync work has been delivered. Check:

```sh
softadastra sync status
```

### Confusing discovery with transport

Discovery finds peers. Transport connects to peers. They are related, but not the same.

## How peers map to the SDK

CLI:

```sh
softadastra peers
```

C++ SDK:

```cpp
auto peers = client.peers();

if (peers.is_ok())
{
    for (const auto &peer : peers.value())
    {
        std::cout << peer.node_id << " "
                  << peer.host << ":"
                  << peer.port << "\n";
    }
}
```

JavaScript SDK:

```js
const peers = await client.peers();

if (peers.isOk()) {
  for (const peer of peers.value()) {
    console.log(`${peer.nodeId} ${peer.host}:${peer.port}`);
  }
}
```

The model is the same across CLI, C++ SDK, and JavaScript SDK.

## How peers map to the engine

```txt
peers command
  -> discovery registry
  -> transport peer registry
  -> peer state
```

Discovery can provide available peers. Transport can provide connected or faulted peers. Metadata can later enrich peer information with capabilities and version.

## Peers in the full flow

A complete flow can look like this:

1. Local node starts
2. Discovery announces local node
3. Discovery receives announcement from another node
4. Peer is added to registry
5. `softadastra peers` lists the peer
6. Transport connects to the peer
7. Sync tick produces a batch
8. Transport sends the batch
9. Remote node applies operation
10. ACK returns
11. Sync state updates

If the peer disappears:

```txt
transport marks peer faulted
sync work remains tracked
retry can happen later
```

## Summary

The peers command shows which nodes the local runtime currently knows about.

Peers are important for synchronization, but they are not required for local work.

The key model is:

- Discovery finds peers.
- Transport connects peers.
- Sync sends operations.
- Store remains local-first.

## Next step

Continue with the CLI reference:

[Go to CLI Reference](/cli/reference)
