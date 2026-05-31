# JavaScript API Reference

This page is the compact reference for the Softadastra JavaScript SDK.

Use it when you already understand the JavaScript SDK and need to quickly check public types, method names, option fields, result fields, or common usage patterns.

For explanations, read the SDK JS section first:

- [SDK JS](/sdk-js/)
- [Installation](/sdk-js/installation)
- [First App](/sdk-js/first-app)
- [Client](/sdk-js/client)
- [Client Options](/sdk-js/client-options)
- [Local Store](/sdk-js/local-store)
- [Persistent Store](/sdk-js/persistent-store)
- [Sync](/sdk-js/sync)
- [Transport](/sdk-js/transport)
- [Discovery](/sdk-js/discovery)
- [Metadata](/sdk-js/metadata)
- [Errors](/sdk-js/errors)
- [Examples](/sdk-js/examples)

The core rule is:

```txt
The JavaScript SDK exposes a stable async API over the Softadastra runtime model.
```

## Package

The main package is:

```txt
@softadastra/sdk
```

Use the main import:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

Other public types can be imported when needed:

```js
import { Client, ClientOptions, Value, Peer } from "@softadastra/sdk";
```

## ESM requirement

The JavaScript SDK uses modern JavaScript modules.

Your `package.json` should include:

```json
{
  "type": "module"
}
```

Then you can run files with:

```bash
node main.js
```

## Main public types

The JavaScript SDK exposes these main public types:

| Type               | Purpose                   |
| ------------------ | ------------------------- |
| `Client`           | Main SDK object           |
| `ClientOptions`    | Runtime configuration     |
| `Value`            | Local store value         |
| `Peer`             | Remote peer description   |
| `NodeInfo`         | Local node metadata       |
| `Result`           | Success or failure result |
| `SoftadastraError` | Structured error          |
| `SyncResult`       | Sync state result value   |
| `TickResult`       | Sync tick result value    |

## Minimal client

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(ClientOptions.local("node-local"));

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

const written = await client.put("app/name", "Softadastra");

if (written.isErr()) {
  console.error(written.error().message);
  await client.close();
  process.exit(1);
}

const value = await client.get("app/name");

if (value.isOk()) {
  console.log(value.value().toString());
}

await client.close();
```

## Client

`Client` is the main SDK object.

It provides one async public API for local store, persistence, sync, transport, discovery, peers, and metadata.

### Lifecycle methods

| Method    | Purpose                                 |
| --------- | --------------------------------------- |
| `open()`  | Open and initialize the local runtime   |
| `close()` | Close the runtime and release resources |

Example:

```js
const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

// use client

await client.close();
```

### Store methods

| Method            | Purpose                                |
| ----------------- | -------------------------------------- |
| `put(key, value)` | Write or update a local value          |
| `get(key)`        | Read a local value                     |
| `remove(key)`     | Remove a local value                   |
| `contains(key)`   | Check whether a key exists             |
| `size()`          | Return the number of local entries     |
| `empty()`         | Check whether the local store is empty |

Example:

```js
await client.put("settings/theme", "dark");

const value = await client.get("settings/theme");

if (value.isOk()) {
  console.log(value.value().toString());
}
```

### Sync methods

| Method                  | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `syncStateInfo()`       | Return current synchronization state                     |
| `sync_state_info()`     | Snake_case alias, if exposed                             |
| `tick()`                | Run one sync tick                                        |
| `tick({ prune: true })` | Run one sync tick and prune completed work, if supported |

Example:

```js
const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(state.value().outboxSize);
}

const tick = await client.tick();

if (tick.isOk()) {
  console.log(tick.value().batchSize);
}
```

### Transport methods

| Method                | Purpose                            |
| --------------------- | ---------------------------------- |
| `startTransport()`    | Start local transport              |
| `start_transport()`   | Snake_case alias, if exposed       |
| `stopTransport()`     | Stop transport, if exposed         |
| `stop_transport()`    | Snake_case alias, if exposed       |
| `transportRunning()`  | Check whether transport is running |
| `transport_running()` | Snake_case alias, if exposed       |
| `connect(peer)`       | Connect to a peer                  |

Example:

```js
const peer = new Peer("node-b", "127.0.0.1", 4042);

const connected = await client.connect(peer);

if (connected.isErr()) {
  console.log(connected.error().message);
}
```

### Discovery methods

| Method                | Purpose                            |
| --------------------- | ---------------------------------- |
| `startDiscovery()`    | Start peer discovery               |
| `start_discovery()`   | Snake_case alias, if exposed       |
| `stopDiscovery()`     | Stop discovery, if exposed         |
| `stop_discovery()`    | Snake_case alias, if exposed       |
| `discoveryRunning()`  | Check whether discovery is running |
| `discovery_running()` | Snake_case alias, if exposed       |
| `peers()`             | List known peers                   |

Example:

```js
const peers = await client.peers();

