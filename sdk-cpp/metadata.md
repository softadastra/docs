# Metadata

Metadata is the part of the Softadastra C++ SDK that describes the local node.

It gives your application information such as node id, display name, hostname, operating system, version, uptime, and capabilities.

The core rule is:

> Metadata tells you who the local node is.

Metadata is local. It does not require a peer, transport, discovery, or network access.

## Why metadata exists

When a node participates in a local-first system, it needs an identity.

Metadata answers questions like: which node is this, what is its display name, what version is it running, which operating system is it on, how long has it been running, and which capabilities does it support?

This is useful for CLI status, debug logs, dashboards, peer inspection, runtime diagnostics, sync visibility, and local node identity.

## Metadata is not store data

Metadata describes the node. It is not application key-value data.

```txt
Store    -> application state
Metadata -> node description
```

## Basic metadata configuration

Configure metadata through `ClientOptions`:

```cpp
ClientOptions options =
    ClientOptions::local("node-metadata");

options.display_name = "Softadastra SDK Node";
options.version = "0.1.0";

options.enable_wal = false;
options.enable_transport = false;
options.enable_discovery = false;
```

## Basic metadata example

```cpp
#include <cstddef>
#include <iostream>

#include <softadastra/metadata/types/CapabilityType.hpp>
#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::local("node-metadata");

    options.display_name = "Softadastra SDK Node";
    options.version = "0.1.0";

    options.enable_wal = false;
    options.enable_transport = false;
    options.enable_discovery = false;

    Client client{options};

    auto open_result = client.open();

    if (open_result.is_err())
    {
        std::cerr << "failed to open client: "
                  << open_result.error().message()
                  << "\n";

        return 1;
    }

    auto node_result = client.refresh_node_info();

    if (node_result.is_err())
    {
        std::cerr << "failed to read node metadata: "
                  << node_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    const auto &node = node_result.value();

    std::cout << "node metadata\n";
    std::cout << "  node id      : " << node.node_id << "\n";
    std::cout << "  display name : " << node.display_name << "\n";
    std::cout << "  hostname     : " << node.hostname << "\n";
    std::cout << "  os           : " << node.os_name << "\n";
    std::cout << "  version      : " << node.version << "\n";
    std::cout << "  uptime ms    : " << node.uptime_ms() << "\n";

    std::cout << "  capabilities : ";

    if (node.capabilities.empty())
    {
        std::cout << "none";
    }
    else
    {
        for (std::size_t i = 0; i < node.capabilities.size(); ++i)
        {
            std::cout
                << softadastra::metadata::types::to_string(
                       node.capabilities[i]);

            if (i + 1 < node.capabilities.size())
            {
                std::cout << ", ";
            }
        }
    }

    std::cout << "\n";

    client.close();

    return 0;
}
```

Expected output style:

```txt
node metadata
  node id      : node-metadata
  display name : Softadastra SDK Node
  hostname     : ...
  os           : linux
  version      : 0.1.0
  uptime ms    : ...
  capabilities : core, store, sync, metadata
```

## Read node metadata

Use:

```cpp
auto result = client.refresh_node_info();

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

const auto &node = result.value();

std::cout << node.node_id << "\n";
std::cout << node.display_name << "\n";
std::cout << node.hostname << "\n";
std::cout << node.os_name << "\n";
std::cout << node.version << "\n";
```

### refresh_node_info

`refresh_node_info()` refreshes and returns local node metadata. Use it when you want the latest runtime metadata, especially for fields that can change over time such as uptime.

### node_info

If your SDK version exposes `node_info()`, it returns cached metadata without forcing a refresh. Use `refresh_node_info()` when you want to refresh runtime fields first.

## NodeInfo

`NodeInfo` is the public SDK type that represents node metadata.

It can contain: `node_id`, `display_name`, `hostname`, `os_name`, `version`, `capabilities`, and `uptime`.

### Node id

The node id identifies the local Softadastra node. It comes from `ClientOptions`:

```cpp
ClientOptions options = ClientOptions::local("node-metadata");
```

A good node id should be non-empty, stable, unique enough for the deployment, and human-readable.

### Display name

```cpp
options.display_name = "Softadastra SDK Node";
```

If no display name is set, the node id can be used as the fallback label.

### Hostname

The machine name. Useful when you run multiple nodes across machines.

### Operating system

```txt
os : linux
```

Useful for debugging and multi-platform tests.

### Version

```cpp
options.version = "0.1.0";
```

Useful when nodes may run different builds.

### Uptime

```cpp
std::cout << node.uptime_ms() << "\n";
```

Useful for detecting fresh starts, unexpected restarts, and long-running nodes.

### Capabilities

Possible capabilities include: `core`, `fs`, `wal`, `store`, `sync`, `transport`, `discovery`, `metadata`, `app`, and `cli`.

```txt
capabilities : core, store, sync, metadata
```

To iterate over capabilities:

```cpp
for (const auto capability : node.capabilities)
{
    std::cout
        << softadastra::metadata::types::to_string(capability)
        << "\n";
}
```

## Metadata without WAL, transport, or discovery

Metadata does not require any of these. This configuration is valid:

```cpp
options.enable_wal = false;
options.enable_transport = false;
options.enable_discovery = false;
```

The client can still expose node metadata.

## Metadata and sync

Sync operations need a node identity. The node id comes from the local client configuration and is used to identify where local operations came from.

## Metadata API reference

| Method | Purpose |
|---|---|
| `refresh_node_info()` | Refresh and return local node metadata |
| `node_info()` | Return cached node metadata, if exposed |

### NodeInfo reference

| Field | Purpose |
|---|---|
| `node_id` | Local node identifier |
| `display_name` | Human-friendly node label |
| `hostname` | Machine hostname |
| `os_name` | Operating system name |
| `version` | Node or app version |
| `capabilities` | Supported runtime capabilities |
| `uptime_ms()` | Runtime uptime in milliseconds |

### ClientOptions metadata reference

| Option | Purpose |
|---|---|
| `node_id` | Local node id, set through `ClientOptions::local()` |
| `display_name` | Human-friendly node label |
| `version` | Node or app version |

## Common errors

### Client not open

```cpp
// wrong
Client client{options};
auto node = client.refresh_node_info();

// correct
auto opened = client.open();
if (opened.is_err()) { return 1; }
auto node = client.refresh_node_info();
```

### Empty node id

```cpp
// wrong
ClientOptions options = ClientOptions::local("");

// correct
ClientOptions options = ClientOptions::local("node-a");
```

## Common mistakes

### Treating metadata as application data

Metadata describes the node. Store contains application data.

### Expecting metadata to discover or connect peers

Discovery finds peers. Transport connects peers. Metadata only provides identity and runtime information.

### Ignoring result values

Always check `is_err()` before reading `value()`.

## Run the SDK example

This guide corresponds to `examples/07_node_metadata.cpp`.

```sh
cd ~/softadastra/sdk
vix build
./build-ninja/examples/07_node_metadata
```

## Summary

Metadata describes the local Softadastra SDK node.

It gives you node id, display name, hostname, operating system, version, uptime, and capabilities.

The key idea is: metadata makes the local node visible and understandable. It is useful for diagnostics, CLI status, dashboards, and debugging.

## Next step

Continue with errors:

[Go to Errors](/sdk-cpp/errors)
