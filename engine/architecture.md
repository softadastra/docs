# Architecture

Softadastra Engine is organized as a modular local-first runtime.

Its architecture is built around one rule:

```txt
Local correctness first.
Network later.
```

The engine is not a single monolithic system. It is a set of focused modules that work together:

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

Each module has one responsibility, clear boundaries, and explicit failure behavior.

## Architecture goal

The goal of the engine architecture is to make local-first reliability possible.

A Softadastra node should be able to:

- accept local work
- persist it when configured
- recover after restart
- track sync work
- retry later
- connect peers when available
- discover peers when available
- describe itself through metadata
- expose state through CLI and SDKs

The architecture is designed for unstable environments where the network may fail, peers may disappear, and processes may restart.

## High-level architecture

The engine can be viewed as layers:

```txt
Application / CLI / SDK
        ↓
metadata + discovery
        ↓
transport
        ↓
sync
        ↓
store
        ↓
wal
        ↓
fs
        ↓
core
```

A more practical view:

```txt
core        -> safe primitives
fs          -> filesystem observation
wal         -> durable operation log
store       -> current local state
sync        -> operation propagation state
transport   -> peer communication
discovery   -> peer discovery
metadata    -> node identity and capabilities
cli         -> command-line runtime
```

The higher layers should depend on lower layers, not the opposite.

## Current repository structure

The engine repository is:

```txt
~/softadastra/softadastra
```

Current layout:

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

The most important folders are:

```txt
modules/  -> reusable runtime modules
apps/     -> runnable applications
examples/ -> focused examples
data/     -> local runtime data and test data
cmake/    -> build helpers
```

## Module architecture

The engine is split into modules.

Each module should answer one question.

| Module | Question |
|--------|----------|
| core | Which primitives are shared everywhere? |
| fs | What changed on the filesystem? |
| wal | Which operations were durably recorded? |
| store | What is the current local state? |
| sync | Which operations need propagation? |
| transport | How do nodes communicate? |
| discovery | Which peers exist? |
| metadata | Who is this node? |
| cli | How does the user interact from terminal? |

This separation keeps the engine understandable.

## Core architecture principle

The engine should not hide failure.

It should expose:

- what failed
- where it failed
- why it failed
- what state remains valid
- what can be retried

This is important because Softadastra is built for unreliable environments.

A peer can disappear. A write can fail. A WAL path can be invalid. A discovery scan can return no peers.

The architecture must make these states explicit.

## Local-first architecture

Local-first means local state can change without the network.

The runtime should allow:

```txt
client writes value
  ↓
value is accepted locally
  ↓
sync tracks the operation
  ↓
transport sends later when possible
```

The network is not required for the first local write.

The basic local-first path is:

```txt
Application
  ↓
Store
  ↓
WAL, if enabled
  ↓
Sync tracking
```

Transport and discovery are optional.

## Offline-first architecture

Offline-first means the system keeps working when offline.

The runtime should support:

- offline writes
- offline reads
- pending sync work
- retry after reconnect
- recovery after restart
- eventual convergence

Offline should be treated as a normal state, not as a crash.

The architecture should allow this:

```txt
network unavailable
  ↓
local writes continue
  ↓
operations remain in outbox
  ↓
sync retries later
  ↓
transport sends when available
```

## Durability architecture

Durability is handled by the WAL.

The WAL stores accepted operations before they are treated as recoverable.

The durability path is:

```txt
operation created
  ↓
WAL append
  ↓
WAL flush, when configured
  ↓
store apply
  ↓
sync tracking
```

The key rule is:

> If WAL append fails, the operation must not be treated as durably accepted.

This keeps local-first behavior honest.

## Store architecture

The store represents current local state.

It is not the same thing as the WAL.

```txt
WAL   -> operation history
Store -> current local value
```

Example:

```txt
put user:1 = Gaspard
put user:1 = Softadastra
remove user:1
```

The WAL remembers the operation sequence.

The store exposes the final state.

The store answers:

- what is the value now?
- does this key exist?
- how many entries exist?
- what version is this entry?

## Sync architecture

Sync tracks operations that should be propagated.

It does not send network messages by itself.

The sync layer owns:

- outbox
- queue
- in-flight operations
- acknowledgements
- retry policy
- conflict resolution
- scheduler tick

The sync path is:

```txt
store operation
  ↓
sync operation
  ↓
outbox
  ↓
queue
  ↓
batch
  ↓
transport sends batch
```

The important separation is:

```txt
Sync decides what should be sent.
Transport sends it.
```

## Transport architecture

Transport moves messages between peers.

