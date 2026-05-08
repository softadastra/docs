# Quick Start

This guide helps you run your first Softadastra flow.

You will learn how to:

```txt
open a local client
write a value
read it back
inspect sync state
run one sync tick
close the client
```

Softadastra is local-first. That means your first write does not require a server, cloud API, transport connection, or discovered peer.

## What you will build

You will create a small local Softadastra client and store one value:

```txt
key   : app/name
value : Softadastra SDK
```

The flow is:

```txt
open client
  ↓
put value
  ↓
get value
  ↓
inspect sync state
  ↓
tick sync pipeline
  ↓
close client
```

## Choose your SDK

Softadastra provides two main SDKs:

- **SDK C++** — native C++ applications
- **SDK JS** — JavaScript / Node.js applications

Use the C++ quick start if you are building native software. Use the JavaScript quick start if you are building with Node.js.

## Quick Start with C++

Create a file:

```sh
nano main.cpp
```

Paste this:

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-quickstart");

    options.enable_transport = false;
    options.enable_discovery = false;
    options.enable_wal = false;

    Client client{options};

    auto open_result = client.open();

    if (open_result.is_err())
    {
        std::cerr << "failed to open client: "
                  << open_result.error().message()
                  << "\n";

        return 1;
    }

    auto put_result = client.put(
        "app/name",
        "Softadastra SDK");

    if (put_result.is_err())
    {
        std::cerr << "failed to store value: "
                  << put_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto value_result = client.get("app/name");

    if (value_result.is_err())
    {
        std::cerr << "failed to read value: "
                  << value_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    std::cout << "key   : app/name\n";
    std::cout << "value : "
              << value_result.value().to_string()
              << "\n";

    std::cout << "size  : "
              << client.size()
              << "\n";

    client.close();

    return 0;
}
```

This creates a memory-only local Softadastra client.

The important part is:

```cpp
ClientOptions options =
    ClientOptions::local("node-quickstart");

options.enable_transport = false;
options.enable_discovery = false;
options.enable_wal = false;
```

For this first example, transport, discovery, and WAL persistence are disabled. The client runs locally without network or persistent storage.

### Run the C++ example

If you are inside the C++ SDK repository, build the SDK first:

```sh
cd ~/softadastra/sdk
vix build
```

Then run the existing example:

```sh
./build-ninja/examples/01_local_store
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

If you are integrating the SDK from another C++ project, make sure your project includes `#include <softadastra/sdk.hpp>` and links against the Softadastra SDK according to your build setup.

## Quick Start with JavaScript

Create a file:

```sh
nano quick-start.js
```

Paste this:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.local("node-quickstart")
);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(`failed to open client: ${openResult.error().message}`);
  process.exit(1);
}

const putResult = await client.put("app/name", "Softadastra SDK");

if (putResult.isErr()) {
  console.error(`failed to store value: ${putResult.error().message}`);
  await client.close();
  process.exit(1);
}

const valueResult = await client.get("app/name");

if (valueResult.isErr()) {
  console.error(`failed to read value: ${valueResult.error().message}`);
  await client.close();
  process.exit(1);
}

console.log("key   : app/name");
console.log(`value : ${valueResult.value().toString()}`);
console.log(`size  : ${client.size()}`);

await client.close();
```

Install the SDK:

```sh
npm install @softadastra/sdk
```

Run it:

```sh
node quick-start.js
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

If you are inside the `sdk-js` repository, examples import from local source:

```js
import { Client, ClientOptions } from "../src/index.js";
```

In an external project, use:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

## Add persistence

The previous examples are local and memory-only.

To make local writes recoverable after restart, enable WAL-backed persistence.

### C++

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/quick-start.wal");
```

Or manually:

```cpp
ClientOptions options =
    ClientOptions::local("node-persistent");

options.enable_wal = true;
options.wal_path = "data/quick-start.wal";
options.auto_flush = true;
```

### JavaScript

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/quick-start.wal"
);
```

With persistence enabled, the flow becomes:

```txt
put value
  ↓
append operation to WAL
  ↓
apply to local store
  ↓
track for sync
```

The network is still not required.

## Inspect sync state

Every local write can be tracked by the sync pipeline.

