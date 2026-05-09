# Run a Local Node

This guide shows how to run and inspect a local Softadastra node.

A local node represents a running Softadastra runtime. It can expose local identity, store state, sync state, transport state, discovery state, and peer information.

The core rule is:

```txt
A Softadastra node is useful before it connects to another node.
```

## What you will do

You will learn how to:

- build the Softadastra CLI
- verify the CLI
- inspect runtime status
- inspect local node metadata
- write local data
- inspect sync state
- run one sync tick
- list known peers
- start a local node process, if available

The basic workflow is:

```txt
build CLI
  ↓
run status
  ↓
inspect node
  ↓
write local data
  ↓
inspect sync
  ↓
tick sync
  ↓
inspect peers
```

## Why run a local node?

Softadastra is local-first.

That means a local runtime should be able to work even when:

- no peer is connected
- transport is disabled
- discovery found no peers
- the network is unavailable
- sync has pending work

Running a local node helps you verify that the local runtime is usable before testing multi-node synchronization.

## Repository location

The engine repository is usually:

```bash
cd ~/softadastra/softadastra
```

You should see:

```txt
CMakeLists.txt
CMakePresets.json
vix.json
apps/
modules/
examples/
README.md
```

The product CLI lives under `apps/cli`.

The reusable CLI framework lives under `modules/cli`.

This guide focuses on the product CLI command:

```txt
softadastra
```

## Build the CLI

The recommended development build is:

```bash
vix build
```

If your build requires the CLI app option explicitly:

```bash
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

If you also want the node app:

```bash
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

If your Vix build supports exporting the binary:

```bash
vix build --bin
```

Then you should be able to run:

```bash
./softadastra help
```

## Build with CMake directly

You can also build with CMake.

Configure:

```bash
cmake --preset dev-ninja
```

Build:

```bash
cmake --build --preset build-ninja
```

If your presets are different, inspect them:

```bash
cat CMakePresets.json
```

## Find the CLI binary

Depending on your build setup, the binary may be in one of these locations:

```txt
./softadastra
build-ninja/softadastra
build-ninja/apps/cli/softadastra
build-ninja/apps/cli/softadastra_cli
```

Find it with:

```bash
find . -type f -executable -name "softadastra*"
```

Then run it directly:

```bash
./path/to/softadastra help
```

## Verify the CLI

Run:

```bash
./softadastra help
./softadastra version
./softadastra status
```

Expected behavior:

```txt
help     -> prints available commands
version  -> prints the CLI version
status   -> prints local runtime status
```

Example version output:

```txt
Softadastra 0.1.0
```

## Add the CLI to PATH

For local development, you can copy the binary to `~/.local/bin`.

```bash
mkdir -p ~/.local/bin
cp ./softadastra ~/.local/bin/softadastra
chmod +x ~/.local/bin/softadastra
```

Make sure `~/.local/bin` is in your `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

To make it permanent:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verify:

```bash
softadastra help
```

## Inspect runtime status

Start with:

```bash
softadastra status
```

Expected output style:

```txt
Softadastra status

Node
  id       : node-a
  version  : 0.1.0
  state    : healthy

Store
  entries  : 0

Sync
  outbox   : 0
  queued   : 0
  failed   : 0

Transport
  running  : no

Discovery
  running  : no
```

The exact values may differ depending on your configuration.

The important point is that transport and discovery can be stopped while the local runtime remains useful.

## Understand the status output

The `status` command gives a quick overview of the local runtime.

```txt
Node       -> local runtime identity
Store      -> current local data state
Sync       -> pending synchronization work
Transport  -> peer message delivery state
Discovery  -> peer discovery state
Peers      -> known peers, if available
```

`status` is usually the first command to run when something does not behave as expected.

## Inspect node metadata

Run:

```bash
softadastra node info
```

Expected output style:

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

This shows the identity of the local runtime.

Node metadata does not store application data. It describes the local node.

## What node metadata means

The node id identifies the local runtime.

```txt
id : node-a
```

The node id can be used by:

- metadata
- sync operation origin
- transport messages
- discovery announcements
- CLI status
- SDK node info

A good node id should be non-empty, stable, unique enough for the local network or deployment, and human-readable when possible.

## Write local data

Now test the local store:

```bash
softadastra store put app/name Softadastra
```

Expected output style:

```txt
Stored value

  key     : app/name
  value   : Softadastra
  created : yes
```

This should be a local write.

It should not require:

- remote server
- connected peer
- transport
- discovery
- cloud access

## Read local data

Read the value:

```bash
softadastra store get app/name
```

Expected output style:

```txt
Value

  key   : app/name
  value : Softadastra
```

This proves that the local runtime can write and read local state.

## Remove local data

Remove the value:

```bash
softadastra store remove app/name
```

Expected output style:

```txt
Removed value

  key     : app/name
  removed : yes
```

Then read it again:

```bash
softadastra store get app/name
```

Expected output style:

```txt
error: key not found
key: app/name
```

A missing key is a normal store error. It should not crash the runtime.

## Inspect sync state

Write another value:

```bash
softadastra store put message/1 hello
```

Then inspect sync:

```bash
softadastra sync status
```

Expected output style:

```txt
Sync status

  outbox       : 1
  queued       : 1
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0
```

The exact numbers may differ depending on whether sync is enabled and how your runtime is configured.

The important idea is:

```txt
store put
  ↓
