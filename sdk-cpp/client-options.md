# Client Options

`softadastra::sdk::ClientOptions` configures how a Softadastra C++ SDK client is initialized.

It controls the local node id, persistence mode, WAL path, sync behavior, optional transport, optional discovery, and node metadata.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## Basic usage

`ClientOptions` is passed to `Client` when creating a client.

```cpp
#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::persistent(
            "my-app",
            "data/my-app.wal"
        );

    Client client{options};
    const auto opened = client.open();

    if (opened.is_err())
    {
        return 1;
    }

    client.close();
    return 0;
}
```

## Node id

Every client needs a local logical node id.

```cpp
ClientOptions options{"node-1"};
```

The node id identifies the local SDK node inside the sync, metadata, transport, and discovery layers.

A valid node id must not be empty.

```cpp
ClientOptions options{""};

if (!options.is_valid())
{
    // Invalid: node id is empty.
}
```

## Recommended mode

For real applications, use persistent mode.

```cpp
auto options = softadastra::sdk::ClientOptions::persistent(
    "my-app",
    "data/my-app.wal"
);
```

Persistent mode enables WAL-backed local storage and automatic flushing after local writes.

This is the best default because it gives the application restart recovery.

## Local mode

Use local mode for quick tests and examples.

```cpp
auto options = softadastra::sdk::ClientOptions::local("node-1");
```

`local()` is an alias for `memory_only()`.

```cpp
auto options = softadastra::sdk::ClientOptions::memory_only("node-1");
```

Local mode:

```txt
does not use a WAL file
does not persist data across restart
keeps data in memory only
is useful for tests and simple examples
```

## Persistent mode

Use persistent mode when local data must survive restarts.

```cpp
auto options = softadastra::sdk::ClientOptions::persistent(
    "node-1",
    "data/sdk-store.wal"
);
```

Persistent mode:

```txt
enables the local store WAL
enables automatic flushing
uses sync_batch_size = 64
uses max_sync_retries = 5
requires acknowledgements
automatically queues local operations
```

`durable()` is an explicit alias for `persistent()`.

```cpp
auto options = softadastra::sdk::ClientOptions::durable(
    "node-1",
    "data/sdk-store.wal"
);
```

## Fast mode

Use fast mode for benchmarks or controlled environments.

```cpp
auto options = softadastra::sdk::ClientOptions::fast(
    "node-1",
    "data/sdk-store.wal"
);
```

Fast mode keeps WAL persistence enabled, but disables automatic flushing after every write.

Fast mode:

```txt
enables the local store WAL
disables automatic flushing
uses sync_batch_size = 128
uses max_sync_retries = 2
does not require acknowledgements
automatically queues local operations
```

Use this mode only when throughput matters more than maximum write durability.

## Configuration modes

| Mode            | WAL | Auto flush | Batch size | Retries | Require ack | Best for     |
| --------------- | --: | ---------: | ---------: | ------: | ----------: | ------------ |
| `local()`       |  no |         no |         64 |       2 |          no | tests        |
| `memory_only()` |  no |         no |         64 |       2 |          no | tests        |
| `persistent()`  | yes |        yes |         64 |       5 |         yes | applications |
| `durable()`     | yes |        yes |         64 |       5 |         yes | applications |
| `fast()`        | yes |         no |        128 |       2 |          no | benchmarks   |

## WAL path

The WAL path defines where persistent local data is stored.

```cpp
auto options = softadastra::sdk::ClientOptions::persistent(
    "node-1",
    "data/app.wal"
);
```

Create the parent directory before running the application:

```bash
mkdir -p data
```

If WAL persistence is enabled, the WAL path must not be empty.

```cpp
auto options = softadastra::sdk::ClientOptions::persistent(
    "node-1",
    ""
);

if (!options.is_valid())
{
    // Invalid: WAL path is empty while WAL is enabled.
}
```

## Manual setters

You can build options manually.

```cpp
using namespace softadastra::sdk;

ClientOptions options{"node-1"};

options.set_store_wal_path("data/app.wal");
options.set_store_wal_enabled(true);
options.set_auto_flush(true);
options.set_initial_store_capacity(1024);

options.set_sync_batch_size(64);
options.set_max_sync_retries(5);
options.set_require_ack(true);
options.set_auto_queue(true);
```

For most applications, prefer `persistent()` instead of configuring every field manually.

## Initial store capacity

The initial store capacity is a capacity hint for the local store.

```cpp
options.set_initial_store_capacity(2048);
```

The value must be greater than zero.

```cpp
options.set_initial_store_capacity(0);

if (!options.is_valid())
{
    // Invalid: initial store capacity cannot be zero.
}
```

## Sync batch size

The sync batch size controls the maximum number of operations produced in one sync batch.

```cpp
options.set_sync_batch_size(128);
```

The value must be greater than zero.

