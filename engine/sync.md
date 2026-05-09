# Sync

`sync` is the operation propagation module of Softadastra Engine.

It tracks local operations that need to move to other nodes.

The core rule is:

```txt
Sync decides what should be sent.
Transport sends it.
```

Sync is not the network layer.

Sync is the layer that keeps propagation state visible, retryable, and deterministic.

## Why sync exists

Softadastra is local-first.

A local write can happen before any peer is available.

Example:

```txt
put user:1 = Gaspard
```

That value can be stored locally first.

But later, the operation may need to reach another node.

Sync exists to track that work.

```txt
local operation
  ↓
store apply
  ↓
sync operation
  ↓
outbox
  ↓
queue
  ↓
batch
  ↓
transport later
```

The sync module makes delayed propagation explicit.

## What sync provides

The sync module provides:

```txt
SyncConfig
SyncContext
SyncEngine
SyncOperation
SyncScheduler
AckTracker
ConflictResolver
outbox
queue
retry
ACK tracking
remote apply
conflict policy
tick
```

It allows the engine to:

- submit local operations
- assign sync ids
- track operation versions
- queue operations
- produce batches
- retry expired work
- track acknowledgements
- receive remote operations
- resolve conflicts
- report sync state

## What sync does not do

sync must not:

- open TCP sockets
- send UDP packets
- discover peers
- own transport connections
- own CLI parsing
- format terminal output
- hide failed operations
- delete local state on network failure

The rule is:

```txt
Store applies local state.
Sync tracks propagation.
Transport delivers messages.
Discovery finds peers.
Metadata describes nodes.
```

## Include

Use the top-level include:

```cpp
#include <softadastra/sync/Sync.hpp>
```

## Module location

The module lives in:

```txt
modules/sync/
```

Typical structure:

```txt
modules/sync/
├── include/
│   └── softadastra/sync/
│       ├── ack/
│       ├── conflict/
│       ├── core/
│       ├── engine/
│       ├── outbox/
│       ├── scheduler/
│       ├── types/
│       └── Sync.hpp
├── src/
├── examples/
├── tests/
├── README.md
├── CMakeLists.txt
└── CHANGELOG.md
```

The exact structure can evolve, but the responsibility should stay stable:

track operation propagation and make sync state observable.

## Main concepts

The sync module is built around these concepts:

```txt
SyncConfig
SyncContext
SyncEngine
SyncOperation
Outbox
Queue
Batch
ACK
Retry
Conflict
Tick
```

The normal flow is:

```txt
store operation
  ↓
submit local operation
  ↓
sync operation created
  ↓
outbox entry created
  ↓
operation queued
  ↓
next batch
  ↓
transport can send
```

## SyncConfig

SyncConfig configures sync behavior.

It can define:

```txt
node id
durability mode
auto queue behavior
ACK requirement
ACK timeout
retry interval
maximum retries
conflict policy
batch size
```

Example:

```cpp
auto config =
    sync::core::SyncConfig::durable("node-a");
```

The node id matters because sync operations need an origin.

### Node id

Every sync operation should know where it came from.

Example:

```txt
node-a
```

A local operation submitted by node-a can later be identified as coming from that node.

The node id is used for:

- operation origin
- version ownership
- conflict resolution
- diagnostics
- ACK tracking
- transport messages

Good node ids:

```txt
node-a
node-local
drive-client
metadata-node
desktop-1
```

Avoid empty node ids.

## SyncContext

SyncContext wires the sync engine to the local store and configuration.

Example:

```cpp
sync::core::SyncContext context{store, config};
```

A valid context needs:

- store engine
- sync config
- valid node id
- valid sync settings

Example validation:

```cpp
if (!context.is_valid())
{
    std::cerr << "invalid sync context\n";
    return 1;
}
```

## SyncEngine

SyncEngine is the main runtime object of the sync module.

It owns sync state.

It can:

- submit local operations
- receive remote operations
- queue operations
- produce next batch
- retry expired operations
- track ACKs
- report state

Example:

```cpp
sync::engine::SyncEngine engine{context};
```

## SyncOperation

SyncOperation is the propagation unit.

It wraps a store operation with sync metadata.

A sync operation can contain:

```txt
sync id
origin node id
version
store operation
timestamp
status
retry count
```

The exact fields depend on the current implementation.

The important point is:

```txt
store operation says what changed
sync operation says how that change propagates
```

