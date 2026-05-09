# Runtime Flow

Runtime flow explains what happens inside Softadastra Engine when a node starts, writes local data, persists operations, tracks sync work, communicates with peers, discovers peers, and exposes metadata.

The core rule is:

```txt
Local work happens first.
Network work happens later.
```

Softadastra is designed so that local state can remain useful even when transport, discovery, or peers are unavailable.

## Why runtime flow matters

Softadastra Engine is modular.

Each module has a clear responsibility:

```txt
core        -> primitives and errors
wal         -> durable operation history
store       -> current local state
sync        -> propagation tracking
transport   -> peer communication
discovery   -> peer finding
metadata    -> node identity
cli         -> terminal interface
```

Runtime flow shows how these modules work together.

It answers:

- what happens when the engine starts?
- what happens when a value is written?
- what happens when WAL is enabled?
- what happens when sync runs?
- what happens when transport fails?
- what happens when discovery finds no peers?
- what happens during recovery?

## High-level flow

The full peer-aware runtime flow looks like this:

```txt
Application / SDK / CLI
  ↓
Store operation
  ↓
WAL append, if enabled
  ↓
Store apply
  ↓
Sync tracking
  ↓
Sync tick
  ↓
Transport send, if available
  ↓
Remote node receives
  ↓
Remote store applies
```

Discovery and metadata support the flow:

```txt
Discovery -> finds peers
Metadata  -> describes nodes
Transport -> connects peers
Sync      -> moves operations
```

## Minimal local flow

The smallest runtime flow is local-only:

```txt
Application
  ↓
Store
  ↓
Value stored locally
```

This flow does not require:

- WAL
- sync
- transport
- discovery
- metadata
- network
- peer

It is useful for tests, demos, and temporary local state.

## Persistent local flow

When WAL is enabled, the local flow becomes:

```txt
Application
  ↓
Operation created
  ↓
WAL append
  ↓
WAL flush, if configured
  ↓
Store apply
  ↓
Value stored locally
```

The key difference is durability.

The operation is recorded so it can be replayed later.

```txt
WAL   -> operation history
Store -> current local state
```

## Sync-aware local flow

When sync is enabled, a write also creates propagation work:

```txt
Application
  ↓
Store operation
  ↓
WAL append, if enabled
  ↓
Store apply
  ↓
Sync operation created
  ↓
Outbox entry created
  ↓
Operation queued
```

The local value is available immediately.

Sync work can move later.

```txt
local write accepted
  does not mean
remote peer already has it
```

## Peer-aware flow

When transport is enabled and a peer is available:

```txt
Application
  ↓
Local write
  ↓
WAL append
  ↓
Store apply
  ↓
Sync outbox
  ↓
Sync tick creates batch
  ↓
Transport encodes message
  ↓
Transport sends to peer
  ↓
Remote transport receives
  ↓
Remote sync receives operation
  ↓
Remote store applies operation
```

This is the complete local-first peer synchronization path.

## Engine startup flow

When a Softadastra runtime starts, the flow is:

```txt
load configuration
  ↓
initialize core primitives
  ↓
open WAL, if enabled
  ↓
recover store from WAL, if enabled
  ↓
initialize sync context
  ↓
initialize transport, if configured
  ↓
initialize discovery, if configured
  ↓
initialize metadata
  ↓
runtime ready
```

The runtime should not require transport or discovery to become locally usable.

A local-first runtime can be ready even if no peer exists.

## Configuration flow

Configuration defines how the runtime starts.

Important values include:

- node id
- WAL enabled
- WAL path
- auto flush
- transport enabled
- transport host
- transport port
- discovery enabled
- discovery host
- discovery port
- discovery target
- display name
- version
- retry policy
- ACK timeout

The runtime reads these options before composing modules.

Example conceptual flow:

```txt
ClientOptions
  ↓
StoreConfig
  ↓
SyncConfig
  ↓
TransportConfig
  ↓
DiscoveryConfig
  ↓
MetadataOptions
```

The SDK hides most of this wiring from application code.

The engine keeps it explicit.

## Node identity flow

Every peer-aware runtime needs a node identity.

The node id flows into several modules:

```txt
node id
  ↓
metadata
  ↓
sync operation origin
  ↓
transport messages
  ↓
discovery announcements
  ↓
CLI status
```

The node id should be stable.

Example:

```txt
node-a
```

A sync operation from `node-a` can then be recognized as originating from that node.

## Metadata flow

Metadata describes the local node.

Startup can create metadata from:

- node id
- display name
- hostname
- operating system
- version
- capabilities
- start time