if (peers.isOk()) {
  for (const peer of peers.value()) {
    console.log(`${peer.nodeId} ${peer.host}:${peer.port}`);
  }
}
```

### Metadata methods

| Method                | Purpose                                 |
| --------------------- | --------------------------------------- |
| `refreshNodeInfo()`   | Refresh and return local node metadata  |
| `refresh_node_info()` | Snake_case alias, if exposed            |
| `nodeInfo()`          | Return cached node metadata, if exposed |
| `node_info()`         | Snake_case alias, if exposed            |

Example:

```js
const info = await client.refreshNodeInfo();

if (info.isOk()) {
  console.log(info.value().nodeId);
  console.log(info.value().displayName);
  console.log(info.value().hostname);
  console.log(info.value().osName);
  console.log(info.value().version);
}
```

## ClientOptions

`ClientOptions` configures the SDK runtime.

Common pattern:

```js
const options = ClientOptions.local("node-a");

const client = new Client(options);
```

### Factory helpers

| Helper                                      | Purpose                                |
| ------------------------------------------- | -------------------------------------- |
| `ClientOptions.local(nodeId)`               | Create local options                   |
| `ClientOptions.persistent(nodeId, walPath)` | Create WAL-backed persistent options   |
| `ClientOptions.memoryOnly(nodeId)`          | Create memory-only options, if exposed |

Example:

```js
const options = ClientOptions.persistent("node-a", "data/node-a.wal");
```

### Identity fields

| Field         | Purpose                        |
| ------------- | ------------------------------ |
| `nodeId`      | Local node identifier          |
| `displayName` | Human-friendly node label      |
| `version`     | Runtime or application version |

Example:

```js
options.displayName = "Node A";
options.version = "0.1.0";
```

### Persistence fields

| Field       | Purpose                                        |
| ----------- | ---------------------------------------------- |
| `enableWal` | Enable WAL-backed persistence                  |
| `walPath`   | WAL file path                                  |
| `autoFlush` | Flush WAL writes automatically when configured |

Example:

```js
options.enableWal = true;
options.walPath = "data/node-a.wal";
options.autoFlush = true;
```

Persistent helper:

```js
const options = ClientOptions.persistent("node-a", "data/node-a.wal");

options.autoFlush = true;
```

### Transport fields

| Field             | Purpose                        |
| ----------------- | ------------------------------ |
| `enableTransport` | Enable transport configuration |
| `transportHost`   | Local transport bind host      |
| `transportPort`   | Local transport bind port      |

Example:

```js
options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;
```

### Discovery fields

| Field                    | Purpose                        |
| ------------------------ | ------------------------------ |
| `enableDiscovery`        | Enable discovery configuration |
| `discoveryHost`          | Local discovery bind host      |
| `discoveryPort`          | Local discovery bind port      |
| `discoveryBroadcastHost` | Discovery target host          |
| `discoveryBroadcastPort` | Discovery target port          |

Example:

```js
options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
```

## Common configurations

### Local-only

No WAL, no transport, no discovery.

```js
const options = ClientOptions.local("node-local");

options.enableWal = false;
options.enableTransport = false;
options.enableDiscovery = false;
```

Use for tests, demos, temporary state, and first examples.

### Persistent local

WAL enabled, no transport, no discovery.

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/node-persistent.wal",
);

options.autoFlush = true;
options.enableTransport = false;
options.enableDiscovery = false;
```

Use when local writes should survive restart.

### Transport-enabled

```js
const options = ClientOptions.persistent("node-a", "data/node-a.wal");

options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

options.enableDiscovery = false;
```

Use when the node should connect to peers manually.

### Discovery-enabled

```js
const options = ClientOptions.persistent(
  "node-discovery-a",
  "data/node-discovery-a.wal",
);

options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4051;

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
```

Use when the node should find peers automatically.

## Value

`Value` represents a local store value.

The SDK accepts strings directly:

```js
await client.put("message", "hello");
```

You can also create a value explicitly:

```js
const value = Value.fromString("hello");

await client.put("message", value);
```

Read values can be converted back to strings:

```js
const result = await client.get("message");

if (result.isOk()) {
  console.log(result.value().toString());
}
```

## Peer

`Peer` describes another node.

```js
const peer = new Peer("node-b", "127.0.0.1", 4042);
```

Common fields:

| Field    | Purpose                |
| -------- | ---------------------- |
| `nodeId` | Remote node identifier |
| `host`   | Remote host            |
| `port`   | Remote transport port  |

Use with:

```js
await client.connect(peer);
```

