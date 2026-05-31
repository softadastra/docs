# Errors Reference

This page explains how Softadastra reports errors.

The main rule is simple:

```txt
check the result before using the value
```

Softadastra makes failures explicit. A command or SDK call should tell you what failed instead of hiding the problem.

## Why errors matter

Softadastra is local-first.

That means local work can succeed even when sync, peers, discovery, or transport are not available.

These situations are normal:

- key not found
- client not open
- missing argument
- invalid key
- sync has pending work
- no connected peers
- no discovery peers
- transport is disabled
- discovery is disabled
- metadata is unavailable

An error should tell you what happened and what to check next.

## C++ result pattern

Most C++ SDK operations return a `Result`.

Correct:

```cpp
const auto value =
    client.get("settings/theme");

if (value.is_err())
{
    std::cerr << value.error().code_string()
              << ": "
              << value.error().message()
              << "\n";

    return 1;
}

std::cout << value.value().to_string()
          << "\n";
```

Do not do this:

```cpp
std::cout << client.get("settings/theme").value().to_string()
          << "\n";
```

That assumes the operation succeeded.

## C++ Error

`Error` describes what failed.

Useful methods:

| Method          | Purpose                            |
| --------------- | ---------------------------------- |
| `code()`        | Return the error code              |
| `code_string()` | Return the error code as text      |
| `message()`     | Return the error message           |
| `context()`     | Return optional diagnostic context |
| `ok()`          | Check whether there is no error    |
| `has_error()`   | Check whether there is an error    |
| `has_context()` | Check whether context is available |
| `clear()`       | Clear the error                    |

Example:

```cpp
const auto value =
    client.get("missing/key");

if (value.is_err())
{
    std::cout << "code    : "
              << value.error().code_string()
              << "\n";

    std::cout << "message : "
              << value.error().message()
              << "\n";

    if (value.error().has_context())
    {
        std::cout << "context : "
                  << value.error().context()
                  << "\n";
    }
}
```

## Error code strings

The C++ SDK exposes these public error code strings:

```txt
none
unknown
invalid_argument
invalid_state
not_found
already_exists
io_error
store_error
sync_error
transport_error
discovery_error
metadata_error
internal_error
```

Use the code for program logic.

Use the message for humans.

Example:

```cpp
const auto value =
    client.get("settings/theme");

if (value.is_err() &&
    value.error().code_string() == "not_found")
{
    client.put("settings/theme", "light");
}
```

## Client lifecycle errors

Most SDK operations require an open client.

Wrong:

```cpp
Client client{
    ClientOptions::memory_only("node-a")
};

client.put("app/name", "Softadastra");
```

Correct:

```cpp
Client client{
    ClientOptions::memory_only("node-a")
};

const auto opened =
    client.open();

if (opened.is_err())
{
    std::cerr << opened.error().message()
              << "\n";

    return 1;
}

client.put("app/name", "Softadastra");

client.close();
```

If the client is not open, operations can fail with an invalid state error.

Common message:

```txt
SDK client is not open
```

## Open errors

`open()` can fail.

Common causes:

- invalid options
- invalid WAL path
- missing parent directory for a persistent store
- permission denied
- runtime initialization failure

Example:

```cpp
const auto opened =
    client.open();

if (opened.is_err())
{
    std::cerr << "open failed: "
              << opened.error().code_string()
              << ": "
              << opened.error().message()
              << "\n";

    return 1;
}
```

If `open()` fails, do not continue as if the client is ready.

## Close after errors

If the client is already open and a later operation fails, close the client before returning.

```cpp
const auto stored =
    client.put("app/name", "Softadastra");

if (stored.is_err())
{
    std::cerr << stored.error().message()
              << "\n";

    client.close();
    return 1;
}
```

## Store errors

Store errors happen when reading or writing local values.

## Key not found

A missing key is a normal store error.

```cpp
const auto value =
    client.get("missing/key");

if (value.is_err())
{
    std::cout << value.error().code_string()
              << "\n";

    std::cout << value.error().message()
              << "\n";
}
```

CLI:

```sh
softadastra store get missing/key
```

Output:

```txt
Key not found: missing/key
```

This does not mean the runtime crashed.

It only means the key does not exist in the local store.

## Empty key

An empty key is invalid.

CLI:

```sh
softadastra store put "" value
```

Output:

```txt
Key cannot be empty.
```

C++:

```cpp
const Key key{""};

if (!key.is_valid())
{
    std::cerr << "key is invalid\n";
}
```

## Missing store value

This happens when `store put` does not receive both a key and a value.

Command:

```sh
softadastra store put app/name
```

Output:

```txt
Missing key or value argument.
Usage: store-put <key> <value>
```

Fix:

```sh
softadastra store put app/name Softadastra
```

## Missing store key

This happens when `store get` does not receive a key.

Command:

```sh
softadastra store get
```

Output:

```txt
Missing key argument.
Usage: store-get <key>
```

Fix:

```sh
softadastra store get app/name
```

## Unknown store command

The current store command supports:

```txt
put
get
```

If you run another subcommand:

```sh
softadastra store remove app/name
```

Output:

```txt
Unknown store command: remove
Usage: store <put|get>
```

Use:

```sh
softadastra store put <key> <value>
softadastra store get <key>
```

## Sync errors

Sync errors happen when the SDK cannot inspect or advance sync state.

Read sync state:

```cpp
const auto state =
    client.sync_state();

if (state.is_err())
{
    std::cerr << "sync_state failed: "
              << state.error().code_string()
              << ": "
              << state.error().message()
              << "\n";
}
```

Run one tick:

```cpp
const auto tick =
    client.tick();

if (tick.is_err())
{
    std::cerr << "tick failed: "
              << tick.error().code_string()
              << ": "
              << tick.error().message()
              << "\n";
}
```

