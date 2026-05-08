# Persistent Store

Persistent store is the WAL-backed local storage mode of the Softadastra C++ SDK.

It lets your application write locally while keeping accepted operations recoverable after restart.

The core rule is:

> Write locally. Persist locally. Recover later.

A persistent store is still local-first. It does not require a server, peer, transport, or discovery to accept local work.

## Why persistent store exists

Memory-only local store is useful for tests, demos, and temporary state. But real applications often need local data to survive process restart, machine restart, application crash, network interruption, or sync interruption.

Persistent store solves this by using a Write-Ahead Log, also called WAL.

```txt
local write
  ↓
WAL append
  ↓
local store apply
  ↓
sync tracking
```

The WAL stores the operation history. The store exposes the current local state.

```txt
WAL   -> durable history
Store -> current value
```

## Persistent store mental model

A persistent local write follows this model:

```txt
client.put("key", "value")
  ↓
operation created
  ↓
operation appended to WAL
  ↓
operation applied to local store
  ↓
operation tracked for sync
```

If the process restarts, the runtime can use the WAL to rebuild local state:

```txt
open client
  ↓
read WAL
  ↓
replay operations
  ↓
restore store state
```

## Basic persistent example

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-persistent");

    options.enable_transport = false;
    options.enable_discovery = false;

    options.enable_wal = true;
    options.wal_path = "data/sdk-persistent-store.wal";
    options.auto_flush = true;

    Client client{options};

    auto open_result = client.open();

    if (open_result.is_err())
    {
        std::cerr << "failed to open client: "
                  << open_result.error().message()
                  << "\n";

        return 1;
    }

    auto put_result = client.put("settings/theme", "dark");

    if (put_result.is_err())
    {
        std::cerr << "failed to store value: "
                  << put_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto value_result = client.get("settings/theme");

    if (value_result.is_err())
    {
        std::cerr << "failed to read value: "
                  << value_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto sync_result = client.sync_state();

    std::cout << "key          : settings/theme\n";
    std::cout << "value        : "
              << value_result.value().to_string()
              << "\n";

    std::cout << "wal path     : "
              << options.wal_path
              << "\n";

    std::cout << "store size   : "
              << client.size()
              << "\n";

    if (sync_result.is_ok())
    {
        std::cout << "outbox size  : "
                  << sync_result.value().outbox_size
                  << "\n";
    }

    client.close();

    return 0;
}
```

Expected output:

```txt
key          : settings/theme
value        : dark
wal path     : data/sdk-persistent-store.wal
store size   : 1
outbox size  : 1
```

## Create the data directory

Before using a WAL path under `data/`, create the directory:

```sh
mkdir -p data
```

If the directory does not exist, opening the client or writing to the WAL can fail.

Recommended WAL path pattern: `data/<node-id>.wal`.

## Persistent configuration

The important options are:

```cpp
options.enable_wal = true;
options.wal_path = "data/sdk-persistent-store.wal";
options.auto_flush = true;
```

For a local persistent app without networking:

```cpp
ClientOptions options =
    ClientOptions::local("node-persistent");

options.enable_transport = false;
options.enable_discovery = false;

options.enable_wal = true;
options.wal_path = "data/node-persistent.wal";
options.auto_flush = true;
```

## Persistent helper

If your SDK version exposes `ClientOptions::persistent`, use it for shorter code:

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/sdk-persistent-store.wal");

options.auto_flush = true;
options.enable_transport = false;
options.enable_discovery = false;
```

## WAL and recovery

The recovery model is:

```txt
process starts
  ↓
client.open()
  ↓
WAL is read
  ↓
valid operations are replayed
  ↓
local store is restored
```

## Persistent store and sync state

A persistent write can also create sync work.

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

```txt
WAL   -> makes local operation recoverable
Sync  -> tracks operation for propagation
```

## WAL path per node

When running multiple local nodes, use different WAL paths.

```cpp
// Node A
ClientOptions node_a =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");

// Node B
ClientOptions node_b =
    ClientOptions::persistent(
        "node-b",
        "data/node-b.wal");
```

One node → one WAL path. Avoid sharing the same WAL file between independent clients.

## Persistent remove

Removing a value can also be recorded through the WAL.

```cpp
client.put("session/token", "temporary-token");
client.remove("session/token");
```

Conceptually:

```txt
put session/token -> WAL record
remove session/token -> WAL record
replay WAL -> session/token does not exist
```

## Run the SDK example

This guide corresponds to `examples/02_persistent_store.cpp`.

```sh
cd ~/softadastra/sdk
vix build
mkdir -p data
./build-ninja/examples/02_persistent_store
```

Verify the WAL file was created:

```sh
ls -la data
```

## Error handling

Common WAL-related failures: directory does not exist, permission denied, invalid path, disk full, write failed, flush failed, corrupted WAL, unsupported WAL version.

Always check results:

```cpp
auto result = client.put("settings/theme", "dark");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    client.close();
    return 1;
}
```

If you use `options.wal_path = "data/app.wal"` but `data/` does not exist:

```sh
mkdir -p data
```

## Persistent store API reference

| Method | Purpose |
|---|---|
| `put(key, value)` | Write or update a local value |
| `get(key)` | Read a local value |
| `remove(key)` | Remove a local value |
| `contains(key)` | Check whether a key exists |
| `size()` | Return the number of local entries |
| `empty()` | Check whether the store is empty |
| `sync_state()` | Inspect sync work created by writes |
| `tick()` | Move sync forward once |

The difference from local store is configuration:

```cpp
options.enable_wal = true;
options.wal_path = "data/app.wal";
options.auto_flush = true;
```

## Common mistakes

### Forgetting mkdir -p data

If your WAL path is under `data/`, create the directory first.

### Expecting WAL to mean synced

WAL means locally persisted. Sync state tells you whether work is pending, queued, acknowledged, or failed.

### Disabling auto flush for important data

For normal durable examples, keep `options.auto_flush = true`.

### Editing the WAL manually

The WAL is an internal runtime file. Do not edit it by hand.

## Summary

Persistent store adds WAL-backed durability to the local store.

The key idea is: persistent means locally recoverable. It does not automatically mean remotely synced.

## Next step

Continue with sync:

[Go to Sync](/sdk-cpp/sync)
