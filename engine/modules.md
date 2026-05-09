# Modules

Softadastra Engine is organized into focused C++ modules.

Each module owns one part of the runtime.

The core rule is:

```txt
One module.
One responsibility.
Clear boundaries.
```

The current engine modules are:

- `cli`
- `core`
- `discovery`
- `fs`
- `metadata`
- `store`
- `sync`
- `transport`
- `wal`

They live in:

```txt
modules/
```

## Why modules exist

Softadastra is a local-first runtime.

It needs several different systems:

- safe primitives
- filesystem observation
- durable operation logging
- local state
- sync tracking
- peer communication
- peer discovery
- node metadata
- CLI runtime

Putting everything in one large system would make the engine hard to reason about.

Modules keep the runtime:

- readable
- testable
- replaceable
- debuggable
- extensible

## Repository module layout

Current module layout:

```txt
modules/
├── cli/
├── core/
├── discovery/
├── fs/
├── metadata/
├── store/
├── sync/
├── transport/
└── wal/
```

Each module should contain its own public headers, implementation files, tests, examples, and build rules when needed.

A typical module shape is:

```txt
modules/<name>/
├── include/
│   └── softadastra/<name>/
├── src/
├── examples/
├── tests/
├── CMakeLists.txt
├── README.md
└── CHANGELOG.md
```

The exact structure can vary per module, but the responsibility must stay clear.

## Module overview

| Module | Role |
|---|---|
| `core` | Shared primitives and errors |
| `fs` | Filesystem observation |
| `wal` | Durable operation history |
| `store` | Current local state |
| `sync` | Operation propagation tracking |
| `transport` | Peer communication |
| `discovery` | Peer discovery |
| `metadata` | Node identity and capabilities |
| `cli` | Command-line runtime |

## Recommended reading order

Read the modules in this order:

1. `core`
2. `fs`
3. `wal`
4. `store`
5. `sync`
6. `transport`
7. `discovery`
8. `metadata`
9. `cli`

This order goes from the lowest-level foundation to the user-facing command-line layer.

## Recommended development order

When implementing or changing the engine, prefer this order:

1. `core`
2. `wal`
3. `store`
4. `sync`
5. `transport`
6. `discovery`
7. `metadata`
8. `cli`
9. `apps`

`fs` can be developed earlier when the work is related to file synchronization, watchers, snapshots, or filesystem events.

## Module dependency direction

The conceptual dependency direction is:

```txt
core
  ↓
fs
  ↓
wal
  ↓
store
  ↓
sync
  ↓
transport
  ↓
discovery
  ↓
metadata
  ↓
cli / apps
```

This does not mean every module must depend on the one before it.

It means lower-level modules must not depend on higher-level modules.

Important examples:

- `core` must not depend on `store`
- `wal` must not depend on `sync`
- `store` must not depend on `transport`
- `sync` must not depend on `discovery`
- `transport` must not depend on `cli`

## Layer view

Softadastra modules can be grouped by layer:

```txt
Foundation
  core

Observation
  fs

Durability
  wal

State
  store

Propagation
  sync

Communication
  transport

Peer awareness
  discovery

Identity
  metadata

Interface
  cli
```

This makes the engine easier to explain and maintain.

## core

`core` is the foundation module.

It provides shared primitives used across the engine.

Responsibilities:

- `Result`
- `Error`
- `ErrorCode`
- `Severity`
- `StrongType`
- `NonCopyable`
- `FileId`
- `DeviceId`
- `OperationId`
- `Timestamp`
- `Duration`
- `Clock`
- `Hash`
- `Hasher`
- `HashAlgorithm`
- `Config`
- `ConfigValue`
- `ConfigValidator`
- `Assert`
- `ScopeGuard`
- `StringUtils`

`core` should be:

- minimal
- stable
- deterministic
- dependency-free
- reusable everywhere

### What core does not do

`core` must not contain:

- filesystem logic
- WAL logic
- store logic
- sync logic
- network logic
- discovery logic
- metadata service logic
- CLI command logic
- application logic

The rule is:

```txt
core defines primitives, not behavior.
```

### core dependency rule

`core` should not depend on any other Softadastra module.

```txt
core -> no internal dependencies
```

Everything else can depend on `core`.

### core example