Flow:

```txt
MetadataOptions
  ↓
NodeMetadata
  ↓
MetadataService
  ↓
local metadata snapshot
  ↓
CLI / SDK / diagnostics
```

Metadata does not write application state.

It only describes the runtime.

## Local write flow

A local write starts with an operation.

Example:

```txt
put user:1 = Gaspard
```

Flow:

```txt
operation created
  ↓
validate key and value
  ↓
append to WAL, if enabled
  ↓
apply to store
  ↓
create sync operation
  ↓
queue for sync
  ↓
return result
```

The local write should return an explicit success or error.

It should not hide WAL, store, or sync failures.

## Write without WAL

If WAL is disabled:

```txt
operation created
  ↓
validate key and value
  ↓
apply to memory store
  ↓
create sync operation, if sync enabled
  ↓
return result
```

This is faster and simpler, but not durable.

If the process restarts, memory-only state can be lost.

## Write with WAL

If WAL is enabled:

```txt
operation created
  ↓
validate key and value
  ↓
append operation to WAL
  ↓
flush WAL, if auto flush enabled
  ↓
apply operation to store
  ↓
create sync operation
  ↓
return result
```

The key rule is:

```txt
do not report durable success if WAL append failed
```

WAL failure means the operation is not safely recorded.

## WAL append flow

A WAL append follows this model:

```txt
WalRecord created
  ↓
sequence assigned
  ↓
timestamp attached
  ↓
record encoded
  ↓
record written to file
  ↓
flush, if requested
  ↓
sequence returned
```

The WAL record can contain:

- sequence
- record type
- status
- timestamp
- payload

The WAL is append-oriented.

It should not require rewriting the full state on every operation.

## Store apply flow

After a valid operation is accepted, the store applies it.

For a put operation:

```txt
Operation::Put
  ↓
key validated
  ↓
entry created or updated
  ↓
version incremented
  ↓
value stored
```

For a delete operation:

```txt
Operation::Delete
  ↓
key validated
  ↓
entry removed
  ↓
delete result returned
```

The store exposes current state.

It does not expose the full historical sequence.

## Read flow

A read is simple and local.

```txt
get key
  ↓
store lookup
  ↓
entry found?
  ↓
return value or not_found error
```

A read should not require:

- network
- transport
- discovery
- peer
- sync tick
- remote server

Local reads must remain local.

## Remove flow

A remove operation follows the same local-first model.

```txt
remove key
  ↓
validate key
  ↓
append remove operation to WAL, if enabled
  ↓
apply remove to store
  ↓
track remove for sync
  ↓
return result
```

After removal:

```txt
contains(key) -> false
get(key)      -> not_found
```

If the remove was recorded in WAL, replay should preserve the final removed state.

## Recovery flow

Recovery happens when the runtime starts with WAL enabled.

```txt
open WAL
  ↓
read records in sequence
  ↓
decode each record
  ↓
validate record
  ↓
apply operation to store
  ↓
rebuild local state
  ↓
runtime ready
```

Recovery should apply records in deterministic order.

The expected behavior is:

```txt
same WAL
  ↓
same replay order
  ↓
same store state
```

## Recovery example

Given this WAL sequence:

```txt
1. put user:1 = Gaspard
2. put user:2 = Softadastra
3. put user:1 = Gaspard Kirira
4. delete user:2
```

After replay:

```txt
user:1 -> Gaspard Kirira
user:2 -> not_found
```

The store exposes the final state.

The WAL keeps the history.

## Corrupted WAL flow

If a WAL contains corrupted trailing data, the safer model is:

```txt
read valid records
  ↓
stop at invalid record
  ↓
do not apply invalid bytes
  ↓
return clear recovery error or partial recovery result
```

The engine should never silently apply corrupted data.

Possible behavior:

- recover valid prefix
- report corruption
- require repair or manual action

The exact policy can evolve, but invalid records must be visible.

## Sync submit flow

After a local store operation, sync can create a sync operation.

```txt
store operation
  ↓
SyncOperation created
  ↓
sync id assigned
  ↓
origin node id attached
  ↓
version attached
  ↓
operation inserted into outbox
  ↓
operation queued
```

The sync operation is the propagation unit.

It is separate from the raw store operation.

## Outbox flow

The outbox keeps operations that need synchronization.

```txt
new sync operation
  ↓
outbox entry created
  ↓
status = queued
  ↓
ready for tick
```

The outbox can contain:

- queued operations
- in-flight operations
- acknowledged operations
- failed operations

