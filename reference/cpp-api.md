# C++ API Reference

This is the compact reference for the Softadastra C++ SDK.

Use it when you already know the SDK and need to quickly check the public types, method names, return types, and common usage patterns.

For explanations, read the C++ SDK section first:

- [C++ SDK](/sdk-cpp/)
- [Installation](/sdk-cpp/installation)
- [Quick Start](/sdk-cpp/quick-start)
- [Client](/sdk-cpp/client)
- [Client Options](/sdk-cpp/client-options)
- [Results and Errors](/sdk-cpp/results-and-errors)
- [Local Store](/sdk-cpp/local-store)
- [Persistent Store](/sdk-cpp/persistent-store)
- [Restart Recovery](/sdk-cpp/restart-recovery)
- [Sync State](/sdk-cpp/sync-state)
- [Manual Tick](/sdk-cpp/tick)
- [Transport](/sdk-cpp/transport)
- [Discovery](/sdk-cpp/discovery)
- [Metadata](/sdk-cpp/metadata)
- [Examples](/sdk-cpp/examples)

## Header

Use the main SDK header:

```cpp
#include <softadastra/sdk.hpp>
```

The public namespace is:

```cpp
softadastra::sdk
```

For examples:

```cpp
using namespace softadastra::sdk;
```

## Main public types

| Type               | Purpose                   |
| ------------------ | ------------------------- |
| `Client`           | Main SDK object           |
| `ClientOptions`    | Runtime configuration     |
| `Result<T, Error>` | Success or failure result |
| `Error`            | Public SDK error          |
| `Key`              | Public key type           |
| `Value`            | Public value type         |
| `Peer`             | Public peer type          |
| `NodeInfo`         | Local node metadata       |
| `SyncState`        | Current sync state        |
| `TickResult`       | Result of one sync tick   |

## Minimal example

```cpp
#include <softadastra/sdk.hpp>

#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("node-local")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().code_string()
                  << ": "
                  << opened.error().message()
                  << "\n";

        return 1;
    }

    const auto stored =
        client.put("app/name", "Softadastra");

    if (stored.is_err())
    {
        std::cerr << stored.error().code_string()
                  << ": "
                  << stored.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    const auto value =
        client.get("app/name");

    if (value.is_err())
    {
        std::cerr << value.error().code_string()
                  << ": "
                  << value.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    std::cout << value.value().to_string()
              << "\n";

    client.close();

    return 0;
}
```

## Client

`Client` is the main SDK object.

It gives your C++ application one public API for:

- local store
- persistent store
- restart recovery
- sync state
- manual ticks
- transport
- discovery
- peers
- metadata

## Client lifecycle

| Method    | Purpose                                 |
| --------- | --------------------------------------- |
| `open()`  | Open and initialize the local runtime   |
| `close()` | Close the runtime and release resources |

Example:

```cpp
Client client{
    ClientOptions::memory_only("node-local")
};

const auto opened = client.open();

if (opened.is_err())
{
    std::cerr << opened.error().message()
              << "\n";

    return 1;
}

// use the client

client.close();
```

## Store methods

| Method            | Purpose                                |
| ----------------- | -------------------------------------- |
| `put(key, value)` | Write or update a local value          |
| `get(key)`        | Read a local value                     |
| `size()`          | Return the number of local entries     |
| `empty()`         | Check whether the local store is empty |

Example:

```cpp
const auto stored =
    client.put("settings/theme", "dark");

if (stored.is_err())
{
    std::cerr << stored.error().message()
              << "\n";

    return 1;
}

const auto value =
    client.get("settings/theme");

if (value.is_ok())
{
    std::cout << value.value().to_string()
              << "\n";
}
```

## Sync methods

| Method         | Purpose                   |
| -------------- | ------------------------- |
| `sync_state()` | Return current sync state |
| `tick()`       | Run one manual sync tick  |

Example:

```cpp
const auto state =
    client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: "
              << state.value().outbox_size()
              << "\n";

    std::cout << "queued: "
              << state.value().queued_count()
              << "\n";

    std::cout << "failed: "
              << state.value().failed_count()
              << "\n";
}
```

Run one tick:

```cpp
const auto tick =
    client.tick();

if (tick.is_ok())
{
    std::cout << "retried: "
              << tick.value().retried_count()
              << "\n";

    std::cout << "pruned: "
              << tick.value().pruned_count()
              << "\n";

    std::cout << "batch: "
              << tick.value().batch_size()
              << "\n";
}
```

## Transport methods

| Method                                 | Purpose                            |
| -------------------------------------- | ---------------------------------- |
| `start_transport()`                    | Start local transport              |
| `stop_transport()`                     | Stop local transport               |
| `transport_running()`                  | Check whether transport is running |
| `connect(peer)`                        | Connect to a peer                  |
| `disconnect(peer)`                     | Disconnect from a peer             |
| `process_transport_events(max_events)` | Process queued transport events    |

Example:

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_local_transport(9100);

Client client{options};

const auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

const auto started =
    client.start_transport();

if (started.is_err())
{
    client.close();
    return 1;
}

const Peer peer =
    Peer::local("node-b", 9101);

const auto connected =
    client.connect(peer);

if (connected.is_err())
{
    std::cerr << connected.error().message()
              << "\n";
}

client.stop_transport();
client.close();
```

## Discovery methods

| Method                | Purpose                            |
| --------------------- | ---------------------------------- |
| `start_discovery()`   | Start peer discovery               |
| `stop_discovery()`    | Stop peer discovery                |
| `discovery_running()` | Check whether discovery is running |
| `peers()`             | List discovered peers              |

Example:

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_local_discovery(5051);

Client client{options};

const auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

const auto started =
    client.start_discovery();

if (started.is_err())
{
    client.close();
    return 1;
}

const auto peers =
    client.peers();

if (peers.is_ok())
{
    for (const auto &peer : peers.value())
    {
        std::cout << peer.node_id()
                  << " "
                  << peer.host()
                  << ":"
                  << peer.port()
                  << "\n";
    }
}

client.stop_discovery();
client.close();
```

## Metadata methods

| Method                | Purpose                            |
| --------------------- | ---------------------------------- |
| `node_info()`         | Return current local node info     |
| `refresh_node_info()` | Refresh and return local node info |

Example:

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_metadata("Local Node", "0.1.0");

Client client{options};

const auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

const auto info =
    client.refresh_node_info();

if (info.is_ok())
{
    std::cout << info.value().node_id()
              << "\n";

    std::cout << info.value().label()
              << "\n";

    std::cout << info.value().hostname()
              << "\n";

    std::cout << info.value().os_name()
              << "\n";

    std::cout << info.value().version()
              << "\n";
}

client.close();
```

## ClientOptions

`ClientOptions` configures the SDK runtime.

Use the factory helpers first.

## ClientOptions helpers

| Helper                                         | Purpose                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `ClientOptions::memory_only(node_id)`          | Create an in-memory local client                             |
| `ClientOptions::persistent(node_id, wal_path)` | Create a WAL-backed persistent client                        |
| `ClientOptions::fast(node_id, wal_path)`       | Create a faster WAL-backed client with weaker flush behavior |

## Memory-only options

Use this for tests and simple examples.

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-local");
```

Memory-only mode does not keep data after restart.

## Persistent options

Use this when local data must survive restart.

```cpp
ClientOptions options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal"
    );
```

The parent directory must exist:

```sh
mkdir -p data
```

## Fast options

Use this for benchmarks or controlled environments.

```cpp
ClientOptions options =
    ClientOptions::fast(
        "node-a",
        "data/node-a.wal"
    );
```

Use `persistent()` when durability matters more than throughput.

## Transport options