```cpp
#include <softadastra/core/Core.hpp>

using namespace softadastra::core;

using IntResult = types::Result<int, errors::Error>;

IntResult divide(int a, int b)
{
    if (b == 0)
    {
        return IntResult::err(
            errors::Error::make(
                errors::ErrorCode::InvalidArgument,
                "division by zero"));
    }

    return IntResult::ok(a / b);
}
```

## fs

`fs` is the filesystem observation module.

It turns filesystem state into deterministic snapshots and events.

Responsibilities:

- `Path`
- `Scanner`
- `Snapshot`
- `SnapshotBuilder`
- `SnapshotDiff`
- `Watcher`
- `FileEvent`
- `EventBatch`
- `FileState`
- `FileMetadata`
- `FileType`

The key idea is:

```txt
The filesystem is observed as state and changes.
```

### What fs does

`fs` can:

- normalize paths
- scan directories
- build snapshots
- compare snapshots
- produce file events
- watch directories
- track created files
- track updated files
- track deleted files

### What fs does not do

`fs` must not:

- sync files over the network
- decide conflict resolution
- write application data
- own WAL persistence
- own peer communication
- own CLI commands

It observes.

It does not decide.

### fs dependency rule

`fs` can depend on:

- `core`

`fs` should not depend on:

- `wal`
- `store`
- `sync`
- `transport`
- `discovery`
- `metadata`
- `cli`

### fs example

```cpp
#include <iostream>

#include <softadastra/fs/Fs.hpp>

using namespace softadastra::fs;

int main()
{
    auto root_result = path::Path::from("./data");

    if (root_result.is_err())
    {
        std::cerr << "Invalid path\n";
        return 1;
    }

    auto snapshot_result =
        scanner::Scanner::scan(root_result.value());

    if (snapshot_result.is_err())
    {
        std::cerr << snapshot_result.error().message() << "\n";
        return 1;
    }

    for (const auto &[_, file] : snapshot_result.value().all())
    {
        std::cout << file.path.str() << "\n";
    }

    return 0;
}
```

## wal

`wal` is the Write-Ahead Log module.

It records operations before they are relied on by higher-level systems.

Responsibilities:

- `WalConfig`
- `WalRecord`
- `WalWriter`
- `WalReader`
- `WalReplayer`
- `WalRecordType`
- `WalRecordStatus`
- record append
- record read
- record streaming
- record replay
- event append

The key idea is:

```txt
Durable history comes before synchronization.
```

### What wal does

`wal` can:

- append records
- assign sequences
- attach timestamps
- encode payloads
- flush records
- read records back
- stream records
- replay records into another component

### What wal does not do

`wal` must not:

- own current application state
- decide sync retries
- connect peers
- discover nodes
- format CLI output
- apply business rules

The WAL is history.

It is not the current store.

### wal dependency rule

`wal` can depend on:

- `core`
- `fs`, only for filesystem event records when needed

`wal` should not depend on:

- `store`
- `sync`
- `transport`
- `discovery`
- `metadata`
- `cli`
- `apps`

### wal example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/wal/Wal.hpp>

using namespace softadastra::wal;

int main()
{
    const std::string path = "example_wal.log";
    std::filesystem::remove(path);

    writer::WalWriter writer{
        core::WalConfig::durable(path)};

    auto result = writer.append(
        types::WalRecordType::Put,
        core::WalRecord::Payload{1, 2, 3});

    if (result.is_err())
    {
        std::cerr << result.error().message() << "\n";
        return 1;
    }

    std::cout << "Written record seq="
              << result.value()
              << "\n";

    return 0;
}
```

## store

`store` is the local key-value state module.

It exposes the current local state.

Responsibilities:

- `StoreEngine`
- `StoreConfig`
- `Key`
- `Value`
- `Entry`
- `Operation`
- `OperationEncoder`
- `OperationDecoder`
- `SnapshotBuilderStore`
- recovery from WAL
- `put`
- `get`
- `remove`
- `entries`
- `size`

The key idea is:

```txt
Store is current state.
WAL is operation history.
```

### What store does

`store` can:

- write values
- read values
- remove values
- track versions
- recover from WAL
- build snapshots from WAL
- encode operations
- decode operations
- expose current entries

### What store does not do

`store` must not:

- send data to peers
- discover peers
- own transport
- own CLI parsing
- decide network retry policy
- hide WAL failures

The store applies operations locally.

Sync and transport handle propagation.

### store dependency rule

`store` can depend on:

- `core`
- `wal`

`store` should not depend on:

- `transport`
- `discovery`
- `metadata`
- `cli`
- `apps`

### store example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>

using namespace softadastra;

int main()
{
    const std::string wal_path = "basic_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine engine{
        store::core::StoreConfig::durable(wal_path)};

    auto result = engine.put(
        store::types::Key{"user:1"},
        store::types::Value::from_string("Gaspard"));

    if (result.is_err())
    {
        std::cerr << result.error().message() << "\n";
        return 1;
    }

    auto entry = engine.get(store::types::Key{"user:1"});

    if (entry.has_value())
    {
        std::cout << entry->key.str()
                  << " => "
                  << entry->value.to_string()
                  << "\n";
    }

    std::filesystem::remove(wal_path);
    return 0;
}
```