The outbox makes sync state observable.

## Sync tick flow

A sync tick moves sync forward once.

```txt
tick
  ↓
retry expired operations
  ↓
prune acknowledged operations, if requested
  ↓
select queued operations
  ↓
create batch
  ↓
return TickResult
```

A tick can report:

- retried count
- pruned count
- batch size

Manual ticks are useful because they are deterministic and testable.

## Sync batch flow

A sync batch is a group of operations ready to send.

```txt
queued operations
  ↓
selected by scheduler
  ↓
wrapped in envelopes
  ↓
returned as batch
  ↓
transport can send
```

A batch can exist even if transport is disabled.

Transport availability controls delivery, not batch creation.

## ACK flow

If acknowledgements are required:

```txt
operation sent
  ↓
operation marked in-flight
  ↓
AckTracker tracks sync id
  ↓
remote peer replies ACK
  ↓
operation marked acknowledged
  ↓
operation can be pruned later
```

If ACK does not arrive:

```txt
ACK timeout
  ↓
operation becomes retry candidate
  ↓
retry policy decides next action
```

## Retry flow

Retry handles operations that were sent but not confirmed.

```txt
operation in-flight
  ↓
timeout reached
  ↓
retry count checked
  ↓
operation re-queued
  ↓
next tick can send again
```

If retry limit is exceeded:

```txt
max retries reached
  ↓
operation marked failed
  ↓
failed count increases
```

Failed sync work does not automatically mean local data is lost.

It means propagation failed.

## Conflict flow

When a remote operation targets a key that also changed locally, conflict policy decides what happens.

Conceptual flow:

```txt
remote operation received
  ↓
local entry exists?
  ↓
versions or timestamps compared
  ↓
conflict policy applied
  ↓
apply remote or keep local
  ↓
return resolution
```

Possible policies can include:

- last write wins
- keep local
- apply remote
- custom policy later

The conflict resolver should make the decision explicit.

## Remote receive flow

When a remote node sends an operation:

```txt
transport receives message
  ↓
message decoded
  ↓
dispatcher identifies sync message
  ↓
sync operation decoded
  ↓
SyncEngine receives remote operation
  ↓
conflict policy checked
  ↓
store operation applied if accepted
  ↓
result returned
```

The remote apply path should preserve local correctness.

Invalid remote operations should be rejected clearly.

## Transport startup flow

Transport startup happens after the client or app has opened the runtime.

```txt
TransportConfig
  ↓
backend created
  ↓
bind host and port
  ↓
start listener
  ↓
transport running
```

Transport should return explicit errors for:

- invalid host
- invalid port
- port already in use
- permission denied
- socket failure

A transport start failure should not destroy local store state.

## Transport connect flow

Connecting to a peer follows this path:

```txt
PeerInfo / Peer
  ↓
validate host and port
  ↓
open connection
  ↓
handshake or hello message
  ↓
mark peer connected
```

If the peer is unavailable:

```txt
connection refused
  ↓
return transport error
  ↓
local store remains usable
```

## Transport send flow

Sending a sync batch follows this path:

```txt
sync batch
  ↓
encode sync operation
  ↓
wrap in transport message
  ↓
encode frame
  ↓
send through backend
  ↓
wait for response or ACK, if required
```

Transport should not decide whether the operation is valid application data.

Sync and store own that meaning.

## Transport receive flow

Receiving a message follows this path:

```txt
network frame received
  ↓
decode frame
  ↓
decode transport message
  ↓
dispatch by message type
  ↓
sync message goes to SyncEngine
  ↓
ping message returns pong
  ↓
hello message updates peer state
```

The dispatcher connects transport messages to the correct engine behavior.

## Discovery startup flow

Discovery startup prepares peer discovery.

```txt
DiscoveryConfig
  ↓
UDP backend created
  ↓
bind discovery host and port
  ↓
discovery server starts
  ↓
discovery running
```

Discovery should return explicit errors for:

- port already in use
- invalid host
- socket failure
- permission denied

Discovery failure should not prevent local store operations.

## Discovery announce flow

A node can announce itself:

```txt
local node id
  ↓
announcement created
  ↓
payload encoded
  ↓
datagram created
  ↓
UDP message sent to discovery target
```

Announcement data can include:

- node id
- host
- port
- capabilities later

Discovery announces existence.

Transport handles connection.

## Discovery listen flow

A node listening for announcements follows this flow:

```txt
UDP datagram received
  ↓
decode discovery message
  ↓
extract announcement
  ↓
upsert peer in discovery registry
  ↓
mark peer available
```