local state updated
  ↓
sync work may be tracked
```

A sync entry does not mean a peer already received the operation. It means local work is waiting for propagation.

## Run one sync tick

Run:

```bash
softadastra sync tick
```

Expected output style:

```txt
Sync tick

  retried : 0
  pruned  : 0
  batch   : 1
```

A tick moves the sync pipeline forward once.

It can:

- retry expired work
- collect next batch
- prepare transport delivery
- prune completed work, if requested

If no peer is connected, sync work can remain pending. That is normal.

## Tick with pruning

If supported:

```bash
softadastra sync tick --prune
```

Expected output style:

```txt
Sync tick

  retried : 0
  pruned  : 2
  batch   : 0
```

Pruning should only remove completed work that is safe to remove.

It should not delete local store data.

## List peers

Run:

```bash
softadastra peers
```

If no peers are known:

```txt
Peers

  no peers found
```

This is not necessarily an error.

A local Softadastra node can still write and read local data without peers.

If peers are known, the output may look like:

```txt
Peers

Node ID        Host        Port    State
node-b         127.0.0.1   4042    available
node-c         127.0.0.1   4043    stale
```

## Start a local node process

If your build includes the node app, run:

```bash
softadastra node start
```

Expected output style:

```txt
Softadastra node

  id       : node-a
  address  : 127.0.0.1:4041
  state    : running
```

If the node app is not available:

```txt
error: node app is not available in this build
hint: rebuild with SOFTADASTRA_BUILD_NODE_APP=ON
```

Rebuild with:

```bash
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

## Use interactive mode

If interactive mode is enabled, run:

```bash
softadastra
```

Then use commands without repeating the binary name:

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

Wrong inside interactive mode:

```txt
softadastra> softadastra status
```

Correct:

```txt
softadastra> status
```

## Recommended local node workflow

Use this sequence for a first local test:

```bash
softadastra status
softadastra node info

softadastra store put app/name Softadastra
softadastra store get app/name

softadastra sync status
softadastra sync tick
softadastra sync status

softadastra peers
```

This verifies:

- runtime status
- node metadata
- local store write
- local store read
- sync state
- manual sync tick
- peer visibility

## Local node without peers

A local node can be useful even when no peers are available.

Example:

```bash
softadastra peers
```

Output:

```txt
Peers

  no peers found
```

You can still run:

```bash
softadastra store put draft/1 hello
softadastra store get draft/1
softadastra sync status
```

The local node can keep work locally and sync later when peers become available.

## Local node without transport

Transport is optional.

If transport is not running:

```txt
Transport
  running : no
```

Local store commands should still work:

```bash
softadastra store put local/key value
softadastra store get local/key
```

Transport only matters when sync needs to deliver messages to peers.

## Local node without discovery

Discovery is optional.

If discovery is not running:

```txt
Discovery
  running : no
```

The local runtime can still work.

Discovery only helps find peers automatically.

Manual peer configuration or future node setup can still be used later.

## Local node and persistence

A local node can be memory-only or persistent.

If WAL is enabled, status may show:

```txt
WAL
  enabled  : yes
  path     : data/softadastra.wal
  durable  : yes
```

This means local operations can be recorded in a durable log.

The next guide explains this in more detail.

## Common issues

### `softadastra: command not found`

The CLI binary is not in your `PATH`.

Run it directly:

```bash
./softadastra help
```

Or copy it to `~/.local/bin`:

```bash
mkdir -p ~/.local/bin
cp ./softadastra ~/.local/bin/softadastra
chmod +x ~/.local/bin/softadastra
export PATH="$HOME/.local/bin:$PATH"
```

### Node app is not available

The node app was not built.

Rebuild with:

```bash
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

### Key not found

The key does not exist in the local store.

Example:

```bash
softadastra store get missing/key
```

Output:

```txt
error: key not found
key: missing/key
```

This is a normal store error.

### No peers found

This output is normal when only one node is running:

```txt
Peers

  no peers found
```

It does not mean the local node is broken.

### Sync has pending work

Pending sync work means local operations are waiting for propagation.

```txt
Sync
  outbox : 3
  queued : 3
```

Run:

```bash
softadastra sync tick
softadastra sync status
```

If no peer is available, the work may remain pending.

## What this guide proves

This guide proves that a local Softadastra node can:

- start locally
- expose metadata
- write local values
- read local values
- track sync state
- run manual sync ticks
- show peers
- remain useful without peers
- remain useful without transport
- remain useful without discovery

That is the foundation of the local-first runtime.

## What this guide does not prove

This guide does not prove multi-node synchronization yet.

It does not prove recovery after restart unless WAL persistence is enabled.

It does not prove conflict resolution because only one local node is used.

It does not prove convergence because no remote operation is exchanged.

Those topics are covered in later guides.

## Summary

You ran and inspected a local Softadastra node.

The core model is:

```txt
local node
  ↓
local store
  ↓
sync state
  ↓
transport and discovery later
```

The node can be useful before it connects to any other node.

## Next step

Continue with:

[Persist Data Locally](./persist-data-locally)
