# Discovery

Discovery lets a Softadastra C++ SDK client find peers.

Discovery is optional. A client can use local storage, persistence, restart recovery, sync state, manual ticks, and transport without enabling discovery.

Use discovery when your application needs to discover nearby or known Softadastra nodes without manually hardcoding every peer.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## What discovery provides

Discovery gives the SDK a peer discovery layer.

With discovery enabled, an application can:

```txt
start the discovery service
check if discovery is running
list discovered peers
stop discovery
```

The public API is simple:

```cpp
client.start_discovery();
client.discovery_running();
client.peers();
client.stop_discovery();
```

## Discovery is optional

A client created without discovery can still write, read, persist, recover, inspect sync state, and use transport manually.

```cpp
Client client{
    ClientOptions::persistent(
        "my-app",
        "data/my-app.wal"
    )
};
```

Discovery methods require discovery to be enabled in `ClientOptions`.

If discovery is not enabled, discovery methods return an error.

```txt
discovery_error: discovery is disabled
```

## Enable discovery

Use `with_local_discovery()` for local development.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

This enables discovery on:

```txt
127.0.0.1:5051
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

## Start discovery

After opening the client, call `start_discovery()`.

```cpp
const auto started = client.start_discovery();

if (started.is_err())
{
    std::cerr << started.error().code_string() << ": " << started.error().message() << "\n";
    return 1;
}
```

Check the running state:

```cpp
if (client.discovery_running())
{
    std::cout << "discovery is running\n";
}
```

## Stop discovery

Use `stop_discovery()` to stop the discovery service.

```cpp
client.stop_discovery();
```

You can check the state again:

```cpp
std::cout << "discovery running: " << (client.discovery_running() ? "yes" : "no") << "\n";
```

## List discovered peers

Use `peers()` to read the discovered peer list.

```cpp
const auto peers = client.peers();

if (peers.is_err())
{
    std::cerr << peers.error().code_string() << ": " << peers.error().message() << "\n";
    return 1;
}

for (const auto &peer : peers.value())
{
    std::cout << peer.node_id() << " " << peer.host() << ":" << peer.port() << "\n";
}
```

`peers()` returns:

```cpp
Result<std::vector<Peer>, Error>
```

## Peer format

Each discovered peer is exposed as:

```cpp
softadastra::sdk::Peer
```

A peer contains:

```txt
node_id
host
port
```

Example:

```cpp
for (const auto &peer : peers.value())
{
    std::cout << "node_id: " << peer.node_id() << "\n";
    std::cout << "host: " << peer.host() << "\n";
    std::cout << "port: " << peer.port() << "\n";
}
```

## Discovery and transport

Discovery depends on the transport runtime internally.

When discovery is enabled, the SDK also builds the transport layer internally so discovered peers can be represented as connectable nodes.

For normal usage, this is enough:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

Then:

```cpp
Client client{options};

client.open();
client.start_discovery();
```

## Discovery address

`with_local_discovery()` binds discovery to localhost.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

For a custom bind host, use `with_discovery()`.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_discovery("0.0.0.0", 5051);
```

## Announced address

When discovery is enabled, the SDK announces the node address so other peers can find it.

If a transport port is configured, discovery announces the transport port.

If no transport port is configured, discovery falls back to the discovery port.

This keeps local discovery usable even when an application only enables discovery.

## Basic discovery example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

namespace
{
    void print_peer(const softadastra::sdk::Peer &peer)
    {
        std::cout << "  - node_id : " << peer.node_id() << "\n";
        std::cout << "    host    : " << peer.host() << "\n";
        std::cout << "    port    : " << peer.port() << "\n";
    }
}

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options = ClientOptions::memory_only("example-discovery").with_local_discovery(5051);
    Client client{options};
    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto started = client.start_discovery();

    if (started.is_err())
    {
        std::cerr << "start_discovery failed: " << started.error().code_string() << ": "
                  << started.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "discovery_running : " << (client.discovery_running() ? "yes" : "no") << "\n";
    const auto peers = client.peers();

    if (peers.is_err())
    {
        std::cerr << "peers failed: " << peers.error().code_string() << ": "
                  << peers.error().message() << "\n";
        client.stop_discovery();
        client.close();

        return 1;
    }

    std::cout << "discovered_peers  : " << peers.value().size() << "\n";

    if (peers.value().empty())
    {
        std::cout << "  no peers discovered\n";
    }
    else
    {
        for (const auto &peer : peers.value())
        {
            print_peer(peer);
        }
    }

    client.stop_discovery();
    std::cout << "discovery_running : " << (client.discovery_running() ? "yes" : "no") << "\n";
    client.close();

    return 0;
}
```

## Expected output

If no other peers are running, the output can look like this:

```txt
discovery_running : yes
discovered_peers  : 0
  no peers discovered
discovery_running : no
```

This is valid. It means discovery started successfully, but no peers were found yet.

## Discovery with metadata

You can give the node a human-readable name.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1")
                            .with_local_discovery(5051)
                            .with_metadata("Discovery Node", "0.1.0");
```

Then read the node metadata:

```cpp
const auto info = client.node_info();

if (info.is_ok())
{
    std::cout << info.value().label() << "\n";
}
```

## Discovery with transport

You can enable both transport and discovery.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1")
                            .with_local_transport(9100)
                            .with_local_discovery(5051);
```

This gives the node:

```txt
async TCP transport on 127.0.0.1:9100
discovery on 127.0.0.1:5051
metadata service
peer listing
```

When peers are discovered, the application can connect to them with transport.

```cpp
const auto discovered = client.peers();

if (discovered.is_ok())
{
    for (const auto &peer : discovered.value())
    {
        client.connect(peer);
    }
}
```

## Common errors

### Discovery is disabled

This happens when a discovery method is called without enabling discovery.

```txt
discovery_error: discovery is disabled
```

Fix:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

### Discovery is not initialized

This means discovery was enabled but the runtime was not built correctly.

```txt
discovery_error: discovery is not initialized
```

Check that `client.open()` succeeded.

### Client is not open

Discovery requires an open client.

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

### Invalid discovery port

A discovery port of `0` is invalid when discovery is enabled.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(0);

if (!options.is_valid())
{
    std::cout << "invalid options\n";
}
```

Use a non-zero port.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

## When to use discovery

Use discovery when your application needs peer discovery.

Good use cases:

```txt
local peer discovery
LAN-first applications
node-to-node experiments
tools that should find nearby peers
applications that should avoid manual peer configuration
```

Do not enable discovery if your application only needs local storage, restart recovery, or manual peer configuration.

## Summary

Discovery is optional.

Enable it with:

```cpp
ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

Start it with:

```cpp
client.start_discovery();
```

List peers with:

```cpp
client.peers();
```

Stop it with:

```cpp
client.stop_discovery();
```

Next, continue with [Metadata](./metadata).
