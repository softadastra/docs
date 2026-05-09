# Sync Between Nodes

This guide shows how to synchronize local operations between two Softadastra nodes.

The goal is to understand how local work moves from one node toward another node through sync, transport, and optional discovery.

The core rule is:

```txt
Sync decides what should be sent.
Transport sends it.
Discovery finds peers.
```

A local write can happen before any peer receives it. Synchronization is the later propagation step.

## What you will do

You will learn how to:

- create two local nodes
- use separate WAL files
- use separate transport ports
- write local data on node A
- inspect sync state
- start transport
- connect node A to node B
- run sync ticks
- inspect pending work
- understand what happens when no peer is available

The basic flow is:

```txt
node A local write
  ↓
WAL append, if enabled
  ↓
store apply
  ↓
sync outbox
  ↓
transport connection
  ↓
node B receives operation
  ↓
node B applies operation
```

## Why two-node sync matters

Offline-first systems allow work to happen before the network is available.

That means a node can write locally first:

```txt
node A writes locally
node B is not connected
node A keeps working
```

Later, when a peer becomes reachable, the local operation can be propagated:

```txt
node A has pending sync work
  ↓
node A connects to node B
  ↓
node A sends sync batch
  ↓
node B applies operation
```

This is the difference between local-first storage and distributed synchronization.

## Important model

Softadastra separates responsibilities:

```txt
Store      -> current local state
WAL        -> durable operation history
Sync       -> pending propagation work
Transport  -> peer message delivery
Discovery  -> peer finding
Metadata   -> node identity
```

This guide focuses on sync and transport.

Discovery can be added later.

## Node A and Node B

For local testing, use two nodes:

```txt
node-a
node-b
```

Each node should have its own runtime identity, WAL path, and transport port.

Recommended local setup:

```txt
node-a
  wal       : data/node-a.wal
  transport : 127.0.0.1:4041

node-b
  wal       : data/node-b.wal
  transport : 127.0.0.1:4042
```

Do not use the same WAL file for both nodes.

## Create the data directory

Before running persistent examples:

```bash
mkdir -p data
```

Each node should have a separate WAL path:

```txt
data/node-a.wal
data/node-b.wal
```

## Option A: C++ two-node sync shape

Use this section if you want to understand the C++ SDK flow.

### Node A configuration

```cpp
ClientOptions node_a_options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");

node_a_options.auto_flush = true;

node_a_options.enable_transport = true;
node_a_options.transport_host = "127.0.0.1";
node_a_options.transport_port = 4041;

node_a_options.enable_discovery = false;
```

### Node B configuration

```cpp
ClientOptions node_b_options =
    ClientOptions::persistent(
        "node-b",
        "data/node-b.wal");

node_b_options.auto_flush = true;

node_b_options.enable_transport = true;
node_b_options.transport_host = "127.0.0.1";
node_b_options.transport_port = 4042;

node_b_options.enable_discovery = false;
```

### Create both clients

```cpp
Client node_a{node_a_options};
Client node_b{node_b_options};
```

Open both:

```cpp
auto open_a = node_a.open();
auto open_b = node_b.open();

if (open_a.is_err())
{
    std::cerr << open_a.error().message() << "\n";
    return 1;
}

if (open_b.is_err())
{
    std::cerr << open_b.error().message() << "\n";
    node_a.close();
    return 1;
}
```

Start transport:

```cpp
auto transport_a = node_a.start_transport();
auto transport_b = node_b.start_transport();
```

Connect node A to node B:

```cpp
Peer peer_b{
    "node-b",
    "127.0.0.1",
    4042};

auto connected = node_a.connect(peer_b);

if (connected.is_err())
{
    std::cout << "connection failed: "
              << connected.error().message()
              << "\n";
}
```

Write on node A:

```cpp
auto written =
    node_a.put("message/1", "hello from node-a");

if (written.is_err())
{
    std::cerr << written.error().message() << "\n";
}
```

Run one tick:

```cpp
auto tick = node_a.tick();

if (tick.is_ok())
{
    std::cout << "batch: "
              << tick.value().batch_size
              << "\n";
}
```

