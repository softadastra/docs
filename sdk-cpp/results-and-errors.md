# Results and Errors

The Softadastra C++ SDK uses explicit result-based error handling.
Most operations return a `Result<T, Error>` instead of throwing exceptions.
This makes SDK behavior predictable and easy to handle in applications, services, tools, and embedded runtimes.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## Result type

The public SDK result type is:

```cpp
softadastra::sdk::Result<T, E>
```

In normal SDK usage, the error type is:

```cpp
softadastra::sdk::Error
```

So most APIs return one of these forms:

```cpp
Result<void, Error>
Result<Value, Error>
Result<SyncState, Error>
Result<TickResult, Error>
Result<NodeInfo, Error>
Result<std::size_t, Error>
```

## Basic pattern

Always check the result before reading the value.

```cpp
const auto opened = client.open();

if (opened.is_err())
{
    std::cerr << opened.error().code_string() << ": "
              << opened.error().message() << "\n";
    return 1;
}
```

For operations that return a value:

```cpp
const auto value = client.get("hello");

if (value.is_err())
{
    std::cerr << value.error().code_string() << ": "
              << value.error().message() << "\n";
    return 1;
}

std::cout << value.value().to_string() << "\n";
```

## Success result

A successful result contains the operation value.

```cpp
const auto value = client.get("hello");

if (value.is_ok())
{
    std::cout << value.value().to_string() << "\n";
}
```

For operations that do not return a value, success means the operation completed.

```cpp
const auto saved = client.put("hello", "world");

if (saved.is_ok())
{
    std::cout << "value saved\n";
}
```

## Error result

An error result contains a public SDK error.

```cpp
const auto value = client.get("missing-key");

if (value.is_err())
{
    const Error &error = value.error();
    std::cerr << error.code_string() << ": " << error.message() << "\n";
}
```

## Error object

`softadastra::sdk::Error` is the public SDK error type.

It contains:

```txt
code
message
context
```

Example:

```cpp
const auto result = client.get("hello");

if (result.is_err())
{
    const auto &error = result.error();

    std::cerr << "code: " << error.code_string() << "\n";
    std::cerr << "message: " << error.message() << "\n";

    if (error.has_context())
    {
        std::cerr << "context: " << error.context() << "\n";
    }
}
```

## Error codes

The SDK exposes stable public error codes.

```cpp
Error::Code::None
Error::Code::Unknown
Error::Code::InvalidArgument
Error::Code::InvalidState
Error::Code::NotFound
Error::Code::AlreadyExists
Error::Code::IoError
Error::Code::StoreError
Error::Code::SyncError
Error::Code::TransportError
Error::Code::DiscoveryError
Error::Code::MetadataError
Error::Code::InternalError
```

Each code has a stable string representation.

```cpp
error.code_string()
```

Examples:

```txt
none
unknown
invalid_argument
invalid_state
not_found
already_exists
io_error
store_error
sync_error
transport_error
discovery_error
metadata_error
internal_error
```

## Common error handling helper

For examples and small applications, a helper function keeps code clean.

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

