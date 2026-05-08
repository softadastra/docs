# Client

`Client` is the main public object of the Softadastra C++ SDK.

It gives C++ applications one stable interface for local storage, WAL-backed persistence, sync state, sync ticks, transport, discovery, peers, and node metadata.

Most C++ applications should start with:

```cpp
#include <softadastra/sdk.hpp>
```

Then:

```cpp
using namespace softadastra::sdk;

Client client{
    ClientOptions::local("node-a")};
```

## Why Client exists

Softadastra Engine is modular internally. It contains modules like `core`, `wal`, `store`, `sync`, `transport`, `discovery`, and `metadata`.

Application developers should not need to manually wire those modules for common use cases.

`Client` exists to provide a simpler public API:

```txt
Client
  ↓
local store
WAL, if enabled
sync
transport, if enabled
discovery, if enabled
metadata
```

The SDK keeps the public surface small while the engine remains modular internally.

## Basic lifecycle

A client has a clear lifecycle:

```txt
construct
  ↓
open
  ↓
use
  ↓
close
```

Example:

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::local("node-a")};

    auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().message() << "\n";
        return 1;
    }

    client.put("hello", "world");

    client.close();

    return 0;
}
```

## Create a client

Create options first:

```cpp
ClientOptions options =
    ClientOptions::local("node-a");
```

Then create the client:

```cpp
Client client{options};
```

The client receives its behavior from `ClientOptions`.

## Open the client

Before using the client, call:

```cpp
auto result = client.open();
```

Always check the result:

```cpp
if (result.is_err())
{
    std::cerr << "failed to open client: "
              << result.error().message()
              << "\n";

    return 1;
}
```

Opening the client prepares the local SDK runtime according to the selected options. Depending on configuration, this can initialize the store, WAL, sync, metadata, and transport/discovery configuration.

Opening the client does not automatically start transport or discovery. Those are explicit operations.

## Close the client

When the application is done, call:

```cpp
client.close();
```

A good lifecycle is:

```cpp
Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

// use client

client.close();
```

## Local store methods

`Client` exposes local key-value operations. These operations are local-first and should not require a server, peer, transport, discovery, or cloud access.

### put

Writes a local value.

```cpp
auto result = client.put("profile/name", "Ada");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}
```

Conceptually:

```txt
put
  ↓
store operation
  ↓
WAL, if enabled
  ↓
store apply
  ↓
sync tracking
```

### get

Reads a local value.

```cpp
auto result = client.get("profile/name");

if (result.is_ok())
{
    std::cout << result.value().to_string() << "\n";
}

if (result.is_err())
{
    std::cerr << result.error().code_string() << "\n";
}
```

A missing key is a normal store error, not a crash.

### remove

Removes a local value.

```cpp
auto result = client.remove("profile/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}
```

### contains

Checks whether a key exists locally.

```cpp
if (client.contains("settings/theme"))
{
    std::cout << "theme exists\n";
}
```

### size

Returns the number of local entries.

```cpp
std::cout << client.size() << "\n";
```

### empty

Checks whether the local store is empty.

```cpp
if (client.empty())
{
    std::cout << "store is empty\n";
}
```

## Working with values

The SDK accepts strings directly:

```cpp
client.put("message", "hello");
```

You can also work with `Value` explicitly:

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

## Sync methods

The client exposes synchronization state and manual ticks.

### sync_state

Reads the current sync state.

```cpp
auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox : "
              << state.value().outbox_size
              << "\n";

    std::cout << "queued : "
              << state.value().queued_count
              << "\n";

    std::cout << "failed : "
              << state.value().failed_count
              << "\n";
}
```

### tick

Runs one sync tick.

```cpp
auto tick = client.tick();

if (tick.is_err())
{
    std::cerr << tick.error().message() << "\n";
    return 1;
}

std::cout << "retried : "
          << tick.value().retried_count
          << "\n";

std::cout << "pruned  : "
          << tick.value().pruned_count
          << "\n";

std::cout << "batch   : "
          << tick.value().batch_size
          << "\n";
```

A tick can retry expired operations, produce the next batch, and prune completed work when requested.

If supported, you can ask a tick to prune completed work:

```cpp
auto tick = client.tick(true);
```

## Transport methods

Transport is optional. It lets the client connect to peers and move sync messages.

### start_transport

```cpp
auto result = client.start_transport();

