# Metadata

Metadata lets a Softadastra C++ SDK client expose information about the local node.
It gives applications a stable way to read the node id, display name, hostname, operating system name, runtime version, uptime, and capabilities.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## What metadata provides

The metadata API gives access to local node information through:

```cpp
client.node_info();
client.refresh_node_info();
```

Both methods return:

```cpp
Result<NodeInfo, Error>
```

`NodeInfo` is the public SDK representation of a Softadastra node.

It contains:

```txt
node_id
display_name
label
hostname
os_name
version
started_at_ms
uptime_ms
capabilities
```

## Metadata is available after open

The metadata service is initialized when the client opens successfully.

```cpp
Client client{
    ClientOptions::memory_only("node-1")
};

const auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

const auto info = client.node_info();
```

## Set metadata

Use `with_metadata()` to give the local node a display name and version.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_metadata("Local Node", "0.1.0");
```

Then create the client:

```cpp
Client client{options};
```

You can also set metadata manually:

```cpp
ClientOptions options{"node-1"};
options.set_metadata("Local Node", "0.1.0");
```

## Display name

The display name is a human-readable name for the node.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_metadata("Example Metadata Node", "0.1.0");
```

Later, read it with:

```cpp
const auto info = client.node_info();

if (info.is_ok())
{
    std::cout << info.value().display_name() << "\n";
}
```

## Label

`label()` returns the best display label for the node.

The display name is preferred. If the display name is empty, the node id is used.

```cpp
const auto info = client.node_info();

if (info.is_ok())
{
    std::cout << info.value().label() << "\n";
}
```

Use `label()` when displaying a node name in logs, tools, dashboards, or UI.

## Read node info

Use `node_info()` to read the current local node metadata.

```cpp
const auto info = client.node_info();

if (info.is_err())
{
    std::cerr << info.error().code_string() << ": " << info.error().message() << "\n";
    return 1;
}

std::cout << "node id: " << info.value().node_id() << "\n";
std::cout << "label: " << info.value().label() << "\n";
```

## Refresh node info

Use `refresh_node_info()` when you want the SDK to refresh local metadata before returning it.

```cpp
const auto info = client.refresh_node_info();

if (info.is_err())
{
    std::cerr << info.error().code_string() << ": " << info.error().message() << "\n";
    return 1;
}

std::cout << info.value().label() << "\n";
```

## NodeInfo fields

`NodeInfo` exposes stable public fields through methods.

```cpp
info.node_id();
info.display_name();
info.label();
info.hostname();
info.os_name();
info.version();
info.started_at_ms();
info.uptime_ms();
info.capabilities();
```

## Node id

`node_id()` returns the logical SDK node id.

```cpp
std::cout << info.node_id() << "\n";
```

The node id comes from `ClientOptions`.

```cpp
ClientOptions::memory_only("node-1");
```

## Hostname

`hostname()` returns the local hostname known by the metadata service.

```cpp
std::cout << info.hostname() << "\n";
```

## Operating system name

`os_name()` returns the local operating system name known by the metadata service.

```cpp
std::cout << info.os_name() << "\n";
```

## Version

`version()` returns the runtime or product version configured for the node.

```cpp
std::cout << info.version() << "\n";
```

Set it with:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_metadata("Local Node", "0.1.0");
```

## Started time

`started_at_ms()` returns the timestamp at which the node started.

The value is expressed in milliseconds since the Unix epoch.

```cpp
std::cout << info.started_at_ms() << " ms\n";
```

## Uptime

`uptime_ms()` returns the node uptime in milliseconds.

```cpp
std::cout << info.uptime_ms() << " ms\n";
```

## Capabilities

`capabilities()` returns the list of public capability names exposed by the metadata service.

```cpp
for (const auto &capability : info.capabilities())
{
    std::cout << capability << "\n";
}
```

You can check for a capability with:

```cpp
if (info.has_capability("capability:1"))
{
    std::cout << "capability found\n";
}
```

## Print helper

For examples, a helper function keeps output readable.

```cpp
#include <softadastra/sdk.hpp>

#include <iostream>

