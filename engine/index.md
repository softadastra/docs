# Engine

The Softadastra Engine is the low-level runtime foundation of Softadastra.

It is the part that implements the core local-first and offline-first behavior:

```txt
durable local writes
WAL-backed operation history
local store
sync engine
transport
discovery
metadata
CLI runtime
```

The engine is not the easiest entry point for application developers.

For most applications, start with: SDK C++, SDK JS, CLI.

Use the engine documentation when you want to understand how Softadastra works internally.

## What the engine is

The engine is the foundation behind Softadastra.

It is organized as a set of C++ modules:

```txt
core
fs
wal
store
sync
transport
discovery
metadata
cli
```

Each module has a clear responsibility.

The goal is to keep the runtime understandable, testable, and reliable under failure.

## Repository layout

The engine repository is:

```txt
~/softadastra/softadastra
```

Current structure:

```txt
softadastra/
├── apps/
│   ├── cli/
│   ├── node/
│   └── CMakeLists.txt
├── modules/
│   ├── cli/
│   ├── core/
│   ├── discovery/
│   ├── fs/
│   ├── metadata/
│   ├── store/
│   ├── sync/
│   ├── transport/
│   └── wal/
├── examples/
├── data/
├── cmake/
├── build-ninja/
├── CMakeLists.txt
├── CMakePresets.json
├── CHANGELOG.md
├── README.md
├── cmd.md
├── vix.json
└── LICENSE
```

The important folders are:

```txt
modules/  -> reusable engine modules
apps/     -> runnable applications built on top of the modules
examples/ -> small examples for learning and testing
```

## Engine versus SDK

The engine is lower-level. The SDK is higher-level.

```txt
Engine
  -> internal runtime modules
  -> C++ implementation details
  -> WAL, store, sync, transport, discovery, metadata

SDK C++
  -> public C++ developer API
  -> Client, ClientOptions, Result, Value, Peer

SDK JS
  -> public JavaScript developer API
  -> Client, ClientOptions, Result, Value, Peer
```

Application developers should usually start with the SDK. Engine contributors should read this section.

## Engine versus CLI

The CLI is an application built on top of the engine.

```txt
Engine modules
  ↓
apps/cli
  ↓
softadastra CLI
```

The CLI exposes useful commands such as:

```txt
status
node
store
sync
peers
```

The engine provides the lower-level behavior behind those commands.

## Engine philosophy

The engine follows a few core principles:

- local-first
- offline-first
- durable before network
- explicit errors
- deterministic behavior
- modular runtime
- observable state

The most important idea is:

> The network is an optimization. Local correctness comes first.

A Softadastra node should be able to accept local work even when transport, discovery, or peers are unavailable.

## Runtime flow

The engine runtime can be understood like this:

```txt
local operation
  ↓
core types and errors
  ↓
WAL append
  ↓
store apply
  ↓
sync tracking
  ↓
transport send, if available
  ↓
discovery/metadata help identify peers
```

