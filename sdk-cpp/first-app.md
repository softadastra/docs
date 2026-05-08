# First App

This page shows how to create your first Softadastra C++ SDK application.

You will build a small local-first program that opens a Softadastra client, writes a value, reads the value back, prints the result, and closes the client.

The goal is to understand the basic SDK flow before enabling persistence, sync, transport, or discovery.

## What you will build

You will create a minimal local-only application:

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

## Create the file

Create a new file:

```sh
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
        ClientOptions::local("node-local");

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

## Understand the code

### The SDK header

```cpp
#include <softadastra/sdk.hpp>
```

This is the main public header for the C++ SDK. It gives access to `Client`, `ClientOptions`, `Key`, `Value`, `Peer`, `NodeInfo`, `Result`, `Error`, `SyncResult`, and `TickResult`.

### Use the SDK namespace

```cpp
using namespace softadastra::sdk;
```

This keeps the example short. Without it, you would write `softadastra::sdk::Client` everywhere.

### Create client options

```cpp
ClientOptions options =
    ClientOptions::local("node-local");
```

This creates local client options for a node named `node-local`. The node id identifies the local runtime.

### Disable transport, discovery, and WAL

```cpp
options.enable_transport = false;
options.enable_discovery = false;
options.enable_wal = false;
```

For the first app, these are all disabled to prove the most important Softadastra principle: local work does not require the network.

### Create the client

```cpp
Client client{options};
```

`Client` is the main SDK object. It owns the local SDK runtime from the application point of view.

### Open the client

```cpp
auto open_result = client.open();
```

The client must be opened before use. The SDK uses explicit result values, so you must check the result:

```cpp
if (open_result.is_err())
{
    std::cerr << "failed to open client: "
              << open_result.error().message()
              << "\n";

    return 1;
}
```

### Write a value

```cpp
auto put_result = client.put(
    "app/name",
    "Softadastra SDK");
```

This writes a local value. The key is `app/name`. The value is `Softadastra SDK`. This is local-first — the write does not require a server, peer, transport, discovery, or cloud access.

Always check the result:

```cpp
if (put_result.is_err())
{
    std::cerr << "failed to store value: "
              << put_result.error().message()
              << "\n";

    client.close();
    return 1;
}
```

### Read the value

```cpp
auto value_result = client.get("app/name");
```

`get()` reads from local state. If the key exists, the result contains a `Value`.

### Check the store size

```cpp
std::cout << "size  : "
          << client.size()
          << "\n";
```

After one successful write, the size should be `1`.

### Close the client

```cpp
client.close();
```

This gives the SDK a clean lifecycle: construct → open → use → close → destroy.

## Run the existing example

If you are inside the SDK repository, the same idea already exists as `examples/01_local_store.cpp`.

Build the SDK:

```sh
cd ~/softadastra/sdk
vix build
```

Run the example:

```sh
./build-ninja/examples/01_local_store
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Build your own app with CMake

A simple consuming project can look like this:

```txt
my-app/
├── CMakeLists.txt
└── main.cpp
```

Example `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_softadastra_app LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(softadastra-sdk CONFIG REQUIRED)

add_executable(my_app main.cpp)

target_link_libraries(my_app PRIVATE softadastra::sdk)
```

## Result and error handling

The SDK uses explicit results. This is the correct pattern:

```cpp
auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";
```

Avoid this pattern:

```cpp
auto value = client.get("app/name").value();
```

That assumes the operation succeeded. In local-first systems, failures must be visible.

## Why local-only first?

The first app disables transport, discovery, and WAL on purpose:

```cpp
options.enable_transport = false;
options.enable_discovery = false;
options.enable_wal = false;
```

This proves the most important Softadastra principle: local work does not require the network.

After this works, you can add features one by one: WAL, sync state, transport, discovery, metadata.

## Next: make it persistent

The first app is memory-only. To make it durable, enable WAL-backed persistence:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/sdk-store.wal");
```

Or configure manually:

```cpp
ClientOptions options =
    ClientOptions::local("node-persistent");

options.enable_wal = true;
options.wal_path = "data/sdk-store.wal";
options.auto_flush = true;
```

## Next: inspect sync

A local write can also create sync work. After writing a value:

```cpp
client.put("profile/name", "Ada");
```

Inspect sync state:

```cpp
auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox : "
              << state.value().outbox_size
              << "\n";
}
```

Run one sync tick:

```cpp
auto tick = client.tick();

if (tick.is_ok())
{
    std::cout << "batch : "
              << tick.value().batch_size
              << "\n";
}
```

## Common mistakes

### Forgetting to open the client

Wrong:

```cpp
Client client{options};
client.put("key", "value");
```

Correct:

```cpp
Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

client.put("key", "value");
```

### Ignoring results

Wrong:

```cpp
client.put("key", "value");
auto value = client.get("key");
std::cout << value.value().to_string() << "\n";
```

Correct:

```cpp
auto value = client.get("key");

if (value.is_err())
{
    std::cerr << value.error().message() << "\n";
    return 1;
}

std::cout << value.value().to_string() << "\n";
```

## Summary

Your first C++ SDK app uses `ClientOptions`, `Client`, `open`, `put`, `get`, `size`, and `close`.

The key lesson is: Softadastra can write and read locally without a server or peer. This is the foundation of the SDK.

## Next step

Continue with the Client API:

[Go to Client](/sdk-cpp/client)