A failed peer connection should not invalidate local state.

## NodeInfo

`NodeInfo` describes the local node.

Common fields:

| Field          | Purpose                        |
| -------------- | ------------------------------ |
| `nodeId`       | Local node identifier          |
| `displayName`  | Human-friendly label           |
| `hostname`     | Machine hostname               |
| `osName`       | Operating system               |
| `version`      | Runtime or app version         |
| `capabilities` | Supported runtime capabilities |
| `uptime_ms()`  | Runtime uptime in milliseconds |

Example:

```js
const result = await client.refreshNodeInfo();

if (result.isOk()) {
  const node = result.value();

  console.log(node.nodeId);
  console.log(node.displayName);
  console.log(node.hostname);
  console.log(node.osName);
  console.log(node.version);
  console.log(node.uptime_ms());
}
```

## Result

Most SDK operations return a `Result`.

Conceptually:

```txt
Result
  -> success: value
  -> failure: SoftadastraError
```

Common methods:

| Method    | Purpose                                |
| --------- | -------------------------------------- |
| `isOk()`  | Check whether the result is successful |
| `isErr()` | Check whether the result failed        |
| `value()` | Access success value                   |
| `error()` | Access error                           |

Correct pattern:

```js
const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  process.exit(1);
}

console.log(result.value().toString());
```

Avoid:

```js
const value = (await client.get("app/name")).value();
```

That assumes the operation succeeded.

## SoftadastraError

`SoftadastraError` describes what failed.

Common fields and methods:

| Field or method | Purpose                                |
| --------------- | -------------------------------------- |
| `message`       | Human-readable error message           |
| `codeString()`  | Stable error code string, when exposed |

Example:

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

## SyncResult

`SyncResult` describes current sync state.

Common fields:

| Field                      | Meaning                                                   |
| -------------------------- | --------------------------------------------------------- |
| `outboxSize`               | Local operations waiting for synchronization              |
| `queuedCount`              | Operations ready to be selected for sending               |
| `inFlightCount`            | Operations prepared or sent, possibly waiting for ACK     |
| `acknowledgedCount`        | Operations confirmed by the remote side                   |
| `failedCount`              | Operations that exceeded retry policy or hit a sync error |
| `totalRetries`             | Total retry attempts                                      |
| `lastSubmittedVersion`     | Last local submitted version, if exposed                  |
| `lastAppliedRemoteVersion` | Last remote applied version, if exposed                   |

Example:

```js
const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox: ${state.value().outboxSize}`);
  console.log(`queued: ${state.value().queuedCount}`);
  console.log(`failed: ${state.value().failedCount}`);
}
```

If exposed:

```js
if (state.isOk() && state.value().hasFailed()) {
  console.error("sync has failed work");
}
```

## TickResult

`TickResult` describes the result of one sync tick.

Common fields:

| Field          | Meaning                                   |
| -------------- | ----------------------------------------- |
| `retriedCount` | Operations retried during the tick        |
| `prunedCount`  | Completed entries removed during the tick |
| `batchSize`    | Operations produced in the current batch  |

Example:

```js
const tick = await client.tick();

if (tick.isOk()) {
  console.log(`retried: ${tick.value().retriedCount}`);
  console.log(`pruned: ${tick.value().prunedCount}`);
  console.log(`batch: ${tick.value().batchSize}`);
}
```

## Local store reference

### `put`

```js
const result = await client.put("profile/name", "Ada");
```

Success means the value is available locally.

If persistence is enabled, the operation can also be persisted.

If sync is enabled, the operation can also be tracked for propagation.

### `get`

```js
const result = await client.get("profile/name");
```

Success returns a `Value`.

Missing key returns an explicit error.

### `remove`

```js
const result = await client.remove("profile/name");
```

Removes the local value.

If sync is enabled, a delete operation can be tracked for propagation.

### `contains`

```js
const exists = client.contains("profile/name");
```

Returns whether the key exists locally.

### `size`

```js
const count = client.size();
```

Returns the number of local entries.

### `empty`

```js
const isEmpty = client.empty();
```

Returns whether the local store is empty.

## Sync reference

### `syncStateInfo`

```js
const state = await client.syncStateInfo();
```

Use it to inspect pending sync work.

### `sync_state_info`

If exposed:

```js
const state = await client.sync_state_info();
```

Snake_case alias for `syncStateInfo()`.

### `tick`

```js
const tick = await client.tick();
```

Runs one sync tick.

### `tick` with pruning

```js
const tick = await client.tick({
  prune: true,
});
```

Runs one sync tick and asks the runtime to prune completed work, if supported.

## Transport reference

### `startTransport`

```js
const result = await client.startTransport();
```

Starts local transport.

Transport requires:

```js
options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;
```

### `start_transport`

If exposed:

```js
const result = await client.start_transport();
```

Snake_case alias for `startTransport()`.

### `transportRunning`

```js
if (client.transportRunning()) {
  console.log("transport is running");
}
```

### `connect`

```js
const peer = new Peer("node-b", "127.0.0.1", 4042);

