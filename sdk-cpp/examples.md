# Examples

Here are complete examples you can copy into a C++ file and run.

Start with the first one. It shows the smallest useful Softadastra SDK program. Then move step by step toward persistence, recovery, sync, transport, discovery, and metadata.

## Build an example

All examples use the same SDK header:

```cpp
#include <softadastra/sdk.hpp>
```

For examples that use a WAL file, create the data directory first:

```bash
mkdir -p data/examples
```

Build with Vix:

```bash
vix build -- -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

Run the app:

```bash
./build-ninja/app
```

## 1. Local store

This is the smallest useful example.

It opens a memory-only client, writes `hello = world`, reads it back, and prints the value.

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("example-local-store")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto stored = client.put("hello", "world");

    if (stored.is_err())
    {
        std::cerr << "put failed: " << stored.error().code_string() << ": "
                  << stored.error().message()<< "\n";
        client.close();
        return 1;
    }

    const auto value = client.get("hello");

    if (value.is_err())
    {
        std::cerr << "get failed: " << value.error().code_string() << ": "
                  << value.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "key   : hello\n";
    std::cout << "value : " << value.value().to_string() << "\n";

    client.close();

    return 0;
}
```

Expected output:

```txt
key   : hello
value : world
```

## 2. Persistent store

Use this when the data must survive after the program closes.
This example stores two values in a WAL-backed local store.

```cpp
#include <softadastra/sdk.hpp>

#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "example-persistent-store",
            "data/examples/persistent-store.wal"
        )
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";

        return 1;
    }

    const auto stored_name = client.put("profile/name", "Ada");

    if (stored_name.is_err())
    {
        std::cerr << "put failed: " << stored_name.error().code_string() << ": "
                  << stored_name.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto stored_language = client.put("profile/language", "C++");

    if (stored_language.is_err())
    {
        std::cerr << "put failed: " << stored_language.error().code_string() << ": "
                  << stored_language.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto name = client.get("profile/name");

    if (name.is_err())
    {
        std::cerr << "get failed: " << name.error().code_string() << ": "
                  << name.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto language = client.get("profile/language");

    if (language.is_err())
    {
        std::cerr << "get failed: " << language.error().code_string() << ": "
                  << language.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "profile/name     : " << name.value().to_string() << "\n";
    std::cout << "profile/language : " << language.value().to_string() << "\n";
    std::cout << "entries          : " << client.size() << "\n";

    client.close();

    return 0;
}
```

Expected output:

```txt
profile/name     : Ada
profile/language : C++
entries          : 2
```

## 3. Restart recovery

This example proves that the SDK can recover local data after restart.
The first client writes a value and closes. The second client opens the same WAL path and reads the value back.

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>
#include <string>

int main()
{
    using namespace softadastra::sdk;

    const std::string wal_path =
        "data/examples/restart-recovery.wal";

    {
        Client writer{
            ClientOptions::persistent(
                "example-recovery-writer",
                wal_path
            )
        };

        const auto opened = writer.open();

        if (opened.is_err())
        {
            std::cerr << "writer open failed: " << opened.error().code_string() << ": "
                      << opened.error().message() << "\n";
            return 1;
        }

        const auto stored = writer.put("session/status", "stored-before-restart");

        if (stored.is_err())
        {
            std::cerr << "writer put failed: " << stored.error().code_string()<< ": "
                      << stored.error().message() << "\n";
            writer.close();
            return 1;
        }

        std::cout << "writer stored session/status\n";
        writer.close();
    }

    {
        Client reader{
            ClientOptions::persistent(
                "example-recovery-reader",
                wal_path
            )
        };

        const auto opened = reader.open();

        if (opened.is_err())
        {
            std::cerr << "reader open failed: " << opened.error().code_string() << ": "
                      << opened.error().message() << "\n";

            return 1;
        }

        const auto value =
            reader.get("session/status");

        if (value.is_err())
        {
            std::cerr << "reader get failed: " << value.error().code_string() << ": "
                      << value.error().message() << "\n";
            reader.close();
            return 1;
        }

        std::cout << "recovered session/status : " << value.value().to_string()<< "\n";
        reader.close();
    }

    return 0;
}
```

Expected output:

```txt
writer stored session/status
recovered session/status : stored-before-restart
```

## 4. Sync state

Use `sync_state()` when you want to see what the SDK is tracking internally after local writes.

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

namespace
{
    void print_sync_state(const softadastra::sdk::SyncState &state)
    {
        std::cout << "outbox_size: " << state.outbox_size() << "\n";
        std::cout << "queued_count: " << state.queued_count() << "\n";
        std::cout << "in_flight_count: " << state.in_flight_count() << "\n";
        std::cout << "acknowledged_count: " << state.acknowledged_count() << "\n";
        std::cout << "failed_count: " << state.failed_count() << "\n";
        std::cout << "last_submitted_version: " << state.last_submitted_version() << "\n";
        std::cout << "last_applied_remote_version : " << state.last_applied_remote_version() << "\n";
        std::cout << "total_retries: " << state.total_retries() << "\n";
    }
}

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("example-sync-state")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto initial_state = client.sync_state();

    if (initial_state.is_err())
    {
        std::cerr << "sync_state failed: " << initial_state.error().code_string() << ": "
                  << initial_state.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "Initial sync state\n";
    print_sync_state(initial_state.value());

    const auto stored = client.put("message", "hello sync");

    if (stored.is_err())
    {
        std::cerr << "put failed: " << stored.error().code_string() << ": "
                  << stored.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto updated_state = client.sync_state();

    if (updated_state.is_err())
    {
        std::cerr << "sync_state failed: " << updated_state.error().code_string() << ": "
                  << updated_state.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "\nAfter local write\n";
    print_sync_state(updated_state.value());

    client.close();
    return 0;
}
```