It does not own application state. It does not decide conflict resolution. It does not decide whether a local operation is valid.

Transport owns:

- peer connection
- message encoding
- message dispatch
- TCP backend
- client/server communication
- peer registry
- sync bridge

The transport path is:

```txt
sync batch
  ↓
transport message
  ↓
encoded frame
  ↓
peer connection
  ↓
remote node
```

If transport fails, local state remains valid.

```txt
transport failure
  ↓
delivery delayed
  ↓
sync may retry
  ↓
store remains local
```

## Discovery architecture

Discovery finds peers.

It does not connect to peers. It does not send sync operations.

Discovery owns:

- announcements
- probes
- UDP backend
- discovery registry
- peer availability
- stale peer tracking
- expired peer pruning

The discovery path is:

```txt
node announces itself
  ↓
other node receives announcement
  ↓
peer is added to discovery registry
  ↓
transport can connect later
```

The relationship is:

```txt
Discovery finds peers.
Transport connects peers.
Sync sends operations.
```

## Metadata architecture

Metadata describes nodes.

It answers:

- who is this node?
- what is its hostname?
- what OS is it running?
- what version is it running?
- what capabilities does it expose?
- how long has it been running?

Metadata owns:

- node metadata
- node capabilities
- metadata registry
- metadata encoding
- metadata decoding
- metadata service
- platform info
- hostname
- version info

Metadata does not own application data.

```txt
Metadata -> node description
Store    -> application state
```

## CLI architecture

The CLI is a user-facing runtime built on top of the engine.

The CLI module provides reusable command-line primitives:

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

The CLI app can expose commands such as:

```txt
status
node
store
sync
peers
```

The CLI architecture is:

```txt
Terminal input
  ↓
Tokenizer
  ↓
ArgParser
  ↓
CommandRegistry
  ↓
CommandHandler
  ↓
Engine modules
  ↓
Formatted output
```

## Apps architecture

The `apps/` folder contains runnable programs built from engine modules.

Current apps:

```txt
apps/cli
apps/node
```

The rule is:

```txt
modules provide reusable logic
apps compose modules into runnable programs
```

Application-specific behavior should live in `apps/`. Reusable runtime behavior should live in `modules/`.

## SDK architecture

The SDKs sit above the engine.

```txt
Softadastra Engine
  ↓
SDK C++
  ↓
Application
```

```txt
Softadastra Engine
  ↓
SDK JS
  ↓
JavaScript application
```

The SDK exposes a smaller developer-facing API:

```txt
Client
ClientOptions
Result
Error
Key
Value
Peer
NodeInfo
SyncResult
TickResult
```

The engine remains the lower-level runtime.

## Engine and SDK boundary

The engine should expose reliable primitives.

The SDK should expose simple developer workflows.

Engine example:

```txt
StoreEngine
SyncEngine
TransportEngine
DiscoveryEngine
MetadataService
```

SDK example:

```txt
client.open()
client.put()
client.get()
client.tick()
client.startTransport()
client.startDiscovery()
client.refreshNodeInfo()
```

The SDK should hide wiring. The engine should keep behavior explicit.

## Dependency direction

The recommended dependency direction is:

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

This is a conceptual direction. Not every module must depend on every previous module.

The important rule is:

> lower-level modules must not depend on higher-level modules

For example:

- core must not depend on sync
- wal must not depend on discovery
- store must not depend on CLI
- transport must not depend on apps

### core dependency rule

`core` is the foundation. It must stay independent.

It can provide: Result, Error, IDs, time, hash, config, utilities.

It must not contain: filesystem logic, WAL logic, store logic, sync logic, network logic, CLI logic, business logic.

If core becomes coupled, the entire engine becomes harder to maintain.

### fs dependency rule

`fs` observes filesystem state. It can depend on `core`.

It should not depend on: wal, store, sync, transport, discovery, metadata, cli.

The filesystem module should produce events, snapshots, and paths. It should not decide how to sync files.

### wal dependency rule

`wal` records operations. It can depend on: core, fs (only when writing file event records).

It should not depend on: store, sync, transport, discovery, cli.

The WAL should not know how sync works. It should only know how to append, read, stream, and replay records.

### store dependency rule

`store` owns current local state. It can depend on: core, wal.

It should not depend on: transport, discovery, metadata, cli.

The store can produce operations for sync, but it should not send them.

### sync dependency rule

`sync` owns operation propagation state. It can depend on: core, store.

It should not depend directly on: discovery, metadata, cli, apps.

Sync should not require the network to exist. Sync prepares work. Transport delivers it.

### transport dependency rule