More visually:

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
discovery + metadata
```

Not every application uses every module.

A local-only app may use only: core, store.

A durable local-first app may use: core, wal, store, sync.

A peer-aware app may use: core, wal, store, sync, transport, discovery, metadata.

## Module overview

### core

core is the foundation module.

It provides:

```txt
Result
Error
ErrorCode
StrongType
IDs
Timestamp
Duration
Clock
Hash
Config
ScopeGuard
StringUtils
Assert
```

Rules: no dependency on other modules, no business logic, deterministic primitives only, stable public foundation.

Everything else can depend on core.

### fs

fs observes the filesystem.

It provides:

```txt
Path
Scanner
Snapshot
SnapshotDiff
Watcher
FileEvent
EventBatch
FileState
FileMetadata
```

It is useful for: file sync, backup systems, local indexing, filesystem-driven apps.

It observes changes. It does not sync files by itself.

### wal

wal is the Write-Ahead Log module.

It provides:

```txt
WalRecord
WalWriter
WalReader
WalReplayer
WalConfig
record encoding
event append
stream reading
replay
```

The WAL makes accepted operations recoverable.

The core rule is:

```txt
Persist before relying on sync.
```

### store

store is the local key-value state engine.

It provides:

```txt
StoreEngine
StoreConfig
Key
Value
Entry
Operation
operation encoding
snapshot from WAL
recovery
```

The store represents current local state. The WAL represents operation history.

```txt
WAL   -> history
Store -> current state
```

### sync

sync tracks local operations for propagation.

It provides:

```txt
SyncEngine
SyncContext
SyncConfig
SyncOperation
outbox
queue
ack tracking
retry
conflict resolution
scheduler tick
```

Sync does not mean network delivery.

```txt
Sync      -> decides what should be sent
Transport -> sends it
```

### transport

transport moves messages between peers.

It provides:

```txt
TransportConfig
TransportContext
TransportMessage
TcpTransportBackend
TransportClient
TransportServer
TransportEngine
PeerRegistry
MessageDispatcher
message encoding
sync bridge
```

Transport does not decide what operations mean. It only delivers messages.

### discovery

discovery helps nodes find peers.

It provides:

```txt
DiscoveryConfig
DiscoveryOptions
DiscoveryMessage
DiscoveryAnnouncement
UdpDiscoveryBackend
DiscoveryClient
DiscoveryServer
DiscoveryEngine
DiscoveryService
DiscoveryRegistry
```

Discovery finds peers. Transport connects to peers. Sync sends operations.

### metadata

metadata describes nodes.

It provides:

```txt
NodeMetadata
NodeCapabilities
MetadataRegistry
MetadataService
MetadataOptions
MetadataEncoder
MetadataDecoder
PlatformInfo
Hostname
VersionInfo
```

Metadata answers: who is this node? what version is it running? what capabilities does it have? what platform is it on?

### cli

cli provides command-line building blocks.

It includes:

```txt
Tokenizer
ArgParser
CommandLine
ParsedCommand
CliCommand
CommandRegistry
ICommandHandler
CliConfig
CliContext
CliEngine
CliService
TableFormatter
UI style helpers
```

It is used to build interactive and single-command CLI applications.

## Dependency direction

The engine should keep dependency direction clean.

Recommended direction:

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
cli/apps
```

This does not mean every module depends on every previous module. It means higher-level modules should not leak into lower-level foundations.

Important rule:

> core must stay independent

## Engine layers

The engine can be grouped into layers:

```txt
Foundation
  core

Local observation
  fs

Durability
  wal

Local state
  store

Convergence and propagation
  sync

Communication
  transport

Peer awareness
  discovery
  metadata

User-facing runtime
  cli
  apps/cli
  apps/node
```

This helps keep the documentation readable like a book.

## When to read engine docs

Read the engine docs if you want to understand:

- how local writes become durable
- how WAL replay works
- how store recovery works
- how sync queues operations
- how retries and ACKs work
- how transport messages are encoded
- how discovery finds peers
- how metadata describes nodes
- how the CLI runtime is built

## When not to start with engine docs

Do not start with engine docs if your goal is only:

- write a value
- read a value
- build a JavaScript app
- build a C++ app
- use the public Client API
- run CLI commands

For those, start with: Quick Start, SDK C++, SDK JS, CLI.

## Engine documentation order

Read this section in this order:

1. Engine Overview
2. Architecture
3. Runtime Flow
4. Modules
5. Core
6. Filesystem
7. WAL
8. Store
9. Sync
10. Transport
11. Discovery
12. Metadata
13. CLI

This order moves from foundation to higher-level runtime.

## Engine learning path

The best learning path is:

```txt
understand core
  ↓
understand WAL
  ↓
understand store
  ↓
understand sync
  ↓
understand transport
  ↓
understand discovery
  ↓
understand metadata
  ↓
understand CLI/apps
```

You can read fs earlier if your use case is file synchronization.

## Minimal engine mental model

```txt
core gives safe primitives
wal makes operations durable
store applies operations locally
sync tracks operations for propagation
transport moves operations to peers
discovery finds peers
metadata describes nodes
cli exposes runtime commands
```

## Engine examples

The engine examples are lower-level than SDK examples. They show how modules work individually.

Examples include:

```txt
core result and IDs
fs scan, snapshot, diff, watch
wal write, read, stream, replay
store memory, WAL, recovery, snapshot
sync local operation, retry, conflict, ACK
transport client, server, peer registry, sync bridge
discovery announce, listen, registry, service
metadata local snapshot, capabilities, registry, service
cli tokenizer, parser, registry, commands, service
```

These examples are useful when working on the engine itself.

## Development workflow

From the engine repository:

```sh
cd ~/softadastra/softadastra
```

Configure and build:

```sh
vix build
```

Or with CMake:

```sh
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

If the preset names change, inspect:

```sh
cat CMakePresets.json
```

## Build output

The build output is usually under:

```txt
build-ninja/
```

If you need to find binaries:

```sh
find build-ninja -type f -executable
```

## Data directory

Some examples use local data files or WAL files.

Create the data directory when needed:

```sh
mkdir -p data
```

Common temporary files may include: `*.wal`, `*.log`, `data/*`.

Do not commit generated runtime files unless they are intentional fixtures.

## Engine design rules

The engine should remain: modular, explicit, deterministic, testable, failure-aware, portable where possible, easy to inspect.

Avoid:

- hidden global state
- silent error swallowing
- network-required local writes
- tight coupling between modules
- business logic inside core
- unobservable sync state

## Failure model

Softadastra assumes failure is normal.

Examples:

```txt
network unavailable
peer offline
transport connection refused
discovery returns no peers
WAL path missing
sync retry expired
process restarted
filesystem changed
metadata unavailable
```

The engine should expose these failures clearly.

> Failure should be visible, not magical.

## Local-first rule

Local-first means: local state can change without the network.

A local write should not depend on: remote server, cloud API, peer connection, discovery success, transport availability.

If persistence is enabled, the write should become durable locally before being treated as accepted.

## Offline-first rule

Offline-first means: the system keeps working when offline.

Offline behavior should be normal, not exceptional.

The runtime should support: local writes, local reads, queued sync work, retry later, recover after restart, eventual convergence.

## Durability rule

When WAL is enabled: accepted local work should be recorded before sync.

The system should not pretend an operation is durable if the WAL append failed.

```txt
WAL failure
  -> operation not safely accepted
```

## Sync rule

Sync should be observable. The engine should expose:

```txt
outbox size
queued count
in-flight count
acknowledged count
failed count
retry count
batch size
```

A developer should be able to understand what the sync engine is doing.

## Transport rule

Transport should only be responsible for communication. It should not own application state.

```txt
transport failure
  -> delivery delayed
  -> local store remains valid
```

## Discovery rule

Discovery should only find peers. It should not be required for local writes.

```txt
no peers found
  -> sync may wait
  -> local store remains valid
```

## Metadata rule

Metadata should make nodes understandable. It should not own application data.

```txt
metadata -> identity and capabilities
store    -> application state
```

## Public API stability

The engine is lower-level than the SDK, but its module APIs should still be treated carefully.

Breaking changes in engine modules can affect: SDK C++, SDK JS, CLI, apps/node, examples, tests.

When changing a module, check what depends on it.

## Recommended contribution order

When improving the engine, work from lower-level to higher-level modules:

1. core
2. wal
3. store
4. sync
5. transport
6. discovery
7. metadata
8. cli
9. apps

Do not change high-level behavior by hiding problems in lower-level modules.

## What to document per module

Each engine module page should explain:

- purpose
- responsibilities
- what it does not do
- main types
- example usage
- dependencies
- integration with other modules
- failure behavior
- design rules
- next steps

This keeps the documentation consistent.

## Engine documentation pages

This section contains:

```txt
architecture
runtime-flow
modules
core
fs
wal
store
sync
transport
discovery
metadata
cli
```

Each page focuses on one part of the runtime.

## Summary

The Softadastra Engine is the C++ runtime foundation behind Softadastra.

It provides:

```txt
core primitives
filesystem observation
WAL durability
local store
sync engine
transport
discovery
metadata
CLI runtime
```

The key idea is:

> The engine makes local-first reliability possible.

Start from the SDK if you are building an app. Read the engine docs when you want to understand or improve the runtime itself.

## Next step

Continue with architecture:

[Go to Architecture](architecture.md)