```cpp
options.set_sync_batch_size(0);

if (!options.is_valid())
{
    // Invalid: sync batch size cannot be zero.
}
```

## Sync retries

The maximum sync retry count controls how many times expired operations can be retried.

```cpp
options.set_max_sync_retries(5);
```

Use a higher retry count for applications that need stronger delivery attempts.

Use a lower retry count for tests or controlled environments.

## Acknowledgements

`require_ack()` controls whether outbound operations require acknowledgements.

```cpp
options.set_require_ack(true);
```

Persistent mode enables acknowledgements by default.

Fast mode disables acknowledgements by default.

## Auto queue

`auto_queue()` controls whether local operations are automatically queued for synchronization.

```cpp
options.set_auto_queue(true);
```

Most applications should keep this enabled.

## Enable transport

Transport is optional.

Use `with_local_transport()` for localhost development:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_transport(9100);
```

This enables transport with host:

```txt
127.0.0.1
```

and port:

```txt
9100
```

You can also provide an explicit host:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_transport("0.0.0.0", 9100);
```

After enabling transport, the client can start it:

```cpp
Client client{options};

client.open();
client.start_transport();
```

## Disable transport

```cpp
options.disable_transport();
```

Disabling transport resets the transport host to:

```txt
0.0.0.0
```

and the port to:

```txt
0
```

## Enable discovery

Discovery is optional.

Use `with_local_discovery()` for localhost development:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

You can also provide an explicit host:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_discovery("0.0.0.0", 5051);
```

After enabling discovery, the client can start it:

```cpp
Client client{options};

client.open();
client.start_discovery();
```

## Discovery and transport

Discovery needs the transport runtime internally.

If discovery is enabled, the SDK builds the transport layer internally so discovered peers can be represented as connectable nodes.

For normal use, you only need:

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_local_discovery(5051);
```

## Disable discovery

```cpp
options.disable_discovery();
```

Disabling discovery resets the discovery host to:

```txt
0.0.0.0
```

and the port to:

```txt
0
```

## Metadata

Metadata identifies the local node with a human-readable name and version.

```cpp
ClientOptions options = ClientOptions::memory_only("node-1").with_metadata("My Local Node", "0.1.0");
```

You can also set metadata manually:

```cpp
options.set_metadata("My Local Node", "0.1.0");
```

If the display name is empty, the SDK can use the node id as the display label.

## Validate options

Use `is_valid()` before opening a client if you build options manually.

```cpp
if (!options.is_valid())
{
    return 1;
}
```

`valid()` is also available as a backward-compatible alias.

```cpp
if (!options.valid())
{
    return 1;
}
```

## Validation rules

`ClientOptions` is valid only when:

```txt
node_id is not empty
WAL path is not empty when WAL is enabled
initial store capacity is greater than zero
sync batch size is greater than zero
transport host and port are valid when transport is enabled
discovery host and port are valid when discovery is enabled
version is not empty
```

## Complete persistent example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options = ClientOptions::persistent(
            "persistent-node",
            "data/persistent-node.wal"
        ).with_metadata(
            "Persistent Node",
            "0.1.0"
        );

    if (!options.is_valid())
    {
        std::cerr << "invalid client options\n";
        return 1;
    }

    Client client{options};
    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto saved = client.put("profile/name", "Ada");

    if (saved.is_err())
    {
        std::cerr << saved.error().code_string() << ": "
                  << saved.error().message() << "\n";
        client.close();
        return 1;
    }

    client.close();
    return 0;
}
```

## Complete transport example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options = ClientOptions::memory_only("transport-node")
                              .with_local_transport(9100)
                              .with_metadata("Transport Node", "0.1.0");
    Client client{options};
    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().message() << "\n";
        return 1;
    }

    const auto started = client.start_transport();

    if (started.is_err())
    {
        std::cerr << started.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "transport running: " << (client.transport_running() ? "yes" : "no") << "\n";

    client.stop_transport();
    client.close();

    return 0;
}
```

## Complete discovery example

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options = ClientOptions::memory_only("discovery-node")
                                .with_local_discovery(5051)
                                .with_metadata("Discovery Node", "0.1.0");
    Client client{options};
    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().message() << "\n";
        return 1;
    }

    const auto started = client.start_discovery();

    if (started.is_err())
    {
        std::cerr << started.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "discovery running: " << (client.discovery_running() ? "yes" : "no") << "\n";

    client.stop_discovery();
    client.close();

    return 0;
}
```

## Summary

Use:

```cpp
ClientOptions::persistent("node-1", "data/app.wal")
```

for real applications.

Use:

```cpp
ClientOptions::local("node-1")
```

for tests and examples.

Use:

```cpp
ClientOptions::fast("node-1", "data/app.wal")
```

for benchmarks or controlled environments.

Next, continue with [Results and Errors](./results-and-errors).
