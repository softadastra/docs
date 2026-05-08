# Local Store

The local store is the simplest part of the Softadastra C++ SDK.

It lets a C++ application write, read, check, and remove values locally before any network synchronization happens.

The core rule is:

> Local state comes first.

A local store operation should not require a server, peer, transport, discovery, or cloud access.

## Why local store exists

Softadastra is local-first. That means an application should be able to work with local data even when the network is unavailable.

The local store gives your application a simple key-value API:

```cpp
client.put("key", "value");
client.get("key");
client.remove("key");
client.contains("key");
```

The store is the current local state. The WAL, when enabled, is the durable operation history. The sync engine, when enabled, tracks local operations for later synchronization.

```txt
Store -> current local state
WAL   -> durable operation history
Sync  -> propagation tracking
```

## Minimal local store example

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

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Local-only configuration

For a simple memory-only local store:

```cpp
ClientOptions options =
    ClientOptions::local("node-local");

options.enable_transport = false;
options.enable_discovery = false;
options.enable_wal = false;
```

Use this mode for first examples, tests, demos, temporary state, and simple local tools. Do not use memory-only mode when data must survive restart.

## Write a value

Use `put()` to write a value.

```cpp
auto result = client.put("profile/name", "Ada");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}
```

A successful `put()` means the value is available locally. If WAL is enabled, the flow becomes:

```txt
put
  ↓
WAL append
  ↓
local store update
```

## Read a value

Use `get()` to read a value.

```cpp
auto result = client.get("profile/name");

if (result.is_ok())
{
    std::cout << result.value().to_string() << "\n";
}

if (result.is_err())
{
    std::cout << result.error().code_string() << "\n";
}
```

A missing key is a normal store error. It should not crash the application.

## Remove a value

Use `remove()` to delete a value.

```cpp
auto result = client.remove("profile/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}
```

## Check if a key exists

```cpp
if (client.contains("settings/theme"))
{
    std::cout << "theme exists\n";
}
```

This is a local check. It does not require transport, discovery, or a peer.

## Store size

```cpp
std::cout << client.size() << "\n";
```

## Check if the store is empty

```cpp
if (client.empty())
{
    std::cout << "store is empty\n";
}
```

Use `empty()` when you only need a boolean answer. Use `size()` when you need the number of entries.

## Keys

A key identifies a local value.

Recommended key style: `domain/name` or `domain/id/field`.

Good examples: `profile/name`, `settings/theme`, `documents/1/title`.

Avoid empty keys — they should return an explicit error.

## Values

The SDK accepts strings directly:

```cpp
client.put("message", "hello");
```

You can also use `Value` explicitly:

```cpp
Value value = Value::from_string("hello");
client.put("message", value);
```

Read values can be converted back to strings:

```cpp
auto result = client.get("message");

if (result.is_ok())
{
    std::cout << result.value().to_string() << "\n";
}
```

## Local store and WAL

For durable local storage, enable WAL:

```cpp
options.enable_wal = true;
options.wal_path = "data/sdk-store.wal";
options.auto_flush = true;
```

```txt
Store -> current value
WAL   -> operation history
```

## Local store and sync

A local store write can create sync work.

```cpp
client.put("profile/name", "Ada");

auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox : "
              << state.value().outbox_size
              << "\n";
}

auto tick = client.tick();
```

The important point: store writes are local, sync happens later.

## Store API reference

| Method | Purpose |
|---|---|
| `put(key, value)` | Write or update a local value |
| `get(key)` | Read a local value |
| `remove(key)` | Remove a local value |
| `contains(key)` | Check whether a key exists |
| `size()` | Return the number of local entries |
| `empty()` | Check whether the store is empty |

## Common mistakes

### Expecting persistence in memory-only mode

If `enable_wal` is false, data is memory-only. Use persistent store when data must survive restart.

### Expecting sync to complete immediately

A store write is local. Sync happens later through sync state and ticks.

### Expecting peers to be required

Peers are not required for local store operations.

### Ignoring results

Always check `is_err()` or `is_ok()`.

## Run the SDK example

Inside the SDK repository, this guide corresponds to `examples/01_local_store.cpp`.

```sh
cd ~/softadastra/sdk
vix build
./build-ninja/examples/01_local_store
```

Expected output:

```txt
key   : app/name
value : Softadastra SDK
size  : 1
```

## Summary

The local store gives you `put`, `get`, `remove`, `contains`, `size`, and `empty`.

The key idea is: local data works before the network. After local store works, the next step is persistent store with WAL.

## Next step

Continue with persistent store:

[Go to Persistent Store](/sdk-cpp/persistent-store)