Use `with_local_transport()` for local development.

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_local_transport(9100);
```

This enables transport on:

```txt
127.0.0.1:9100
```

## Discovery options

Use `with_local_discovery()` for local discovery.

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_local_discovery(5051);
```

This enables discovery on:

```txt
127.0.0.1:5051
```

## Metadata options

Use `with_metadata()` to set a readable node label and version.

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_metadata("Local Node", "0.1.0");
```

## Key

`Key` identifies a local value.

```cpp
Key key{"profile/name"};
```

Create from string:

```cpp
Key key =
    Key::from("profile/name");
```

Check validity:

```cpp
if (key.is_valid())
{
    std::cout << key.str()
              << "\n";
}
```

Useful methods:

| Method       | Purpose                        |
| ------------ | ------------------------------ |
| `str()`      | Return the key string          |
| `value()`    | Alias for `str()`              |
| `empty()`    | Check whether the key is empty |
| `is_valid()` | Check whether the key is valid |
| `valid()`    | Alias for `is_valid()`         |
| `clear()`    | Clear the key                  |

A valid key is not empty.

## Value

`Value` stores binary-safe data.

The SDK accepts strings directly:

```cpp
client.put("message", "hello");
```

You can also create a value explicitly:

```cpp
Value value =
    Value::from_string("hello");

client.put("message", value);
```

Convert a value back to string:

```cpp
const auto result =
    client.get("message");

if (result.is_ok())
{
    std::cout << result.value().to_string()
              << "\n";
}
```

Useful methods:

| Method        | Purpose                          |
| ------------- | -------------------------------- |
| `bytes()`     | Return stored bytes              |
| `data()`      | Return stored bytes              |
| `span()`      | Return read-only byte span       |
| `empty()`     | Check whether the value is empty |
| `size()`      | Return byte size                 |
| `to_string()` | Convert bytes to string          |
| `clear()`     | Clear the value                  |

Empty values are valid.

## Peer

`Peer` describes another Softadastra node.

Create a localhost peer:

```cpp
const Peer peer =
    Peer::local("node-b", 9101);
```

Create a peer manually:

```cpp
Peer peer{
    "node-b",
    "127.0.0.1",
    9101
};
```

Useful methods:

| Method           | Purpose                                |
| ---------------- | -------------------------------------- |
| `node_id()`      | Return peer node id                    |
| `host()`         | Return peer host                       |
| `port()`         | Return peer port                       |
| `is_localhost()` | Check whether peer points to localhost |
| `is_valid()`     | Check whether peer is valid            |
| `valid()`        | Alias for `is_valid()`                 |
| `clear()`        | Clear the peer                         |

A valid peer must have:

- non-empty node id
- non-empty host
- non-zero port

## NodeInfo

`NodeInfo` describes the local node.

Useful methods:

| Method                  | Purpose                                |
| ----------------------- | -------------------------------------- |
| `node_id()`             | Return local node id                   |
| `display_name()`        | Return display name                    |
| `label()`               | Return display name or node id         |
| `hostname()`            | Return hostname                        |
| `os_name()`             | Return operating system name           |
| `version()`             | Return version                         |
| `started_at_ms()`       | Return start timestamp in milliseconds |
| `uptime_ms()`           | Return uptime in milliseconds          |
| `capabilities()`        | Return capabilities                    |
| `has_capability(value)` | Check whether capability exists        |
| `is_valid()`            | Check whether node info is valid       |
| `valid()`               | Alias for `is_valid()`                 |
| `clear()`               | Clear node info                        |

Example:

```cpp
const auto info =
    client.refresh_node_info();

