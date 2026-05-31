# Manual Tick

`tick()` manually advances the Softadastra C++ SDK synchronization pipeline once.

It is useful when an application wants explicit control over synchronization work instead of hiding everything behind background magic.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## What tick does

A tick is one synchronization step.

When you call:

```cpp
const auto result = client.tick();
```

the SDK asks the synchronization scheduler to advance once.

A tick can:

```txt
retry expired operations
prune completed operations
produce an outbound batch
process transport events when transport is enabled
```

## Why manual tick exists

Softadastra is designed for applications that need predictable behavior.

Instead of forcing all synchronization work to happen invisibly in the background, the SDK lets the application decide when to advance the sync pipeline.

This is useful for:

```txt
game loops
embedded runtimes
CLI tools
desktop applications
test environments
deterministic sync control
manual event loops
```

## Basic example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("tick-example")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto stored = client.put("message", "tick example");

    if (stored.is_err())
    {
        std::cerr << "put failed: " << stored.error().code_string() << ": "
                  << stored.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto tick = client.tick();

    if (tick.is_err())
    {
        std::cerr << "tick failed: " << tick.error().code_string() << ": "
                  << tick.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "retried_count: " << tick.value().retried_count() << "\n";
    std::cout << "pruned_count: " << tick.value().pruned_count() << "\n";
    std::cout << "batch_size: " << tick.value().batch_size() << "\n";
    std::cout << "has_work: " << (tick.value().has_work() ? "yes" : "no") << "\n";

    client.close();

    return 0;
}
```

## Returned type

`tick()` returns:

```cpp
Result<TickResult, Error>
```

Example:

```cpp
const auto tick = client.tick();

if (tick.is_err())
{
    std::cerr << tick.error().code_string() << ": "
              << tick.error().message() << "\n";
    return 1;
}

const TickResult &result = tick.value();
```

## TickResult

`TickResult` describes what happened during one tick.

It exposes three counters:

```cpp
result.retried_count();
result.pruned_count();
result.batch_size();
```

## Retried count

`retried_count()` returns the number of expired operations requeued for retry.

```cpp
std::cout << "retried: " << result.retried_count() << "\n";
```

If this value is greater than zero, the tick retried some pending sync work.

You can also use:

```cpp
if (result.retried())
{
    std::cout << "retry work happened\n";
}
```

## Pruned count

`pruned_count()` returns the number of completed or failed entries pruned by the tick.

```cpp
std::cout << "pruned: " << result.pruned_count() << "\n";
```

You can also use:

```cpp
if (result.pruned())
{
    std::cout << "pruning happened\n";
}
```

## Batch size

`batch_size()` returns the number of outbound sync items produced by the tick.

```cpp
std::cout << "batch size: " << result.batch_size() << "\n";
```

You can also use:

```cpp
if (result.produced_batch())
{
    std::cout << "outbound sync batch produced\n";
}
```

## Check if the tick did work

Use `has_work()` to know whether the tick produced any retry, prune, or outbound batch work.

```cpp
if (result.has_work())
{
    std::cout << "tick produced work\n";
}
else
{
    std::cout << "nothing to do\n";
}
```

Use `empty()` to check the opposite.

```cpp
if (result.empty())
{
    std::cout << "tick result is empty\n";
}
```

## Prune completed entries during tick

By default:

```cpp
client.tick();
```

does not request completed-entry pruning.

To prune completed entries during the tick, pass `true`:

```cpp
const auto tick = client.tick(true);
```

This is useful when you want the scheduler to advance sync work and clean completed entries in the same call.

## Tick and sync state

A common pattern is:

```txt
write local data
  ↓
inspect sync_state()
  ↓
call tick()
  ↓
inspect sync_state() again
```

Example:

```cpp
const auto before = client.sync_state();
const auto tick = client.tick();
const auto after = client.sync_state();
```

You can use this to observe how one manual tick changes the sync pipeline.

## Complete example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

namespace
{
    void print_tick_result(const softadastra::sdk::TickResult &result)
    {
        std::cout << "retried_count : " << result.retried_count() << "\n";
        std::cout << "pruned_count  : " << result.pruned_count() << "\n";
        std::cout << "batch_size    : " << result.batch_size() << "\n";
        std::cout << "has_work      : " << (result.has_work() ? "yes" : "no") << "\n";
    }
}

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("example-tick")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto stored = client.put("message", "tick example");

    if (stored.is_err())
    {
        std::cerr << "put failed: " << stored.error().code_string() << ": "
                  << stored.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto tick = client.tick();

    if (tick.is_err())
    {
        std::cerr << "tick failed: " << tick.error().code_string() << ": "
                  << tick.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "Tick result\n";
    print_tick_result(tick.value());

    const auto state = client.sync_state();

    if (state.is_ok())
    {
        std::cout << "\nSync has work : " << (state.value().has_work() ? "yes" : "no") << "\n";
    }

    client.close();

    return 0;
}
```

## Tick with transport

When transport is enabled, `tick()` also processes a small number of queued transport events.

Example:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_transport(9100);
Client client{options};

client.open();
client.start_transport();

const auto tick = client.tick();
```

This makes `tick()` useful in applications that manually drive their own loop.

## Manual loop example

A simple application loop can call `tick()` repeatedly.

```cpp
for (int i = 0; i < 10; ++i)
{
    const auto tick = client.tick();

    if (tick.is_err())
    {
        std::cerr << tick.error().message() << "\n";
        break;
    }

    if (tick.value().has_work())
    {
        std::cout << "sync work produced\n";
    }
}
```

In real applications, this loop can be connected to a timer, an event loop, a frame loop, or a user action.

## Retry only

If you only want to retry expired sync operations, use `retry_expired()`.

```cpp
const auto retried = client.retry_expired();

if (retried.is_ok())
{
    std::cout << "retried: "
              << retried.value()
              << "\n";
}
```

## Prune completed only

If you only want to prune completed entries, use `prune_completed()`.

```cpp
const auto pruned = client.prune_completed();

if (pruned.is_ok())
{
    std::cout << "pruned: " << pruned.value() << "\n";
}
```

## Prune failed only

If you only want to prune failed entries, use `prune_failed()`.

```cpp
const auto pruned = client.prune_failed();

if (pruned.is_ok())
{
    std::cout << "pruned failed: " << pruned.value() << "\n";
}
```

## Common errors

### Client is not open

`tick()` requires an open client.

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

### Local runtime is not initialized

This means the internal SDK runtime was not built correctly.

```txt
internal_error: SDK local runtime is not initialized
```

Check that `ClientOptions` is valid and that `client.open()` succeeded.

## When to use tick()

Use `tick()` when you want explicit sync control.

Good use cases:

```txt
manual sync buttons
CLI commands
tests
diagnostic tools
custom event loops
offline-first applications that decide when sync should advance
```

## Summary

`tick()` advances synchronization once.

It returns a `TickResult` with:

```txt
retried_count
pruned_count
batch_size
```

Use:

```cpp
const auto tick = client.tick();

if (tick.is_ok() && tick.value().has_work())
{
    std::cout << "sync advanced\n";
}
```

Next, continue with [Transport](./transport).
