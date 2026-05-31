# Persistent Store

The Softadastra C++ SDK can persist local data with a WAL-backed store.
A persistent store keeps local writes across application restarts. This is the recommended mode for real applications.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## Why persistent storage matters

Local-first applications must be able to accept writes even when the network is unavailable.
But accepting local writes is not enough. The application also needs to keep those writes after:

```txt
process restart
application crash
device reboot
temporary network failure
```

Persistent mode solves this by storing local data through a WAL-backed store.

## Recommended mode

Use `ClientOptions::persistent()` for real applications.

```cpp
auto options = softadastra::sdk::ClientOptions::persistent(
    "my-app",
    "data/my-app.wal"
);
```

This enables:

```txt
WAL-backed local storage
automatic WAL flushing
restart recovery
local-first writes
sync operation tracking
```

## Durable alias

`ClientOptions::durable()` is an explicit alias for `persistent()`.

```cpp
auto options = softadastra::sdk::ClientOptions::durable(
    "my-app",
    "data/my-app.wal"
);
```

Use `persistent()` in most documentation and application code.

Use `durable()` when you want the name to emphasize durability.

## Basic persistent example

```cpp
#include <softadastra/sdk.hpp>

#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "example-persistent-store",
            "data/examples/persistent-store.wal"
        )
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": " << opened.error().message() << "\n";
        return 1;
    }

    const auto stored_name = client.put("profile/name", "Ada");

    if (stored_name.is_err())
    {
        std::cerr << "put failed: " << stored_name.error().code_string() << ": " << stored_name.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto stored_language = client.put("profile/language", "C++");

    if (stored_language.is_err())
    {
        std::cerr << "put failed: " << stored_language.error().code_string() << ": "
                  << stored_language.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto name = client.get("profile/name");

    if (name.is_err())
    {
        std::cerr << "get failed: " << name.error().code_string() << ": "
                  << name.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto language = client.get("profile/language");

    if (language.is_err())
    {
        std::cerr << "get failed: " << language.error().code_string() << ": "
                  << language.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "profile/name: " << name.value().to_string() << "\n";
    std::cout << "profile/language: " << language.value().to_string() << "\n";
    std::cout << "entries: " << client.size() << "\n";
    client.close();

    return 0;
}
```

Expected output:

```txt
profile/name     : Ada
profile/language : C++
entries          : 2
```

## Create the data directory

Before running a persistent example, create the parent directory for the WAL file.

```bash
mkdir -p data/examples
```

If the parent directory does not exist, opening or writing through the persistent store can fail with an I/O error.

## WAL path

The second argument to `persistent()` is the WAL path.

```cpp
ClientOptions::persistent(
    "node-1",
    "data/sdk-store.wal"
)
```

The default WAL path is:

```txt
data/sdk-store.wal
```

So this:

```cpp
auto options = ClientOptions::persistent("node-1");
```

is equivalent to:

```cpp
auto options = ClientOptions::persistent(
    "node-1",
    "data/sdk-store.wal"
);
```

## Persistent mode behavior

Persistent mode configures the SDK with:

```txt
store WAL enabled
auto flush enabled
initial store capacity = 1024
sync batch size = 64
max sync retries = 5
require ack = true
auto queue = true
transport backend = AsyncTcp
```

This mode is designed for application correctness and restart recovery.

## Local writes are durable

When you call:

```cpp
client.put("profile/name", "Ada");
```

the SDK accepts the write locally and submits it through the synchronization pipeline.

In persistent mode, the local store is backed by a WAL file, so the data can be recovered when the application opens the same WAL path again.

## Read after write

You can read the value immediately after writing it.

```cpp
const auto saved = client.put("profile/name", "Ada");

if (saved.is_err())
{
    return 1;
}

const auto value = client.get("profile/name");

if (value.is_ok())
{
    std::cout << value.value().to_string() << "\n";
}
```

Expected output:

```txt
Ada
```

## Check stored entries

Use `size()` to inspect the number of entries in the local store.

```cpp
std::cout << "entries: " << client.size() << "\n";
```

Use `empty()` to check whether the local store is empty.

```cpp
if (client.empty())
{
    std::cout << "store is empty\n";
}
```

## Remove persistent data

Use `remove()` to remove a value.

```cpp
const auto removed = client.remove("profile/name");

if (removed.is_err())
{
    std::cerr << removed.error().code_string() << ": "
              << removed.error().message() << "\n";
    return 1;
}
```

After removal, the operation is also tracked by the synchronization pipeline.

## Persistent store and sync state

Persistent writes are also visible through `sync_state()`.

```cpp
const auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: " << state.value().outbox_size() << "\n";
    std::cout << "queued: " << state.value().queued_count() << "\n";
}
```

This helps applications observe pending local work.

## Persistent store vs memory-only store

| Mode            | WAL | Survives restart | Best for                               |
| --------------- | --: | ---------------: | -------------------------------------- |
| `memory_only()` |  no |               no | examples and tests                     |
| `local()`       |  no |               no | examples and tests                     |
| `persistent()`  | yes |              yes | real applications                      |
| `durable()`     | yes |              yes | real applications                      |
| `fast()`        | yes |              yes | benchmarks and controlled environments |

## Persistent mode vs fast mode

`persistent()` enables automatic flushing after local writes.

```cpp
auto options = ClientOptions::persistent(
    "node-1",
    "data/app.wal"
);
```

`fast()` keeps the WAL enabled but disables automatic flushing after every write.

```cpp
auto options = ClientOptions::fast(
    "node-1",
    "data/app.wal"
);
```

Use `persistent()` when correctness and durability matter.

Use `fast()` only for benchmarks or controlled environments where throughput matters more than maximum durability.

## Complete example with error handling

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

namespace
{
    template <typename ResultType>
    bool failed(
        const ResultType &result,
        const char *operation)
    {
        if (result.is_ok())
        {
            return false;
        }

        const auto &error = result.error();

        std::cerr << operation << " failed: " << error.code_string() << ": " << error.message();
        if (error.has_context())
        {
            std::cerr << " (" << error.context() << ")";
        }

        std::cerr << "\n";
        return true;
    }
}

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "persistent-example",
            "data/persistent-example.wal"
        )
    };

    const auto opened = client.open();
    if (failed(opened, "open"))
    {
        return 1;
    }

    const auto saved = client.put(
        "settings/theme",
        "dark"
    );

    if (failed(saved, "put"))
    {
        client.close();
        return 1;
    }

    const auto value = client.get("settings/theme");
    if (failed(value, "get"))
    {
        client.close();
        return 1;
    }

    std::cout << "settings/theme: " << value.value().to_string() << "\n";
    std::cout << "entries: " << client.size() << "\n";
    client.close();

    return 0;
}
```

## Common issues

### The WAL directory does not exist

Create the parent directory before running the application.

```bash
mkdir -p data
```

### The WAL path is empty

This is invalid when WAL persistence is enabled.

```cpp
auto options = ClientOptions::persistent("node-1", "");

if (!options.is_valid())
{
    // Invalid.
}
```

### The client was not opened

Most operations require `client.open()` first.

```txt
invalid_state: SDK client is not open
```

Fix:

```cpp
const auto opened = client.open();

if (opened.is_err())
{
    return 1;
}
```

## Summary

Use persistent storage when your application needs local data to survive restarts.

The recommended configuration is:

```cpp
ClientOptions::persistent(
    "my-app",
    "data/my-app.wal"
)
```

Persistent mode gives the application:

```txt
local-first writes
WAL-backed storage
automatic flushing
restart recovery
sync operation tracking
```

Next, continue with [Restart Recovery](./restart-recovery).