## Local operation submit flow

A local store operation becomes sync work through `submit_local_operation`.

Flow:

```txt
store Operation
  ↓
SyncEngine::submit_local_operation
  ↓
SyncOperation created
  ↓
sync id assigned
  ↓
version assigned
  ↓
outbox entry inserted
  ↓
operation queued, if auto_queue is enabled
```

## Basic sync example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== BASIC SYNC EXAMPLE ==\n";

    const std::string wal_path = "basic_sync_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto config =
        sync::core::SyncConfig::durable("node-a");

    sync::core::SyncContext context{store, config};

    if (!context.is_valid())
    {
        std::cerr << "invalid sync context\n";
        return 1;
    }

    sync::engine::SyncEngine engine{context};

    auto operation = store::core::Operation::put(
        store::types::Key{"user:1"},
        store::types::Value::from_string("Gaspard"));

    auto submitted = engine.submit_local_operation(operation);

    if (submitted.is_err())
    {
        std::cerr << "submit failed: "
                  << submitted.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Submitted sync id: "
              << submitted.value().sync_id
              << "\n";

    auto batch = engine.next_batch();

    std::cout << "Batch size: "
              << batch.size()
              << "\n";

    for (const auto &envelope : batch)
    {
        std::cout << "Ready to send: "
                  << envelope.operation.sync_id
                  << " version="
                  << envelope.operation.version
                  << "\n";
    }

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Outbox

The outbox stores operations that need propagation.

It can contain entries in states such as:

```txt
queued
in-flight
acknowledged
failed
```

The outbox answers:

- what work is pending?
- what work is ready?
- what work is waiting for ACK?
- what work failed?

This is why sync state is observable.

## Queue

Queued operations are ready to be selected for a batch.

Flow:

```txt
operation submitted
  ↓
outbox entry created
  ↓
queued
  ↓
next_batch selects it
```

If auto_queue is disabled, operations can be submitted without being queued immediately.

### Manual queue example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== MANUAL QUEUE EXAMPLE ==\n";

    const std::string wal_path = "manual_queue_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto config =
        sync::core::SyncConfig::durable("node-a");

    config.auto_queue = false;

    sync::core::SyncContext context{store, config};
    sync::engine::SyncEngine engine{context};

    auto operation = store::core::Operation::put(
        store::types::Key{"manual:key"},
        store::types::Value::from_string("manual-value"));

    auto submitted = engine.submit_local_operation(operation);

    if (submitted.is_err())
    {
        std::cerr << "submit failed\n";
        return 1;
    }

    std::cout << "Queued before manual queue: "
              << engine.state().queued_count
              << "\n";

    const auto &sync_id = submitted.value().sync_id;

    if (!engine.queue_operation(sync_id))
    {
        std::cerr << "failed to queue operation\n";
        return 1;
    }

    std::cout << "Queued after manual queue: "
              << engine.state().queued_count
              << "\n";

    auto batch = engine.next_batch();

    std::cout << "Batch size: "
              << batch.size()
              << "\n";

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Batch

A batch is a group of sync operations ready to send.

Flow:

```txt
queued operations
  ↓
next_batch
  ↓
batch of envelopes
  ↓
transport can send
```

A batch can exist even when transport is disabled.

That matters because sync and transport are separate.

```txt
Sync produces batches.
Transport delivers batches.
```

## SyncScheduler

SyncScheduler runs one sync tick.

A tick can:

- retry expired operations
- prune acknowledged operations
- select queued operations
- produce a batch
- return tick information

The scheduler is useful when the application wants a deterministic manual sync step.

### Scheduler tick example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== SYNC SCHEDULER TICK EXAMPLE ==\n";

    const std::string wal_path = "scheduler_tick_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto config =
        sync::core::SyncConfig::durable("node-a");

    sync::core::SyncContext context{store, config};
    sync::engine::SyncEngine engine{context};
    sync::scheduler::SyncScheduler scheduler{engine};

    auto operation = store::core::Operation::put(
        store::types::Key{"task:1"},
        store::types::Value::from_string("sync-me"));

    auto submitted = engine.submit_local_operation(operation);

    if (submitted.is_err())
    {
        std::cerr << "submit failed\n";
        return 1;
    }

    auto tick = scheduler.tick(false);

    std::cout << "Tick batch size: "
              << tick.batch_size()
              << "\n";

    std::cout << "Tick has work: "
              << tick.has_work()
              << "\n";

    for (const auto &envelope : tick.batch)
    {
        std::cout << "Transport should send: "
                  << envelope.operation.sync_id
                  << "\n";
    }

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Tick flow

A sync tick follows this model:

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
return tick result
```

A tick should expose:

- retried count
- pruned count
- batch size
- has work

Manual tick behavior makes sync easier to test.

## AckTracker

AckTracker tracks operations waiting for acknowledgement.

ACKs are useful when a sender needs to know that a remote node received or applied an operation.

Flow:

```txt
operation sent
  ↓
track sync id
  ↓
wait for ACK
  ↓
ACK received
  ↓
mark acknowledged
  ↓
prune later
```

### ACK tracker example

```cpp
#include <iostream>

#include <softadastra/sync/Sync.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== ACK TRACKER EXAMPLE ==\n";

    sync::ack::AckTracker tracker;

    tracker.track(
        "node-a-1",
        core::time::Duration::from_seconds(10));

    std::cout << "Tracked count: "
              << tracker.size()
              << "\n";

    std::cout << "Waiting: "
              << tracker.is_waiting("node-a-1")
              << "\n";

    tracker.ack("node-a-1");

    std::cout << "Acknowledged: "
              << tracker.acknowledged("node-a-1")
              << "\n";

    auto removed = tracker.prune_received();

    std::cout << "Removed: "
              << removed
              << "\n";

    return tracker.empty() ? 0 : 1;
}
```

## ACK timeout

If an operation requires ACK and none arrives before timeout:

```txt
operation in-flight
  ↓
