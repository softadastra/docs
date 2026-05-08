# Discovery

Discovery is the part of the Softadastra C++ SDK that lets a local node find peers.

The core rule is:

```txt
Discovery finds peers.
Transport connects peers.
Sync sends operations.
```

Discovery is optional. A Softadastra client can still write, read, persist, and track sync work without discovery.

## Why discovery exists

Without discovery, peers must be configured manually:

```cpp
Peer peer{"node-b", "127.0.0.1", 4042};
```

That is useful for tests and simple local demos. But in a peer-aware system, a node may need to discover peers dynamically.

Discovery exists to answer: which peers are available, where can I reach them, which node id do they use, and which transport port do they expose?

## Discovery is not transport

Discovery finds peers. Transport connects to them. A discovered peer is not automatically a connected peer.

## Discovery is optional

You can disable discovery:

```cpp
options.enable_discovery = false;
```

The client can still `open`, `put`, `get`, `remove`, `sync_state`, `tick`, `start_transport`, connect to manually configured peers, and `close`. Discovery is only needed when the node should find peers automatically.

## Basic discovery configuration

Discovery usually works together with transport.

```cpp
ClientOptions options =
    ClientOptions::local("node-discovery-a");

options.enable_wal = true;
options.wal_path = "data/sdk-discovery.wal";
options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
```

## Basic discovery example

```cpp
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-discovery-a");

    options.enable_wal = true;
    options.wal_path = "data/sdk-discovery.wal";
    options.auto_flush = true;

    options.enable_transport = true;
    options.transport_host = "127.0.0.1";
    options.transport_port = 4051;

    options.enable_discovery = true;
    options.discovery_host = "127.0.0.1";
    options.discovery_port = 5051;
    options.discovery_broadcast_host = "127.0.0.1";
    options.discovery_broadcast_port = 5052;

    Client client{options};

    auto open_result = client.open();

    if (open_result.is_err())
    {
        std::cerr << "failed to open client: "
                  << open_result.error().message()
                  << "\n";

        return 1;
    }

    auto discovery_result = client.start_discovery();

    if (discovery_result.is_err())
    {
        std::cerr << "failed to start discovery: "
                  << discovery_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto peers_result = client.peers();

    std::cout << "discovery\n";
    std::cout << "  running : "
              << (client.discovery_running() ? "yes" : "no")
              << "\n";

    std::cout << "  bind    : "
              << options.discovery_host << ":"
              << options.discovery_port
              << "\n";

    std::cout << "  target  : "
              << options.discovery_broadcast_host << ":"
              << options.discovery_broadcast_port
              << "\n";

    std::cout << "\npeers\n";

    if (peers_result.is_ok() && peers_result.value().empty())
    {
        std::cout << "  no peer discovered yet\n";
    }
    else if (peers_result.is_ok())
    {
        for (const auto &peer : peers_result.value())
        {
            std::cout << "  "
                      << peer.node_id << " "
                      << peer.host << ":"
                      << peer.port << "\n";
        }
    }

    client.close();

    return 0;
}
```

Expected output when no other node is running:

```txt
discovery
  running : yes
  bind    : 127.0.0.1:5051
  target  : 127.0.0.1:5052

peers
  no peer discovered yet
```

No discovered peer is normal. The local client can still write and read local data.

## Start discovery

After opening the client:

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

## Check discovery status

```cpp
if (client.discovery_running())
{
    std::cout << "discovery is running\n";
}
```

## List peers

```cpp
auto peers = client.peers();

if (peers.is_ok())
{
    for (const auto &peer : peers.value())
    {
        std::cout << peer.node_id << " "
                  << peer.host << ":" << peer.port << "\n";
    }
}

if (peers.is_ok() && peers.value().empty())
{
    std::cout << "no peer discovered yet\n";
}
```

## Stop discovery

If exposed:

```cpp
client.stop_discovery();
```

If not yet exposed, `client.close()` should stop discovery resources.

## Discovery port configuration

For local two-node tests:

```txt
node-a discovery_port = 5051
node-a discovery_broadcast_port = 5052

node-b discovery_port = 5052
node-b discovery_broadcast_port = 5051
```

Each node targets the other node's discovery listener.

## Two-node discovery shape

Node A:

```cpp
options.discovery_port = 5051;
options.discovery_broadcast_port = 5052;
options.transport_port = 4051;
```

Node B:

```cpp
options.discovery_port = 5052;
options.discovery_broadcast_port = 5051;
options.transport_port = 4052;
```

## Discovery and transport together

Discovery gives you peers. Transport can connect to them.

```cpp
auto peers = client.peers();

if (peers.is_ok())
{
    for (const auto &peer : peers.value())
    {
        auto connected = client.connect(peer);

        if (connected.is_ok())
        {
            std::cout << "connected to "
                      << peer.node_id << "\n";
        }
    }
}
```

## Discovery and local writes

Discovery is not required for local writes.

```cpp
client.put("draft/1", "hello");
client.get("draft/1");
```

No peer means synchronization with other nodes is delayed. It does not mean local state is invalid.

## Discovery API reference

| Method | Purpose |
|---|---|
| `start_discovery()` | Start peer discovery |
| `stop_discovery()` | Stop discovery, if exposed |
| `discovery_running()` | Check discovery state |
| `peers()` | List known peers |

### Discovery option reference

| Option | Purpose |
|---|---|
| `enable_discovery` | Enable discovery support |
| `discovery_host` | Local discovery bind host |
| `discovery_port` | Local discovery bind port |
| `discovery_broadcast_host` | Discovery target host |
| `discovery_broadcast_port` | Discovery target port |

### Peer reference

| Field | Purpose |
|---|---|
| `node_id` | Peer node id |
| `host` | Peer transport host |
| `port` | Peer transport port |

## Common issues

### Port already in use

```sh
ss -lunp | grep 5051
```

Use another discovery port.

### Wrong discovery target

For local two-node tests, check that each node targets the other node's discovery port.

### No peers found

Possible causes: no other node is running, other node uses a different discovery port, discovery is disabled on the other node, or network blocks discovery traffic.

## Common mistakes

### Expecting discovery to connect peers

Discovery finds peers. Transport connects peers.

### Expecting discovery to sync data

Discovery does not send sync operations. Sync handles operations.

### Reusing the same discovery port

Use different discovery ports for different local nodes.

### Treating no peers as local failure

No peers only means no remote node is currently known. Local store can still work.

## Run the SDK example

This guide corresponds to `examples/06_discovery.cpp`.

```sh
cd ~/softadastra/sdk
vix build
mkdir -p data
./build-ninja/examples/06_discovery
```

## Summary

Discovery is the peer discovery layer of the C++ SDK.

It gives you `start_discovery`, `discovery_running`, `peers`, and optional `stop_discovery`.

The key idea is: discovery finds peers, transport connects peers, sync sends operations, and store remains local-first.

Discovery failure or an empty peer list should delay synchronization, not break local work.

## Next step

Continue with metadata:

[Go to Metadata](/sdk-cpp/metadata)
