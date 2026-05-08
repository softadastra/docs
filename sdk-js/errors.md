# Errors

Errors in the Softadastra JavaScript SDK are explicit.

The SDK does not assume that an operation succeeded. Most operations return a `Result`, and the application must check whether the result is successful or failed.

The core rule is:

> Check the result before using the value.

## Why explicit errors matter

Softadastra is designed for local-first and offline-first systems. In this kind of system, failures are normal: the WAL path may be invalid, the data directory may not exist, a key may be missing, transport may fail, a peer may be unavailable, discovery may find no peers, sync may have failed work, and metadata may be unavailable.

## Basic pattern

```js
const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}

console.log(result.value().toString());
```

## Result

`Result` represents success or failure.

Common methods: `isOk()`, `isErr()`, `value()`, `error()`.

## SoftadastraError

`SoftadastraError` describes what failed.

Common fields and methods: `message`, `codeString()`.

```js
const result = await client.get("missing/key");

if (result.isErr()) {
  console.log(`code    : ${result.error().codeString()}`);
  console.log(`message : ${result.error().message}`);
}
```

Expected output style:

```txt
code    : not_found
message : key not found
```

## `isOk()` and `isErr()`

Use `isOk()` when you want to handle success:

```js
const result = await client.get("app/name");

if (result.isOk()) {
  console.log(result.value().toString());
}
```

Use `isErr()` when you want to handle failure first (the recommended pattern):

```js
const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}

console.log(result.value().toString());
```

## `value()` and `error()`

Only call `value()` after checking that the result is successful:

```js
// correct
if (result.isOk()) {
  const value = result.value();
}

// wrong — assumes key exists and operation succeeded
const value = (await client.get("app/name")).value();
```

## `message` and `codeString()`

Use `message` for logs and user-facing diagnostics:

```js
console.error(result.error().message);
```

Use `codeString()` for logic:

```js
if (result.isErr() && result.error().codeString() === "not_found") {
  await client.put("settings/theme", "light");
}
```

## Store errors

### Key not found

```js
const result = await client.get("missing/key");

if (result.isErr()) {
  console.log(result.error().codeString()); // not_found
}
```

A missing key is a normal store error. It should not crash the application.

### Invalid key

```js
const result = await client.put("", "value");

if (result.isErr()) {
  console.error(result.error().message);
}
```

## Client lifecycle errors

### Client not open

```js
// wrong
const client = new Client(options);
const result = await client.put("app/name", "Softadastra");

// correct
const opened = await client.open();

if (opened.isErr()) {
  console.error(`failed to open client: ${opened.error().message}`);
  process.exit(1);
}

const result = await client.put("app/name", "Softadastra");
```

### Cleanup after errors

After the client is open, call `await client.close()` before returning:

```js
const result = await client.put("app/name", "Softadastra");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}

await client.close();
```

## WAL errors

Common causes: data directory does not exist, permission denied, invalid WAL path, disk full, write failed, flush failed.

### Missing WAL directory

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

### WAL write failed

If WAL append fails, the operation should not be treated as durably accepted.

## Sync errors

### Read sync state error

```js
const state = await client.syncStateInfo();

if (state.isErr()) {
  console.error(`failed to read sync state: ${state.error().message}`);
}
```

### Tick error

```js
const tick = await client.tick();

if (tick.isErr()) {
  console.error(`failed to tick sync pipeline: ${tick.error().message}`);
}
```

### Failed sync work is not lost local data

```js
await client.put("draft/1", "hello");
const tick = await client.tick();

// Even if sync fails:
const value = await client.get("draft/1"); // still readable locally
```

```txt
store failure -> local data problem
sync failure  -> propagation problem
```

## Transport errors

### Transport disabled

```js
// wrong
options.enableTransport = false;
await client.startTransport();

// correct
options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;
```

### Port already in use

```sh
ss -ltnp | grep 4041
```

Use another port: `options.transportPort = 4043`.

### Peer unavailable

```js
const connected = await client.connect(peer);

if (connected.isErr()) {
  console.log(`peer connection failed: ${connected.error().message}`);
}

// Local writes still work:
await client.put("local/key", "value");
```

## Discovery errors

### No peers found

```js
const peers = await client.peers();

if (peers.isOk() && peers.value().length === 0) {
  console.log("no peer discovered yet");
}
```

This can simply mean only one node is running. Local store operations can still work.

### Discovery disabled

```js
// wrong
options.enableDiscovery = false;
await client.startDiscovery();

// correct
options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
```

## Error handling in full example

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.persistent(
  "node-errors",
  "data/node-errors.wal",
);

options.autoFlush = true;
options.enableTransport = false;
options.enableDiscovery = false;

const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  console.error(`open failed: ${opened.error().message}`);
  process.exit(1);
}

const written = await client.put("app/name", "Softadastra");

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

const missing = await client.get("missing/key");

if (missing.isErr()) {
  console.log(`missing key handled: ${missing.error().codeString()}`);
}

const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox: ${state.value().outboxSize}`);
}

await client.close();
```

Create the data directory first:

```sh
mkdir -p data
```

Expected output style:

```txt
value: Softadastra
missing key handled: not_found
outbox: 1
```

## Errors and local-first behavior

Failures should be isolated:

```txt
transport failure  -> sync delivery delayed
discovery failure  -> peer finding delayed
sync failure       -> propagation failed
store failure      -> local state operation failed
```

A transport error should not erase local data. A discovery error should not make the store unusable.

## Error API reference

| Method or field | Purpose |
|---|---|
| `isOk()` | Check if the result succeeded |
| `isErr()` | Check if the result failed |
| `value()` | Access the success value |
| `error()` | Access the error value |
| `message` | Human-readable error message |
| `codeString()` | Error code string |

## Recommended pattern

```js
const result = await operation();

if (result.isErr()) {
  console.error(result.error().message);
  process.exit(1);
}

const value = result.value();
```

For operations after `client.open()`:

```js
const result = await operation();

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}
```

## Common mistakes

### Reading value() without checking

```js
// wrong
const value = (await client.get("key")).value();

// correct
const result = await client.get("key");

if (result.isErr()) {
  console.error(result.error().message);
  await client.close();
  process.exit(1);
}

const value = result.value();
```

### Ignoring open()

```js
// wrong
const client = new Client(options);
await client.put("key", "value");

// correct
const opened = await client.open();

if (opened.isErr()) {
  process.exit(1);
}
```

### Treating no peers as a fatal error

No peers can be normal. Local work can continue.

### Treating sync failure as local data loss

Sync failure is propagation failure. Local data may still exist.

### Returning without cleanup

After the client is open, call `await client.close()` before returning.

## Summary

Errors in the JavaScript SDK are explicit.

The important rules are: check `isErr()`, use `message` for humans, use `codeString()` for logic, do not read `value()` before checking success, do not treat sync failure as local data loss, do not treat no peers as fatal, and close the client after errors when it was opened.

## Next step

Continue with examples:

[Go to Examples](/sdk-js/examples)
