# Local Store

The Softadastra C++ SDK provides a local key/value store through `softadastra::sdk::Client`.

The local store is the first layer of the SDK. It lets an application write data locally, read it back, check if a key exists, remove values, and inspect the number of stored entries.

A local write does not require the network.

## Include

```cpp
#include <softadastra/sdk.hpp>
```

## Basic local store example

Use `ClientOptions::memory_only()` or `ClientOptions::local()` for a memory-only local store.

```cpp
#include <softadastra/sdk.hpp>

#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("local-store-example")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: "
                  << opened.error().code_string()
                  << ": "
                  << opened.error().message()
                  << "\n";

        return 1;
    }

    const auto stored = client.put("hello", "world");

    if (stored.is_err())
    {
        std::cerr << "put failed: "
                  << stored.error().code_string()
                  << ": "
                  << stored.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    const auto value = client.get("hello");

    if (value.is_err())
    {
        std::cerr << "get failed: "
                  << value.error().code_string()
                  << ": "
                  << value.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    std::cout << "value: "
              << value.value().to_string()
              << "\n";

    client.close();

    return 0;
}
```

Expected output:

```txt
value: world
```

## Local mode

`ClientOptions::local()` is a developer-friendly alias for `ClientOptions::memory_only()`.

```cpp
auto options = softadastra::sdk::ClientOptions::local("node-1");
```

This mode keeps data in memory only.

```txt
No WAL file
No restart recovery
Useful for tests, examples, and temporary data
```

For durable local data, use [Persistent Store](./persistent-store).

## Keys

Keys identify values in the local store.

```cpp
softadastra::sdk::Key key{"profile/name"};
```

A key must not be empty.

```cpp
const auto saved = client.put("", "value");

if (saved.is_err())
{
    std::cerr << saved.error().code_string()
              << ": "
              << saved.error().message()
              << "\n";
}
```

Possible output:

```txt
invalid_argument: key cannot be empty
```

You can use string keys directly:

```cpp
client.put("profile/name", "Ada");
client.get("profile/name");
client.remove("profile/name");
```

Or explicit `Key` objects:

```cpp
using namespace softadastra::sdk;

Key key = Key::from("profile/name");

client.put(key, Value::from_string("Ada"));
```

## Values

Values are binary-safe payloads.

```cpp
softadastra::sdk::Value value{"hello"};
```

The SDK stores values as bytes. It does not interpret the content.

A value can represent:

```txt
text
JSON
metadata
binary data
application-specific payloads
```

Create a value from a string:

```cpp
auto value = softadastra::sdk::Value::from_string("hello");
```

Read it back as a string:

```cpp
std::cout << value.to_string() << "\n";
```

`to_string()` does not validate UTF-8. It simply converts the stored bytes to a `std::string`.

## Store text data

```cpp
const auto saved = client.put("profile/name", "Ada");

if (saved.is_err())
{
    return 1;
}
```

Read the value:

```cpp
const auto name = client.get("profile/name");

if (name.is_ok())
{
    std::cout << name.value().to_string() << "\n";
}
```

## Store JSON data

The SDK does not parse JSON automatically. It stores JSON as bytes.

```cpp
const auto saved = client.put(
    "user/1",
    R"({"name":"Ada","language":"C++"})"
);

if (saved.is_err())
{
    return 1;
}
```

Read it back:

```cpp
const auto user = client.get("user/1");

if (user.is_ok())
{
    std::cout << user.value().to_string() << "\n";
}
```

## Store binary data

Use `Value::from_bytes()` when storing binary data.

```cpp
#include <softadastra/sdk.hpp>

#include <cstdint>
#include <vector>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::memory_only("binary-example")
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        return 1;
    }

    std::vector<std::uint8_t> bytes{
        0x48,
        0x65,
        0x6c,
        0x6c,
        0x6f
    };

    const auto saved = client.put(
        Key::from("binary/hello"),
        Value::from_bytes(bytes)
    );

    if (saved.is_err())
    {
        client.close();
        return 1;
    }

    client.close();

    return 0;
}
```

## Read a value

`get()` reads from the local store.

```cpp
const auto value = client.get("hello");

if (value.is_err())
{
    std::cerr << value.error().code_string()
              << ": "
              << value.error().message()
              << "\n";

    return 1;
}

std::cout << value.value().to_string() << "\n";
```

If the key does not exist, the SDK returns:

```txt
not_found: key not found
```

## Check if a key exists

Use `contains()`.

```cpp
if (client.contains("hello"))
{
    std::cout << "key exists\n";
}
```

`contains()` returns `false` when:

```txt
the client is closed
the key is empty
the key does not exist
```

## Remove a value

Use `remove()`.

```cpp
const auto removed = client.remove("hello");

if (removed.is_err())
{
    std::cerr << removed.error().code_string()
              << ": "
              << removed.error().message()
              << "\n";

    return 1;
}
```

After removing the value:

```cpp
if (!client.contains("hello"))
{
    std::cout << "removed\n";
}
```

Like `put()`, `remove()` is submitted through the synchronization pipeline.

## Store size

Use `size()` to get the number of entries in the local store.

```cpp
std::cout << "entries: "
          << client.size()
          << "\n";
```

Use `empty()` to check if the store is empty.

```cpp
if (client.empty())
{
    std::cout << "store is empty\n";
}
```

When the client is closed, `size()` returns `0`.

## Local writes and sync

A local write is accepted locally first.

```cpp
client.put("message", "hello");
```

Internally, the SDK creates a local operation and submits it to the synchronization pipeline.

That means local storage and synchronization are connected:

```txt
client.put()
  ↓
local operation
  ↓
local store
  ↓
sync pipeline
  ↓
outbox / queued operation
```

The application can inspect this with `sync_state()`.

```cpp
const auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: "
              << state.value().outbox_size()
              << "\n";

    std::cout << "queued: "
              << state.value().queued_count()
              << "\n";
}
```

## Complete example

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
        std::cerr << "open failed: "
                  << opened.error().code_string()
                  << ": "
                  << opened.error().message()
                  << "\n";

        return 1;
    }

    const auto stored = client.put("hello", "world");

    if (stored.is_err())
    {
        std::cerr << "put failed: "
                  << stored.error().code_string()
                  << ": "
                  << stored.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    const auto value = client.get("hello");

    if (value.is_err())
    {
        std::cerr << "get failed: "
                  << value.error().code_string()
                  << ": "
                  << value.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    std::cout << "key   : hello\n";

    std::cout << "value : "
              << value.value().to_string()
              << "\n";

    std::cout << "entries: "
              << client.size()
              << "\n";

    client.close();

    return 0;
}
```

## Summary

Use the local store API to:

```txt
write values with put()
read values with get()
remove values with remove()
check keys with contains()
inspect entry count with size()
check emptiness with empty()
```

Use `ClientOptions::memory_only()` or `ClientOptions::local()` for temporary in-memory storage.

Use `ClientOptions::persistent()` when local data must survive restarts.

Next, continue with [Persistent Store](./persistent-store).