if (result.is_err())
{
    std::cerr << "failed to start transport: "
              << result.error().message()
              << "\n";

    return 1;
}
```

Transport requires transport options:

```cpp
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
```

### transport_running

```cpp
if (client.transport_running())
{
    std::cout << "transport is running\n";
}
```

### connect

```cpp
Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

auto result = client.connect(peer);

if (result.is_err())
{
    std::cout << "peer connection failed: "
              << result.error().message()
              << "\n";
}
```

A failed connection should not prevent local writes:

```cpp
client.put("draft/1", "still local");
```

### stop_transport

If exposed by the SDK:

```cpp
client.stop_transport();
```

If not yet exposed, `client.close()` should clean up transport resources.

## Discovery methods

Discovery is optional. It lets the client list known peers.

### start_discovery

```cpp
auto result = client.start_discovery();

if (result.is_err())
{
    std::cerr << "failed to start discovery: "
              << result.error().message()
              << "\n";

    return 1;
}
```

### discovery_running

```cpp
if (client.discovery_running())
{
    std::cout << "discovery is running\n";
}
```

### peers

```cpp
auto peers = client.peers();

if (peers.is_ok())
{
    for (const auto &peer : peers.value())
    {
        std::cout << peer.node_id << " "
                  << peer.host << ":"
                  << peer.port << "\n";
    }
}
```

No peers is a valid state. Local writes should still work.

### stop_discovery

If exposed:

```cpp
client.stop_discovery();
```

## Metadata methods

### refresh_node_info

Refreshes and returns local node metadata.

```cpp
auto result = client.refresh_node_info();

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

const auto &node = result.value();

std::cout << "node id      : " << node.node_id << "\n";
std::cout << "display name : " << node.display_name << "\n";
std::cout << "hostname     : " << node.hostname << "\n";
std::cout << "os           : " << node.os_name << "\n";
std::cout << "version      : " << node.version << "\n";
std::cout << "uptime ms    : " << node.uptime_ms() << "\n";
```

### node_info

If exposed, returns cached local node information without forcing a refresh.

```cpp
auto info = client.node_info();
```

## Error handling pattern

The SDK uses explicit results.

```cpp
auto result = client.get("key");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

auto value = result.value();
```

Avoid assuming success:

```cpp
auto value = client.get("key").value(); // wrong — hides failure
```

Common result methods: `is_ok()`, `is_err()`, `value()`, `error()`.

Common error methods: `message()`, `code_string()`.

## Client method reference

| Method | Purpose |
|---|---|
| `open()` | Initialize the client runtime |
| `close()` | Close the client runtime |
| `put(key, value)` | Write a local value |
| `get(key)` | Read a local value |
| `remove(key)` | Remove a local value |
| `contains(key)` | Check if a key exists |
| `size()` | Return local store size |
| `empty()` | Check if local store is empty |
| `sync_state()` | Return sync state |
| `tick()` | Run one sync tick |
| `start_transport()` | Start transport |
| `stop_transport()` | Stop transport, if available |
| `transport_running()` | Check transport state |
| `connect(peer)` | Connect to a peer |
| `start_discovery()` | Start discovery |
| `stop_discovery()` | Stop discovery, if available |
| `discovery_running()` | Check discovery state |
| `peers()` | List known peers |
| `node_info()` | Read cached node metadata, if available |
| `refresh_node_info()` | Refresh and read node metadata |

## Common mistakes

### Forgetting open()

```cpp
// wrong
Client client{options};
client.put("key", "value");

// correct
Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

client.put("key", "value");
```

### Ignoring result values

```cpp
// wrong
auto value = client.get("key");
std::cout << value.value().to_string() << "\n";

// correct
auto value = client.get("key");

if (value.is_err())
{
    std::cerr << value.error().message() << "\n";
    return 1;
}

std::cout << value.value().to_string() << "\n";
```

### Starting transport without enabling it

```cpp
// wrong
ClientOptions options =
    ClientOptions::local("node-a");

Client client{options};
client.open();
client.start_transport();

// correct
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
```

### Expecting peers to be required for local writes

Peers are not required for local writes. This should still work with no peers:

```cpp
client.put("draft/1", "hello");
client.get("draft/1");
```

## Summary

`Client` is the main C++ SDK API.

It provides lifecycle, local store, sync state, manual ticks, transport, discovery, peers, metadata, and explicit errors.

The most important pattern is:

```cpp
Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

// use client

client.close();
```

Use `Client` for application code. Use engine modules directly only when working on Softadastra internals.

## Next step

Continue with client options:

[Go to Client Options](/sdk-cpp/client-options)