This adds peers to the list returned by discovery.

It does not automatically connect to them.

## Discovery probe flow

A probe asks whether peers are available.

```txt
probe message sent
  ↓
remote node receives probe
  ↓
remote node replies or announces
  ↓
registry updates peer state
```

This is useful when the local node wants to refresh peer availability.

## Discovery registry flow

The discovery registry stores known peers.

```txt
announcement received
  ↓
peer inserted or updated
  ↓
last seen timestamp updated
  ↓
peer marked available
```

Over time:

```txt
peer not seen
  ↓
peer marked stale
  ↓
peer marked expired
  ↓
expired peer pruned
```

This prevents old peers from staying forever.

## Metadata startup flow

Metadata starts from node options.

```txt
node id
display name
version
hostname
platform info
capabilities
  ↓
NodeMetadata created
  ↓
runtime fields refreshed
  ↓
metadata exposed to SDK / CLI
```

Metadata can be refreshed later to update fields like uptime.

## Metadata refresh flow

Refreshing metadata follows this model:

```txt
read current hostname
  ↓
read platform info
  ↓
calculate uptime
  ↓
update capabilities
  ↓
return NodeMetadata / NodeInfo
```

Metadata is diagnostic.

It does not modify application store data.

## CLI command flow

A CLI command goes through the CLI engine.

```txt
terminal input
  ↓
Tokenizer
  ↓
CommandLine
  ↓
ArgParser
  ↓
ParsedCommand
  ↓
CommandRegistry
  ↓
ICommandHandler
  ↓
engine module call
  ↓
formatted output
```

Example:

```txt
store put user:1 Gaspard
  ↓
parse command
  ↓
call store command handler
  ↓
write local value
  ↓
print result
```

## Interactive CLI flow

Interactive mode keeps the CLI running.

```txt
start CLI
  ↓
show banner
  ↓
read line
  ↓
parse command
  ↓
execute handler
  ↓
print result
  ↓
read next line
```

The loop stops on commands such as:

- `exit`
- `quit`

## Single-command CLI flow

Single-command mode runs one command and exits.

```txt
start CLI
  ↓
parse command
  ↓
execute command
  ↓
print output
  ↓
return exit code
```

This is useful for scripts and automation.

## SDK C++ flow

The C++ SDK wraps engine composition into a simpler client API.

```txt
ClientOptions
  ↓
Client
  ↓
open
  ↓
put / get / remove
  ↓
sync_state / tick
  ↓
start_transport / start_discovery
  ↓
close
```

The SDK hides manual engine wiring.

Application code uses Client.

## SDK JS flow

The JavaScript SDK mirrors the public C++ SDK shape.

```txt
ClientOptions
  ↓
Client
  ↓
open
  ↓
put / get / remove
  ↓
syncStateInfo / tick
  ↓
startTransport / startDiscovery
  ↓
close
```

The names follow JavaScript conventions, but the model remains the same.

## Full local-first flow

A complete local-first write with persistence and sync looks like this:

```txt
client.put("profile/name", "Ada")
  ↓
validate key and value
  ↓
create store operation
  ↓
append to WAL
  ↓
flush WAL
  ↓
apply to store
  ↓
create sync operation
  ↓
insert into outbox
  ↓
queue operation
  ↓
return success
```

Then:

```txt
client.get("profile/name")
  ↓
read local store
  ↓
return "Ada"
```

No network was required.

## Full peer-sync flow

A complete peer-sync flow looks like this:

```txt
node-a writes locally
  ↓
node-a WAL append
  ↓
node-a store apply
  ↓
node-a sync outbox
  ↓
node-a tick creates batch
  ↓
node-a transport sends batch to node-b
  ↓
node-b transport receives batch
  ↓
node-b dispatcher decodes batch
  ↓
node-b sync receives remote operation
  ↓
node-b conflict resolver checks operation
  ↓
node-b store applies operation
  ↓
node-b may ACK
  ↓
node-a marks operation acknowledged
```

This is the full architecture working together.

## Flow when transport fails

If transport fails:

```txt
local write
  ↓
WAL append succeeds
  ↓
store apply succeeds
  ↓
sync operation queued
  ↓
transport connection fails
  ↓
operation remains pending
  ↓
retry later
```

The correct behavior is:

- local value remains available
- sync is delayed
- error is visible

Transport failure should not delete local state.

## Flow when discovery finds no peers

If discovery finds no peers:

```txt
discovery starts
  ↓
no announcement received
  ↓
peer list empty
  ↓
local writes still work
  ↓
sync work remains pending
```