const result = await client.connect(peer);
```

Connects to a peer.

A connection failure should not make local store data invalid.

## Discovery reference

### `startDiscovery`

```js
const result = await client.startDiscovery();
```

Starts peer discovery.

Discovery requires:

```js
options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
```

### `start_discovery`

If exposed:

```js
const result = await client.start_discovery();
```

Snake_case alias for `startDiscovery()`.

### `discoveryRunning`

```js
if (client.discoveryRunning()) {
  console.log("discovery is running");
}
```

### `peers`

```js
const result = await client.peers();
```

Returns known peers.

No peers is a valid state.

## Metadata reference

### `refreshNodeInfo`

```js
const result = await client.refreshNodeInfo();
```

Refreshes and returns local node metadata.

### `refresh_node_info`

If exposed:

```js
const result = await client.refresh_node_info();
```

Snake_case alias for `refreshNodeInfo()`.

### `nodeInfo`

If exposed:

```js
const result = await client.nodeInfo();
```

Returns cached node metadata without forcing a refresh.

## Common flows

### Local-only flow

```js
const options = ClientOptions.local("node-local");

options.enableWal = false;
options.enableTransport = false;
options.enableDiscovery = false;

const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  process.exit(1);
}

await client.put("app/name", "Softadastra");

const value = await client.get("app/name");

await client.close();
```

### Persistent flow

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/node-persistent.wal",
);

options.autoFlush = true;
options.enableTransport = false;
options.enableDiscovery = false;

const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  process.exit(1);
}

await client.put("settings/theme", "dark");

await client.close();
```

### Sync flow

```js
await client.put("message/1", "hello");

const state = await client.syncStateInfo();

const tick = await client.tick();
```

### Transport flow

```js
options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

const client = new Client(options);

await client.open();
await client.startTransport();

const peer = new Peer("node-b", "127.0.0.1", 4042);

await client.connect(peer);
await client.tick();

await client.close();
```

### Metadata flow

```js
const node = await client.refreshNodeInfo();

if (node.isOk()) {
  console.log(node.value().nodeId);
}
```

## Naming style

The JavaScript SDK uses `camelCase` for public fields and methods.

Examples:

```js
options.enableWal = true;
options.walPath = "data/node-a.wal";

await client.syncStateInfo();
await client.startTransport();
await client.startDiscovery();
await client.refreshNodeInfo();
```

Snake_case aliases can exist for compatibility, but `camelCase` is the preferred JavaScript style.

This differs from the C++ SDK, which uses `snake_case`.

## Async behavior

Most runtime operations are async.

Use `await` with:

- `open`
- `close`
- `put`
- `get`
- `remove`
- `syncStateInfo`
- `tick`
- `startTransport`
- `connect`
- `startDiscovery`
- `peers`
- `refreshNodeInfo`

Wrong:

```js
const result = client.put("app/name", "Softadastra");
```

Correct:

```js
const result = await client.put("app/name", "Softadastra");
```

Methods like `contains`, `size`, `empty`, `transportRunning`, and `discoveryRunning` can be synchronous when they inspect already available local state.

## Local-first behavior

The JavaScript API should preserve Softadastra's local-first model.

A local store operation should not require:

- remote server
- connected peer
- transport
- discovery
- cloud access

This should work locally:

```js
options.enableTransport = false;
options.enableDiscovery = false;

await client.put("draft/1", "hello");
await client.get("draft/1");
```

Transport failure should not delete local data.

Discovery failure should not block local store access.

Sync failure should be visible, but local values should remain readable.

## Stability rule

This reference should only document public SDK behavior that is implemented and intended to remain stable.

Recommended rule:

```txt
public SDK type          -> include here
public SDK method        -> include here
experimental method      -> mention carefully or keep out
internal engine class    -> document in engine section, not here
implementation detail    -> keep out of public API reference
```

## Related pages

- [SDK JS](/sdk-js/)
- [Client](/sdk-js/client)
- [Client Options](/sdk-js/client-options)
- [Local Store](/sdk-js/local-store)
- [Persistent Store](/sdk-js/persistent-store)
- [Sync](/sdk-js/sync)
- [Transport](/sdk-js/transport)
- [Discovery](/sdk-js/discovery)
- [Metadata](/sdk-js/metadata)
- [Errors](/sdk-js/errors)
- [Configuration Reference](/reference/config)
- [Errors Reference](/reference/errors)