Inspect sync state:

```cpp
auto state = node_a.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: "
              << state.value().outbox_size
              << "\n";

    std::cout << "queued: "
              << state.value().queued_count
              << "\n";

    std::cout << "failed: "
              << state.value().failed_count
              << "\n";
}
```

Close both nodes:

```cpp
node_a.close();
node_b.close();
```

## C++ complete example shape

This example shows the expected structure. Depending on the current transport implementation, remote apply may already work or may still be represented as a pending transport/sync batch.

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions node_a_options =
        ClientOptions::persistent(
            "node-a",
            "data/node-a.wal");

    node_a_options.auto_flush = true;
    node_a_options.enable_transport = true;
    node_a_options.transport_host = "127.0.0.1";
    node_a_options.transport_port = 4041;
    node_a_options.enable_discovery = false;

    ClientOptions node_b_options =
        ClientOptions::persistent(
            "node-b",
            "data/node-b.wal");

    node_b_options.auto_flush = true;
    node_b_options.enable_transport = true;
    node_b_options.transport_host = "127.0.0.1";
    node_b_options.transport_port = 4042;
    node_b_options.enable_discovery = false;

    Client node_a{node_a_options};
    Client node_b{node_b_options};

    auto open_a = node_a.open();

    if (open_a.is_err())
    {
        std::cerr << "failed to open node-a: "
                  << open_a.error().message()
                  << "\n";

        return 1;
    }

    auto open_b = node_b.open();

    if (open_b.is_err())
    {
        std::cerr << "failed to open node-b: "
                  << open_b.error().message()
                  << "\n";

        node_a.close();
        return 1;
    }

    auto start_a = node_a.start_transport();
    auto start_b = node_b.start_transport();

    if (start_a.is_err())
    {
        std::cerr << "failed to start node-a transport: "
                  << start_a.error().message()
                  << "\n";
    }

    if (start_b.is_err())
    {
        std::cerr << "failed to start node-b transport: "
                  << start_b.error().message()
                  << "\n";
    }

    Peer peer_b{
        "node-b",
        "127.0.0.1",
        4042};

    auto connected = node_a.connect(peer_b);

    if (connected.is_err())
    {
        std::cout << "peer connection failed\n";
        std::cout << "  peer    : node-b\n";
        std::cout << "  address : 127.0.0.1:4042\n";
        std::cout << "  error   : "
                  << connected.error().message()
                  << "\n";
    }
    else
    {
        std::cout << "connected to node-b\n";
    }

    auto written =
        node_a.put("message/1", "hello from node-a");

    if (written.is_err())
    {
        std::cerr << "write failed: "
                  << written.error().message()
                  << "\n";

        node_a.close();
        node_b.close();
        return 1;
    }

    auto before = node_a.sync_state();

    if (before.is_ok())
    {
        std::cout << "\nbefore tick\n";
        std::cout << "  outbox : "
                  << before.value().outbox_size
                  << "\n";
        std::cout << "  queued : "
                  << before.value().queued_count
                  << "\n";
        std::cout << "  failed : "
                  << before.value().failed_count
                  << "\n";
    }

    auto tick = node_a.tick();

    if (tick.is_ok())
    {
        std::cout << "\nsync tick\n";
        std::cout << "  retried : "
                  << tick.value().retried_count
                  << "\n";
        std::cout << "  pruned  : "
                  << tick.value().pruned_count
                  << "\n";
        std::cout << "  batch   : "
                  << tick.value().batch_size
                  << "\n";
    }

    auto after = node_a.sync_state();

    if (after.is_ok())
    {
        std::cout << "\nafter tick\n";
        std::cout << "  outbox : "
                  << after.value().outbox_size
                  << "\n";
        std::cout << "  queued : "
                  << after.value().queued_count
                  << "\n";
        std::cout << "  failed : "
                  << after.value().failed_count
                  << "\n";
    }

    node_a.close();
    node_b.close();

    return 0;
}
```

Expected output style:

```txt
connected to node-b

