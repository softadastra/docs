# Sync

Sync is the part of the Softadastra C++ SDK that tracks local operations and moves them toward synchronization.

A local write can happen first:

```cpp
client.put("profile/name", "Ada");
```

Then sync can inspect and move the pending work:

```cpp
client.sync_state();
client.tick();
```

The core rule is:

> Write locally first. Sync later.

## Why sync exists

Softadastra is local-first. That means an application can accept local writes before a peer, server, or transport connection is available.

But local-first applications still need a way to propagate local work later. Sync exists for that.

```txt
local write
  ↓
local store
  ↓
sync operation
  ↓
outbox
  ↓
queue
  ↓
tick
  ↓
transport batch, if transport is enabled
```

## Sync is not transport

```txt
Sync       -> tracks and prepares operations
Transport  -> sends messages to peers
```

You can use sync without transport:

```cpp
options.enable_transport = false;
options.enable_discovery = false;
```

The client can still track local operations and expose sync state.

## Sync is not the store

```txt
Store -> current state
Sync  -> pending propagation work
```

## Basic sync example

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-basic-sync");

    options.enable_transport = false;
    options.enable_discovery = false;

    options.enable_wal = true;
    options.wal_path = "data/sdk-basic-sync.wal";
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

    auto put_result = client.put("profile/name", "Softadastra");

    if (put_result.is_err())
    {
        std::cerr << "failed to submit local value: "
                  << put_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto before = client.sync_state();

    if (before.is_ok())
    {
        std::cout << "before tick\n";
        std::cout << "  outbox : "
                  << before.value().outbox_size << "\n";
        std::cout << "  queued : "
                  << before.value().queued_count << "\n";
        std::cout << "  failed : "
                  << before.value().failed_count << "\n";
    }

    auto tick_result = client.tick();

    if (tick_result.is_err())
    {
        std::cerr << "failed to tick sync pipeline: "
                  << tick_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    std::cout << "\ntick result\n";
    std::cout << "  retried : "
              << tick_result.value().retried_count << "\n";
    std::cout << "  pruned  : "
              << tick_result.value().pruned_count << "\n";
    std::cout << "  batch   : "
              << tick_result.value().batch_size << "\n";

    client.close();

    return 0;
}
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

## sync_state

`sync_state()` returns the current synchronization state.

```cpp
auto state = client.sync_state();

if (state.is_err())
{
    std::cerr << state.error().message() << "\n";
    return 1;
}

std::cout << "outbox : " << state.value().outbox_size << "\n";
std::cout << "queued : " << state.value().queued_count << "\n";
std::cout << "failed : " << state.value().failed_count << "\n";
```

### Sync state fields

**`outbox_size`** — Local operations waiting for synchronization. Does not mean the work has been delivered to any peer.

**`queued_count`** — Operations ready to be selected for sending. A sync tick can collect queued work into a batch.

**`in_flight_count`** — Operations sent or prepared for delivery, possibly waiting for ACK.

**`acknowledged_count`** — Operations confirmed by the remote side.

**`failed_count`** — Operations that exceeded the retry policy or hit a non-retryable sync error. Failed sync does not mean the local value disappeared.

**`total_retries`** — Total retry attempts. Helps debug unstable transport or missing ACKs.

## tick

`tick()` runs one manual sync tick.

```cpp
auto tick = client.tick();

if (tick.is_err())
{
    std::cerr << tick.error().message() << "\n";
    return 1;
}

std::cout << "retried : " << tick.value().retried_count << "\n";
std::cout << "pruned  : " << tick.value().pruned_count << "\n";
std::cout << "batch   : " << tick.value().batch_size << "\n";
```

### Tick result fields

**`retried_count`** — Operations retried during this tick.

**`pruned_count`** — Completed entries removed during this tick. Can be zero if pruning is not enabled.

**`batch_size`** — Operations produced in the current sync batch. Can be sent by transport when peers are available.

### Tick with pruning

If your SDK version supports a pruning argument:

```cpp
auto tick = client.tick(true);
```

## Why ticks are manual

Softadastra exposes manual ticks because explicit sync is easier to test and debug. Manual ticks are useful for CLI commands, tests, demos, embedded runtimes, and applications that own their event loop.

## Sync without transport

This is valid:

```cpp
options.enable_transport = false;
options.enable_discovery = false;
```

You can still call `sync_state()` and `tick()`. Transport is only needed for delivery to peers.

## Sync with transport

```cpp
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
```

Then:

```cpp
client.open();
client.start_transport();

Peer peer{"node-b", "127.0.0.1", 4042};
client.connect(peer);

client.put("message/1", "hello");
client.tick();
```

If the peer is unavailable, the connect call should fail cleanly and local writes should still work.

## Sync and WAL

For reliable local-first sync, enable WAL:

```cpp
options.enable_wal = true;
options.wal_path = "data/sync.wal";
options.auto_flush = true;
```

```txt
WAL  -> local durability
Sync -> operation propagation tracking
```

A value can be durable locally but not yet synced remotely. Use `sync_state()` to see the difference.

## Sync and failed work

If sync work fails, local data can still exist.

```cpp
client.put("draft/1", "hello");
auto tick = client.tick();

// Even if tick fails, the local value can still be read:
auto value = client.get("draft/1");
```

## Sync API reference

| Method | Purpose |
|---|---|
| `sync_state()` | Read current sync state |
| `tick()` | Run one sync tick |
| `tick(true)` | Run one tick and prune completed work, if supported |

### SyncResult fields

| Field | Purpose |
|---|---|
| `outbox_size` | Number of tracked sync entries |
| `queued_count` | Number of queued entries |
| `in_flight_count` | Number of in-flight entries |
| `acknowledged_count` | Number of acknowledged entries |
| `failed_count` | Number of failed entries |
| `total_retries` | Total retry attempts |

### TickResult fields

| Field | Purpose |
|---|---|
| `retried_count` | Number of operations retried |
| `pruned_count` | Number of completed entries pruned |
| `batch_size` | Number of operations in the tick batch |

## Run the SDK example

This guide corresponds to `examples/04_basic_sync.cpp`.

```sh
cd ~/softadastra/sdk
vix build
mkdir -p data
./build-ninja/examples/04_basic_sync
```

## Common mistakes

### Expecting sync to mean immediate network delivery

Sync tracks and prepares operations. Transport delivers them.

### Treating failed sync as lost local data

Failed sync means propagation failed. Local store data can still exist.

### Forgetting to check results

Always check `is_err()` before reading `value()`.

## Summary

Sync in the C++ SDK gives you `sync_state`, `tick`, outbox visibility, queued work, failed work, retry visibility, and batch visibility.

The key idea is: local writes happen first. Sync makes them observable and movable later. Sync is explicit, local-first, and separate from transport.

## Next step

Continue with transport:

[Go to Transport](/sdk-cpp/transport)