ACK timeout reached
  ↓
operation becomes retry candidate
  ↓
retry policy decides next step
```

This keeps failed delivery visible.

## Retry

Retry moves expired or failed in-flight work back into the queue when allowed.

Flow:

```txt
operation sent
  ↓
ACK timeout or delivery failure
  ↓
retry count checked
  ↓
operation re-queued
  ↓
next tick can send again
```

If retry limit is reached:

```txt
max retries reached
  ↓
operation marked failed
  ↓
failed_count increases
```

Failed sync does not mean local data is lost.

It means propagation failed.

### Retry example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== SYNC RETRY EXAMPLE ==\n";

    const std::string wal_path = "retry_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto config = sync::core::SyncConfig::fast("node-a");
    config.require_ack = true;
    config.max_retries = 3;
    config.ack_timeout = core::time::Duration::from_millis(1);
    config.retry_interval = core::time::Duration::from_millis(1);

    sync::core::SyncContext context{store, config};
    sync::engine::SyncEngine engine{context};

    auto operation = store::core::Operation::put(
        store::types::Key{"retry:key"},
        store::types::Value::from_string("retry-value"));

    auto submitted = engine.submit_local_operation(operation);

    if (submitted.is_err())
    {
        std::cerr << "submit failed\n";
        return 1;
    }

    auto batch = engine.next_batch();

    std::cout << "Initial batch size: "
              << batch.size()
              << "\n";

    auto retried = engine.retry_expired();

    std::cout << "Retried count: "
              << retried
              << "\n";

    std::cout << "Outbox size: "
              << engine.state().outbox_size
              << "\n";

    std::filesystem::remove(wal_path);

    return 0;
}
```

## ConflictResolver

ConflictResolver decides what happens when a remote operation conflicts with local state.

A conflict can happen when:

- local node changed a key
- remote node also changed the same key
- operations arrive in different order
- versions differ
- timestamps differ

Conflict resolution must be deterministic.

### Conflict policy

A conflict policy defines the decision rule.

Possible policies include:

```txt
LastWriteWins
KeepLocal
ApplyRemote
Custom, later
```

The current implementation may support a subset.

The important rule is:

> conflict decisions should be explicit and inspectable

### Conflict example

```cpp
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== CONFLICT POLICY EXAMPLE ==\n";

    auto local_entry = store::core::Entry::make(
        store::types::Key{"doc:1"},
        store::types::Value::from_string("local"),
        1);

    auto remote_operation = store::core::Operation::put(
        store::types::Key{"doc:1"},
        store::types::Value::from_string("remote"));

    auto resolution =
        sync::conflict::ConflictResolver::resolve(
            local_entry,
            remote_operation,
            sync::types::ConflictPolicy::LastWriteWins,
            "node-a",
            "node-b");

    std::cout << "Conflict detected: "
              << resolution.conflict_detected
              << "\n";

    std::cout << "Apply remote: "
              << resolution.apply_remote
              << "\n";

    std::cout << "Keep local: "
              << resolution.keep_local
              << "\n";

    return resolution.is_valid() ? 0 : 1;
}
```

