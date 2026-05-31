# Restart Recovery

Restart recovery is the ability to close an application, open it again, and recover the local data that was previously written.
The Softadastra C++ SDK supports restart recovery when the client uses a persistent WAL-backed store.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## Why restart recovery matters

A local-first application must not lose important local data when:

```txt
the process stops
the application restarts
the device reboots
the network is unavailable
the application comes back later
```

With `ClientOptions::persistent()`, the SDK stores local data through a WAL-backed store.

When another client opens the same WAL path, the SDK can recover the previously stored data.

## Required mode

Restart recovery requires persistent mode.

```cpp
auto options = softadastra::sdk::ClientOptions::persistent(
    "my-app",
    "data/my-app.wal"
);
```

Memory-only mode does not support restart recovery.

```cpp
auto options = softadastra::sdk::ClientOptions::memory_only("my-app");
```

Memory-only data exists only while the process is running.

## Recovery flow

The recovery flow is simple:

```txt
open persistent client
  ↓
write local data
  ↓
close client
  ↓
open another client with the same WAL path
  ↓
read the recovered data
```

The important part is the WAL path.

Both clients must use the same WAL file.

## Complete example

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

        const auto stored = writer.put(
            "session/status",
            "stored-before-restart"
        );

        if (stored.is_err())
        {
            std::cerr << "writer put failed: " << stored.error().code_string() << ": "
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

        const auto value = reader.get("session/status");

        if (value.is_err())
        {
            std::cerr << "reader get failed: " << value.error().code_string() << ": "
                      << value.error().message() << "\n";
            reader.close();
            return 1;
        }

        std::cout << "recovered session/status : " << value.value().to_string() << "\n";
        reader.close();
    }

    return 0;
}
```

## Create the data directory

Before running the example, create the WAL parent directory.

```bash
mkdir -p data/examples
```

## Expected output

```txt
writer stored session/status
recovered session/status : stored-before-restart
```

This shows that the second client recovered the value written by the first client.

## Important rule

Restart recovery depends on using the same WAL path.

```cpp
const std::string wal_path =
    "data/examples/restart-recovery.wal";
```

The writer uses it:

```cpp
Client writer{
    ClientOptions::persistent(
        "example-recovery-writer",
        wal_path
    )
};
```

The reader uses the same path:

```cpp
Client reader{
    ClientOptions::persistent(
        "example-recovery-reader",
        wal_path
    )
};
```

If the second client uses another WAL path, it opens another local store and will not see the previous data.

## Node id and WAL path

The node id identifies the local SDK node.

The WAL path identifies where persistent local data is stored.

For restart recovery, the WAL path is the critical part.

```cpp
ClientOptions::persistent(
    "node-id",
    "data/app.wal"
)
```

You can use different node ids in examples, but the same WAL path must be reused to recover the same local data.

For real applications, keep the node id stable too.

## Recovery and local-first behavior

Restart recovery is part of the local-first model.

The application can write data locally without depending on the network.

```cpp
client.put("session/status", "stored-before-restart");
```

Then, after restart, the application can open the same persistent store and read the value again.

```cpp
client.get("session/status");
```

## Recovery and sync

A persistent local write is also submitted to the synchronization pipeline.

That means the SDK can recover local data and keep synchronization state connected to local operations.

You can inspect the state after recovery:

```cpp
const auto state = reader.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: " << state.value().outbox_size() << "\n";
    std::cout << "queued: " << state.value().queued_count() << "\n";
}
```

## Common issues

### The parent directory does not exist

Create the directory before opening the client.

```bash
mkdir -p data/examples
```

### The reader uses a different WAL path

This will not recover the data from the writer.

```cpp
ClientOptions::persistent(
    "reader",
    "data/another-file.wal"
)
```

Use the same WAL path as the writer.

### The client uses memory-only mode

This does not persist data across restarts.

```cpp
ClientOptions::memory_only("node-1")
```

Use persistent mode instead.

```cpp
ClientOptions::persistent(
    "node-1",
    "data/app.wal"
)
```

### The client was not opened

Most SDK operations require `client.open()` first.

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

## Summary

Restart recovery requires:

```txt
persistent mode
a valid WAL path
the same WAL path after restart
client.open()
```

Use:

```cpp
ClientOptions::persistent(
    "my-app",
    "data/my-app.wal"
)
```

when local data must survive application restarts.

Next, continue with [Sync State](./sync-state).