before tick
  outbox : 1
  queued : 1
  failed : 0

sync tick
  retried : 0
  pruned  : 0
  batch   : 1

after tick
  outbox : 1
  queued : 1
  failed : 0
```

The exact output can differ depending on ACK handling, pruning, and the current transport implementation.

## Option B: JavaScript two-node sync shape

Use this section if you want to understand the JavaScript SDK flow.

### Node A configuration

```js
const nodeAOptions = ClientOptions.persistent(
  "node-a",
  "data/node-a.wal",
);

nodeAOptions.autoFlush = true;

nodeAOptions.enableTransport = true;
nodeAOptions.transportHost = "127.0.0.1";
nodeAOptions.transportPort = 4041;

nodeAOptions.enableDiscovery = false;
```

### Node B configuration

```js
const nodeBOptions = ClientOptions.persistent(
  "node-b",
  "data/node-b.wal",
);

nodeBOptions.autoFlush = true;

nodeBOptions.enableTransport = true;
nodeBOptions.transportHost = "127.0.0.1";
nodeBOptions.transportPort = 4042;

nodeBOptions.enableDiscovery = false;
```

### Create both clients

```js
const nodeA = new Client(nodeAOptions);
const nodeB = new Client(nodeBOptions);
```

Open both:

```js
const openA = await nodeA.open();
const openB = await nodeB.open();

if (openA.isErr()) {
  console.error(openA.error().message);
  process.exit(1);
}

if (openB.isErr()) {
  console.error(openB.error().message);
  await nodeA.close();
  process.exit(1);
}
```

Start transport:

```js
await nodeA.startTransport();
await nodeB.startTransport();
```

Connect node A to node B:

```js
const peerB = new Peer("node-b", "127.0.0.1", 4042);

const connected = await nodeA.connect(peerB);

if (connected.isErr()) {
  console.log(`connection failed: ${connected.error().message}`);
}
```

Write on node A:

```js
const written = await nodeA.put(
  "message/1",
  "hello from node-a",
);

if (written.isErr()) {
  console.error(written.error().message);
}
```

Run one tick:

```js
const tick = await nodeA.tick();

if (tick.isOk()) {
  console.log(`batch: ${tick.value().batchSize}`);
}
```

Inspect sync state:

```js
const state = await nodeA.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox: ${state.value().outboxSize}`);
  console.log(`queued: ${state.value().queuedCount}`);
  console.log(`failed: ${state.value().failedCount}`);
}
```

Close both nodes:

```js
await nodeA.close();
await nodeB.close();
```

## JavaScript complete example shape

Create:

```bash
mkdir -p data
nano two-node-sync.js
```

Paste this code:

```js
import {
  Client,
  ClientOptions,
  Peer,
} from "@softadastra/sdk";

const nodeAOptions = ClientOptions.persistent(
  "node-a",
  "data/node-a.wal",
);

nodeAOptions.autoFlush = true;
nodeAOptions.enableTransport = true;
nodeAOptions.transportHost = "127.0.0.1";
nodeAOptions.transportPort = 4041;
nodeAOptions.enableDiscovery = false;

const nodeBOptions = ClientOptions.persistent(
  "node-b",
  "data/node-b.wal",
);

nodeBOptions.autoFlush = true;
nodeBOptions.enableTransport = true;
nodeBOptions.transportHost = "127.0.0.1";
nodeBOptions.transportPort = 4042;
nodeBOptions.enableDiscovery = false;

const nodeA = new Client(nodeAOptions);
const nodeB = new Client(nodeBOptions);

const openA = await nodeA.open();

if (openA.isErr()) {
  console.error(`failed to open node-a: ${openA.error().message}`);
  process.exit(1);
}

const openB = await nodeB.open();

if (openB.isErr()) {
  console.error(`failed to open node-b: ${openB.error().message}`);
  await nodeA.close();
  process.exit(1);
}

const startA = await nodeA.startTransport();
const startB = await nodeB.startTransport();

if (startA.isErr()) {
  console.error(`failed to start node-a transport: ${startA.error().message}`);
}

if (startB.isErr()) {
  console.error(`failed to start node-b transport: ${startB.error().message}`);
}

const peerB = new Peer("node-b", "127.0.0.1", 4042);

const connected = await nodeA.connect(peerB);

if (connected.isErr()) {
  console.log("peer connection failed");
  console.log("  peer    : node-b");
  console.log("  address : 127.0.0.1:4042");
  console.log(`  error   : ${connected.error().message}`);
} else {
  console.log("connected to node-b");
}

const written = await nodeA.put(
  "message/1",
  "hello from node-a",
);

if (written.isErr()) {
  console.error(`write failed: ${written.error().message}`);
  await nodeA.close();
  await nodeB.close();
  process.exit(1);
}

const before = await nodeA.syncStateInfo();

if (before.isOk()) {
  console.log("\nbefore tick");
  console.log(`  outbox : ${before.value().outboxSize}`);
  console.log(`  queued : ${before.value().queuedCount}`);
  console.log(`  failed : ${before.value().failedCount}`);
}

const tick = await nodeA.tick();

if (tick.isOk()) {
  console.log("\nsync tick");
  console.log(`  retried : ${tick.value().retriedCount}`);
  console.log(`  pruned  : ${tick.value().prunedCount}`);
  console.log(`  batch   : ${tick.value().batchSize}`);
}

const after = await nodeA.syncStateInfo();

if (after.isOk()) {
  console.log("\nafter tick");
  console.log(`  outbox : ${after.value().outboxSize}`);
  console.log(`  queued : ${after.value().queuedCount}`);
  console.log(`  failed : ${after.value().failedCount}`);
}

await nodeA.close();
await nodeB.close();
```

Run:

```bash
node two-node-sync.js
```

Expected output style:

```txt
connected to node-b

before tick
  outbox : 1
  queued : 1
  failed : 0

sync tick
  retried : 0
  pruned  : 0
  batch   : 1

after tick
  outbox : 1
  queued : 1
  failed : 0
```

The exact output can differ depending on ACK handling, pruning, and the current transport implementation.

## What happens when no peer is available

If node B is not running or transport cannot connect, the connection may fail.

Example output:

```txt
peer connection failed
  peer    : node-b
  address : 127.0.0.1:4042
  error   : connection refused
```

This should not invalidate the local write.

The correct behavior is:

```txt
connection failed
  ↓
local write still works
  ↓
sync work remains tracked
  ↓
retry later
```

You should still be able to read the local value from node A.

C++:

```cpp
auto value = node_a.get("message/1");
```

JavaScript:

```js
const value = await nodeA.get("message/1");
```

## Inspect sync state after connection failure

A connection failure can leave sync work pending.

Example:

```txt
Sync status

  outbox       : 1
  queued       : 1
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0
```

This is normal.

Pending work means:

```txt
local operation exists
  ↓
sync wants to propagate it
  ↓
delivery has not completed yet
```

It does not mean local data is lost.

## Use the CLI for the same workflow

You can inspect the same model with the CLI.

Write local data:

```bash
softadastra store put message/1 hello
```

Inspect sync:

```bash
softadastra sync status
```

Run one tick:

```bash
softadastra sync tick
```

Inspect peers:

```bash
softadastra peers
```

If no peers are available:

```txt
Peers

  no peers found
```

That is expected in a one-node local setup.

## Sync status fields

The most useful sync fields are:

```txt
outbox       -> local operations waiting for synchronization
queued       -> operations ready to be selected for sending
in flight    -> operations prepared or sent, waiting for ACK
acknowledged -> operations confirmed by the remote side
failed       -> operations that exceeded retry policy
retries      -> total retry attempts
```

A healthy offline state can still have outbox work.

That means local data exists and will be propagated later when possible.

## Tick result fields

A tick result usually exposes:

```txt
retried -> expired operations retried during the tick
pruned  -> completed entries removed during the tick
batch   -> operations produced for delivery
```

Example:

```txt
Sync tick

  retried : 0
  pruned  : 0
  batch   : 1
```