if (info.is_ok())
{
    const auto &node =
        info.value();

    std::cout << node.label()
              << "\n";

    std::cout << node.hostname()
              << "\n";

    std::cout << node.version()
              << "\n";
}
```

## SyncState

`SyncState` describes the current sync state.

Useful methods:

| Method                          | Purpose                               |
| ------------------------------- | ------------------------------------- |
| `outbox_size()`                 | Number of operations tracked for sync |
| `queued_count()`                | Number of queued operations           |
| `in_flight_count()`             | Number of in-flight operations        |
| `acknowledged_count()`          | Number of acknowledged operations     |
| `failed_count()`                | Number of failed operations           |
| `last_submitted_version()`      | Last submitted local version          |
| `last_applied_remote_version()` | Last applied remote version           |
| `total_retries()`               | Total retry count                     |
| `has_queued()`                  | Check whether queued work exists      |
| `has_in_flight()`               | Check whether in-flight work exists   |
| `has_failed()`                  | Check whether failed work exists      |
| `has_work()`                    | Check whether sync has work           |
| `empty()`                       | Check whether state is empty          |
| `total_tracked()`               | Total tracked operations              |
| `clear()`                       | Clear the state object                |

Example:

```cpp
const auto state =
    client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: "
              << state.value().outbox_size()
              << "\n";

    std::cout << "queued: "
              << state.value().queued_count()
              << "\n";

    std::cout << "failed: "
              << state.value().failed_count()
              << "\n";
}
```

## TickResult

`TickResult` describes one manual sync tick.

Useful methods:

| Method             | Purpose                              |
| ------------------ | ------------------------------------ |
| `retried_count()`  | Number of retried operations         |
| `pruned_count()`   | Number of pruned entries             |
| `batch_size()`     | Number of outbound sync items        |
| `has_work()`       | Check whether the tick produced work |
| `retried()`        | Check whether retry work happened    |
| `pruned()`         | Check whether pruning happened       |
| `produced_batch()` | Check whether a batch was produced   |
| `empty()`          | Check whether result is empty        |
| `clear()`          | Clear the tick result                |

Example:

```cpp
const auto tick =
    client.tick();

if (tick.is_ok())
{
    std::cout << "retried: "
              << tick.value().retried_count()
              << "\n";

    std::cout << "pruned: "
              << tick.value().pruned_count()
              << "\n";

    std::cout << "batch: "
              << tick.value().batch_size()
              << "\n";
}
```

## Result

Most SDK operations return a `Result`.

A result is either:

```txt
success value
```

or:

```txt
Error
```

Common methods:

| Method     | Purpose                                |
| ---------- | -------------------------------------- |
| `is_ok()`  | Check whether the result is successful |
| `is_err()` | Check whether the result failed        |
| `value()`  | Access success value                   |
| `error()`  | Access error                           |

Correct pattern:

```cpp
const auto result =
    client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().code_string()
              << ": "
              << result.error().message()
              << "\n";

    return 1;
}

std::cout << result.value().to_string()
          << "\n";
```

Do not do this:

```cpp
std::cout << client.get("app/name").value().to_string()
          << "\n";
```

That assumes the operation succeeded.

## Error

`Error` describes what failed.

Useful methods:

| Method          | Purpose                            |
| --------------- | ---------------------------------- |
| `code()`        | Return error code                  |
| `code_string()` | Return stable error code string    |
| `message()`     | Return error message               |
| `context()`     | Return optional diagnostic context |
| `ok()`          | Check whether there is no error    |
| `has_error()`   | Check whether there is an error    |
| `has_context()` | Check whether context is available |
| `clear()`       | Clear the error                    |

Common error code strings:

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

Example:

```cpp
const auto result =
    client.get("missing/key");

if (result.is_err())
{
    std::cout << "code    : "
              << result.error().code_string()
              << "\n";

    std::cout << "message : "
              << result.error().message()
              << "\n";

    if (result.error().has_context())
    {
        std::cout << "context : "
                  << result.error().context()
                  << "\n";
    }
}
```

## Version

The SDK exposes version helpers.

| Name                  | Purpose                   |
| --------------------- | ------------------------- |
| `version_major`       | SDK major version         |
| `version_minor`       | SDK minor version         |
| `version_patch`       | SDK patch version         |
| `version_string`      | SDK version string        |
| `sdk_version_major()` | Return SDK major version  |
| `sdk_version_minor()` | Return SDK minor version  |
| `sdk_version_patch()` | Return SDK patch version  |
| `sdk_version()`       | Return SDK version string |

Example:

```cpp
std::cout << softadastra::sdk::sdk_version()
          << "\n";