namespace
{
    template <typename ResultType>
    bool print_error_if_failed(
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
```

Usage:

```cpp
const auto opened = client.open();

if (print_error_if_failed(opened, "open"))
{
    return 1;
}
```

## Handling `open()`

`open()` returns `Result<void, Error>`.

```cpp
const auto opened = client.open();

if (opened.is_err())
{
    std::cerr << "open failed: " << opened.error().code_string() << ": "
              << opened.error().message() << "\n";
    return 1;
}
```

Possible causes include invalid client options or a failure while building the internal SDK runtime.

## Handling `put()`

`put()` returns `Result<void, Error>`.

```cpp
const auto saved = client.put("hello", "world");

if (saved.is_err())
{
    std::cerr << "put failed: " << saved.error().code_string() << ": "
              << saved.error().message() << "\n";
    return 1;
}
```

A common error is an empty key.

```txt
invalid_argument: key cannot be empty
```

Fix:

```cpp
client.put("valid-key", "value");
```

## Handling `get()`

`get()` returns `Result<Value, Error>`.

```cpp
const auto value = client.get("hello");

if (value.is_err())
{
    std::cerr << "get failed: " << value.error().code_string() << ": "
              << value.error().message() << "\n";
    return 1;
}

std::cout << value.value().to_string() << "\n";
```

If the key does not exist, the SDK returns:

```txt
not_found: key not found
```

The missing key can be provided as error context.

## Handling `remove()`

`remove()` returns `Result<void, Error>`.

```cpp
const auto removed = client.remove("hello");

if (removed.is_err())
{
    std::cerr << "remove failed: " << removed.error().code_string() << ": "
              << removed.error().message() << "\n";
    return 1;
}
```

Like `put()`, `remove()` requires a valid non-empty key.

## Handling `sync_state()`

`sync_state()` returns `Result<SyncState, Error>`.

```cpp
const auto state = client.sync_state();

if (state.is_err())
{
    std::cerr << "sync_state failed: " << state.error().code_string() << ": "
              << state.error().message() << "\n";
    return 1;
}

std::cout << "queued: " << state.value().queued_count() << "\n";
```

A common error is calling `sync_state()` before opening the client.

```txt
invalid_state: SDK client is not open
```

## Handling `tick()`

`tick()` returns `Result<TickResult, Error>`.

```cpp
const auto tick = client.tick();

if (tick.is_err())
{
    std::cerr << "tick failed: " << tick.error().code_string() << ": "
              << tick.error().message() << "\n";
    return 1;
}

std::cout << "batch size: " << tick.value().batch_size() << "\n";
```

## Handling transport errors

Transport APIs return errors when transport is disabled or not initialized.

```cpp
const auto started = client.start_transport();

if (started.is_err())
{
    std::cerr << started.error().code_string() << ": " << started.error().message() << "\n";
    return 1;
}
```

Common error:

```txt
transport_error: transport is disabled
```

Fix:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_transport(9100);
```

Then create and open the client:

```cpp
Client client{options};

client.open();
client.start_transport();
```

## Handling peer connection errors

When connecting to a peer, the error context can contain the peer node id.

```cpp
const Peer peer = Peer::local("node-2", 9101);

const auto connected = client.connect(peer);

if (connected.is_err())
{
    const auto &error = connected.error();

    std::cerr << error.code_string() << ": " << error.message();
    if (error.has_context())
    {
        std::cerr << " (" << error.context() << ")";
    }

    std::cerr << "\n";
}
```

A peer must have:

```txt
non-empty node id
non-empty host
non-zero port
```

## Handling discovery errors

Discovery APIs return errors when discovery is disabled or not initialized.

```cpp
const auto started = client.start_discovery();

if (started.is_err())
{
    std::cerr << started.error().code_string() << ": "
              << started.error().message() << "\n";

    return 1;
}
```

Common error:

```txt
discovery_error: discovery is disabled
```

Fix:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

Then create and open the client:

```cpp
Client client{options};

client.open();
client.start_discovery();
```

## Handling metadata errors

Metadata APIs return `Result<NodeInfo, Error>`.

```cpp
const auto info = client.refresh_node_info();

if (info.is_err())
{
    std::cerr << "refresh_node_info failed: " << info.error().code_string() << ": "
              << info.error().message() << "\n";
    return 1;
}

std::cout << info.value().label() << "\n";
```

The metadata service is initialized when the client opens successfully.

## Closed client errors

Most operations require an open client.
This error means an operation was called before `client.open()`:

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

Then call SDK operations.

## Invalid argument errors

Invalid argument errors happen when input values cannot be used by the SDK.

Examples:

```txt
empty node id
empty key
empty WAL path while WAL is enabled
zero sync batch size
zero transport port when transport is enabled
zero discovery port when discovery is enabled
```

Example:

```cpp
const auto saved = client.put("", "value");

if (saved.is_err())
{
    std::cerr << saved.error().code_string() << ": "
              << saved.error().message() << "\n";
}
```

Output:

```txt
invalid_argument: key cannot be empty
```

## Not found errors

`get()` returns `not_found` when the key is missing from the local store.

```cpp
const auto value = client.get("missing");

if (value.is_err())
{
    std::cerr << value.error().code_string() << ": "
              << value.error().message() << "\n";
}
```

Possible output:

```txt
not_found: key not found
```

## I/O errors

I/O errors represent filesystem-related failures.

Examples:

```txt
file not found
file already exists
file read error
file write error
permission denied
```

These internal errors are mapped to:

```txt
io_error
```

## Internal errors

Internal errors represent SDK or runtime failures that should not happen during normal usage.

Examples:

```txt
SDK local runtime is not initialized
metadata service is not initialized
failed to build local SDK runtime
```

If you see an internal error, check that the client options are valid and that the SDK/runtime installation is correct.

## Error boundary

The SDK does not expose internal Softadastra module errors directly.
Internal errors from core, store, sync, transport, discovery, metadata, and runtime modules are converted to the public `softadastra::sdk::Error` type before reaching application code.
This keeps the public C++ SDK API stable while allowing the internal runtime to evolve.

## Complete example

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
            "errors-example",
            "data/errors-example.wal"
        )
    };

    const auto opened = client.open();

    if (failed(opened, "open"))
    {
        return 1;
    }

    const auto saved = client.put("hello", "world");

    if (failed(saved, "put"))
    {
        client.close();
        return 1;
    }

    const auto value = client.get("hello");

    if (failed(value, "get"))
    {
        client.close();
        return 1;
    }

    std::cout << value.value().to_string() << "\n";

    const auto missing = client.get("missing-key");

    if (missing.is_err())
    {
        std::cout << "expected error: " << missing.error().code_string() << ": " << missing.error().message();
        if (missing.error().has_context())
        {
            std::cout << " (" << missing.error().context() << ")";
        }

        std::cout << "\n";
    }

    client.close();
    return 0;
}
```

## Summary

Use this pattern:

```cpp
const auto result = operation();

if (result.is_err())
{
    std::cerr << result.error().code_string() << ": " << result.error().message() << "\n";
    return 1;
}
```

For successful results with values:

```cpp
const auto value = result.value();
```

For errors:

```cpp
const auto &error = result.error();
```

Next, continue with [Local Store](./local-store).
