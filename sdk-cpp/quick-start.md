# Quick Start

This page shows the shortest path to using the Softadastra C++ SDK in an application.
You will create a client, open it, write a value locally, read it back, inspect the synchronization state, run one manual sync tick, and close the client.

## Include the SDK

Use the main SDK header:

```cpp
#include <softadastra/sdk.hpp>
```

This gives access to the public SDK API:

```cpp
softadastra::sdk::Client
softadastra::sdk::ClientOptions
softadastra::sdk::Result
softadastra::sdk::Error
softadastra::sdk::Key
softadastra::sdk::Value
softadastra::sdk::SyncState
softadastra::sdk::TickResult
```

## Create a client

The main SDK entry point is:

```cpp
softadastra::sdk::Client
```

For a real application, start with a persistent client:

```cpp
softadastra::sdk::Client client{
    softadastra::sdk::ClientOptions::persistent(
        "my-app",
        "data/my-app.wal"
    )
};
```

This enables WAL-backed local persistence.

## Complete example

Create `main.cpp`:

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "quick-start-app",
            "data/quick-start.wal"
        )
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto saved = client.put("hello", "world");

    if (saved.is_err())
    {
        std::cerr << "put failed: " << saved.error().code_string() << ": "
                  << saved.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto value = client.get("hello");

    if (value.is_err())
    {
        std::cerr << "get failed: " << value.error().code_string() << ": "
                  << value.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "value: " << value.value().to_string() << "\n";

    const auto state = client.sync_state();

    if (state.is_ok())
    {
        std::cout << "queued operations: " << state.value().queued_count() << "\n";
        std::cout << "outbox size: " << state.value().outbox_size() << "\n";
    }

    const auto tick = client.tick();

    if (tick.is_ok())
    {
        std::cout << "tick batch size: " << tick.value().batch_size() << "\n";
    }

    client.close();

    return 0;
}
```

## Create a CMake project

Create `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.20)
project(softadastra_quick_start LANGUAGES CXX)
find_package(sdk-cpp REQUIRED)
add_executable(app main.cpp)
target_compile_features(app PRIVATE cxx_std_20)
target_link_libraries(app PRIVATE softadastra::sdk)
```

## Build

Create the data directory:

```bash
mkdir -p data
```

Build with Vix:

```bash
vix build -- -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

Run the app:

```bash
./build-ninja/app
```

Expected output:

```txt
value: world
queued operations: 1
outbox size: 1
tick batch size: 1
```

The exact sync counters can change as the SDK evolves, but the program should write and read the value successfully.

## What happened

The example follows this flow:

```txt
create ClientOptions
  ↓
create Client
  ↓
client.open()
  ↓
client.put("hello", "world")
  ↓
client.get("hello")
  ↓
client.sync_state()
  ↓
client.tick()
  ↓
client.close()
```

## Local-first behavior

The write happens locally first.

```cpp
client.put("hello", "world");
```

The application does not need a network connection to accept the local write.
The SDK stores the value locally and submits the operation to the synchronization pipeline.

## Persistent behavior

This example uses:

```cpp
ClientOptions::persistent(
    "quick-start-app",
    "data/quick-start.wal"
)
```

That means local data is backed by a WAL file.
If the application restarts and opens the same WAL path again, the SDK can recover the local data.

## Result handling

Most SDK operations return a result.
For operations without a returned value:

```cpp
const auto opened = client.open();

if (opened.is_err())
{
    std::cerr << opened.error().message() << "\n";
    return 1;
}
```

For operations that return a value:

```cpp
const auto value = client.get("hello");

if (value.is_ok())
{
    std::cout << value.value().to_string() << "\n";
}
```

Errors expose a stable code and a developer-facing message:

```cpp
error.code_string()
error.message()
error.context()
```

## Next step

Continue with [Client](./client).
