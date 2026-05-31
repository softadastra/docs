# Client

`softadastra::sdk::Client` is the main entry point of the Softadastra C++ SDK.

It gives applications a simple API for local storage, WAL-backed persistence, restart recovery, synchronization, optional transport, optional discovery, and node metadata.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## Create a client

A client is created from `ClientOptions`.

```cpp
#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "my-app",
            "data/my-app.wal"
        )
    };

    return 0;
}
```

The first argument is the local node id.
The second argument is the WAL path used by the persistent local store.

## Open the client

Before using the client, call `open()`.

```cpp
const auto opened = client.open();

if (opened.is_err())
{
    return 1;
}
```

`open()` initializes the internal Softadastra runtime.
After `open()` succeeds, the client can access the local store, synchronization pipeline, metadata service, and optional services configured in `ClientOptions`.

## Close the client

Call `close()` when the application no longer needs the SDK client.

```cpp
client.close();
```

`close()` stops optional services and releases the internal runtime.
The client destructor also closes the runtime, but explicit `close()` keeps application shutdown clear.

## Check if the client is open

```cpp
if (client.is_open())
{
    // The client is ready.
}
```

`opened()` is also available as a backward-compatible alias.

```cpp
if (client.opened())
{
    // Same as is_open().
}
```

## Write a value

Use `put()` to store a value locally.

```cpp
const auto saved = client.put("hello", "world");

if (saved.is_err())
{
    return 1;
}
```

A local write does not require the network.
Internally, the SDK submits the write to the synchronization pipeline. The value is accepted locally and then tracked for synchronization.

## Read a value

Use `get()` to read from the local store.

```cpp
const auto value = client.get("hello");

if (value.is_err())
{
    return 1;
}

std::cout << value.value().to_string() << "\n";
```

If the key does not exist, `get()` returns an error with code:

```txt
not_found
```

## Remove a value

Use `remove()` to delete a value from the local store.

```cpp
const auto removed = client.remove("hello");

if (removed.is_err())
{
    return 1;
}
```

Like `put()`, `remove()` is submitted through the synchronization pipeline.

## Check if a key exists

```cpp
if (client.contains("hello"))
{
    // The key exists in the local store.
}
```

`contains()` returns `false` when:

```txt
the client is closed
the key is invalid
the key does not exist
```

## Check store size

```cpp
std::cout << client.size() << "\n";
```

When the client is closed, `size()` returns `0`.

You can also use:

```cpp
if (client.empty())
{
    // The local store is empty.
}
```

## Inspect synchronization state

Use `sync_state()` to inspect the current sync pipeline.

```cpp
const auto state = client.sync_state();

if (state.is_err())
{
    return 1;
}

std::cout << "outbox: " << state.value().outbox_size() << "\n";
std::cout << "queued: " << state.value().queued_count() << "\n";
std::cout << "failed: " << state.value().failed_count() << "\n";
```

The sync state is useful for debugging, observability, and showing application status.

## Run one manual sync tick

Use `tick()` to advance synchronization once.

```cpp
const auto tick = client.tick();

if (tick.is_err())
{
    return 1;
}

std::cout << "batch size: " << tick.value().batch_size() << "\n";
```

A tick can:

```txt
retry expired operations
prune completed operations
produce an outbound batch
process transport events when transport is enabled
```

You can ask the SDK to prune completed sync entries during the tick:

```cpp
const auto tick = client.tick(true);
```

## Retry expired operations

```cpp
const auto retried = client.retry_expired();

if (retried.is_ok())
{
    std::cout << "retried: " << retried.value() << "\n";
}
```

## Prune completed operations

```cpp
const auto pruned = client.prune_completed();

if (pruned.is_ok())
{
    std::cout << "pruned: " << pruned.value() << "\n";
}
```

## Prune failed operations

```cpp
const auto pruned = client.prune_failed();

if (pruned.is_ok())
{
    std::cout << "pruned failed: " << pruned.value() << "\n";
}
```

## Start transport

Transport is optional.