### C++

```cpp
auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox : "
              << state.value().outbox_size
              << "\n";

    std::cout << "queued : "
              << state.value().queued_count
              << "\n";

    std::cout << "failed : "
              << state.value().failed_count
              << "\n";
}
```

### JavaScript

```js
const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox : ${state.value().outboxSize}`);
  console.log(`queued : ${state.value().queuedCount}`);
  console.log(`failed : ${state.value().failedCount}`);
}
```

This tells you how much sync work is currently tracked.

## Run one sync tick

A sync tick moves the sync pipeline forward once.

### C++

```cpp
auto tick = client.tick();

if (tick.is_ok())
{
    std::cout << "retried : "
              << tick.value().retried_count
              << "\n";

    std::cout << "pruned  : "
              << tick.value().pruned_count
              << "\n";

    std::cout << "batch   : "
              << tick.value().batch_size
              << "\n";
}
```

### JavaScript

```js
const tick = await client.tick();

if (tick.isOk()) {
  console.log(`retried : ${tick.value().retriedCount}`);
  console.log(`pruned  : ${tick.value().prunedCount}`);
  console.log(`batch   : ${tick.value().batchSize}`);
}
```

A tick can retry expired operations, produce the next batch, and prune completed work when requested.

Softadastra keeps this explicit so synchronization stays observable and testable.

## Enable transport

Transport allows a node to connect to another peer.

### C++

```cpp
ClientOptions options =
    ClientOptions::local("node-a");

options.enable_wal = true;
options.wal_path = "data/node-a.wal";
options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

Client client{options};

client.open();
client.start_transport();

Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

client.connect(peer);
```

### JavaScript

```js
import { Client, ClientOptions, Peer } from "@softadastra/sdk";

const options = ClientOptions.local("node-a");

options.enableWal = true;
options.walPath = "data/node-a.wal";
options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

const client = new Client(options);

await client.open();
await client.startTransport();

const peer = new Peer("node-b", "127.0.0.1", 4042);

await client.connect(peer);
```

Transport is optional. If the peer is unavailable, local writes should still work.

## Enable discovery

Discovery lets the node list known peers.

### C++

```cpp
ClientOptions options =
    ClientOptions::local("node-discovery-a");

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;

Client client{options};

client.open();
client.start_discovery();

auto peers = client.peers();
```

### JavaScript

```js
const options = ClientOptions.local("node-discovery-a");

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4051;

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;

const client = new Client(options);

await client.open();
await client.startDiscovery();

const peers = await client.peers();
```

The relationship is:

```txt
Discovery finds peers
  ↓
Transport connects peers
  ↓
Sync sends operations
```

## Read node metadata

Metadata describes the local node.

### C++

```cpp
auto info = client.refresh_node_info();

if (info.is_ok())
{
    const auto &node = info.value();

    std::cout << "node id      : " << node.node_id << "\n";
    std::cout << "display name : " << node.display_name << "\n";
    std::cout << "hostname     : " << node.hostname << "\n";
    std::cout << "os           : " << node.os_name << "\n";
    std::cout << "version      : " << node.version << "\n";
}
```

### JavaScript

```js
const info = await client.refreshNodeInfo();

if (info.isOk()) {
  const node = info.value();

  console.log(`node id      : ${node.nodeId}`);
  console.log(`display name : ${node.displayName}`);
  console.log(`hostname     : ${node.hostname}`);
  console.log(`os           : ${node.osName}`);
  console.log(`version      : ${node.version}`);
}
```

Metadata answers: who is this node, what version is it running, what platform is it on, and what capabilities does it support.

## The complete mental model

Softadastra follows this model:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

A local write is the first step. Network delivery is a later step.

```txt
Local write
  ↓
Store
  ↓
WAL, if enabled
  ↓
Sync state
  ↓
Transport, if enabled
  ↓
Discovery, if enabled
  ↓
Remote peer
```

## Recommended next steps

Now that you have written and read your first value:

- Learn the core model in [Concepts](/concepts/)
- Use the CLI in [CLI](/cli/)
- Build with C++ in [SDK C++](/sdk-cpp/)
- Build with JavaScript in [SDK JS](/sdk-js/)
