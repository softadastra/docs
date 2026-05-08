# SDK C++ Installation

This page explains how to install, build, and verify the Softadastra C++ SDK.

The C++ SDK lives in:

```txt
~/softadastra/sdk
```

It exposes the public header:

```cpp
#include <softadastra/sdk.hpp>
```

## Requirements

To build and use the C++ SDK, you need:

- C++20 compiler
- CMake
- Ninja
- Git
- Vix, recommended
- Softadastra engine dependencies available through the project build

Check your tools:

```sh
g++ --version
cmake --version
ninja --version
git --version
vix --version
```

## Repository layout

The SDK repository is organized like this:

```txt
sdk/
├── include/
│   └── softadastra/
│       ├── sdk.hpp
│       └── sdk/
│           ├── Client.hpp
│           ├── ClientOptions.hpp
│           ├── Error.hpp
│           ├── Key.hpp
│           ├── NodeInfo.hpp
│           ├── Peer.hpp
│           ├── Result.hpp
│           ├── SyncResult.hpp
│           ├── TickResult.hpp
│           └── Value.hpp
├── src/
├── examples/
├── tests/
├── CMakeLists.txt
├── CMakePresets.json
├── vix.json
└── README.md
```

The SDK is intentionally smaller than the engine. It gives application developers one stable public API over the internal modules.

## Go to the SDK directory

```sh
cd ~/softadastra/sdk
```

You should see `CMakeLists.txt`, `CMakePresets.json`, `vix.json`, `include/`, `src/`, `examples/`, and `tests/`.

## Build with Vix

The recommended development command is:

```sh
vix build
```

For a clean release-style build:

```sh
vix build --preset release
```

If your project uses the default Ninja build directory, the output will usually be under `build-ninja/`.

## Build with CMake

You can also build directly with CMake.

Configure:

```sh
cmake --preset dev-ninja
```

Build:

```sh
cmake --build --preset build-ninja
```

For release builds:

```sh
cmake --preset release
cmake --build --preset build-release
```

If your preset names are different, inspect them:

```sh
cat CMakePresets.json
```

## Include the SDK

In your C++ application, include:

```cpp
#include <softadastra/sdk.hpp>
```

Then use the SDK namespace:

```cpp
using namespace softadastra::sdk;
```

Minimal program:

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::local("node-local")};

    auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().message() << "\n";
        return 1;
    }

    auto written = client.put("hello", "world");

    if (written.is_err())
    {
        std::cerr << written.error().message() << "\n";
        client.close();
        return 1;
    }

    auto value = client.get("hello");

    if (value.is_ok())
    {
        std::cout << value.value().to_string() << "\n";
    }

    client.close();

    return value.is_ok() ? 0 : 1;
}
```

## Link the SDK

The preferred long-term target shape:

```cmake
target_link_libraries(my_app PRIVATE softadastra::sdk)
```

A minimal consuming project:

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_softadastra_app LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(softadastra-sdk CONFIG REQUIRED)

add_executable(my_app main.cpp)

target_link_libraries(my_app PRIVATE softadastra::sdk)
```

## Run the examples

After building:

```sh
vix build
```

Run the examples:

```sh
./build-ninja/examples/01_local_store
./build-ninja/examples/02_persistent_store
./build-ninja/examples/03_remove_value
./build-ninja/examples/04_basic_sync
./build-ninja/examples/05_tcp_peer_sync
./build-ninja/examples/06_discovery
./build-ninja/examples/07_node_metadata
```

If the path is different, find the executables:

```sh
find build-ninja -type f -executable
```

## Example order

The examples are designed to be read in this order:

1. `01_local_store.cpp`
2. `02_persistent_store.cpp`
3. `03_remove_value.cpp`
4. `04_basic_sync.cpp`
5. `05_tcp_peer_sync.cpp`
6. `06_discovery.cpp`
7. `07_node_metadata.cpp`

## Verify local store

Run:

```sh
./build-ninja/examples/01_local_store
```

Expected output style:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Verify persistent store

Run:

```sh
./build-ninja/examples/02_persistent_store
```

Expected output style:

```txt
key          : settings/theme
value        : dark
wal path     : data/sdk-persistent-store.wal
store size   : 1
outbox size  : 1
```

## Verify sync

Run:

```sh
./build-ninja/examples/04_basic_sync
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

Run:

```sh
./build-ninja/examples/05_tcp_peer_sync
```

If no peer is running, the connection can fail cleanly. The important point is that local writes and sync ticks can still happen even when a peer is unavailable.

## Verify discovery

Run:

```sh
./build-ninja/examples/06_discovery
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

No discovered peer is normal in local development.

## Verify metadata

Run:

```sh
./build-ninja/examples/07_node_metadata
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

## Build modes

### Memory-only mode

```cpp
ClientOptions options =
    ClientOptions::local("node-memory");

options.enable_wal = false;
options.enable_transport = false;
options.enable_discovery = false;
```

### Local mode

```cpp
ClientOptions options =
    ClientOptions::local("node-local");
```

### Persistent mode

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/sdk-store.wal");
```

### Transport-enabled mode

```cpp
ClientOptions options =
    ClientOptions::local("node-a");

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
```

### Discovery-enabled mode

```cpp
ClientOptions options =
    ClientOptions::local("node-discovery");

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
```

## Common issues

### Header not found

Error:

```txt
fatal error: softadastra/sdk.hpp: No such file or directory
```

Check that `include/softadastra/sdk.hpp` exists and your build system includes the SDK include directory.

### Linker errors

Use the exported CMake target when possible:

```cmake
target_link_libraries(my_app PRIVATE softadastra::sdk)
```

### C++ standard errors

Make sure your project uses C++20:

```cmake
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
```

### WAL path errors

If persistent examples fail, create the data directory:

```sh
mkdir -p data
```

### Transport connection fails

This can be normal if the target peer is not running. Local writes should still work.

### Discovery shows no peers

This can be normal in local development. Start another discovery-compatible process if you want peer discovery to return entries.

## Summary

To install and verify the C++ SDK locally:

```sh
cd ~/softadastra/sdk
vix build
./build-ninja/examples/01_local_store
```

Use this include in applications:

```cpp
#include <softadastra/sdk.hpp>
```

## Next step

Create your first C++ SDK app:

[Go to First App](/sdk-cpp/first-app)
