# First App

This page shows how to create your first Softadastra JavaScript SDK application.

You will build a small local-first program that opens a Softadastra client, writes a value, reads the value back, prints the result, and closes the client.

The goal is to understand the basic SDK flow before enabling persistence, sync, transport, or discovery.

## What you will build

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

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

## Create a small app

```sh
mkdir softadastra-js-first-app
cd softadastra-js-first-app

npm init -y
npm pkg set type=module
npm install @softadastra/sdk

nano main.js
```

## Write the first app

Paste this code:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.local("node-local"),
);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(
    `failed to open client: ${openResult.error().message}`,
  );

  process.exit(1);
}

const putResult = await client.put(
  "app/name",
  "Softadastra SDK",
);

if (putResult.isErr()) {
  console.error(
    `failed to store value: ${putResult.error().message}`,
  );

  await client.close();
  process.exit(1);
}

const valueResult = await client.get("app/name");

if (valueResult.isErr()) {
  console.error(
    `failed to read value: ${valueResult.error().message}`,
  );

  await client.close();
  process.exit(1);
}

console.log("key   : app/name");
console.log(`value : ${valueResult.value().toString()}`);
console.log(`size  : ${client.size()}`);

await client.close();
```

## Run the app

```sh
node main.js
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Understand the code

### The SDK import

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

This gives access to the main public SDK types. For this first app, you only need `Client` and `ClientOptions`.

### Create client options

```js
const client = new Client(
  ClientOptions.local("node-local"),
);
```

`ClientOptions.local("node-local")` creates a local SDK configuration. The node id is `node-local`. In local mode, no WAL, transport, or discovery is configured by default.

### Open the client

```js
const openResult = await client.open();
```

The client must be opened before use. The SDK uses explicit result values, so you must check the result:

```js
if (openResult.isErr()) {
  console.error(
    `failed to open client: ${openResult.error().message}`,
  );

  process.exit(1);
}
```

This is the normal SDK pattern: call operation, check result, handle error, continue only on success.

### Write a value

```js
const putResult = await client.put(
  "app/name",
  "Softadastra SDK",
);
```

This writes a local value. The key is `app/name`. The value is `Softadastra SDK`. This is local-first — the write does not require a server, peer, transport, discovery, or cloud access.

Always check the result:

```js
if (putResult.isErr()) {
  console.error(
    `failed to store value: ${putResult.error().message}`,
  );

  await client.close();
  process.exit(1);
}
```

### Read the value

```js
const valueResult = await client.get("app/name");
```

`get()` reads from local state. Always check the result before reading the value:

```js
if (valueResult.isErr()) {
  console.error(
    `failed to read value: ${valueResult.error().message}`,
  );

  await client.close();
  process.exit(1);
}

console.log(`value : ${valueResult.value().toString()}`);
```

### Check the store size

```js
console.log(`size  : ${client.size()}`);
```

After one successful write, the size should be `1`.

### Close the client

```js
await client.close();
```

This gives the SDK a clean lifecycle: construct → open → use → close.

## Run the existing example

If you are inside the JavaScript SDK repository, the same idea already exists as `examples/01-local-store.js`.

```sh
cd ~/softadastra/sdk-js
npm install
npm run examples:local-store
```

Or directly:

```sh
node examples/01-local-store.js
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Local repository import

Inside the SDK repository, examples use the local source import:

```js
import { Client, ClientOptions } from "../src/index.js";
```

For external applications, use the package import:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

## Result and error handling

This is the correct pattern:

```js
const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  process.exit(1);
}

console.log(result.value().toString());
```

Avoid this pattern:

```js
const value = (await client.get("app/name")).value();
```

That assumes the operation succeeded. In local-first systems, failures must be visible.

## Why local-only first?

The first app uses local mode on purpose:

```js
ClientOptions.local("node-local")
```

This proves the most important Softadastra principle: local work does not require the network.

After this works, you can add features one by one: persistent store, sync state, manual ticks, transport, discovery, metadata.

## Make it persistent next

The first app is local and simple. To make it persistent:

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/sdk-store.wal",
);

options.autoFlush = true;

const client = new Client(options);
```

Create the data directory first:

```sh
mkdir -p data
```

## Inspect sync next

After writing a value:

```js
await client.put("profile/name", "Ada");
```

Inspect sync state:

```js
const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox : ${state.value().outboxSize}`);
  console.log(`queued : ${state.value().queuedCount}`);
  console.log(`failed : ${state.value().failedCount}`);
}
```

Run one sync tick:

```js
const tick = await client.tick();

if (tick.isOk()) {
  console.log(`batch : ${tick.value().batchSize}`);
}
```

## Complete app with cleanup

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.local("node-local"),
);

const opened = await client.open();

if (opened.isErr()) {
  console.error(`open failed: ${opened.error().message}`);
  process.exit(1);
}

const written = await client.put("app/name", "Softadastra SDK");

if (written.isErr()) {
  console.error(`put failed: ${written.error().message}`);
  await client.close();
  process.exit(1);
}

const value = await client.get("app/name");

if (value.isErr()) {
  console.error(`get failed: ${value.error().message}`);
  await client.close();
  process.exit(1);
}

console.log(`value: ${value.value().toString()}`);

await client.close();
```

## Common mistakes

### Forgetting ESM mode

If you see `Cannot use import statement outside a module`:

```sh
npm pkg set type=module
```

### Forgetting to install the SDK

If you see `Cannot find package '@softadastra/sdk'`:

```sh
npm install @softadastra/sdk
```

### Ignoring results

Wrong:

```js
await client.put("key", "value");
const value = await client.get("key");
console.log(value.value().toString());
```

Correct:

```js
const value = await client.get("key");

if (value.isErr()) {
  console.error(value.error().message);
  await client.close();
  process.exit(1);
}

console.log(value.value().toString());
```

### Forgetting to close the client

After `open()` succeeds, close the client before exiting:

```js
await client.close();
```

## Recommended first workflow

```sh
mkdir softadastra-js-first-app
cd softadastra-js-first-app
npm init -y
npm pkg set type=module
npm install @softadastra/sdk
nano main.js
node main.js
```

Then verify the output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Summary

Your first JavaScript SDK app uses `ClientOptions`, `Client`, `open`, `put`, `get`, `size`, and `close`.

The key lesson is: Softadastra can write and read locally without a server or peer. This is the foundation of the JavaScript SDK.

## Next step

Continue with the Client API:

[Go to Client](/sdk-js/client)