## 5. Manual tick

A tick advances the sync pipeline once.
This is useful when your app wants to decide when sync work should move forward.

```cpp
#include <softadastra/sdk.hpp>
#include <iostream>

namespace
{
    void print_tick_result(const softadastra::sdk::TickResult &result)
    {
        std::cout << "retried_count : " << result.retried_count() << "\n";
        std::cout << "pruned_count  : " << result.pruned_count() << "\n";
        std::cout << "batch_size    : " << result.batch_size() << "\n";
        std::cout << "has_work      : " << (result.has_work() ? "yes" : "no") << "\n";
    }
}

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("example-tick")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: " << opened.error().code_string() << ": "
                  << opened.error().message() << "\n";
        return 1;
    }

    const auto stored = client.put("message", "tick example");

    if (stored.is_err())
    {
        std::cerr << "put failed: " << stored.error().code_string() << ": "
                  << stored.error().message() << "\n";
        client.close();
        return 1;
    }

    const auto tick = client.tick();

    if (tick.is_err())
    {
        std::cerr << "tick failed: " << tick.error().code_string() << ": "
                  << tick.error().message() << "\n";
        client.close();
        return 1;
    }

    std::cout << "Tick result\n";
    print_tick_result(tick.value());

    const auto state =
        client.sync_state();

    if (state.is_ok())
    {
        std::cout << "\nSync has work : " << (state.value().has_work() ? "yes" : "no") << "\n";
    }

    client.close();
    return 0;
}
```

## 6. Transport

Transport starts the network layer.
This example starts transport on port `9100`, then tries to connect to a peer on port `9101`.
The connection can fail if no peer is listening. That is okay. The point here is to see how to start transport and handle the result.

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
        std::cout << "connected peer    : " << peer.node_id() << " " << peer.host() << ":" << peer.port() << "\n";
    }

    client.stop_transport();
    std::cout << "transport_running : " << (client.transport_running() ? "yes" : "no") << "\n";
    client.close();

    return 0;
}
```

## 7. Discovery

Discovery lets the client look for peers.
If this example prints `no peers discovered`, that is not an error. It only means no other node was found.

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
        std::cerr << "start_discovery failed: " << started.error().code_string()<< ": "
                  << started.error().message()<< "\n";
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

## 8. Metadata

Metadata gives you information about the local node: its node id, display name, hostname, OS name, version, uptime, and capabilities.

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

## What to read first

Read the examples like this:

```txt
local store
persistent store
restart recovery
sync state
manual tick
transport
discovery
metadata
```

Start with local storage. After that, persistence and restart recovery will make more sense. Transport and discovery are easier to understand once the local and sync parts are clear.

## Common issues

### Persistent examples fail to open

Create the WAL directory first:

```bash
mkdir -p data/examples
```

### Transport connection fails

Check that transport started first:

```cpp
client.transport_running();
```

If transport is running but `connect()` fails, there may simply be no peer listening on the target port.

### Discovery finds no peers

That is fine when no other node is running.

The useful check is:

```cpp
client.discovery_running();
```

### An operation says the client is not open

Call `open()` first and check the result:

```cpp
const auto opened = client.open();

if (opened.is_err())
{
    return 1;
}
```