```

## Common flows

## Memory-only flow

```cpp
Client client{
    ClientOptions::memory_only("node-local")
};

const auto opened =
    client.open();

if (opened.is_err())
{
    return 1;
}

client.put("app/name", "Softadastra");

const auto value =
    client.get("app/name");

client.close();
```

## Persistent flow

```cpp
Client client{
    ClientOptions::persistent(
        "node-persistent",
        "data/node-persistent.wal"
    )
};

const auto opened =
    client.open();

if (opened.is_err())
{
    return 1;
}

client.put("settings/theme", "dark");

client.close();
```

## Restart recovery flow

```cpp
const std::string wal_path =
    "data/recovery.wal";

{
    Client writer{
        ClientOptions::persistent(
            "writer",
            wal_path
        )
    };

    if (writer.open().is_err())
    {
        return 1;
    }

    writer.put("session/status", "stored");
    writer.close();
}

{
    Client reader{
        ClientOptions::persistent(
            "reader",
            wal_path
        )
    };

    if (reader.open().is_err())
    {
        return 1;
    }

    const auto value =
        reader.get("session/status");

    if (value.is_ok())
    {
        std::cout << value.value().to_string()
                  << "\n";
    }

    reader.close();
}
```

## Sync flow

```cpp
client.put("message/1", "hello");

const auto state =
    client.sync_state();

const auto tick =
    client.tick();
```

## Transport flow

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_local_transport(9100);

Client client{options};

if (client.open().is_err())
{
    return 1;
}

client.start_transport();

const Peer peer =
    Peer::local("node-b", 9101);

client.connect(peer);

client.process_transport_events(64);

client.stop_transport();
client.close();
```

## Discovery flow

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_local_discovery(5051);

Client client{options};

if (client.open().is_err())
{
    return 1;
}

client.start_discovery();

const auto peers =
    client.peers();

client.stop_discovery();
client.close();
```

## Metadata flow

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_metadata("Local Node", "0.1.0");

Client client{options};

if (client.open().is_err())
{
    return 1;
}

const auto info =
    client.refresh_node_info();

if (info.is_ok())
{
    std::cout << info.value().label()
              << "\n";
}

client.close();
```

## Naming style

The C++ SDK uses `snake_case`.

Examples:

```cpp
client.sync_state();
client.start_transport();
client.start_discovery();
client.refresh_node_info();
```

The JavaScript SDK uses `camelCase`.

## Local-first behavior

The C++ SDK keeps local work useful before the network is available.

This does not need peers:

```cpp
client.put("draft/1", "hello");
client.get("draft/1");
```

Transport and discovery are optional.

A transport failure should not delete local data.

A discovery failure should not block local reads and writes.

A sync failure should be visible, but local values should remain readable.

## Stability rule

This reference documents the public C++ SDK API.

Internal runtime classes, conversion helpers, stores, schedulers, WAL internals, and engine implementation details do not belong here.

## Related pages

- [C++ SDK](/sdk-cpp/)
- [Client](/sdk-cpp/client)
- [Client Options](/sdk-cpp/client-options)
- [Results and Errors](/sdk-cpp/results-and-errors)
- [Local Store](/sdk-cpp/local-store)
- [Persistent Store](/sdk-cpp/persistent-store)
- [Restart Recovery](/sdk-cpp/restart-recovery)
- [Sync State](/sdk-cpp/sync-state)
- [Manual Tick](/sdk-cpp/tick)
- [Transport](/sdk-cpp/transport)
- [Discovery](/sdk-cpp/discovery)
- [Metadata](/sdk-cpp/metadata)
- [Examples](/sdk-cpp/examples)
- [Configuration Reference](/reference/config)