## sync

`sync` is the operation propagation module.

It tracks local operations that need to move to other nodes.

Responsibilities:

- `SyncConfig`
- `SyncContext`
- `SyncEngine`
- `SyncOperation`
- `SyncScheduler`
- `AckTracker`
- `ConflictResolver`
- outbox
- queue
- retry
- ACK tracking
- remote apply
- conflict policy
- tick

The key idea is:

```txt
Sync decides what should be sent.
Transport sends it.
```

### What sync does

`sync` can:

- submit local operations
- create sync ids
- track operation versions
- queue operations
- produce batches
- retry expired work
- track ACKs
- receive remote operations
- resolve conflicts
- report sync state

### What sync does not do

`sync` must not:

- open TCP sockets
- discover peers
- own UDP announcements
- format CLI output
- own application UI
- hide failed operations

Sync prepares work.

Transport delivers work.

### sync dependency rule

`sync` can depend on:

- `core`
- `store`

`sync` should not depend directly on:

- `discovery`
- `metadata`
- `cli`
- `apps`

Transport can bridge sync work to network messages.

### sync example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>

using namespace softadastra;

int main()
{
    const std::string wal_path = "basic_sync_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto config =
        sync::core::SyncConfig::durable("node-a");

    sync::core::SyncContext context{store, config};

    sync::engine::SyncEngine engine{context};

    auto operation = store::core::Operation::put(
        store::types::Key{"user:1"},
        store::types::Value::from_string("Gaspard"));

    auto submitted = engine.submit_local_operation(operation);

    if (submitted.is_err())
    {
        std::cerr << submitted.error().message() << "\n";
        return 1;
    }

    auto batch = engine.next_batch();

    std::cout << "Batch size: "
              << batch.size()
              << "\n";

    std::filesystem::remove(wal_path);
    return 0;
}
```

## transport

`transport` is the peer communication module.

It moves messages between nodes.

Responsibilities:

- `TransportConfig`
- `TransportContext`
- `TransportMessage`
- `TcpTransportBackend`
- `TransportClient`
- `TransportServer`
- `TransportEngine`
- `PeerInfo`
- `PeerRegistry`
- `MessageDispatcher`
- `MessageEncoder`
- `MessageDecoder`
- sync bridge
- ping / pong
- hello messages

The key idea is:

```txt
Transport moves messages.
It does not decide application meaning.
```

### What transport does

`transport` can:

- start a local backend
- connect to peers
- send hello messages
- send ping messages
- send sync batches
- receive messages
- decode frames
- dispatch messages
- track peer connection state

### What transport does not do

`transport` must not:

- own application state
- decide conflict resolution
- discover peers by itself
- own metadata identity
- format CLI commands
- delete local data on connection failure

Transport failure means delivery is delayed.

It does not mean local state is invalid.

### transport dependency rule

`transport` can depend on:

- `core`
- `sync`

`transport` should not depend on:

- `cli`
- `apps`
- business logic

### transport example

```cpp
#include <iostream>