`transport` owns communication. It can depend on: core, sync.

It should not depend on: cli, apps, business logic.

Transport should not decide application state. It only moves messages and dispatches them.

### discovery dependency rule

`discovery` owns peer finding. It can depend on: core, transport.

It should not own store or sync behavior. Discovery can provide peers to transport. It should not decide what data is synchronized.

### metadata dependency rule

`metadata` owns node identity and capabilities. It can integrate with discovery when needed. It should not own application state.

### cli dependency rule

`cli` is a user-facing layer. It can depend on engine modules. It should not be required by lower-level modules.

The CLI should be replaceable by another interface: SDK, HTTP API, desktop UI, dashboard, tests.

Engine modules must not depend on CLI output.

## Data flow architecture

A typical local write follows this path:

```txt
SDK or CLI
  ↓
Client or command handler
  ↓
Store operation
  ↓
WAL append, if enabled
  ↓
Store apply
  ↓
Sync outbox entry
  ↓
Tick produces batch
  ↓
Transport sends batch, if peer exists
```

## Read flow architecture

A local read is simpler:

```txt
SDK or CLI
  ↓
Store get
  ↓
Value or not_found error
```

A read should not require: WAL, sync, transport, discovery, peer, network.

Reading local state must stay local.

## Recovery flow architecture

When the process restarts:

```txt
client or app starts
  ↓
open runtime
  ↓
read WAL, if enabled
  ↓
replay valid operations
  ↓
rebuild store state
  ↓
rebuild sync state, when supported
  ↓
runtime ready
```

The key idea is:

> accepted durable operations should be recoverable

## Sync flow architecture

A sync tick follows this path:

```txt
tick
  ↓
retry expired operations
  ↓
prune completed operations, if requested
  ↓
select queued operations
  ↓
produce batch
  ↓
return TickResult
```

The tick should be observable. It should expose: retried count, pruned count, batch size.

## Peer communication flow

A peer communication flow looks like this:

```txt
discovery finds peer, optional
  ↓
transport connects to peer
  ↓
sync produces batch
  ↓
transport sends message
  ↓
remote transport receives message
  ↓
remote dispatcher decodes message
  ↓
remote sync receives operation
  ↓
remote store applies operation
```

Each layer has a clear job.

## Failure architecture

The engine architecture assumes failure.

Examples:

- WAL append failed
- WAL read failed
- store key missing
- sync retry expired
- transport connection refused
- discovery returned no peers
- metadata unavailable
- filesystem watcher failed
- CLI command invalid

Each failure should be reported by the layer that detects it.

Do not hide lower-level failures behind generic messages.

## Failure isolation

A failure in one layer should not destroy unrelated state.

Examples:

```txt
transport failure
  -> delivery delayed
  -> local store remains valid

discovery failure
  -> peer finding delayed
  -> local writes still work

sync failure
  -> propagation failed
  -> local value may still exist

metadata failure
  -> diagnostics unavailable
  -> store may still work
```

This is critical for local-first reliability.

## Error architecture

Errors should be explicit.

The engine should prefer structured errors over hidden exceptions.

The common pattern is:

```txt
Result<T, Error>
  -> ok(value)
  -> err(error)
```

This allows calling code to decide what to do.

The engine should make it clear:

- is this error fatal?
- can it be retried?
- is local state still valid?
- was the operation accepted?

## Observability architecture

Softadastra should be observable.

A developer should be able to inspect:

```txt
node id
runtime status
store size
sync outbox size
queued count
failed count
peer count
transport status
discovery status
metadata
WAL path
last sequence
```

This is why the engine includes: state structs, metadata, CLI output, sync state, registries, examples.

Hidden state makes local-first systems hard to debug.

## Configuration architecture

Configuration should be explicit.

Examples:

```txt
node id
WAL path
auto flush
transport host
transport port
discovery host
discovery port
retry policy
ACK timeout
version
display name
```

Avoid configuration that silently changes behavior without visibility.

Good configuration:

```txt
options.enableWal = true
options.walPath = "data/node-a.wal"
options.autoFlush = true
```

Bad configuration:

```txt
implicit WAL path
hidden transport start
silent discovery enable
```

Explicit configuration makes failures easier to understand.

## Runtime composition

A full peer-aware runtime composes modules like this:

```txt
Core primitives
  ↓
StoreEngine with WAL-backed config
  ↓
SyncContext with node id
  ↓
SyncEngine
  ↓
TransportContext with SyncEngine
  ↓
TransportEngine
  ↓
DiscoveryContext with TransportEngine
  ↓
DiscoveryEngine
  ↓
MetadataService
  ↓
CLI or SDK
```

