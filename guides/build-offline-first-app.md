# Build an Offline-first App

This guide shows how to build a small offline-first application with Softadastra.

The goal is simple: write data locally, read it locally, and keep the application useful even when no network, server, peer, transport, or discovery is available.

The core rule is:

```txt
Local work must not depend on network availability.
```

## What you will build

You will build a small local-first app that:

- creates a Softadastra client
- opens the local runtime
- writes a value locally
- reads the value locally
- prints the result
- checks local store size
- closes the runtime

The flow is:

```txt
ClientOptions
  ↓
Client
  ↓
open
  ↓
put
  ↓
get
  ↓
close
```

This is the smallest useful Softadastra workflow.

## Why this guide starts offline

Softadastra is designed for real-world environments where the network can fail.

A user action should not automatically fail just because:

- internet is unavailable
- server is unreachable
- peer is offline
- transport is disabled
- discovery found no peers
- sync is delayed

So the first application should prove one thing:

```txt
local write
  ↓
local state
  ↓
local read
```

No network is required.

## Choose your SDK

You can build this first app with either SDK:

```txt
C++ SDK -> native C++ application
JS SDK  -> JavaScript or Node.js application
```

Both follow the same model.

C++:

```cpp
client.put("app/name", "Softadastra SDK");
```

JavaScript:

```js
await client.put("app/name", "Softadastra SDK");
```

The API shape is different, but the idea is the same: write locally first.

## Option A: C++ offline-first app

Use this version if you want to build with the C++ SDK.

### Create the file

```bash
mkdir softadastra-cpp-offline-app
cd softadastra-cpp-offline-app
nano main.cpp
```

Paste this code:

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-offline");

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
        std::cerr << "failed to write value: "
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

    std::cout << "offline-first app\n";
    std::cout << "  key   : app/name\n";
    std::cout << "  value : "
              << value_result.value().to_string()
              << "\n";
    std::cout << "  size  : "
              << client.size()
              << "\n";

    client.close();

    return 0;
}
```

### What this configuration means

```cpp
ClientOptions options =
    ClientOptions::local("node-offline");
```

This creates a local Softadastra node named `node-offline`.

```cpp
options.enable_transport = false;
options.enable_discovery = false;
options.enable_wal = false;
```

For the first app, transport, discovery, and WAL are disabled.

That means:

```txt
transport disabled  -> no peer connection required
discovery disabled  -> no peer discovery required
WAL disabled        -> memory-only local state
```

The application is still local-first.

It can write and read local data.

### Expected output

```txt
offline-first app
  key   : app/name
  value : Softadastra SDK
  size  : 1
```

## Option B: JavaScript offline-first app

Use this version if you want to build with the JavaScript SDK.

### Create the project

```bash
mkdir softadastra-js-offline-app
cd softadastra-js-offline-app

npm init -y
npm pkg set type=module
npm install @softadastra/sdk

nano main.js
```

Paste this code:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.local("node-offline");

options.enableTransport = false;
options.enableDiscovery = false;
options.enableWal = false;

const client = new Client(options);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(`failed to open client: ${openResult.error().message}`);
  process.exit(1);
}

const putResult = await client.put(
  "app/name",
  "Softadastra SDK",
);

if (putResult.isErr()) {
  console.error(`failed to write value: ${putResult.error().message}`);
  await client.close();
  process.exit(1);
}

const valueResult = await client.get("app/name");

if (valueResult.isErr()) {
  console.error(`failed to read value: ${valueResult.error().message}`);
  await client.close();
  process.exit(1);
}

console.log("offline-first app");
console.log("  key   : app/name");
console.log(`  value : ${valueResult.value().toString()}`);
console.log(`  size  : ${client.size()}`);

await client.close();
```

### Run the app

```bash
node main.js
```

Expected output:

```txt
offline-first app
  key   : app/name
  value : Softadastra SDK
  size  : 1
```

## What happened internally

Even in the simplest app, the Softadastra model is visible.

```txt
application
  ↓
client.open()
  ↓
client.put()
  ↓
local store
  ↓
client.get()
  ↓
client.close()
```