#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    auto config =
        transport::core::TransportConfig::local(7000);

    transport::backend::TcpTransportBackend backend{config};
    transport::server::TransportServer server{backend};

    if (!server.start())
    {
        std::cerr << "failed to start server\n";
        return 1;
    }

    std::cout << "server running on "
              << config.bind_host
              << ":"
              << config.bind_port
              << "\n";

    server.stop();

    return 0;
}
```

## discovery

`discovery` is the peer discovery module.

It helps nodes find other nodes.

Responsibilities:

- `DiscoveryConfig`
- `DiscoveryOptions`
- `DiscoveryContext`
- `DiscoveryAnnouncement`
- `DiscoveryMessage`
- `UdpDiscoveryBackend`
- `DiscoveryClient`
- `DiscoveryServer`
- `DiscoveryEngine`
- `DiscoveryService`
- `DiscoveryRegistry`
- announcement
- probe
- peer found callbacks
- peer stale tracking
- peer expiration

The key idea is:

```txt
Discovery finds peers.
Transport connects peers.
Sync sends operations.
```

### What discovery does

`discovery` can:

- announce a node
- probe for peers
- listen for discovery messages
- decode discovery datagrams
- track known peers
- mark peers stale
- mark peers expired
- prune expired peers
- expose available peers

### What discovery does not do

`discovery` must not:

- send sync operations
- apply store values
- decide conflicts
- own transport connections directly
- require local writes to work

No peers is a valid state.

It should not break the local store.

### discovery dependency rule

`discovery` can depend on:

- `core`
- `transport`

`discovery` should not own:

- store logic
- sync policy
- CLI parsing
- application state

### discovery example

```cpp
#include <iostream>

#include <softadastra/discovery/Discovery.hpp>

using namespace softadastra;

int main()
{
    auto options =
        discovery::DiscoveryOptions::local(
            "node-a",
            9400,
            7000);

    if (!options.is_valid())
    {
        std::cerr << "invalid discovery options\n";
        return 1;
    }

    auto config = options.to_config();

    std::cout << "node id: "
              << config.node_id
              << "\n";

    std::cout << "bind: "
              << config.bind_host
              << ":"
              << config.bind_port
              << "\n";

    return 0;
}
```

## metadata

`metadata` is the node identity module.

It describes the local node and known remote nodes.

Responsibilities:

- `NodeMetadata`
- `NodeCapabilities`
- `MetadataOptions`
- `MetadataService`
- `MetadataRegistry`
- `MetadataEncoder`
- `MetadataDecoder`
- `PlatformInfo`
- `Hostname`
- `VersionInfo`
- capabilities
- runtime info

The key idea is:

```txt
Metadata tells you who the node is.
```

### What metadata does

`metadata` can expose:

- node id
- display name
- hostname
- operating system
- version
- uptime
- capabilities
- known node metadata
- encoded metadata snapshots

### What metadata does not do

`metadata` must not:

- own application data
- sync values
- connect peers
- discover peers alone
- decide store conflicts
- format all CLI output

Metadata describes nodes.

Store contains application data.

### metadata dependency rule

`metadata` can integrate with discovery when needed.

It should not own:

- store state
- sync conflict rules
- application data

### metadata example

```cpp
#include <iostream>

#include <softadastra/metadata/Metadata.hpp>

using namespace softadastra;

int main()
{
    auto metadata_snapshot =
        metadata::core::NodeMetadata::foundation(
            "node-a",
            metadata::utils::Hostname::get(),
            metadata::utils::PlatformInfo::os_name(),
            metadata::utils::VersionInfo::current());

    metadata_snapshot.refresh_runtime();

    std::cout << "node id: "
              << metadata_snapshot.node_id()
              << "\n";

    std::cout << "hostname: "
              << metadata_snapshot.runtime.hostname
              << "\n";

    std::cout << "os: "
              << metadata_snapshot.runtime.os_name
              << "\n";

    return 0;
}
```

## cli

`cli` is the command-line runtime module.

It provides reusable CLI building blocks.

Responsibilities:

- `Tokenizer`
- `ArgParser`
- `CommandLine`
- `ParsedCommand`
- `CliCommand`
- `CommandRegistry`
- `ICommandHandler`
- `CliConfig`
- `CliContext`
- `CliEngine`
- `CliService`
- `TableFormatter`
- UI style helpers

The key idea is:

```txt
CLI turns terminal input into engine actions.
```

### What cli does

`cli` can:

- tokenize command input
- parse arguments
- parse options
- register commands
- execute command handlers
- format tables
- print styled output
- run interactive mode
- run single-command mode

### What cli does not do

`cli` must not:

- be required by core modules
- own store internals
- own sync internals
- force engine behavior
- hide engine errors

CLI is an interface.

Engine modules should work without it.

### cli dependency rule

`cli` can depend on engine modules.

Engine modules must not depend on `cli`.

```txt
modules/core -> must not depend on cli
modules/store -> must not depend on cli
modules/sync -> must not depend on cli
```

### cli example

```cpp
#include <iostream>
#include <memory>

