# Persistent Store

Persistent store is the WAL-backed local storage mode of the Softadastra JavaScript SDK.

It lets your application write locally while keeping accepted operations recoverable after restart.

The core rule is:

> Write locally. Persist locally. Recover later.

A persistent store is still local-first. It does not require a server, peer, transport, or discovery to accept local work.

## Why persistent store exists

Memory-only local store is useful for tests, demos, and temporary state. But real applications often need local data to survive process restart, machine restart, application crash, network interruption, or sync interruption.

Persistent store solves this by using a WAL-style persistence path.

```txt
local write
  ↓
persistent operation record
  ↓
local store apply
  ↓
sync tracking
```

```txt
Persistence -> durable history
Store       -> current value
```

## Basic persistent example

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.local("node-persistent");

options.enableTransport = false;
options.enableDiscovery = false;

options.enableWal = true;
options.walPath = "data/sdk-persistent-store.wal";
options.autoFlush = true;

const client = new Client(options);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(`failed to open client: ${openResult.error().message}`);
  process.exit(1);
}

const putResult = await client.put("settings/theme", "dark");

if (putResult.isErr()) {
  console.error(`failed to store value: ${putResult.error().message}`);
  await client.close();
  process.exit(1);
}

const valueResult = await client.get("settings/theme");

if (valueResult.isErr()) {
  console.error(`failed to read value: ${valueResult.error().message}`);
  await client.close();
  process.exit(1);
}

const syncResult = await client.syncStateInfo();

console.log("key          : settings/theme");
console.log(`value        : ${valueResult.value().toString()}`);
console.log(`wal path     : ${options.walPath}`);
console.log(`store size   : ${client.size()}`);

if (syncResult.isOk()) {
  console.log(`outbox size  : ${syncResult.value().outboxSize}`);
}

await client.close();
```

Expected output:

```txt
key          : settings/theme
value        : dark
wal path     : data/sdk-persistent-store.wal
store size   : 1
outbox size  : 1
```

## Create the data directory

```sh
mkdir -p data
```

If the directory does not exist, opening the client or writing persistent data can fail.

Recommended WAL path pattern: `data/<node-id>.wal`.

## Persistent configuration

```js
options.enableWal = true;
options.walPath = "data/sdk-persistent-store.wal";
options.autoFlush = true;
```

## Persistent helper

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/sdk-persistent-store.wal",
);

options.autoFlush = true;
options.enableTransport = false;
options.enableDiscovery = false;
```

## WAL and recovery

The recovery model is:

```txt
process starts
  ↓
client.open()
  ↓
persistent log is read
  ↓
valid operations are replayed
  ↓
local store is restored
```

## Test persistence manually

Create `persistent-test.js`:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.local("node-persistent-test");

options.enableTransport = false;
options.enableDiscovery = false;

options.enableWal = true;
options.walPath = "data/persistent-test.wal";
options.autoFlush = true;

{
  const client = new Client(options);

  const opened = await client.open();

  if (opened.isErr()) {
    console.error(opened.error().message);
    process.exit(1);
  }

  await client.put("app/name", "Softadastra");

  console.log("first run value written");

  await client.close();
}

{
  const client = new Client(options);

  const opened = await client.open();

  if (opened.isErr()) {
    console.error(opened.error().message);
    process.exit(1);
  }

  const value = await client.get("app/name");

  if (value.isErr()) {
    console.error(`recovery failed: ${value.error().message}`);
    await client.close();
    process.exit(1);
  }

  console.log(`recovered value: ${value.value().toString()}`);

  await client.close();
}
```

Before running:

```sh
mkdir -p data
```

Run:

```sh
node persistent-test.js
```

Expected output:

```txt
first run value written
recovered value: Softadastra
```

## Persistent store and sync state

```js
await client.put("profile/name", "Ada");

const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox : ${state.value().outboxSize}`);
}

const tick = await client.tick();
```

```txt
Persistence -> makes local operation recoverable
Sync        -> tracks operation for propagation
```

## WAL path per node

```js
// Node A
const nodeA = ClientOptions.persistent("node-a", "data/node-a.wal");

// Node B
const nodeB = ClientOptions.persistent("node-b", "data/node-b.wal");
```

One node → one WAL path.

## Run the SDK example

```sh
cd ~/softadastra/sdk-js
npm install
mkdir -p data
npm run examples:persistent-store
```

Verify the WAL file was created:

```sh
ls -la data
```

## Error handling

Always check results:

```js
const result = await client.put("settings/theme", "dark");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}
```

### Missing directory

```sh
mkdir -p data
```

### Invalid WAL path

```js
// wrong
options.enableWal = true;
options.walPath = "";

// correct
options.enableWal = true;
options.walPath = "data/app.wal";
```

## Persistent store API reference

| Method | Purpose |
|---|---|
| `put(key, value)` | Write or update a local value |
| `get(key)` | Read a local value |
| `remove(key)` | Remove a local value |
| `contains(key)` | Check whether a key exists |
| `size()` | Return the number of local entries |
| `empty()` | Check whether the store is empty |
| `syncStateInfo()` | Inspect sync work created by writes |
| `tick()` | Move sync forward once |

The difference from local store is configuration:

```js
options.enableWal = true;
options.walPath = "data/app.wal";
options.autoFlush = true;
```

## Common mistakes

### Forgetting `mkdir -p data`

If your WAL path is under `data/`, create the directory first.

### Expecting WAL to mean synced

WAL means locally persisted. Sync state tells you whether work is pending, queued, acknowledged, or failed.

### Disabling auto flush for important data

Keep `options.autoFlush = true` for normal durable examples.

### Editing the WAL manually

The WAL is an internal runtime file. Do not edit it by hand.

## Summary

Persistent store adds WAL-backed durability to the local store.

The key idea is: persistent means locally recoverable. It does not automatically mean remotely synced.

## Next step

Continue with sync:

[Go to Sync](/sdk-js/sync)