A batch greater than zero means sync found work ready for delivery.

It does not always mean the remote peer has applied it yet.

## Sync with pruning

If supported, pruning can remove completed work.

C++:

```cpp
auto tick = node_a.tick(true);
```

JavaScript:

```js
const tick = await nodeA.tick({ prune: true });
```

CLI:

```bash
softadastra sync tick --prune
```

Pruning must be safe.

It should only remove work that is completed or no longer needed.

It should not remove local store values.

## Add discovery later

This guide uses manual peer configuration.

C++:

```cpp
Peer peer_b{
    "node-b",
    "127.0.0.1",
    4042};
```

JavaScript:

```js
const peerB = new Peer("node-b", "127.0.0.1", 4042);
```

Discovery can be added later to find peers automatically.

The model becomes:

```txt
discovery finds node-b
  ↓
transport connects node-b
  ↓
sync sends operations
```

Manual peers are simpler for the first sync guide.

## Two-node port rules

When running two nodes on the same machine, ports must not collide.

Good:

```txt
node-a transport : 4041
node-b transport : 4042
```

Bad:

```txt
node-a transport : 4041
node-b transport : 4041
```

If a port is already in use, transport may fail to start.

Check ports:

```bash
ss -ltnp | grep 4041
ss -ltnp | grep 4042
```

## Two-node WAL rules

Each node must use its own WAL path.

Good:

```txt
node-a -> data/node-a.wal
node-b -> data/node-b.wal
```

Bad:

```txt
node-a -> data/shared.wal
node-b -> data/shared.wal
```

A WAL belongs to one local runtime.

Sharing WAL files between nodes can make recovery and sync behavior unsafe.

## Sync does not mean instant convergence

After one tick, both nodes may not instantly show the same state.

Why?

- transport may not be connected
- message may be in flight
- ACK may be required
- remote apply may be delayed
- retry may be needed
- conflict policy may apply

Convergence is eventual.

The important thing is that local work remains valid and sync work remains tracked.

## What this guide proves

This guide proves that Softadastra can:

- write on one node
- track local operations for sync
- prepare sync batches
- use transport as delivery layer
- keep local data valid when peer delivery fails
- use separate node ids
- use separate WAL paths
- use separate transport ports

## What this guide does not prove

This guide does not fully prove production synchronization.

It does not prove conflict resolution under concurrent edits.

It does not prove discovery-based peer discovery.

It does not prove cross-machine deployment.

It does not prove long-running retry behavior.

It does not prove convergence under complex failure patterns.

Those topics belong to deeper guides and production testing.

## Common mistakes

### Using the same port for both nodes

Wrong:

```txt
node-a transport port = 4041
node-b transport port = 4041
```

Fix:

```txt
node-a transport port = 4041
node-b transport port = 4042
```

### Using the same WAL path for both nodes

Wrong:

```txt
node-a WAL = data/node.wal
node-b WAL = data/node.wal
```

Fix:

```txt
node-a WAL = data/node-a.wal
node-b WAL = data/node-b.wal
```

### Assuming connection failure means local write failed

A connection failure is a transport problem.

It should not delete or invalidate local data.

```txt
transport failure
  ↓
sync remains pending
  ↓
local value remains readable
```

### Assuming tick means remote apply

A tick moves the sync pipeline forward.

It may produce a batch.

Remote application may require transport delivery, ACK handling, remote validation, and conflict checks.

### Ignoring sync status

Always inspect sync state when debugging:

```bash
softadastra sync status
```

Or through the SDK:

C++:

```cpp
auto state = node_a.sync_state();
```

JavaScript:

```js
const state = await nodeA.syncStateInfo();
```

## Summary

You configured two local Softadastra nodes and moved local work toward synchronization.

The core flow is:

```txt
node A write
  ↓
node A store
  ↓
node A sync outbox
  ↓
node A tick
  ↓
transport delivery
  ↓
node B apply, when available
```

The key idea is that local work is valid before remote delivery completes.

## Next step

Continue with:

[Use the C++ SDK with the Engine](./use-cpp-sdk-with-engine)
