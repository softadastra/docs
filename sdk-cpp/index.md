# C++ SDK

The Softadastra C++ SDK is the official C++ interface for using Softadastra inside a C++ application.
It gives your app a simple API to write data locally, read it back, keep it after restart, inspect sync state, run manual sync ticks, and later use transport, discovery, and metadata when needed.

## What the C++ SDK gives you

The main entry point is:

```cpp
softadastra::sdk::Client
```

Most of the time, this is the only class your application needs to start with.
With the C++ SDK, your app can:

- write data locally
- read data from the local store
- keep data after restart with a WAL-backed store
- recover local data by reopening the same WAL path
- inspect pending sync work
- manually advance sync with `tick()`
- enable async TCP transport when nodes need to communicate
- enable discovery when nodes need to find each other
- read local node metadata

The SDK keeps the internal runtime details behind a small public API.

## Main include

Use one public header:

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
softadastra::sdk::Peer
softadastra::sdk::NodeInfo
softadastra::sdk::SyncState
softadastra::sdk::TickResult
```

## Minimal example

This is the smallest useful persistent example.

It opens a client, writes `hello = world`, reads the value back, prints it, and closes the client.

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "my-app",
            "data/my-app.wal"
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

    std::cout << value.value().to_string() << "\n";
    client.close();

    return 0;
}
```

Expected output:

```txt
world
```

## Mental model

Softadastra is built around a simple local-first flow:

```txt
Application
  ↓
softadastra::sdk::Client
  ↓
Local store
  ↓
WAL persistence
  ↓
Sync pipeline
  ↓
Optional transport and discovery
```

A local write does not need the network.

When your app calls `put()`, the SDK accepts the write locally and tracks it in the sync pipeline. After that, your app can inspect the sync state or move the sync pipeline forward with `tick()`.

## Client modes

The SDK gives you three useful modes through `ClientOptions`.

### Local mode

Use local mode for examples and tests.

```cpp
auto options =
    softadastra::sdk::ClientOptions::local("node-1");
```

Local mode keeps data in memory only.

It is useful when you want to test the SDK quickly without creating a WAL file.

### Persistent mode

Use persistent mode for real applications.

```cpp
auto options = softadastra::sdk::ClientOptions::persistent(
                  "node-1",
                  "data/app.wal"
               );
```

Persistent mode enables WAL-backed storage and automatic flushing.

This is the best default when your app must keep local data after restart.

### Fast mode

Use fast mode for benchmarks or controlled environments.

```cpp
auto options = softadastra::sdk::ClientOptions::fast(
        "node-1",
        "data/app.wal"
    );
```

Fast mode still uses a WAL file, but it does not flush after every write.
Use `persistent()` when durability matters more than raw throughput.

## Main documentation path

Read the C++ SDK docs in this order:

1. [Installation](./installation)
2. [Quick Start](./quick-start)
3. [Client](./client)
4. [Client Options](./client-options)
5. [Results and Errors](./results-and-errors)
6. [Local Store](./local-store)
7. [Persistent Store](./persistent-store)
8. [Restart Recovery](./restart-recovery)
9. [Sync State](./sync-state)
10. [Manual Tick](./tick)
11. [Transport](./transport)
12. [Discovery](./discovery)
13. [Metadata](./metadata)
14. [Examples](./examples)

## When to use the C++ SDK

Use the C++ SDK when you want to embed Softadastra directly inside a C++ application.
It is useful for applications that need:

- local-first data storage
- durable local writes
- recovery after restart
- explicit sync control
- peer-to-peer or node-based synchronization
- reliable behavior when the network is slow, unstable, or unavailable

## Next step

Continue with [Installation](./installation).