## Remote apply

Remote apply receives an operation from another node and applies it locally when allowed.

Flow:

```txt
remote sync operation received
  ↓
validate operation
  ↓
detect conflict
  ↓
apply conflict policy
  ↓
apply store operation, if accepted
  ↓
return apply result
```

### Remote apply example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== REMOTE APPLY EXAMPLE ==\n";

    const std::string wal_path = "remote_apply_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto config =
        sync::core::SyncConfig::durable("node-local");

    sync::core::SyncContext context{store, config};
    sync::engine::SyncEngine engine{context};

    auto remote_store_operation = store::core::Operation::put(
        store::types::Key{"remote:user:1"},
        store::types::Value::from_string("Remote value"));

    auto remote_sync_operation =
        sync::core::SyncOperation::remote(
            "node-remote-1",
            "node-remote",
            1,
            remote_store_operation);

    auto result =
        engine.receive_remote_operation(remote_sync_operation);

    if (result.is_err())
    {
        std::cerr << "remote apply failed: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    if (result.value().applied)
    {
        std::cout << "Remote operation applied\n";
    }

    auto entry = store.get(
        store::types::Key{"remote:user:1"});

    if (entry.has_value())
    {
        std::cout << "Stored value: "
                  << entry->value.to_string()
                  << "\n";
    }

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Sync state

The sync engine should expose state.

Useful fields include:

```txt
outbox_size
queued_count
in_flight_count
acknowledged_count
failed_count
last_submitted_version
last_applied_remote_version
total_retries
```

The exact fields depend on the current implementation.

The important idea is:

> sync must be observable

A developer should be able to inspect what is pending, queued, acknowledged, or failed.

### Outbox size

`outbox_size` tells how much work is tracked by sync.

Example: `outbox_size = 1`

This means sync knows about one operation. It does not mean the operation has been delivered.

### Queued count

`queued_count` tells how much work is ready for a batch.

Example: `queued_count = 1`

This means `next_batch()` can likely produce work.

### In-flight count

`in_flight_count` tells how many operations are currently sent or waiting for ACK.

This matters when ACK tracking is enabled.

### Acknowledged count

`acknowledged_count` tells how many operations have been acknowledged.

Acknowledged operations can be pruned later when safe.

### Failed count

`failed_count` tells how many operations failed propagation.

A failed sync operation does not automatically delete local store data.

It means propagation failed.

## Sync and store

Store and sync are connected but separate.

```txt
Store -> current local state
Sync  -> propagation state
```

A store operation can become sync work:

```txt
Operation::Put
  ↓
SyncOperation
  ↓
Outbox
```

The store should not decide retry policy.

The sync module should not own current key-value state.

## Sync and WAL

WAL makes operations durable.

Sync makes operations propagatable.

```txt
WAL  -> local operation history
Sync -> propagation tracking
```

A local operation can be:

- durable locally
- pending remotely

This distinction is important.

## Sync and transport

Transport delivers sync batches.

Relationship:

```txt
SyncEngine::next_batch()
  ↓
TransportEngine::send_sync_batch()
```

Sync does not open sockets.

Transport does not decide conflict resolution.

## Sync and discovery

Discovery finds peers.

Sync does not find peers.

Flow:

```txt
Discovery finds peer
  ↓
Transport connects peer
  ↓
Sync batch sent to peer
```

No peers means sync work may remain pending.

It does not mean local data is invalid.

## Sync and metadata

Metadata describes nodes.

Sync uses node identity.

Example:

```txt
metadata node id = node-a
sync operation origin = node-a
```

Metadata can help make sync diagnostics easier to understand.

## Sync and CLI

CLI can expose sync commands.

Correct direction:

```txt
CLI command
  ↓
SyncEngine
```

Wrong direction:

```txt
SyncEngine
  ↓
CLI output
```

Sync should return structured state.

CLI should format it.

## Sync and SDK

The SDK wraps sync behind simpler methods.

C++ SDK:

```txt
client.sync_state()
client.tick()
```

JavaScript SDK:

```txt
client.syncStateInfo()
client.tick()
```

The SDK should hide lower-level wiring.

The engine keeps sync behavior explicit.

## Local-first behavior

Sync must not block local writes.

Correct behavior:

```txt
local write
  ↓
store apply
  ↓
sync track
  ↓
network can fail later
```

Wrong behavior:

```txt
local write
  ↓
wait for remote peer
  ↓
only then apply locally
```

That is not local-first.

## Offline behavior

When offline:

```txt
local write still works
sync operation enters outbox
transport is unavailable
operation remains pending
retry later
```

Offline is a normal state.

The sync module should expose it clearly.

## Retry behavior

Retry should be controlled by configuration.

Important settings:

```txt
require_ack
ack_timeout
retry_interval
max_retries
```

A good retry system should answer:

- how many retries happened?
- which operations failed?
- which operations are still queued?
- when will they be retried?

## ACK behavior

ACK behavior should be optional.

Some flows may require ACKs. Some may only need best-effort delivery.

When ACKs are enabled, sync should track waiting operations.

When ACKs are disabled, sync may mark work differently after batch selection.

The policy should be explicit.

## Conflict behavior

Conflict behavior should be deterministic.

Good conflict resolution:

```txt
same local entry
same remote operation
same policy
  ↓
same decision
```

Avoid hidden random conflict behavior.

## Remote operation validation

Remote operations should be validated before apply.

Reject operations with:

- empty sync id
- empty origin node id
- invalid version
- invalid store operation
- invalid key
- invalid payload

Invalid remote operations should not corrupt local state.

## Sync errors

Sync should return explicit errors.

Possible errors:

```txt
invalid sync context
invalid node id
invalid local operation
invalid remote operation
operation not found
queue failed
retry failed
conflict resolution failed
store apply failed
ACK tracking failed
```

Do not hide sync failures.

### Invalid context

A sync context is invalid if required dependencies are missing or configuration is bad.

Example:

```cpp
if (!context.is_valid())
{
    std::cerr << "invalid sync context\n";
    return 1;
}
```

The error should identify the real problem when possible.

### Invalid operation

An invalid operation should not enter the outbox.

Bad:

```txt
invalid operation
  ↓
queued anyway
```

Better:

```txt
invalid operation
  ↓
return error
  ↓
outbox unchanged
```

### Operation not found

Manual queue or ACK operations may reference unknown sync ids.

The result should be clear.

Example:

```txt
sync operation not found: node-a-42
```

### Retry exhausted

When max retries is reached:

```txt
operation retry count >= max_retries
  ↓
mark failed
  ↓
failed count increases
```

Failed work should remain inspectable.

### Conflict failure

If conflict resolution cannot decide safely, the operation should not be applied silently.

Return a clear error or resolution result.

### Store apply failure

Remote apply can fail if the underlying store rejects the operation.

The sync engine should return the store error with context.

Example:

```txt
remote apply failed: invalid key
```

## Examples

Current useful examples include:

```txt
ack_tracker.cpp
basic_sync.cpp
conflict_policy.cpp
manual_queue.cpp
remote_apply.cpp
retry.cpp
scheduler_tick.cpp
```

Recommended order:

1. `basic_sync.cpp`
2. `manual_queue.cpp`
3. `scheduler_tick.cpp`
4. `ack_tracker.cpp`
5. `retry.cpp`
6. `conflict_policy.cpp`
7. `remote_apply.cpp`

This order moves from local operation tracking to remote application.

## Run examples

From the engine repository:

```sh
cd ~/softadastra/softadastra
```

Build:

```sh
vix build
```

Or with CMake:

```sh
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

Find binaries:

```sh
find build-ninja -type f -executable
```

Run the relevant sync example binary from the build output.

## Testing sync

Sync tests should verify:

- valid context
- invalid context
- submit local operation
- auto queue enabled
- auto queue disabled
- manual queue
- next batch
- scheduler tick
- ACK track
- ACK receive
- ACK prune
- retry expired
- retry exhausted
- remote apply
- conflict resolution
- invalid remote operation
- state counters

### Good sync test flow

Basic submit test:

```txt
create store
create sync config
create sync engine
submit local operation
expect outbox size = 1
expect queued count = 1
```

Manual queue test:

```txt
auto_queue = false
submit operation
expect queued count = 0
queue operation manually
expect queued count = 1
```

Retry test:

```txt
require ACK
submit operation
create batch
wait until timeout
retry expired
expect retried count > 0
```

Remote apply test:

```txt
create remote operation
receive remote operation
expect store contains remote value
```

Conflict test:

```txt
create local entry
create remote operation
resolve conflict
expect deterministic decision
```

## Design rules

The sync module should follow these rules:

1. Track propagation, not transport.
2. Keep sync state observable.
3. Keep local writes independent from network.
4. Use explicit sync ids.
5. Use deterministic versions.
6. Return explicit errors.
7. Keep retry policy configurable.
8. Keep ACK behavior explicit.
9. Keep conflict resolution deterministic.
10. Do not hide failed operations.

## Common mistakes

### Making sync open network sockets

Wrong:

```txt
SyncEngine opens TCP connection
```

Better:

```txt
SyncEngine produces batch
TransportEngine sends batch
```

### Treating sync failure as local data loss

Wrong:

```txt
sync failed
  ↓
delete local value
```

Better:

```txt
sync failed
  ↓
mark propagation failed
  ↓
local store remains valid
```

### Hiding failed operations

Wrong:

```txt
retry exhausted
  ↓
drop operation silently
```

Better:

```txt
retry exhausted
  ↓
mark failed
  ↓
failed_count increases
```

### Making discovery required

Wrong:

```txt
no peer discovered
  ↓
cannot write locally
```

Better:

```txt
no peer discovered
  ↓
write locally
  ↓
sync later
```

### Making conflict resolution random

Wrong:

```txt
sometimes local wins, sometimes remote wins
```

Better:

```txt
policy decides deterministically
```

### Ignoring ACK timeout

If ACKs are required, missing ACKs must be visible.

## Recommended usage pattern

Create store and sync engine:

```cpp
store::engine::StoreEngine store{
    store::core::StoreConfig::durable("data/node-a.wal")};

auto config =
    sync::core::SyncConfig::durable("node-a");

sync::core::SyncContext context{store, config};

if (!context.is_valid())
{
    return 1;
}

sync::engine::SyncEngine engine{context};
```

Submit local operation:

```cpp
auto operation = store::core::Operation::put(
    store::types::Key{"user:1"},
    store::types::Value::from_string("Gaspard"));

auto submitted = engine.submit_local_operation(operation);

if (submitted.is_err())
{
    return 1;
}
```

Create batch:

```cpp
auto batch = engine.next_batch();

for (const auto &envelope : batch)
{
    // transport can send envelope.operation
}
```

Run tick:

```cpp
sync::scheduler::SyncScheduler scheduler{engine};

auto tick = scheduler.tick(false);

if (tick.has_work())
{
    // send tick.batch through transport
}
```

## API reference

Main areas:

| Area | Purpose |
|------|---------|
| core | Sync config, context, operation |
| engine | SyncEngine |
| scheduler | Manual sync tick |
| ack | ACK tracking |
| conflict | Conflict resolution |
| types | Sync types and policies |
| outbox | Propagation state |

### Main types

| Type | Purpose |
|------|---------|
| SyncConfig | Configures sync behavior |
| SyncContext | Wires sync to store and config |
| SyncEngine | Main sync runtime |
| SyncOperation | Propagation operation |
| SyncScheduler | Runs manual ticks |
| AckTracker | Tracks acknowledgements |
| ConflictResolver | Resolves local/remote conflicts |
| ConflictPolicy | Defines conflict rule |

### Common methods

| Method | Purpose |
|--------|---------|
| submit_local_operation(operation) | Track a local operation |
| next_batch() | Return queued operations ready to send |
| queue_operation(sync_id) | Queue an operation manually |
| retry_expired() | Retry expired in-flight work |
| receive_remote_operation(operation) | Apply remote sync operation |
| state() | Inspect sync state |

Only document a method as stable when it exists in the current public API.

## Summary

sync is the operation propagation module of Softadastra Engine.

It provides:

```txt
SyncConfig
SyncContext
SyncEngine
SyncOperation
SyncScheduler
AckTracker
ConflictResolver
outbox
queue
retry
ACK tracking
remote apply
```

The key idea is:

> Sync makes local operations visible, queued, retryable, and ready for transport.

It does not open sockets, discover peers, or own application state.

## Next step

Continue with transport:

[Go to Transport](./transport)
