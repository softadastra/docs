# Errors

Errors in the Softadastra C++ SDK are explicit.

The SDK does not assume that an operation succeeded. Most operations return a `Result`, and the application must check whether the result is successful or failed.

The core rule is:

> Check the result before using the value.

## Why explicit errors matter

Softadastra is designed for local-first and offline-first systems. In this kind of system, failures are normal: the WAL path may be invalid, the data directory may not exist, a key may be missing, transport may fail, a peer may be unavailable, discovery may find no peers, sync may have failed work, and metadata may be unavailable.

The SDK should make these failures visible instead of hiding them.

## Basic pattern

```cpp
auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";
```

Read it as: call the operation, check if it failed, handle the error, only then read the value.

## Result

`Result` is the SDK type used to represent success or failure.

A successful result contains a value. A failed result contains an error.

```txt
Result<T>
  -> success: T
  -> failure: Error
```

Common methods: `is_ok()`, `is_err()`, `value()`, `error()`.

## Error

`Error` describes what failed.

Common methods: `message()`, `code_string()`.

```cpp
auto result = client.get("missing/key");

if (result.is_err())
{
    std::cout << "code    : "
              << result.error().code_string()
              << "\n";

    std::cout << "message : "
              << result.error().message()
              << "\n";
}
```

Expected output style:

```txt
code    : not_found
message : key not found
```

## is_ok() and is_err()

Use `is_ok()` when you want to handle success:

```cpp
auto result = client.get("app/name");

if (result.is_ok())
{
    std::cout << result.value().to_string() << "\n";
}
```

Use `is_err()` when you want to handle failure first (the recommended pattern):

```cpp
auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";
```

## value() and error()

Only call `value()` after checking that the result is successful:

```cpp
// correct
auto result = client.get("app/name");

if (result.is_ok())
{
    auto value = result.value();
}

// wrong — assumes key exists and operation succeeded
auto value = client.get("app/name").value();
```

Only call `error()` after checking that the result failed:

```cpp
// correct
if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
}
```

## Store errors

### Key not found

A missing key is a normal store error.

```cpp
auto result = client.get("missing/key");

if (result.is_err())
{
    std::cout << result.error().code_string() << "\n";
}
```

Expected code: `not_found`

### Invalid key

An empty key should return an explicit error:

```cpp
auto result = client.put("", "value");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
}
```

## Client lifecycle errors

### Client not open

```cpp
// wrong
Client client{options};
auto result = client.put("app/name", "Softadastra");

// correct
Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    std::cerr << "failed to open client: "
              << opened.error().message()
              << "\n";

    return 1;
}

auto result = client.put("app/name", "Softadastra");
```

### Open failed

Possible causes: invalid node id, invalid WAL path, missing data directory, permission denied, or runtime initialization failed.

### Returning without cleanup

After the client is open, call `client.close()` before returning.

```cpp
auto result = client.put("app/name", "Softadastra");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    client.close();
    return 1;
}

client.close();
```

## WAL errors

Common causes: data directory does not exist, permission denied, invalid WAL path, disk full, write failed, flush failed, corrupted WAL, unsupported WAL format.

### Missing WAL directory

```cpp
options.enable_wal = true;
options.wal_path = "data/app.wal";
```

If `data/` does not exist:

```sh
mkdir -p data
```

### Invalid WAL path

```cpp
// wrong
options.enable_wal = true;
options.wal_path = "";

// correct
options.enable_wal = true;
options.wal_path = "data/app.wal";
```

The important rule: if WAL append fails, the operation should not be treated as durably accepted.

## Sync errors

### Read sync state error

```cpp
auto state = client.sync_state();

if (state.is_err())
{
    std::cerr << "failed to read sync state: "
              << state.error().message()
              << "\n";
}
```

### Tick error

```cpp
auto tick = client.tick();

if (tick.is_err())
{
    std::cerr << "failed to tick sync pipeline: "
              << tick.error().message()
              << "\n";
}
```

### Failed sync work is not lost local data

```cpp
client.put("draft/1", "hello");
auto tick = client.tick();

// Even if sync fails:
auto value = client.get("draft/1"); // still readable locally
```

```txt
store failure -> local data problem
sync failure  -> propagation problem
```

## Transport errors

### Transport disabled

```cpp
// wrong
options.enable_transport = false;
client.start_transport();

// correct
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
```

### Port already in use

```sh
ss -ltnp | grep 4041
```

