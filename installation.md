# Installation

This page explains how to install and prepare Softadastra for local development.

Softadastra is split into three main developer entry points:

```txt
Softadastra CLI
Softadastra SDK C++
Softadastra SDK JS
```

The CLI is used from the terminal. The C++ SDK is used from native C++ applications. The JavaScript SDK is used from Node.js or JavaScript applications.

## Requirements

Softadastra is designed around modern C++ and JavaScript tooling.

For the engine and C++ SDK, you need:

- C++20 compiler
- CMake
- Ninja
- Git
- Vix, recommended for building Softadastra projects

For the JavaScript SDK, you need:

- Node.js
- npm

## Repository layout

A typical local Softadastra workspace can look like this:

```txt
softadastra/
├── softadastra/   # engine, modules, CLI, node app
├── sdk/           # C++ SDK
├── sdk-js/        # JavaScript SDK
└── docs/          # documentation site
```

The engine contains the runtime modules:

```txt
softadastra/
├── apps/
│   ├── cli/
│   └── node/
└── modules/
    ├── cli
    ├── core
    ├── discovery
    ├── fs
    ├── metadata
    ├── store
    ├── sync
    ├── transport
    └── wal
```

The C++ SDK exposes a smaller public API over the engine:

```txt
sdk/
├── include/
│   └── softadastra/
│       ├── sdk.hpp
│       └── sdk/
└── examples/
```

The JavaScript SDK exposes the same model for JavaScript applications:

```txt
sdk-js/
├── src/
├── docs/
├── examples/
└── package.json
```

## Install the CLI

The Softadastra CLI is built from the engine repository.

From the engine directory:

```sh
cd ~/softadastra/softadastra
```

Build the project:

```sh
vix build
```

Build with the CLI application enabled:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

Build the node daemon too:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

Build in release mode:

```sh
vix build --preset release
```

Build and export the final executable to the project root:

```sh
vix build --bin
```

After building, the final CLI binary is:

```txt
softadastra
```

You can test it with:

```sh
softadastra help
softadastra version
softadastra status
```

## Install the C++ SDK

The C++ SDK is used from C++ applications.

From the SDK directory:

```sh
cd ~/softadastra/sdk
```

Build it with Vix:

```sh
vix build
```

Or with CMake:

```sh
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

Use the SDK through the umbrella header:

```cpp
#include <softadastra/sdk.hpp>
```

Minimal example:

```cpp
#include <iostream>
#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("node-local")};

    auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().message() << "\n";
        return 1;
    }

    client.put("hello", "world");

    auto value = client.get("hello");

    if (value.is_ok())
    {
        std::cout << value.value().to_string() << "\n";
    }

    client.close();

    return 0;
}
```

Run SDK examples after building:

```sh
./build-ninja/examples/01_local_store
./build-ninja/examples/02_persistent_store
./build-ninja/examples/03_remove_value
./build-ninja/examples/04_basic_sync
./build-ninja/examples/05_tcp_peer_sync
./build-ninja/examples/06_discovery
./build-ninja/examples/07_node_metadata
```

## Install the JavaScript SDK

The JavaScript SDK is distributed as:

```txt
@softadastra/sdk
```

Install it with npm:

```sh
npm install @softadastra/sdk
```

Use it in JavaScript:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

Minimal example:

```js
import { Client, ClientOptions } from "@softadastra/sdk";

const client = new Client(
  ClientOptions.local("node-local")
);

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

await client.put("hello", "world");

const value = await client.get("hello");

if (value.isOk()) {
  console.log(value.value().toString());
}

await client.close();
```

For local development inside the SDK repository:

```sh
cd ~/softadastra/sdk-js
npm install
npm test
```

Run examples:

```sh
npm run examples:local-store
npm run examples:persistent-store
npm run examples:remove-value
npm run examples:basic-sync
npm run examples:tcp-peer-sync
npm run examples:discovery
npm run examples:node-metadata
```

## Install documentation dependencies

The documentation site uses VitePress.

From the documentation directory:

```sh
cd ~/softadastra/docs
```

Install dependencies:

```sh
npm install
```

If the project does not have a `package.json` yet, create one:

```sh
npm init -y
npm install -D vitepress
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  }
}
```

Run the docs locally:

```sh
npm run dev
```

Build the docs:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Recommended local development flow

When working on the documentation:

```sh
cd ~/softadastra/docs
npm run dev
```

When working on the engine:

```sh
cd ~/softadastra/softadastra
vix build
```

When working on the C++ SDK:

```sh
cd ~/softadastra/sdk
vix build
```

When working on the JavaScript SDK:

```sh
cd ~/softadastra/sdk-js
npm test
```

## Verify installation

### Verify CLI

```sh
softadastra help
softadastra status
```

Expected behavior: The CLI should print help output or runtime status.

### Verify C++ SDK

Build and run:

```sh
cd ~/softadastra/sdk
vix build
./build-ninja/examples/01_local_store
```

Expected behavior: The example should open a local client, write a value, read it back, and print it.

### Verify JavaScript SDK

Run:

```sh
cd ~/softadastra/sdk-js
npm run examples:local-store
```

Expected behavior: The example should open a local client, write a value, read it back, and print it.

## Common issues

### `softadastra` command not found

The CLI binary may not be in your PATH.

Run it directly from the build output, or export it after build:

```sh
vix build --bin
```

Then run:

```sh
./softadastra help
```

### C++ compiler errors

Make sure your compiler supports C++20.

Check your compiler version:

```sh
g++ --version
clang++ --version
```

### CMake preset not found

Make sure you are in the correct repository:

```sh
pwd
ls
```

You should see files like:

```txt
CMakeLists.txt
CMakePresets.json
vix.json
```

### npm package not found locally

If you are inside the `sdk-js` repository, examples may import from local source:

```js
import { Client, ClientOptions } from "../src/index.js";
```

If you are using the package from another project, import from npm:

```js
import { Client, ClientOptions } from "@softadastra/sdk";
```

## Next step

Continue with the quick start:

[Go to Quick Start](/quick-start)
