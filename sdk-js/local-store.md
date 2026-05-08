# Local Store

The local store is the simplest part of the Softadastra JavaScript SDK.

It lets a JavaScript application write, read, check, and remove values locally before any network synchronization happens.

The core rule is:

> Local state comes first.

A local store operation should not require a server, peer, transport, discovery, or cloud access.

## Minimal local store example

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.local("node-local");

options.enableTransport = false;
options.enableDiscovery = false;
options.enableWal = false;

const client = new Client(options);

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

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Local-only configuration

```js
const options = ClientOptions.local("node-local");

options.enableTransport = false;
options.enableDiscovery = false;
options.enableWal = false;
```

Use this mode for first examples, tests, demos, temporary state, and simple local tools. Do not use memory-only mode when data must survive restart.

## Write a value

```js
const result = await client.put("profile/name", "Ada");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}
```

## Read a value

```js
const result = await client.get("profile/name");

if (result.isOk()) {
  console.log(result.value().toString());
}

if (result.isErr()) {
  console.log(result.error().codeString());
}
```

A missing key is a normal store error. It should not crash the application.

## Remove a value

```js
const result = await client.remove("profile/name");

if (result.isErr()) {
  console.error(result.error().message);
}
```

## Check if a key exists

```js
if (client.contains("settings/theme")) {
  console.log("theme exists");
}
```

## Store size

```js
console.log(client.size());
```

## Check if the store is empty

```js
if (client.empty()) {
  console.log("store is empty");
}
```

## Keys

Good key examples: `app/name`, `settings/theme`, `profile/name`, `message/1`, `cache/session`.

Recommended key style: `domain/name` or `domain/id/field`.

Avoid empty keys — they should return an explicit error.

## Values

The SDK accepts strings directly:

```js
await client.put("message", "hello");
```

You can also use `Value` explicitly:

```js
import { Value } from "@softadastra/sdk";

const value = Value.fromString("hello");

await client.put("message", value);
```

Read values:

```js
const result = await client.get("message");

if (result.isOk()) {
  console.log(result.value().toString());
}
```

## Local store and sync

A local store write can create sync work.

```js
await client.put("profile/name", "Ada");

const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox : ${state.value().outboxSize}`);
}

const tick = await client.tick();
```

The important point: store writes are local, sync happens later.

## Store API reference

| Method | Purpose |
|---|---|
| `put(key, value)` | Write or update a local value |
| `get(key)` | Read a local value |
| `remove(key)` | Remove a local value |
| `contains(key)` | Check whether a key exists |
| `size()` | Return the number of local entries |
| `empty()` | Check whether the store is empty |

## Run the SDK example

```sh
cd ~/softadastra/sdk-js
npm install
npm run examples:local-store
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Common mistakes

### Expecting persistence in memory-only mode

If `enableWal` is false, data is memory-only. Use persistent store when data must survive restart.

### Expecting sync to complete immediately

A store write is local. Sync happens later through sync state and ticks.

### Expecting peers to be required

Peers are not required for local store operations.

### Ignoring results

Always check `isErr()` or `isOk()`.

## Summary

The local store gives you `put`, `get`, `remove`, `contains`, `size`, and `empty`.

The key idea is: local data works before the network. After local store works, the next step is persistent store.

## Next step

Continue with persistent store:

[Go to Persistent Store](/sdk-js/persistent-store)
