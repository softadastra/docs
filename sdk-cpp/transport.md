# Transport

Transport lets a Softadastra C++ SDK client start an async TCP network runtime and connect to peers.
Transport is optional. A client can use the local store, persistence, sync state, and manual ticks without enabling transport.
Use transport when your application needs to connect one Softadastra node to another.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## What transport provides

Transport gives the SDK a network layer for peer communication.

With transport enabled, an application can:

```txt
start the transport runtime
check if transport is running
connect to a peer
disconnect from a peer
process queued transport events
advance transport work during tick()
```

The public API stays simple:

```cpp
client.start_transport();
client.transport_running();
client.connect(peer);
client.disconnect(peer);
client.process_transport_events();
client.stop_transport();
```

## Transport is optional

A client created without transport can still write, read, persist, recover, inspect sync state, and run manual ticks.

```cpp
Client client{
    ClientOptions::persistent(
        "my-app",
        "data/my-app.wal"
    )
};
```

Transport methods require transport to be enabled in `ClientOptions`.

If transport is not enabled, transport methods return an error.

```txt
transport_error: transport is disabled
```

## Enable transport

Use `with_local_transport()` for local development.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_transport(9100);
```

This enables transport on:

```txt
127.0.0.1:9100
```

Then create and open the client.

```cpp
Client client{options};

const auto opened = client.open();

if (opened.is_err())
{
    return 1;
}
```

## Start transport

After opening the client, call `start_transport()`.

```cpp
const auto started = client.start_transport();

if (started.is_err())
{
    std::cerr << started.error().code_string() << ": "
              << started.error().message() << "\n";
    return 1;
}
```

Check the running state:

```cpp
if (client.transport_running())
{
    std::cout << "transport is running\n";
}
```

## Stop transport

Use `stop_transport()` to stop the transport service.

```cpp
client.stop_transport();
```

You can check the state again:

```cpp
std::cout << "transport running: " << (client.transport_running() ? "yes" : "no") << "\n";
```

## Peer

A peer represents another Softadastra node.

```cpp
const Peer peer = Peer::local("node-2", 9101);
```

A valid peer must have:

```txt
non-empty node id
non-empty host
non-zero port
```

For localhost development, use:

```cpp
Peer::local("node-2", 9101);
```

This creates a peer pointing to:

```txt
127.0.0.1:9101
```

## Connect to a peer

Use `connect()` to connect to another peer.

```cpp
const Peer peer = Peer::local("node-2", 9101);

const auto connected = client.connect(peer);

if (connected.is_err())
{
    std::cerr << connected.error().code_string() << ": " << connected.error().message();
    if (connected.error().has_context())
    {
        std::cerr << " (" << connected.error().context() << ")";
    }

    std::cerr << "\n";
}
```

If the peer is invalid, the SDK returns:

```txt
invalid_argument: invalid peer
```

If the connection fails, the SDK returns a transport error.

## Disconnect from a peer

Use `disconnect()` to disconnect from a peer.

```cpp
const auto disconnected = client.disconnect(peer);

if (disconnected.is_err())
{
    std::cerr << disconnected.error().code_string() << ": " << disconnected.error().message() << "\n";
}
```

## Process transport events

The async transport backend can queue events.

Use `process_transport_events()` to let the SDK process them explicitly.

```cpp
const auto processed = client.process_transport_events(64);

if (processed.is_ok())
{
    std::cout << "processed events: " << processed.value() << "\n";
}
```

This is useful after:

```txt
start_transport()
connect()
disconnect()
tick()
a wait loop
a manual event loop
```

## Transport and tick

When transport is enabled, `tick()` also processes a small number of queued transport events.

```cpp
const auto tick = client.tick();

if (tick.is_err())
{
    return 1;
}
```

This makes transport usable in applications that manually drive their runtime loop.

## Basic transport example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options = ClientOptions::memory_only("example-transport").with_local_transport(9100);
    Client client{options};

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto started = client.start_transport();

    if (started.is_err())
    {
        std::cerr << "start_transport failed: " << started.error().code_string() << ": "
                  << started.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "transport_running : " << (client.transport_running() ? "yes" : "no") << "\n";

    const Peer peer = Peer::local("example-peer", 9101);
    const auto connected = client.connect(peer);

    if (connected.is_err())
    {
        std::cerr << "connect failed: " << connected.error().code_string() << ": " << connected.error().message();
        if (connected.error().has_context())
        {
            std::cerr << " (" << connected.error().context() << ")";
        }

        std::cerr << "\n";
    }
    else
    {
        std::cout << "connected peer: " << peer.node_id() << " " << peer.host() << ":" << peer.port() << "\n";
    }

    client.stop_transport();
    std::cout << "transport_running : " << (client.transport_running() ? "yes" : "no") << "\n";
    client.close();

    return 0;
}
```