#include <softadastra/cli/cli.hpp>

namespace cli_command = softadastra::cli::command;
namespace cli_core = softadastra::cli::core;
namespace cli_parser = softadastra::cli::parser;
namespace cli_types = softadastra::cli::types;

class StatusHandler final : public cli_command::ICommandHandler
{
public:
    [[nodiscard]] cli_types::CliErrorCode handle(
        const cli_parser::ParsedCommand &command) override
    {
        std::cout << "Softadastra status\n";
        std::cout << "  command: " << command.name << "\n";
        std::cout << "  state: healthy\n";

        return cli_types::CliErrorCode::None;
    }
};

int main()
{
    cli_core::CliConfig config;
    config.app_name = "softadastra";
    config.version = "0.1.0";
    config.interactive = false;
    config.show_banner = false;

    softadastra::cli::CliService service{config};

    service.register_command(
        cli_command::CliCommand{
            "status",
            "Show Softadastra runtime status",
            "status",
            cli_types::CliCommandType::Info,
            {"st"},
            {},
        },
        std::make_shared<StatusHandler>());

    return service.run(
        softadastra::cli::CliOptions::single_command("status"));
}
```

## Module integration flow

A complete peer-aware runtime can integrate modules like this:

```txt
core
  ↓
wal
  ↓
store
  ↓
sync
  ↓
transport
  ↓
discovery
  ↓
metadata
  ↓
cli / sdk / apps
```

A typical local write uses:

- `core`
- `wal`
- `store`
- `sync`

A typical peer sync uses:

- `core`
- `wal`
- `store`
- `sync`
- `transport`

A typical discovered peer sync uses:

- `core`
- `wal`
- `store`
- `sync`
- `transport`
- `discovery`
- `metadata`

## Module responsibilities by flow

### Local write

```txt
core   -> Result and Error
wal    -> append operation, if enabled
store  -> apply value locally
sync   -> track propagation work
```

### Local read

```txt
core   -> Result and Error
store  -> lookup key
```

### Recovery

```txt
wal    -> read records
store  -> replay operations
core   -> errors and time
```

### Sync tick

```txt
sync   -> retry, prune, batch
core   -> timing and errors
store  -> operation payloads
```

### Peer send

```txt
sync      -> produce batch
transport -> encode and send message
core      -> errors and identifiers
```

### Peer discovery

```txt
discovery -> announce, listen, registry
transport -> connection target later
metadata  -> node description
```

### CLI command

```txt
cli      -> parse and dispatch command
store    -> store command behavior
sync     -> sync command behavior
metadata -> node command behavior
```

## Module design rules

Each module should follow these rules:

1. Own one responsibility.
2. Expose explicit errors.
3. Keep public headers clear.
4. Avoid hidden global state.
5. Avoid circular dependencies.
6. Keep examples small.
7. Keep tests focused.
8. Do not require network for local behavior.
9. Do not hide lower-level failures.
10. Document what the module does not do.

## Module README rule

Each module README should include:

- purpose
- responsibilities
- what it does not do
- main components
- example usage
- dependencies
- integration
- design rules
- roadmap

This keeps documentation consistent across modules.

## Module examples rule

Each module should have examples that teach one concept at a time.

Good examples:

- `core_result.cpp`
- `fs_scan.cpp`
- `wal_write.cpp`
- `store_basic.cpp`
- `sync_basic.cpp`
- `transport_server.cpp`
- `discovery_minimal.cpp`
- `metadata_local_snapshot.cpp`
- `cli_custom_command.cpp`

Avoid examples that combine everything too early.

Large end-to-end demos can exist, but they should not replace small module examples.

## Module testing rule

Each module should have unit tests for its own behavior.

Examples:

```txt
core
  -> Result, Error, IDs, Timestamp

