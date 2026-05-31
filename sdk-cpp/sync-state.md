# Sync State

`sync_state()` lets an application inspect the current synchronization state of the Softadastra C++ SDK client.

It returns a compact snapshot of the sync pipeline: outbox size, queued operations, in-flight operations, acknowledged operations, failed operations, version markers, and retry count.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## What sync state is

Softadastra accepts local writes first.

When an application calls:

```cpp
client.put("message", "hello");
```

the SDK stores the value locally and submits the operation to the synchronization pipeline.

`sync_state()` lets the application inspect that pipeline.

```cpp
const auto state = client.sync_state();
```

## Basic example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("sync-state-example")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto stored = client.put("message", "hello sync");

    if (stored.is_err())
    {
        std::cerr << "put failed: " << stored.error().code_string() << ": "
                  << stored.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto state = client.sync_state();

    if (state.is_err())
    {
        std::cerr << "sync_state failed: " << state.error().code_string() << ": "
                  << state.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "outbox_size: " << state.value().outbox_size() << "\n";
    std::cout << "queued_count: " << state.value().queued_count() << "\n";
    std::cout << "in_flight_count: " << state.value().in_flight_count() << "\n";
    std::cout << "acknowledged_count : " << state.value().acknowledged_count() << "\n";
    std::cout << "failed_count: " << state.value().failed_count() << "\n";

    client.close();

    return 0;
}
```

## Returned type

`sync_state()` returns:

```cpp
Result<SyncState, Error>
```

Example:

```cpp
const auto state = client.sync_state();

if (state.is_err())
{
    std::cerr << state.error().code_string() << ": "
              << state.error().message() << "\n";
    return 1;
}

const SyncState &snapshot = state.value();
```

## SyncState counters

`SyncState` exposes stable counters that are useful to SDK users.

```cpp
state.value().outbox_size();
state.value().queued_count();
state.value().in_flight_count();
state.value().acknowledged_count();
state.value().failed_count();
```

## Outbox size

`outbox_size()` returns the number of operations currently stored in the sync outbox.

```cpp
std::cout << state.value().outbox_size() << "\n";
```

The outbox represents local work tracked by the synchronization pipeline.

## Queued operations

`queued_count()` returns the number of operations waiting to be sent.

```cpp
std::cout << state.value().queued_count() << "\n";
```

After a local write, queued work can appear because the operation has been accepted locally and prepared for synchronization.

## In-flight operations

`in_flight_count()` returns the number of operations currently in flight.

```cpp
std::cout << state.value().in_flight_count() << "\n";
```

An in-flight operation is sync work that has been sent or is being processed and is waiting for completion or acknowledgement.

## Acknowledged operations

`acknowledged_count()` returns the number of operations acknowledged by the sync pipeline.

```cpp
std::cout << state.value().acknowledged_count() << "\n";
```

Acknowledged operations are completed from the sync point of view.

## Failed operations

`failed_count()` returns the number of operations that failed.

```cpp
std::cout << state.value().failed_count() << "\n";
```

Use this counter to detect sync problems.

```cpp
if (state.value().has_failed())
{
    std::cout << "some sync operations failed\n";
}
```

## Version markers

`SyncState` also exposes version markers.

```cpp
state.value().last_submitted_version();
state.value().last_applied_remote_version();
```

`last_submitted_version()` returns the last local version submitted to the sync pipeline.

`last_applied_remote_version()` returns the last remote version applied locally.

These values are useful for debugging, observability, and future synchronization tooling.

## Retry count

`total_retries()` returns the total number of retry attempts performed by sync.

```cpp
std::cout << state.value().total_retries() << "\n";
```

## Helper methods

`SyncState` provides helper methods for common checks.

```cpp
if (state.value().has_queued())
{
    std::cout << "queued work exists\n";
}

if (state.value().has_in_flight())
{
    std::cout << "in-flight work exists\n";
}

if (state.value().has_failed())
{
    std::cout << "failed work exists\n";
}

if (state.value().has_work())
{
    std::cout << "sync has pending work\n";
}
```

## Total tracked operations

`total_tracked()` returns the sum of queued, in-flight, acknowledged, and failed operations.

```cpp
std::cout << "tracked: "
          << state.value().total_tracked()
          << "\n";
```

This is useful when an application wants one compact number for sync activity.

## Empty state

Use `empty()` to check whether all counters and version markers are zero.

```cpp
if (state.value().empty())
{
    std::cout << "sync state is empty\n";
}
```

## Print helper

For examples, a print helper keeps sync output readable.

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

namespace
{
    void print_sync_state(const softadastra::sdk::SyncState &state)
    {
        std::cout << "outbox_size: " << state.outbox_size() << "\n";
        std::cout << "queued_count: " << state.queued_count() << "\n";
        std::cout << "in_flight_count: " << state.in_flight_count() << "\n";
        std::cout << "acknowledged_count: " << state.acknowledged_count() << "\n";
        std::cout << "failed_count: " << state.failed_count() << "\n";
        std::cout << "last_submitted_version: " << state.last_submitted_version() << "\n";
        std::cout << "last_applied_remote_version: " << state.last_applied_remote_version() << "\n";
        std::cout << "total_retries: " << state.total_retries() << "\n";
    }
}
```

## Complete example

```cpp
#include <softadastra/sdk.hpp>

#include <iostream>

namespace
{
    void print_sync_state(const softadastra::sdk::SyncState &state)
    {
        std::cout << "outbox_size: " << state.outbox_size() << "\n";
        std::cout << "queued_count: " << state.queued_count() << "\n";
        std::cout << "in_flight_count: " << state.in_flight_count() << "\n";
        std::cout << "acknowledged_count: " << state.acknowledged_count() << "\n";
        std::cout << "failed_count: " << state.failed_count() << "\n";
        std::cout << "last_submitted_version: " << state.last_submitted_version() << "\n";
        std::cout << "last_applied_remote_version: " << state.last_applied_remote_version() << "\n";
        std::cout << "total_retries: " << state.total_retries() << "\n";
    }
}

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("example-sync-state")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto initial_state = client.sync_state();

    if (initial_state.is_err())
    {
        std::cerr << "sync_state failed: " << initial_state.error().code_string() << ": "
                  << initial_state.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "Initial sync state\n";
    print_sync_state(initial_state.value());

    const auto stored = client.put("message", "hello sync");

    if (stored.is_err())
    {
        std::cerr << "put failed: " << stored.error().code_string() << ": "
                  << stored.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto updated_state = client.sync_state();

    if (updated_state.is_err())
    {
        std::cerr << "sync_state failed: " << updated_state.error().code_string() << ": "
                  << updated_state.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "\nAfter local write\n";
    print_sync_state(updated_state.value());

    client.close();

    return 0;
}
```

## Common errors

### Client is not open

`sync_state()` requires an open client.

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

### Runtime is not initialized

If the SDK runtime was not built correctly, `sync_state()` can return an internal error.

```txt
internal_error: SDK local runtime is not initialized
```

Check that `ClientOptions` is valid and that `client.open()` succeeded.

## When to use sync_state()

Use `sync_state()` when you want to:

```txt
debug local sync behavior
show pending local work
detect failed sync operations
inspect outbox activity
build diagnostics
display application sync status
```

## Summary

`sync_state()` gives a snapshot of the SDK synchronization pipeline.

Use it after local writes to inspect pending work.

```cpp
const auto state = client.sync_state();

if (state.is_ok() && state.value().has_work())
{
    std::cout << "sync has work\n";
}
```

Next, continue with [Manual Tick](./tick).