## Two-node local example

Transport is easiest to understand with two local nodes.

Node 1 listens on port `9100`.

```cpp
ClientOptions node1_options = ClientOptions::memory_only("node-1").with_local_transport(9100);
Client node1{node1_options};

node1.open();
node1.start_transport();
```

Node 2 listens on port `9101`.

```cpp
ClientOptions node2_options = ClientOptions::memory_only("node-2").with_local_transport(9101);
Client node2{node2_options};

node2.open();
node2.start_transport();
```

Node 1 can connect to node 2.

```cpp
const Peer node2_peer = Peer::local("node-2", 9101);
const auto connected = node1.connect(node2_peer);
```

After connect, process transport events.

```cpp
node1.process_transport_events();
node2.process_transport_events();
```

## Complete two-node example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client node1{
        ClientOptions::memory_only("node-1")
            .with_local_transport(9100)
    };

    Client node2{
        ClientOptions::memory_only("node-2")
            .with_local_transport(9101)
    };

    const auto opened1 = node1.open();

    if (opened1.is_err())
    {
        std::cerr << "node1 open failed: " << opened1.error().message() << "\n";
        return 1;
    }

    const auto opened2 = node2.open();

    if (opened2.is_err())
    {
        std::cerr << "node2 open failed: " << opened2.error().message() << "\n";
        node1.close();
        return 1;
    }

    const auto started1 = node1.start_transport();

    if (started1.is_err())
    {
        std::cerr << "node1 transport failed: " << started1.error().message() << "\n";

        node2.close();
        node1.close();
        return 1;
    }

    const auto started2 = node2.start_transport();

    if (started2.is_err())
    {
        std::cerr << "node2 transport failed: " << started2.error().message() << "\n";

        node1.stop_transport();
        node2.close();
        node1.close();
        return 1;
    }

    const Peer node2_peer = Peer::local("node-2", 9101);
    const auto connected = node1.connect(node2_peer);

    if (connected.is_err())
    {
        std::cerr << "connect failed: " << connected.error().code_string() << ": "
                  << connected.error().message() << "\n";
    }
    else
    {
        std::cout << "node-1 connected to node-2\n";
    }

    node1.process_transport_events();
    node2.process_transport_events();

    node2.stop_transport();
    node1.stop_transport();

    node2.close();
    node1.close();

    return 0;
}
```

## Transport with persistent storage

Transport can be used with persistent storage.

```cpp
ClientOptions options = ClientOptions::persistent(
        "node-1",
        "data/node-1.wal"
    ).with_local_transport(9100);
```

This gives the node:

```txt
WAL-backed local storage
sync pipeline
async TCP transport
node metadata
```

## Transport with metadata

You can give the node a human-readable display name.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1")
        .with_local_transport(9100)
        .with_metadata("Local Node 1", "0.1.0");
```

Then read it later:

```cpp
const auto info = client.node_info();

if (info.is_ok())
{
    std::cout << info.value().label() << "\n";
}
```

## Common errors

### Transport is disabled

This happens when a transport method is called without enabling transport.

```txt
transport_error: transport is disabled
```

Fix:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_transport(9100);
```

### Transport is not initialized

This means transport was enabled but the runtime was not built correctly.

```txt
transport_error: transport is not initialized
```

Check that `client.open()` succeeded.

### Client is not open

Transport requires an open client.

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

### Invalid peer

This happens when the peer has an empty node id, empty host, or zero port.

```txt
invalid_argument: invalid peer
```

Fix:

```cpp
const Peer peer =
    Peer::local("node-2", 9101);
```

## When to use transport

Use transport when your application needs network communication between Softadastra nodes.

Good use cases:

```txt
local peer-to-peer experiments
node-to-node synchronization
LAN-first applications
manual sync runtimes
tools that need explicit peer connections
```

Do not enable transport if your application only needs local storage and restart recovery.

## Summary

Transport is optional.

Enable it with:

```cpp
ClientOptions::memory_only("node-1").with_local_transport(9100);
```

Start it with:

```cpp
client.start_transport();
```

Connect to peers with:

```cpp
client.connect(Peer::local("node-2", 9101));
```

Process events with:

```cpp
client.process_transport_events();
```

Stop it with:

```cpp
client.stop_transport();
```

Next, continue with [Discovery](./discovery).