To use transport, enable it in `ClientOptions`.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_transport(9100);
Client client{options};

client.open();

const auto started = client.start_transport();
if (started.is_err())
{
    return 1;
}
```

Check if transport is running:

```cpp
if (client.transport_running())
{
    // Transport is running.
}
```

Stop transport:

```cpp
client.stop_transport();
```

## Connect to a peer

```cpp
const Peer peer = Peer::local("node-2", 9101);
const auto connected = client.connect(peer);

if (connected.is_err())
{
    std::cerr << connected.error().message() << "\n";
}
```

A valid peer must have:

```txt
node id
host
non-zero port
```

## Disconnect from a peer

```cpp
const auto disconnected = client.disconnect(peer);

if (disconnected.is_err())
{
    return 1;
}
```

## Process transport events

When transport is enabled, the SDK can process queued backend events explicitly.

```cpp
const auto processed = client.process_transport_events(64);

if (processed.is_ok())
{
    std::cout << "processed events: "
              << processed.value()
              << "\n";
}
```

This is useful after:

```txt
start_transport()
connect()
disconnect()
tick()
an application wait loop
```

## Start discovery

Discovery is optional.

Enable it in `ClientOptions`.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
Client client{options};

client.open();

const auto started = client.start_discovery();
if (started.is_err())
{
    return 1;
}
```

Check if discovery is running:

```cpp
if (client.discovery_running())
{
    // Discovery is running.
}
```

Stop discovery:

```cpp
client.stop_discovery();
```

## List discovered peers

```cpp
const auto peers = client.peers();

if (peers.is_err())
{
    return 1;
}

for (const auto &peer : peers.value())
{
  std::cout << peer.node_id() << " " << peer.host() << ":" << peer.port() << "\n";
}
```

## Read node metadata

Use `node_info()` to read local node metadata.

```cpp
const auto info = client.node_info();

if (info.is_err())
{
    return 1;
}

std::cout << info.value().label() << "\n";
std::cout << info.value().hostname() << "\n";
std::cout << info.value().version() << "\n";
```

## Refresh node metadata

```cpp
const auto info = client.refresh_node_info();

if (info.is_ok())
{
    std::cout << info.value().label() << "\n";
}
```

## Access client options

```cpp
const ClientOptions &options = client.options();

std::cout << options.node_id() << "\n";
```

## Complete example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "client-example",
            "data/client-example.wal"
        )
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto saved = client.put("message", "hello from Softadastra");

    if (saved.is_err())
    {
        std::cerr << "put failed: " << saved.error().code_string() << ": "
                  << saved.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto value = client.get("message");

    if (value.is_err())
    {
        std::cerr << "get failed: " << value.error().code_string() << ": "
                  << value.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "value: " << value.value().to_string() << "\n";
    const auto state = client.sync_state();

    if (state.is_ok())
    {
        std::cout << "outbox: " << state.value().outbox_size() << "\n";
        std::cout << "queued: " << state.value().queued_count() << "\n";
    }

    const auto tick = client.tick();

    if (tick.is_ok())
    {
        std::cout << "tick batch size: " << tick.value().batch_size() << "\n";
    }

    client.close();
    return 0;
}
```

## Common errors

### SDK client is not open

This happens when an operation is called before `open()`.

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

### Key cannot be empty

This happens when `put()`, `get()`, or `remove()` receives an empty key.

```txt
invalid_argument: key cannot be empty
```

Fix:

```cpp
client.put("valid-key", "value");
```

### Transport is disabled

This happens when a transport method is called without enabling transport.

```txt
transport_error: transport is disabled
```

Fix:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_transport(9100);
```

### Discovery is disabled

This happens when a discovery method is called without enabling discovery.

```txt
discovery_error: discovery is disabled
```

Fix:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

## Summary

`Client` is the main SDK facade.

Use it to:

```txt
open the SDK runtime
write local values
read local values
remove local values
inspect sync state
run manual sync ticks
start optional transport
connect to peers
start optional discovery
read node metadata
close the runtime
```

Next, continue with [Client Options](./client-options).