No peers is not a local store failure.

It only means the node does not currently know a remote peer.

## Flow when WAL fails

If WAL append fails:

```txt
local write requested
  ↓
WAL append fails
  ↓
operation is not durably recorded
  ↓
return error
```

The engine should not pretend the operation was safely accepted.

This is different from transport failure.

```txt
WAL failure       -> local durability problem
transport failure -> remote delivery problem
```

## Flow when key is missing

A missing key is a normal read result.

```txt
get missing/key
  ↓
store lookup
  ↓
entry not found
  ↓
return not_found error
```

This should not crash.

It should be explicit.

## Flow when remote operation conflicts

A conflict flow looks like this:

```txt
remote operation received
  ↓
local key exists with different version
  ↓
conflict resolver called
  ↓
policy decides result
  ↓
apply remote or keep local
  ↓
return conflict resolution
```

The important point is:

```txt
conflicts should be visible and deterministic
```

## Runtime state visibility

The runtime should expose useful state.

Examples:

- store size
- WAL path
- last WAL sequence
- outbox size
- queued count
- in-flight count
- acknowledged count
- failed count
- transport running
- discovery running
- known peers
- node metadata

This visibility is important for debugging.

## Runtime flow by command

### `status`

Conceptual flow:

```txt
status command
  ↓
read runtime state
  ↓
read store state
  ↓
read sync state
  ↓
read transport state
  ↓
read discovery state
  ↓
print summary
```

### `node info`

Conceptual flow:

```txt
node info command
  ↓
refresh metadata
  ↓
print node id
  ↓
print hostname
  ↓
print OS
  ↓
print version
  ↓
print capabilities
```

### `store put`

Conceptual flow:

```txt
store put key value
  ↓
create store operation
  ↓
WAL append, if enabled
  ↓
store apply
  ↓
sync tracking
  ↓
print result
```

### `store get`

Conceptual flow:

```txt
store get key
  ↓
store lookup
  ↓
print value or not_found
```

### `sync tick`

Conceptual flow:

```txt
sync tick
  ↓
retry expired work
  ↓
prune completed work, if requested
  ↓
select queued operations
  ↓
print tick result
```

### `peers`

Conceptual flow:

```txt
peers command
  ↓
read discovery registry
  ↓
read transport peer registry
  ↓
print known peers
```

## Runtime flow by module

| Module | Main runtime flow |
|---|---|
| `core` | Create safe primitives and structured errors |
| `wal` | Append, read, stream, replay records |
| `store` | Apply operations and expose current state |
| `sync` | Track operations and produce batches |
| `transport` | Connect peers and move messages |
| `discovery` | Announce, listen, probe, track peers |
| `metadata` | Build and refresh node identity |
| `cli` | Parse commands and call modules |

## Runtime flow rules

Softadastra runtime flow should follow these rules:

1. Local writes must not require the network.
2. WAL-backed writes must not ignore WAL failures.
3. Store must expose current state.
4. WAL must preserve operation history.
5. Sync must be observable.
6. Transport failure must not delete local state.
7. Discovery failure must not block local writes.
8. Metadata must describe nodes, not application data.
9. CLI must expose state clearly.
10. Errors must be explicit.

## Common wrong flows

Avoid this:

```txt
local write
  ↓
wait for remote server
  ↓
only then update local store
```

This is not local-first.

Avoid this:

```txt
WAL append failed
  ↓
store still reports durable success
```

This breaks durability.

Avoid this:

```txt
transport connection failed
  ↓
delete local operation
```

This loses local work.

Avoid this:

```txt
discovery returned no peers
  ↓
disable local store
```

This breaks offline-first behavior.

## Recommended mental model

Use this mental model:

```txt
Write locally.
Persist locally.
Track sync.
Send when possible.
Retry when needed.
Converge later.
```

Expanded:

```txt
Write locally
  -> store accepts state

Persist locally
  -> WAL records history

Track sync
  -> outbox remembers propagation work

Send when possible
  -> transport uses available peers

Retry when needed
  -> sync handles failure

Converge later
  -> remote nodes eventually receive operations
```

## Summary

Runtime flow explains how Softadastra Engine behaves during real work.

The key separation is:

```txt
WAL records operation history.
Store exposes current local state.
Sync tracks propagation work.
Transport sends messages.
Discovery finds peers.
Metadata describes nodes.
CLI exposes the runtime.
```

The most important rule is:

```txt
Local work must remain valid even when the network is unavailable.
```

## Next step

Continue with modules:

[Go to Modules](./modules.md)