namespace
{
    void print_node_info(const softadastra::sdk::NodeInfo &info)
    {
        std::cout << "node_id: " << info.node_id() << "\n";
        std::cout << "display_name: " << info.display_name() << "\n";
        std::cout << "label: " << info.label() << "\n";
        std::cout << "hostname: " << info.hostname() << "\n";
        std::cout << "os_name: " << info.os_name() << "\n";
        std::cout << "version: " << info.version() << "\n";
        std::cout << "started_at: " << info.started_at_ms() << " ms\n";
        std::cout << "uptime: " << info.uptime_ms() << " ms\n";
        std::cout << "capabilities: " << info.capabilities().size() << "\n";

        for (const auto &capability : info.capabilities())
        {
            std::cout << "  - " << capability << "\n";
        }
    }
}
```

## Complete example

```cpp
#include <softadastra/sdk.hpp>

#include <iostream>

namespace
{
    void print_node_info(const softadastra::sdk::NodeInfo &info)
    {
        std::cout << "node_id : " << info.node_id() << "\n";
        std::cout << "display_name: " << info.display_name() << "\n";
        std::cout << "label: " << info.label() << "\n";
        std::cout << "hostname: " << info.hostname() << "\n";
        std::cout << "os_name: " << info.os_name() << "\n";
        std::cout << "version: " << info.version() << "\n";
        std::cout << "started_at: " << info.started_at_ms() << " ms\n";
        std::cout << "uptime: " << info.uptime_ms() << " ms\n";
        std::cout << "capabilities: " << info.capabilities().size() << "\n";

        for (const auto &capability : info.capabilities())
        {
            std::cout << "  - " << capability << "\n";
        }
    }
}

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options = ClientOptions::memory_only("example-metadata").with_metadata("Example Metadata Node", "0.1.0");
    Client client{options};
    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto info = client.refresh_node_info();

    if (info.is_err())
    {
        std::cerr << "refresh_node_info failed: " << info.error().code_string() << ": "
                  << info.error().message() << "\n";
        client.close();
        return 1;
    }

    print_node_info(info.value());
    client.close();

    return 0;
}
```

## Expected output

The exact hostname, operating system name, timestamps, uptime, and capabilities depend on the machine and runtime.

Example output:

```txt
node_id      : example-metadata
display_name : Example Metadata Node
label        : Example Metadata Node
hostname     : my-machine
os_name      : linux
version      : 0.1.0
started_at   : 0 ms
uptime       : 1 ms
capabilities : 0
```

## Metadata with persistent storage

Metadata can be used with persistent clients.

```cpp
ClientOptions options = ClientOptions::persistent(
                          "node-1",
                          "data/node-1.wal"
                      ).with_metadata(
                          "Persistent Node",
                          "0.1.0"
                      );
```

This gives the application:

```txt
WAL-backed local storage
restart recovery
sync pipeline
local node metadata
```

## Metadata with transport

Metadata can be used with transport.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1")
                            .with_local_transport(9100)
                            .with_metadata("Transport Node", "0.1.0");
```

This is useful when a node should expose a readable name while using network transport.

## Metadata with discovery

Metadata can be used with discovery.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1")
        .with_local_discovery(5051)
        .with_metadata("Discovery Node", "0.1.0");
```

When discovery is enabled, metadata can be connected internally to the discovery engine.

## Validate NodeInfo

`NodeInfo` can be checked with `is_valid()`.

```cpp
if (info.value().is_valid())
{
    std::cout << "node info is valid\n";
}
```

`valid()` is also available as a backward-compatible alias.

```cpp
if (info.value().valid())
{
    std::cout << "node info is valid\n";
}
```

A valid `NodeInfo` must contain:

```txt
node id
hostname
operating system name
version
```

## Common errors

### Client is not open

Metadata methods require an open client.

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

### Metadata service is not initialized

This means the internal metadata service was not built correctly.

```txt
metadata_error: metadata service is not initialized
```

Check that `client.open()` succeeded.

### Local node metadata is not available

This can happen if the metadata service cannot provide local node metadata.

```txt
metadata_error: local node metadata is not available
```

Try refreshing the metadata:

```cpp
const auto info = client.refresh_node_info();
```

## When to use metadata

Use metadata when your application needs to:

```txt
identify the local node
display a readable node name
show runtime version
inspect hostname and OS information
show uptime
list node capabilities
build diagnostics or status screens
```

## Summary

Metadata gives applications a stable public view of the local Softadastra node.

Use:

```cpp
client.node_info();
```

to read current metadata.

Use:

```cpp
client.refresh_node_info();
```

to refresh and read metadata.

Configure readable metadata with:

```cpp
ClientOptions::memory_only("node-1")
    .with_metadata("Local Node", "0.1.0");
```

Next, continue with [Examples](./examples).
