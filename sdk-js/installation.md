# SDK JS Installation

This page explains how to install, run, and verify the Softadastra JavaScript SDK.

The JavaScript SDK lives in:

```txt
~/softadastra/sdk-js
```

The package name is:

```txt
@softadastra/sdk
```

The main import is:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

## Requirements

To use the JavaScript SDK, you need:

- Node.js
- npm
- Git

Check your tools:

```sh
node --version
npm --version
git --version
```

Recommended: Node.js 18 or newer, npm 9 or newer. The SDK uses modern JavaScript modules, so your runtime should support ESM.

## Repository layout

The JavaScript SDK repository is organized like this:

```txt
sdk-js/
├── src/
│   ├── client.js
│   ├── client-options.js
│   ├── error.js
│   ├── index.js
│   ├── key.js
│   ├── node-info.js
│   ├── peer.js
│   ├── result.js
│   ├── sync-result.js
│   ├── tick-result.js
│   ├── value.js
│   └── conversions/
├── docs/
├── examples/
├── test/
├── package.json
├── package-lock.json
├── jsconfig.json
├── vix.json
├── README.md
├── CHANGELOG.md
└── LICENSE
```

The public entry point is `src/index.js`.

Application code should import from the package:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

Inside this repository, examples may import from local source:

```js
import { Client, ClientOptions } from "../src/index.js";
```

## Go to the SDK directory

```sh
cd ~/softadastra/sdk-js
```

You should see `package.json`, `src/`, `examples/`, `test/`, and `README.md`.

## Install dependencies

```sh
npm install
```

## Use the SDK in an app

In a JavaScript project, install the package:

```sh
npm install @softadastra/sdk
```

Then import it:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

Minimal example:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.local("node-local"),
);

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

const written = await client.put("hello", "world");

if (written.isErr()) {
  console.error(written.error().message);
  await client.close();
  process.exit(1);
}

const value = await client.get("hello");

if (value.isOk()) {
  console.log(value.value().toString());
}

await client.close();
```

## Run the examples

After installing dependencies:

```sh
cd ~/softadastra/sdk-js
npm install
```

Run the examples:

```sh
npm run examples:local-store
npm run examples:persistent-store
npm run examples:remove-value
npm run examples:basic-sync
npm run examples:tcp-peer-sync
npm run examples:discovery
npm run examples:node-metadata
```

Or run files directly:

```sh
node examples/01-local-store.js
node examples/02-persistent-store.js
node examples/03-remove-value.js
node examples/04-basic-sync.js
node examples/05-tcp-peer-sync.js
node examples/06-discovery.js
node examples/07-node-metadata.js
```

## Verify local store

```sh
npm run examples:local-store
```

Expected output style:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Verify persistent store

```sh
npm run examples:persistent-store
```

Expected output style:

```txt
key          : settings/theme
value        : dark
wal path     : data/sdk-persistent-store.wal
store size   : 1
outbox size  : 1
```

If the example uses a `data/` directory, create it first:

```sh
mkdir -p data
```

## Verify sync

```sh
npm run examples:basic-sync
```

Expected output style:

```txt
before tick
  outbox : 1
  queued : 1
  failed : 0

tick result
  retried : 0
  pruned  : 0
  batch   : 1
```

## Verify transport

```sh
npm run examples:tcp-peer-sync
```

If no peer is running, the connection can fail cleanly. The important point is that local writes and sync ticks can still happen even when a peer is unavailable.

## Verify discovery

```sh
npm run examples:discovery
```

Expected output style:

```txt
discovery
  running : yes
  bind    : 127.0.0.1:5051
  target  : 127.0.0.1:5052

peers
  no peer discovered yet
```

No discovered peer is normal when only one node is running.

## Verify metadata

```sh
npm run examples:node-metadata
```

Expected output style:

```txt
node metadata
  node id      : node-metadata
  display name : Softadastra SDK Node
  hostname     : ...
  os           : ...
  version      : 0.1.0
  uptime ms    : ...
  capabilities : ...
```

## Run tests

```sh
npm test
```

## ESM support

The SDK uses JavaScript modules. Your `package.json` should include:

```json
{
  "type": "module"
}
```

Then you can use:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

If your app uses CommonJS, prefer migrating the app entry to ESM for Softadastra SDK usage.

## Minimal app setup

```sh
mkdir softadastra-js-app
cd softadastra-js-app
npm init -y
npm install @softadastra/sdk
npm pkg set type=module
```

Create `main.js`:

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

Run:

```sh
node main.js
```

Expected output:

```txt
value: Softadastra SDK
```

## Build modes

### Memory-only mode

```js
const options = ClientOptions.local("node-memory");

options.enableWal = false;
options.enableTransport = false;
options.enableDiscovery = false;
```

### Local mode

```js
const options = ClientOptions.local("node-local");
```

### Persistent mode

```js
const options = ClientOptions.persistent(
  "node-persistent",
  "data/sdk-store.wal",
);
```

### Transport-enabled mode

```js
const options = ClientOptions.local("node-a");

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;
```

### Discovery-enabled mode

```js
const options = ClientOptions.local("node-discovery");

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4051;

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;
```

## Common issues

### `Cannot use import statement outside a module`

Your app is not running as ESM.

Fix:

```sh
npm pkg set type=module
```

Then rerun:

```sh
node main.js
```

### `Cannot find package '@softadastra/sdk'`

Run:

```sh
npm install @softadastra/sdk
```

If you are working inside the repository, use the local source import:

```js
import { Client, ClientOptions } from "../src/index.js";
```

### `ENOENT: no such file or directory, open 'data/...wal'`

Create the data directory:

```sh
mkdir -p data
```

### Peer connection failed

This can be normal for the TCP peer example. It usually means no peer is running on the target port. Local writes should still work.

### No peer discovered

This can be normal when only one node is running. Local writes should still work.

## Recommended development workflow

```sh
cd ~/softadastra/sdk-js
npm install
npm test

npm run examples:local-store
npm run examples:persistent-store
npm run examples:basic-sync
```

## Summary

To install and verify the JavaScript SDK locally:

```sh
cd ~/softadastra/sdk-js
npm install
npm test
npm run examples:local-store
```

The SDK is ready when local store works, persistent store works, sync state works, examples run, and tests pass.

## Next step

Create your first JavaScript SDK app:

[Go to First App](/sdk-js/first-app)
