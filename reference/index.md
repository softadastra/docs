# Reference

The reference section gives compact technical information for Softadastra.

Use it when you already understand the basics and want to quickly check commands, API names, configuration variables, or error behavior.

The rule is simple:

```txt
Guides teach workflows.
Reference pages give exact names.
```

## Reference pages

Start here:

1. [CLI Reference](./cli)
2. [C++ API Reference](./cpp-api)
3. [Configuration Reference](./config)
4. [Errors Reference](./errors)

## CLI Reference

Use the CLI reference when you need the exact terminal command.

It covers the current Softadastra CLI surface:

```sh
softadastra status

softadastra node
softadastra node info
softadastra node start

softadastra store
softadastra store put <key> <value>
softadastra store get <key>

softadastra sync
softadastra sync status
softadastra sync tick

softadastra peers
```

It also covers interactive mode:

```txt
softadastra
softadastra> status
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> exit
```

Read: [CLI Reference](./cli)

## C++ API Reference

Use the C++ API reference when you need the public C++ SDK surface.

It covers public types such as:

- `Client`
- `ClientOptions`
- `Result`
- `Error`
- `Key`
- `Value`
- `Peer`
- `NodeInfo`
- `SyncState`
- `TickResult`

Common C++ SDK calls:

```cpp
client.open();
client.close();

client.put("key", "value");
client.get("key");

client.size();
client.empty();

client.sync_state();
client.tick();

client.start_transport();
client.stop_transport();
client.transport_running();
client.connect(peer);

client.start_discovery();
client.stop_discovery();
client.discovery_running();
client.peers();

client.node_info();
client.refresh_node_info();
```

Read: [C++ API Reference](./cpp-api)

## Configuration Reference

Use the configuration reference when you need installer and SDK path configuration.

It covers variables such as:

- `SOFTADASTRA_VERSION`
- `SOFTADASTRA_SDK_VERSION`
- `SOFTADASTRA_INSTALL_KIND`
- `SOFTADASTRA_HOME`
- `SOFTADASTRA_BIN_DIR`
- `SOFTADASTRA_SDK_DIR`
- `SOFTADASTRA_REPO`
- `SOFTADASTRA_SDK_REPO`

It also explains the default install locations for the CLI and C++ SDK.

Read: [Configuration Reference](./config)

## Errors Reference

Use the errors reference when you need to understand result handling and failure behavior.

The most important SDK rule is:

```txt
check the result before using the value
```

C++ example:

```cpp
const auto value =
    client.get("app/name");

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

The errors reference also explains common CLI errors, store errors, sync errors, transport errors, discovery errors, and metadata errors.

Read: [Errors Reference](./errors)

## Reference versus guides

Use guides when you want a complete workflow.

Use reference pages when you only need the exact command, type, method, or variable.

Example:

```txt
Quick Start          -> shows the first working flow
CLI Reference        -> lists the exact CLI commands
C++ API Reference    -> lists the public C++ SDK methods
Configuration        -> lists installer variables and paths
Errors               -> explains failure handling
```

## Reference versus SDK pages

SDK pages explain how to use each SDK area.

Reference pages summarize the public surface.

Example:

```txt
sdk-cpp/client.md        -> explains Client
reference/cpp-api.md     -> lists Client methods

sdk-cpp/client-options.md -> explains options
reference/config.md       -> lists installer and path configuration
```

Use SDK pages to learn.

Use reference pages to verify names quickly.

## Stability rule

Only stable behavior should appear in reference pages.

The reference should not present future commands, experimental options, or internal engine details as public behavior.

Good rule:

```txt
implemented and stable       -> reference page
experimental or future work   -> roadmap or repo notes
internal implementation       -> engine or repository docs
```

## Core model reminder

The reference section still follows the Softadastra model:

```txt
write locally
read locally
persist when needed
track sync work
move sync explicitly
connect with peers when available
```

Keep this separation clear:

```txt
store      -> current local data
WAL        -> durable local history
sync       -> propagation tracking
transport  -> peer communication
discovery  -> peer finding
metadata   -> node information
CLI        -> terminal interface
SDK        -> application API
```

## What to read next

Start with:

[CLI Reference](./cli)