The SDK should hide this composition from application developers.

## Minimal local composition

A minimal local runtime can be:

```txt
core
store
```

With persistence:

```txt
core
wal
store
```

With sync state:

```txt
core
wal
store
sync
```

With peer communication:

```txt
core
wal
store
sync
transport
```

With peer discovery:

```txt
core
wal
store
sync
transport
discovery
```

With node identity:

```txt
core
wal
store
sync
transport
discovery
metadata
```

## Architecture by use case

### Local-only app

Use: core, store. Optional: wal, metadata.

No transport required. No discovery required.

### Persistent local app

Use: core, wal, store, sync, metadata.

Transport is optional. Discovery is optional.

### Peer-aware app

Use: core, wal, store, sync, transport, metadata.

Discovery can be added for automatic peer finding.

### Local network app

Use: core, wal, store, sync, transport, discovery, metadata.

This is the full local-first peer-aware stack.

### CLI runtime

Use: core, cli, store, sync, transport, discovery, metadata.

The CLI composes the runtime and exposes commands.

## Architecture rules

The engine should follow these rules:

1. Keep core independent.
2. Keep modules focused.
3. Keep local writes independent from the network.
4. Persist before sync when WAL is enabled.
5. Keep sync separate from transport.
6. Keep discovery separate from transport.
7. Keep metadata separate from application data.
8. Expose errors clearly.
9. Expose runtime state.
10. Make examples small and focused.

## What should not happen

Avoid this architecture:

```txt
store directly sends TCP messages
core depends on CLI
transport decides conflict resolution
discovery writes application data
metadata owns store values
WAL depends on app commands
local writes require discovery
sync silently drops failed operations
```

These designs create coupling and make failures harder to debug.

## Recommended architecture diagram

Use this mental diagram:

```txt
                    CLI / SDK / Apps
                          ↓
                    Public API Layer
                          ↓
        ┌─────────────────────────────────┐
        │           Metadata              │
        │    identity + capabilities       │
        └─────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │           Discovery             │
        │          peer finding            │
        └─────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │           Transport             │
        │        peer communication        │
        └─────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │             Sync                │
        │   outbox + retry + convergence   │
        └─────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │            Store                │
        │       current local state        │
        └─────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │             WAL                 │
        │       durable operation log      │
        └─────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │             Core                │
        │      errors + ids + time         │
        └─────────────────────────────────┘
```

This diagram is conceptual. Some modules can be used independently.

## Architecture summary per module

| Module | Layer | Responsibility |
|--------|-------|----------------|
| core | Foundation | Shared primitives |
| fs | Observation | Filesystem events and snapshots |
| wal | Durability | Durable operation history |
| store | State | Current local key-value state |
| sync | Propagation | Outbox, queue, retry, convergence |
| transport | Communication | Peer messages |
| discovery | Peer awareness | Peer finding |
| metadata | Identity | Node description |
| cli | Interface | Terminal commands and UI |

## Recommended development order

When implementing or changing the engine, prefer this order:

1. core
2. wal
3. store
4. sync
5. transport
6. discovery
7. metadata
8. cli
9. apps

This keeps foundational behavior stable before higher-level behavior changes.

## Testing architecture

Tests should follow module boundaries.

Good test groups:

```txt
core tests
fs tests
wal tests
store tests
sync tests
transport tests
discovery tests
metadata tests
cli tests
integration tests
```

Unit tests should verify each module alone. Integration tests should verify flows across modules.

Examples:

```txt
WAL append + read
store recovery from WAL
sync outbox after store operation
transport encodes sync batch
discovery adds peer
metadata describes node
CLI command calls module
```

## Examples architecture

Examples should teach one concept at a time.

Good example progression:

```txt
core result
fs scan
wal write
wal read
store put/get
store recovery
sync local operation
sync retry
transport client/server
discovery announce/listen
metadata local snapshot
cli command
```

Avoid one giant example that teaches everything at once.

The SDK can have simpler examples. The engine can have lower-level examples.

## Documentation architecture

The engine docs should be read like a book:

1. Overview
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

This order follows the runtime from foundations to user-facing tools.

## Summary

The Softadastra Engine architecture is modular, local-first, and failure-aware.

The key separation is:

```txt
WAL persists operations.
Store exposes current state.
Sync tracks propagation.
Transport sends messages.
Discovery finds peers.
Metadata describes nodes.
CLI exposes runtime behavior.
```

The most important rule is:

> Local correctness must not depend on the network.

## Next step

Continue with runtime flow:

[Go to Runtime Flow](runtime-flow.md)