With WAL disabled, the flow is memory-only:

```txt
put
  ↓
validate key and value
  ↓
apply to local store
  ↓
return result
```

There is no network step.

There is no peer step.

There is no server step.

That is the point of the first offline-first app.

## Why transport is disabled

Transport is the delivery layer.

It connects to peers and moves messages.

For this first app, transport is disabled because the goal is not peer communication yet.

```txt
local store works first
transport can be added later
```

A local application should not need transport to write local data.

## Why discovery is disabled

Discovery finds peers.

For this first app, discovery is disabled because the app does not need to find another node.

```txt
discovery finds peers
transport connects peers
sync sends operations
```

Those steps come later.

The local store can work without them.

## Why WAL is disabled

WAL gives durability.

For the first app, WAL is disabled to keep the example minimal.

That means local state is memory-only:

```txt
process running  -> value exists
process exits    -> value may be lost
```

This is useful for learning, tests, demos, and temporary state.

When you need recovery after restart, use persistent store.

## Add a second value

You can add more local values.

C++:

```cpp
client.put("settings/theme", "dark");
client.put("profile/name", "Ada");
```

JavaScript:

```js
await client.put("settings/theme", "dark");
await client.put("profile/name", "Ada");
```

Then the store size should increase.

```txt
size : 3
```

## Read a missing value

A missing key should return an explicit error.

C++:

```cpp
auto result = client.get("missing/key");

if (result.is_err())
{
    std::cout << result.error().code_string() << "\n";
}
```

JavaScript:

```js
const result = await client.get("missing/key");

if (result.isErr()) {
  console.log(result.error().codeString());
}
```

Expected output style:

```txt
not_found
```

A missing key is a normal local store error. It should not crash the app.

## Remove a value

C++:

```cpp
auto removed = client.remove("app/name");

if (removed.is_err())
{
    std::cerr << removed.error().message() << "\n";
}
```

JavaScript:

```js
const removed = await client.remove("app/name");

if (removed.isErr()) {
  console.error(removed.error().message);
}
```

After removal, reading the same key should return `not_found`.

## Inspect local state with the CLI

You can test the same idea from the CLI.

```bash
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra store remove app/name
```

The CLI follows the same local-first model:

```txt
store put
  ↓
local write
  ↓
local state
```

It should not require a peer or remote server.

## What this app guarantees

This first app demonstrates these guarantees:

- local write can happen without network
- local read can happen without network
- transport is not required
- discovery is not required
- peers are not required
- server access is not required
- errors are explicit

This is the foundation of Softadastra.

## What this app does not guarantee

This first app does not provide persistence after restart because WAL is disabled.

It does not synchronize with other nodes because transport and discovery are disabled.

It does not resolve conflicts because there is only one local node.

It does not prove convergence because no remote operation is exchanged.

Those features are added step by step in later guides.

## Common mistakes

### Expecting data to survive restart

In this first app, WAL is disabled.

```txt
enable_wal = false
enableWal = false
```

So the state is memory-only.

Use persistent store when data must survive restart.

### Expecting sync to complete automatically

This app does not start transport, discovery, or a peer connection.

A local write can create sync work in more advanced configurations, but synchronization is a separate phase.

### Ignoring result values

Do not call `value()` before checking success.

C++:

```cpp
auto result = client.get("app/name");

if (result.is_ok())
{
    std::cout << result.value().to_string() << "\n";
}
```

JavaScript:

```js
const result = await client.get("app/name");

if (result.isOk()) {
  console.log(result.value().toString());
}
```

## Recommended next experiment

Change the value.

C++:

```cpp
client.put("app/name", "Softadastra Offline App");
```

JavaScript:

```js
await client.put("app/name", "Softadastra Offline App");
```

Then read it again.

The result should show the new value.

This proves that the local store holds the current state.

## Summary

You built the smallest Softadastra offline-first app.

The key model is:

```txt
open local runtime
  ↓
write locally
  ↓
read locally
  ↓
close runtime
```

The network was not required.

The next step is to run a local node and inspect the runtime from the CLI.

## Next step

Continue with:

[Run a Local Node](./run-local-node.md)