fs
  -> Path, SnapshotDiff, Scanner

wal
  -> append, read, replay, corrupted input

store
  -> put, get, remove, recovery

sync
  -> submit, queue, retry, ACK, conflict

transport
  -> message encoding, peer registry, dispatch

discovery
  -> encode/decode, registry, stale peers

metadata
  -> capabilities, encode/decode, registry

cli
  -> tokenizer, parser, command registry
```

Integration tests should verify module flows.

## Module failure rule

Each module should report its own failures.

Examples:

```txt
wal
  -> append failed
  -> read failed
  -> corrupted record

store
  -> key not found
  -> invalid key
  -> operation apply failed

sync
  -> retry exhausted
  -> conflict resolution failed
  -> invalid remote operation

transport
  -> connection refused
  -> port already in use
  -> decode failed

discovery
  -> no peers
  -> port already in use
  -> invalid datagram

metadata
  -> invalid node id
  -> platform info unavailable

cli
  -> unknown command
  -> invalid arguments
```

Do not convert every failure into a vague unknown error.

## Module ownership rule

Reusable runtime behavior belongs in `modules/`.

Runnable composition belongs in `apps/`.

Examples:

```txt
modules/store
  -> StoreEngine, Key, Value, Operation

apps/cli
  -> commands using StoreEngine

modules/sync
  -> SyncEngine, outbox, retry

apps/node
  -> node runtime composition
```

If logic can be reused by SDKs, CLI, tests, and apps, it probably belongs in a module.

If logic is only for one executable, it belongs in `apps/`.

## Public include rule

Each module should expose a clear top-level include.

Examples:

```cpp
#include <softadastra/core/Core.hpp>
#include <softadastra/fs/Fs.hpp>
#include <softadastra/wal/Wal.hpp>
#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>
#include <softadastra/discovery/Discovery.hpp>
#include <softadastra/metadata/Metadata.hpp>
#include <softadastra/cli/cli.hpp>
```

This makes examples easy to read.

Internal headers can still exist for advanced users and module implementation.

## Build integration

The top-level engine build should include modules through CMake.

Conceptually:

```txt
CMakeLists.txt
  ↓
modules/core
modules/fs
modules/wal
modules/store
modules/sync
modules/transport
modules/discovery
modules/metadata
modules/cli
apps
examples
```

Each module should be buildable and testable as independently as possible.

## Versioning modules

Module changes should be tracked carefully.

Breaking changes in one module can affect:

- engine examples
- apps/cli
- apps/node
- SDK C++
- SDK JS
- docs
- tests

Before changing a public module API, check dependent modules.

## Module stability levels

A useful stability model:

```txt
core
  -> highest stability required

wal / store
  -> high stability required

sync
  -> high stability, behavior-sensitive

transport / discovery
  -> evolving but explicit

metadata
  -> evolving but simple

cli
  -> user-facing, should remain clear

apps
  -> can evolve fastest
```

The lower the module, the more careful changes must be.

## Common mistakes

### Putting business logic in core

`core` should stay generic.

Do not put sync, store, transport, or app behavior in `core`.

### Making store send network messages

The store should not know about transport.

### Making transport decide conflicts

Conflict resolution belongs in sync.

### Making discovery required for local writes

Discovery should be optional.

### Hiding WAL failure

If WAL append fails, report it clearly.

### Creating circular dependencies

Avoid designs like:

```txt
sync depends on transport
transport depends on sync
```

If two modules need to communicate, use a clear bridge or context boundary.

### Making CLI required by modules

The CLI should call modules.

Modules should not call CLI.

## Recommended module documentation order

Each module page should follow this structure:

1. What it is
2. Why it exists
3. What it provides
4. What it does not do
5. Main types
6. Basic example
7. Integration with other modules
8. Failure behavior
9. Design rules
10. Summary

This keeps the engine docs consistent like a book.

## Summary

Softadastra Engine modules divide the runtime into clear responsibilities.

The key idea is:

```txt
core gives primitives
fs observes files
wal records history
store holds current state
sync tracks propagation
transport moves messages
discovery finds peers
metadata describes nodes
cli exposes commands
```

Good module boundaries make Softadastra easier to build, test, debug, and extend.

## Next step

Continue with core:

[Go to Core](./core)