Use another port:

```cpp
options.transport_port = 4043;
```

### Peer unavailable

```cpp
Peer peer{"node-b", "127.0.0.1", 4042};

auto connected = client.connect(peer);

if (connected.is_err())
{
    std::cout << "connection failed: "
              << connected.error().message()
              << "\n";
}

// Local writes still work:
client.put("local/key", "value");
```

## Discovery errors

### Discovery disabled

```cpp
// wrong
options.enable_discovery = false;
client.start_discovery();

// correct
options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
```

### No peers found

No peers is not automatically an error:

```cpp
auto peers = client.peers();

if (peers.is_ok() && peers.value().empty())
{
    std::cout << "no peer discovered yet\n";
}
```

## Metadata errors

### Invalid node id

```cpp
// wrong
ClientOptions options = ClientOptions::local("");

// correct
ClientOptions options = ClientOptions::local("node-a");
```

## Error handling in full example

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::persistent(
            "node-errors",
            "data/node-errors.wal");

    options.auto_flush = true;
    options.enable_transport = false;
    options.enable_discovery = false;

    Client client{options};

    auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: "
                  << opened.error().message()
                  << "\n";

        return 1;
    }

    auto written = client.put("app/name", "Softadastra");

    if (written.is_err())
    {
        std::cerr << "put failed: "
                  << written.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto value = client.get("app/name");

    if (value.is_err())
    {
        std::cerr << "get failed: "
                  << value.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    std::cout << "value: "
              << value.value().to_string()
              << "\n";

    auto missing = client.get("missing/key");

    if (missing.is_err())
    {
        std::cout << "missing key handled: "
                  << missing.error().code_string()
                  << "\n";
    }

    auto state = client.sync_state();

    if (state.is_ok())
    {
        std::cout << "outbox: "
                  << state.value().outbox_size
                  << "\n";
    }

    client.close();

    return 0;
}
```

Create the data directory first:

```sh
mkdir -p data
```

Expected output style:

```txt
value: Softadastra
missing key handled: not_found
outbox: 1
```

## Error codes

Use `code_string()` for logic, `message()` for humans.

```cpp
auto value = client.get("missing/key");

if (value.is_err() &&
    value.error().code_string() == "not_found")
{
    std::cout << "create default value\n";
}
```

## Common error categories

The SDK can expose error codes such as: `invalid_argument`, `not_found`, `already_exists`, `unavailable`, `permission_denied`, `io_error`, `wal_error`, `store_error`, `sync_error`, `transport_error`, `discovery_error`, `metadata_error`, and `unknown`.

Only rely on codes that are stable in the current public SDK.

## Errors and local-first behavior

In Softadastra, failures should be isolated.

```txt
transport failure  -> sync delivery delayed
discovery failure  -> peer finding delayed
sync failure       -> propagation failed
store failure      -> local state operation failed
```

A transport error should not erase local data. A discovery error should not make the store unusable. A missing peer should not prevent local writes.

## Error API reference

| Method | Purpose |
|---|---|
| `is_ok()` | Check if the result succeeded |
| `is_err()` | Check if the result failed |
| `value()` | Access the success value |
| `error()` | Access the error value |
| `message()` | Human-readable error message |
| `code_string()` | Stable or semi-stable error code string |

## Recommended pattern

```cpp
auto result = operation();

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

auto value = result.value();
```

For operations after `client.open()`:

```cpp
auto result = operation();

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    client.close();
    return 1;
}
```

## Common mistakes

### Reading value() without checking

```cpp
// wrong
auto value = client.get("key").value();

// correct
auto result = client.get("key");

if (result.is_err())
{
    return 1;
}

auto value = result.value();
```

### Treating no peers as a fatal error

No peers can be normal. Local work can continue.

### Treating sync failure as local data loss

Sync failure is propagation failure. Local data may still exist.

### Treating WAL failure as successful persistence

If WAL append fails, do not claim durable success.

### Returning without cleanup

After the client is open, call `client.close()` before returning.

## Summary

Errors in the C++ SDK are explicit.

The important rules are: check `is_err()`, use `message()` for humans, use `code_string()` for logic, do not read `value()` before checking success, do not treat sync failure as local data loss, do not treat no peers as fatal, and close the client after errors when it was opened.

The key idea is: Softadastra errors should explain what failed without hiding local-first behavior.

## Next step

Continue with examples:

[Go to Examples](/sdk-cpp/examples)