CLI:

```sh
softadastra sync status
softadastra sync tick
```

## No sync work

A sync tick can report:

```txt
No sync operations ready for delivery.
```

This is not a crash.

It means there was no sync batch ready at that moment.

## No connected peers

A sync tick can also report:

```txt
No connected transport peers available.
```

This is normal when no peer is connected.

Local data is still safe locally.

The difference is important:

```txt
local data exists
sync delivery waits for peers
```

## Unknown sync command

The current sync command supports:

```txt
status
tick
```

If you run another subcommand:

```sh
softadastra sync prune
```

Output:

```txt
Unknown sync command: prune
Usage: sync <status|tick>
```

Use:

```sh
softadastra sync status
softadastra sync tick
```

## Transport errors

Transport errors happen when peer communication is not available or fails.

Common cases:

- transport is disabled
- transport is not initialized
- transport is not running
- peer is unavailable
- connection fails

C++:

```cpp
const Peer peer =
    Peer::local("node-b", 9101);

const auto connected =
    client.connect(peer);

if (connected.is_err())
{
    std::cout << "connect failed: "
              << connected.error().code_string()
              << ": "
              << connected.error().message()
              << "\n";
}
```

A transport failure should not delete local data.

This should still work:

```cpp
client.put("draft/1", "hello");
client.get("draft/1");
```

## Transport disabled

If transport is not enabled in `ClientOptions`, transport methods can fail.

Use:

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_local_transport(9100);
```

Then:

```cpp
Client client{options};

const auto opened =
    client.open();

if (opened.is_err())
{
    return 1;
}

const auto started =
    client.start_transport();
```

## Discovery errors

Discovery errors happen when peer discovery is disabled, unavailable, or not running.

If discovery is not enabled, discovery methods can fail.

Use:

```cpp
ClientOptions options =
    ClientOptions::memory_only("node-a")
        .with_local_discovery(5051);
```

Then:

```cpp
Client client{options};

const auto opened =
    client.open();

if (opened.is_err())
{
    return 1;
}

const auto started =
    client.start_discovery();
```

## No peers found

No peers found is normally not an error.

CLI:

```sh
softadastra peers
```

Output:

```txt
Discovery peers
No discovery peers found.

Transport peers
No transport peers found.
```

Local store commands can still work:

```sh
softadastra store put draft/1 hello
softadastra store get draft/1
```

## Metadata errors

Metadata errors happen when local node information cannot be read or refreshed.

C++:

```cpp
const auto info =
    client.refresh_node_info();

if (info.is_err())
{
    std::cerr << "refresh_node_info failed: "
              << info.error().code_string()
              << ": "
              << info.error().message()
              << "\n";
}
```

CLI:

```sh
softadastra node info
```

If metadata is unavailable, the CLI can still show basic node information:

```txt
Softadastra node

Field          Value
node_id        node-1
node_running   no
metadata       unavailable
```

In interactive mode, start node services first:

```txt
softadastra> node start
softadastra> node info
```

## Unknown node command

The current node command supports:

```txt
info
start
```

If you run another subcommand:

```sh
softadastra node something
```

Output:

```txt
Unknown node command: something
Usage: node <info|start>
```

Use:

```sh
softadastra node info
softadastra node start
```

## Persistent store errors

Persistent clients use a WAL path.

```cpp
Client client{
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal"
    )
};
```

The parent directory must exist:

```sh
mkdir -p data
```

If the directory does not exist or is not writable, `open()` can fail.

## Local-first failure rule

Softadastra separates local work from network work.

These are different:

```txt
local write accepted
remote sync delivered
```

A local write can succeed even when:

- no peer exists
- transport is stopped
- discovery finds nothing
- sync delivery cannot happen yet

This should work without peers:

```sh
softadastra store put draft/1 hello
softadastra store get draft/1
```

## What failures mean

Use this simple model:

| Area                   | Meaning                      |
| ---------------------- | ---------------------------- |
| Store error            | Local read or write problem  |
| Persistent store error | Local durability problem     |
| Sync error             | Propagation tracking problem |
| Transport error        | Peer communication problem   |
| Discovery error        | Peer finding problem         |
| Metadata error         | Node information problem     |
| CLI usage error        | Command shape problem        |

A sync, transport, or discovery error does not automatically mean local data is gone.

## Common CLI errors

| Error                            | Meaning                                |
| -------------------------------- | -------------------------------------- |
| `Missing key or value argument.` | `store put` needs both key and value   |
| `Missing key argument.`          | `store get` needs a key                |
| `Key cannot be empty.`           | The key is empty                       |
| `Key not found: <key>`           | The key does not exist locally         |
| `Unknown store command: <name>`  | Store supports only `put` and `get`    |
| `Unknown sync command: <name>`   | Sync supports only `status` and `tick` |
| `Unknown node command: <name>`   | Node supports only `info` and `start`  |

## Error handling checklist

When an operation fails, ask:

- Did I call `open()` first?
- Did I check `is_err()` before using `value()`?
- Is the key valid?
- Does the key exist?
- Does the WAL directory exist?
- Is transport enabled before calling transport methods?
- Is discovery enabled before calling discovery methods?
- Are peers actually available?
- Is the error about local data or only about sync delivery?

## Summary

Softadastra errors are explicit.

The most important rule is:

```txt
check the result before using the value
```

The most important distinction is:

```txt
local storage failure
is different from
network or sync delivery failure
```

Local data can still be readable even when peers, discovery, transport, or sync delivery are not ready.

## Related pages

- [CLI Reference](/cli/reference)
- [C++ API Reference](/reference/cpp-api)
- [Configuration Reference](/reference/config)
- [Results and Errors](/sdk-cpp/results-and-errors)
