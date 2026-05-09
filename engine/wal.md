# WAL

`wal` is the Write-Ahead Log module of Softadastra Engine.

It records operations before higher-level systems rely on them.

The core rule is:

```txt
Record first.
Apply and sync after.
```

WAL gives Softadastra a durable operation history.

It is one of the most important modules for local-first and offline-first reliability.

## Why WAL exists

Softadastra is designed for environments where failures are normal:

- process restart
- network failure
- transport disconnect
- peer unavailable
- sync interruption
- power loss
- application crash

A local-first system must not lose accepted work just because the network failed.

The WAL solves this by recording operations locally before sync depends on them.

```txt
local operation
  ↓
WAL record
  ↓
store apply
  ↓
sync tracking
```

The WAL is the durable history of what happened.

## What WAL provides

The `wal` module provides:

- `WalConfig`
- `WalRecord`
- `WalWriter`
- `WalReader`
- `WalReplayer`
- `WalRecordType`
- `WalRecordStatus`
- record append
- record read
- record stream
- record replay
- event append

It allows the engine to:

- append operations
- assign sequence numbers
- attach timestamps
- flush records
- read records back
- stream records
- replay history
- recover local state
- inspect operation history

## What WAL does not do

`wal` must not:

- own current application state
- decide sync retries
- connect peers
- discover nodes
- resolve conflicts
- format CLI output
- own business logic

The rule is:

```txt
WAL records history.
Store exposes current state.
Sync tracks propagation.
Transport sends messages.
```

## Include

Use the top-level include:

```cpp
#include <softadastra/wal/Wal.hpp>
```

## Module location

The module lives in:

```txt
modules/wal/
```

Typical structure:

```txt
modules/wal/
├── include/
│   └── softadastra/wal/
│       ├── core/
│       ├── encoding/
│       ├── reader/
│       ├── replay/
│       ├── types/
│       ├── writer/
│       └── Wal.hpp
├── src/
├── examples/
├── tests/
├── README.md
├── CMakeLists.txt
└── CHANGELOG.md
```

The exact structure can evolve, but the responsibility should stay stable:

```txt
append, read, stream, and replay durable records
```

## Main concepts

The WAL module is built around five concepts:

- `WalConfig`
- `WalRecord`
- `WalWriter`
- `WalReader`
- `WalReplayer`

The normal flow is:

```txt
WalConfig
  ↓
WalWriter
  ↓
append record
  ↓
flush, if needed
  ↓
WalReader / WalReplayer later
```

## WalConfig

`WalConfig` configures how the WAL is used.

Common configuration shapes:

- durable file-backed WAL
- memory-only WAL, if supported
- auto flush behavior, if supported
- path to WAL file

Example:

```cpp
wal::core::WalConfig::durable("example_wal.log")
```

A durable WAL writes records to a local file.

## Durable WAL

A durable WAL uses a file path.

Example:

```cpp
writer::WalWriter writer{
    core::WalConfig::durable("example_wal.log")};
```

This means records are written to:

```txt
example_wal.log
```

A durable WAL is useful when operations must survive restart.

## WAL path rule

A WAL path should be:

- non-empty
- writable
- inside an existing directory
- unique per local node when used by a node runtime
- not manually edited by users

Good examples:

```txt
data/node-a.wal
data/sdk-persistent-store.wal
data/store_recovery_demo.wal
example_wal.log
```

Avoid:

- empty path
- shared path between unrelated nodes
- path in unwritable directory

## WalRecord

`WalRecord` is one entry in the log.

A record can contain:

- sequence
- type
- status
- timestamp
- payload

Conceptual shape:

```cpp
WalRecord {
    sequence
    type
    status
    timestamp
    payload
}
```

Each record is appended in order.

The sequence number gives deterministic ordering.

## WalRecordType

`WalRecordType` describes the kind of operation.

Common types include:

- `Put`
- `Update`
- `Delete`
- `Event`
- `Checkpoint`, if supported
- `Unknown`, if needed

The exact enum values depend on the current implementation.

Use the module helper when printing:

```cpp
types::to_string(record.type)
```

## WalRecordStatus

`WalRecordStatus` describes the status of a record.

Common statuses can include:

- `Pending`
- `Committed`
- `Applied`
- `Failed`

The exact enum values depend on the current implementation.

Use:

```cpp
types::to_string(record.status)
```

when printing status.

## Payload

The payload contains the encoded operation data.

Example:

```cpp
core::WalRecord::Payload{1, 2, 3}
```

The WAL does not need to understand every high-level meaning of the payload.

Higher-level modules can encode and decode their own operation data.

## Sequence

The sequence number gives every record a stable order.

Example output:

```txt
Written record seq=1
Written record seq=2
```

Recovery depends on deterministic sequence order.

```txt
same WAL
  ↓
same sequence order
  ↓
same replay order
```

## Timestamp

Each record should carry a timestamp.

The timestamp helps with:

- debugging
- recovery inspection
- sync diagnostics
- event history
- runtime observability

The timestamp should come from core time primitives.

## WalWriter

`WalWriter` appends records.

It owns write-side behavior:

- open WAL
- append record
- assign sequence
- write encoded bytes
- flush when requested
- return sequence or error

## Basic write example

```cpp
#include <filesystem>
#include <iostream>

#include <softadastra/wal/Wal.hpp>

using namespace softadastra::wal;

int main()
{
    std::cout << "== WAL WRITE EXAMPLE ==\n";

    const std::string path = "example_wal.log";
    std::filesystem::remove(path);

    writer::WalWriter writer{
        core::WalConfig::durable(path)};

    auto first = writer.append(
        types::WalRecordType::Put,
        core::WalRecord::Payload{1, 2, 3});

    if (first.is_err())
    {
        std::cerr << "Failed to write first record: "
                  << first.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Written record seq="
              << first.value()
              << "\n";

    auto second = writer.append(
        types::WalRecordType::Update,
        core::WalRecord::Payload{4, 5});

    if (second.is_err())
    {
        std::cerr << "Failed to write second record: "
                  << second.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Written record seq="
              << second.value()
              << "\n";

    auto flushed = writer.flush();

    if (flushed.is_err())
    {
        std::cerr << "Failed to flush WAL: "
                  << flushed.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "WAL written to: "
              << path
              << "\n";

    return 0;
}
```

## Append flow

A WAL append follows this model:

```txt
append requested
  ↓
validate record type and payload
  ↓
assign sequence number
  ↓
attach timestamp
  ↓
encode record
  ↓
write bytes
  ↓
return sequence
```

If auto flush or explicit flush is used:

```txt
write bytes
  ↓
flush file
  ↓
return durable result
```

## Flush

Flush forces written data to be pushed according to the current backend behavior.

Example:

```cpp
auto flushed = writer.flush();

if (flushed.is_err())
{
    std::cerr << flushed.error().message() << "\n";
}
```

Use flush when durability matters.

The important rule is:

```txt
If flush fails, durability is not guaranteed.
```

## WalReader

`WalReader` reads records back.

It owns read-side behavior:

- open WAL file
- read encoded records
- decode records
- return records
- report errors

## Basic read example

```cpp
#include <iostream>

#include <softadastra/wal/Wal.hpp>

using namespace softadastra::wal;

int main()
{
    std::cout << "== WAL READ EXAMPLE ==\n";

    const std::string path = "example_wal.log";

    reader::WalReader reader{path};

    auto records = reader.read_all();

    if (records.is_err())
    {
        std::cerr << "Failed to read WAL: "
                  << records.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Total records: "
              << records.value().size()
              << "\n\n";

    for (const auto &record : records.value())
    {
        std::cout << "Sequence:  "
                  << record.sequence
                  << "\n";

        std::cout << "Type:      "
                  << types::to_string(record.type)
                  << "\n";

        std::cout << "Status:    "
                  << types::to_string(record.status)
                  << "\n";

        std::cout << "Timestamp: "
                  << record.timestamp.millis()
                  << "\n";

        std::cout << "Payload:   ";

        for (auto byte : record.payload)
        {
            std::cout << static_cast<int>(byte) << ' ';
        }

        std::cout << "\n----------------------\n";
    }

    return 0;
}
```

## Read flow

Reading all records follows this model:

```txt
open WAL path
  ↓
read first record
  ↓
decode record
  ↓
validate record
  ↓
append to result list
  ↓
repeat until end
```

If reading fails:

```txt
read error
  ↓
return explicit error
```

If decoding fails:

```txt
decode error
  ↓
return explicit error or valid-prefix recovery result, depending on policy
```

The failure must be visible.

## Streaming records

`WalReader` can also stream records one by one.

This is useful when a WAL may be large.

## Stream example

```cpp
#include <iostream>

#include <softadastra/wal/Wal.hpp>

using namespace softadastra::wal;

int main()
{
    std::cout << "== WAL STREAM EXAMPLE ==\n";

    const std::string path = "example_wal.log";

    reader::WalReader reader{path};

    auto result = reader.for_each(
        [](const core::WalRecord &record)
        {
            std::cout << "[record] seq="
                      << record.sequence
                      << " type="
                      << types::to_string(record.type)
                      << " status="
                      << types::to_string(record.status)
                      << " timestamp="
                      << record.timestamp.millis()
                      << " payload_size="
                      << record.payload.size()
                      << "\n";
        });

    if (result.is_err())
    {
        std::cerr << "Failed to stream WAL: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    return 0;
}
```

## Streaming flow

Streaming follows this model:

```txt
open WAL
  ↓
read next record
  ↓
decode record
  ↓
call callback
  ↓
repeat
```

Streaming avoids loading all records into memory at once.

Use streaming for:

- large WAL files
- diagnostic tools
- incremental replay
- CLI inspection

## WalReplayer

`WalReplayer` replays records into another component.

Replay is used to rebuild state or apply history.

## Replay to store example

```cpp
#include <cstdint>
#include <filesystem>
#include <iostream>
#include <map>
#include <string>
#include <vector>

#include <softadastra/wal/Wal.hpp>

using namespace softadastra::wal;

class DemoStore
{
public:
    void apply(const core::WalRecord &record)
    {
        const std::string key =
            "record_" + std::to_string(record.sequence);

        switch (record.type)
        {
        case types::WalRecordType::Put:
        case types::WalRecordType::Update:
            data_[key] = record.payload;
            break;

        case types::WalRecordType::Delete:
            data_.erase(key);
            break;

        default:
            break;
        }
    }

    void print() const
    {
        std::cout << "\n== STORE STATE ==\n";

        if (data_.empty())
        {
            std::cout << "(empty)\n";
            return;
        }

        for (const auto &[key, value] : data_)
        {
            std::cout << key << " => [ ";

            for (auto byte : value)
            {
                std::cout << static_cast<int>(byte) << ' ';
            }

            std::cout << "]\n";
        }
    }

private:
    std::map<std::string, std::vector<std::uint8_t>> data_{};
};

int main()
{
    std::cout << "== WAL REPLAY TO STORE EXAMPLE ==\n";

    const std::string wal_path = "replay_store_example.log";
    std::filesystem::remove(wal_path);

    writer::WalWriter writer{
        core::WalConfig::durable(wal_path)};

    auto first = writer.append(
        types::WalRecordType::Put,
        core::WalRecord::Payload{10, 20, 30});

    auto second = writer.append(
        types::WalRecordType::Update,
        core::WalRecord::Payload{99, 88});

    auto third = writer.append(
        types::WalRecordType::Put,
        core::WalRecord::Payload{7, 8, 9, 10});

    if (first.is_err() || second.is_err() || third.is_err())
    {
        std::cerr << "Failed to write WAL records\n";
        return 1;
    }

    auto flushed = writer.flush();

    if (flushed.is_err())
    {
        std::cerr << "Failed to flush WAL: "
                  << flushed.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "WAL written to: "
              << wal_path
              << "\n";

    DemoStore store;
    replay::WalReplayer replayer{wal_path};

    std::cout << "\n== REPLAYING RECORDS ==\n";

    auto replay_result = replayer.replay(
        [&](const core::WalRecord &record)
        {
            std::cout << "Applying seq="
                      << record.sequence
                      << " type="
                      << types::to_string(record.type)
                      << " payload_size="
                      << record.payload.size()
                      << "\n";

            store.apply(record);
        });

    if (replay_result.is_err())
    {
        std::cerr << "Replay failed: "
                  << replay_result.error().message()
                  << "\n";

        return 1;
    }

    store.print();

    std::filesystem::remove(wal_path);

    return 0;
}
```

## Replay flow

Replay follows this model:

```txt
open WAL
  ↓
read record in sequence order
  ↓
decode record
  ↓
call apply callback
  ↓
continue until end
```

Replay is used for:

- store recovery
- diagnostics
- rebuilding state
- testing deterministic history
- migration tools later

## WAL and filesystem events

The WAL can also record filesystem events.

This is useful when Softadastra is used for file synchronization or local filesystem tracking.

## File event append example

```cpp
#include <filesystem>
#include <iostream>
#include <optional>

#include <softadastra/wal/Wal.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== WAL FILE EVENT EXAMPLE ==\n";

    const std::string path = "event_wal.log";
    std::filesystem::remove(path);

    wal::writer::WalWriter writer{
        wal::core::WalConfig::durable(path)};

    auto path_result =
        fs::path::Path::from("docs/file.txt");

    if (path_result.is_err())
    {
        std::cerr << "Invalid path: "
                  << path_result.error().message()
                  << "\n";

        return 1;
    }

    fs::state::FileMetadata metadata{};
    metadata.type = fs::types::FileType::File;
    metadata.size = 128;
    metadata.modified = core::time::Timestamp::now();

    fs::state::FileState state{
        path_result.value(),
        metadata,
        std::nullopt};

    fs::events::FileEvent event{
        fs::types::FileEventType::Created,
        state,
        std::nullopt};

    auto result = writer.append_event(event);

    if (result.is_err())
    {
        std::cerr << "Failed to append event: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Event written with seq="
              << result.value()
              << "\n";

    return 0;
}
```

## WAL and store

The store can use WAL-backed configuration.

Relationship:

```txt
WAL   -> operation history
Store -> current key-value state
```

A store operation can be recorded before it is applied.

```txt
store put
  ↓
operation encoded
  ↓
WAL append
  ↓
store apply
```

This allows recovery.

## WAL-backed store flow

```txt
StoreEngine::put(key, value)
  ↓
create Operation::Put
  ↓
encode operation
  ↓
append to WAL
  ↓
apply operation to current store
  ↓
return result
```

On restart:

```txt
open StoreEngine
  ↓
read WAL
  ↓
decode operations
  ↓
replay operations
  ↓
rebuild entries
```

## WAL and sync

Sync uses local operation history indirectly.

The WAL makes operations recoverable.

Sync makes operations propagatable.

```txt
WAL  -> local durability
Sync -> propagation tracking
```

A value can be durable locally but not yet synced remotely.

```txt
durable locally
  does not mean
acknowledged remotely
```

## WAL and transport

Transport does not write WAL directly in the clean model.

Better flow:

```txt
store operation
  ↓
WAL append
  ↓
sync tracking
  ↓
transport sends sync message
```

Transport failure should not affect already recorded WAL history.

## WAL and discovery

Discovery should not depend on WAL for local store behavior.

Discovery finds peers.

WAL records operations.

They are separate.

A higher-level diagnostic or service may record discovery events later, but generic discovery must not own WAL durability.

## WAL and metadata

Metadata describes the node.

WAL records history.

They are separate concerns.

A metadata snapshot can include the WAL path for diagnostics later, but metadata should not own WAL writing.

## WAL and CLI

CLI can expose WAL-backed behavior through commands.

Examples:

- `store put`
- `store get`
- `sync status`
- `status`

But WAL must not depend on CLI.

Correct direction:

```txt
CLI command
  ↓
store / wal module
```

Wrong direction:

```txt
wal module
  ↓
cli output
```

WAL should return structured results and errors.

## Durability rule

The most important WAL rule is:

```txt
Do not report durable success if the WAL append failed.
```

If WAL append fails:

```txt
operation requested
  ↓
WAL append fails
  ↓
return error
  ↓
do not pretend operation is durable
```

This protects local-first correctness.

## WAL failure versus transport failure

These failures are different.

```txt
WAL failure
  -> local durability problem

transport failure
  -> remote delivery problem
```

If transport fails after WAL succeeds:

```txt
local operation remains durable
sync can retry later
```

If WAL fails before store apply:

```txt
operation is not durably accepted
caller must see error
```

## Recovery rule

Recovery should be deterministic.

```txt
same WAL records
  ↓
same replay order
  ↓
same final state
```

This is why sequence numbers matter.

Do not replay records in random order.

## Valid-prefix recovery

If a WAL is partially corrupted, the safest model is:

```txt
read valid records
  ↓
stop at invalid record
  ↓
do not apply invalid bytes
  ↓
return clear error or partial recovery result
```

The engine should never silently apply corrupted records.

The exact recovery policy can evolve, but corruption must be visible.

## WAL file ownership

A WAL file should normally be owned by one local runtime or node.

Recommended:

```txt
one node -> one WAL path
```

Good:

```txt
data/node-a.wal
data/node-b.wal
```

Avoid two independent nodes writing the same WAL file unless the engine explicitly supports concurrent access.

## WAL cleanup

Examples may create temporary WAL files.

They can remove them when done:

```cpp
std::filesystem::remove(wal_path);
```

Production runtimes should not delete WAL files unless the operation is intentional.

A WAL contains recovery history.

## WAL compaction

Future versions may add compaction.

Compaction can reduce log size by replacing old operation history with a snapshot or checkpoint.

Possible flow:

```txt
WAL grows
  ↓
store snapshot created
  ↓
checkpoint record written
  ↓
old records compacted
```

Compaction must preserve recovery correctness.

## WAL checkpoints

A future checkpoint record can represent a known state.

Conceptual flow:

```txt
records 1..1000
  ↓
checkpoint at 1000
  ↓
future recovery starts from checkpoint
```

This can speed up recovery.

It must be carefully designed.

## WAL and snapshots

The store can build a snapshot from WAL history.

Flow:

```txt
read WAL records
  ↓
decode store operations
  ↓
apply in sequence
  ↓
produce snapshot
```

This is useful for diagnostics and recovery.

## Error handling

WAL operations should return explicit errors.

Example:

```cpp
auto result = writer.append(
    types::WalRecordType::Put,
    core::WalRecord::Payload{1, 2, 3});

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}
```

Possible errors:

- invalid path
- permission denied
- open failed
- write failed
- flush failed
- read failed
- decode failed
- corrupted record
- unsupported record version
- invalid payload

Do not hide WAL failures.

## Invalid WAL path

An empty path should be rejected.

Bad:

```txt
""
```

Good:

```txt
data/node-a.wal
```

The error should explain the problem:

```txt
invalid WAL path: path is empty
```

## Directory missing

If the WAL path is:

```txt
data/node-a.wal
```

and `data/` does not exist, opening or writing can fail.

Fix:

```bash
mkdir -p data
```

The error should be clear:

```txt
failed to open WAL path data/node-a.wal: directory does not exist
```

## Permission denied

If the process cannot write to the WAL path, return an error.

Example:

```txt
failed to append WAL record: permission denied
```

The caller should not treat the operation as accepted.

## Disk full

If the disk is full, append or flush can fail.

The engine should return a clear error.

Example:

```txt
failed to flush WAL: no space left on device
```

This is a serious durability problem.

## Decode failed

If reading a record fails during decode:

```txt
read bytes
  ↓
decode failed
  ↓
return error
```

Do not apply invalid records.

## Corrupted record

A corrupted record should be visible.

Example:

```txt
corrupted WAL record at sequence 42
```

or:

```txt
corrupted WAL record at byte offset 8192
```

Good diagnostics should include the sequence or file offset when available.

## WAL API reference

### Main areas

| Area | Purpose |
|---|---|
| `core` | WAL config and record primitives |
| `types` | Record types and statuses |
| `writer` | Append and flush records |
| `reader` | Read and stream records |
| `replay` | Replay records |
| `encoding` | Encode and decode records |

### Main types

| Type | Purpose |
|---|---|
| `WalConfig` | Configures WAL behavior |
| `WalRecord` | One log record |
| `WalWriter` | Appends records |
| `WalReader` | Reads records |
| `WalReplayer` | Replays records |
| `WalRecordType` | Type of record |
| `WalRecordStatus` | Status of record |

### Recommended public include

```cpp
#include <softadastra/wal/Wal.hpp>
```

## Examples

Current useful examples include:

- `wal_write.cpp`
- `wal_read.cpp`
- `wal_stream.cpp`
- `wal_replay_to_store.cpp`
- `wal_event.cpp`

Recommended order:

1. `wal_write.cpp`
2. `wal_read.cpp`
3. `wal_stream.cpp`
4. `wal_replay_to_store.cpp`
5. `wal_event.cpp`

This order moves from simple append to replay and file event recording.

## Run examples

From the engine repository:

```bash
cd ~/softadastra/softadastra
```

Build:

```bash
vix build
```

Or with CMake:

```bash
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

Find binaries:

```bash
find build-ninja -type f -executable
```

Run the relevant WAL example binary from the build output.

## Testing WAL

WAL tests should verify:

- append one record
- append multiple records
- sequence increments
- flush succeeds
- read all records
- stream records
- replay records
- invalid path returns error
- missing directory returns error
- corrupted record is detected
- empty WAL reads as empty
- large payload works
- delete record works

## WAL test flow

A good test flow:

```txt
create temp WAL path
append records
flush
read records
verify sequence
verify type
verify payload
cleanup temp WAL path
```

Another:

```txt
create temp WAL path
append records
replay records into test store
verify final state
cleanup
```

Another:

```txt
create corrupted WAL file
read WAL
expect explicit error
cleanup
```

## Design rules

The `wal` module should follow these rules:

1. Append records in deterministic order.
2. Assign stable sequence numbers.
3. Use core time for timestamps.
4. Return explicit errors.
5. Do not hide write or flush failures.
6. Do not own store behavior.
7. Do not own sync retry behavior.
8. Do not depend on transport or discovery.
9. Make replay deterministic.
10. Keep examples small.

## Common mistakes

### Treating WAL as current state

Wrong:

```txt
WAL is the database state
```

Better:

```txt
WAL is operation history
Store is current state
```

### Ignoring append errors

Wrong:

```cpp
writer.append(type, payload);
store.apply(operation);
```

Better:

```cpp
auto result = writer.append(type, payload);

if (result.is_err())
{
    return result.error();
}

store.apply(operation);
```

### Applying corrupted records

Wrong:

```txt
decode failed
  ↓
apply partial payload anyway
```

Better:

```txt
decode failed
  ↓
stop
  ↓
return error
```

### Sharing one WAL between independent nodes

Wrong:

```txt
node-a and node-b write data/shared.wal
```

Better:

```txt
node-a -> data/node-a.wal
node-b -> data/node-b.wal
```

### Making WAL depend on sync

Wrong:

```txt
wal module calls SyncEngine
```

Better:

```txt
store or runtime composes WAL and SyncEngine
```

### Making WAL print CLI output

Wrong:

```txt
WalWriter prints user-facing messages
```

Better:

```txt
WalWriter returns Result
CLI formats output
```

## Recommended usage pattern

For durable append:

```cpp
writer::WalWriter writer{
    core::WalConfig::durable("data/node-a.wal")};

auto result = writer.append(
    types::WalRecordType::Put,
    payload);

if (result.is_err())
{
    return 1;
}

auto flushed = writer.flush();

if (flushed.is_err())
{
    return 1;
}
```

For read:

```cpp
reader::WalReader reader{"data/node-a.wal"};

auto records = reader.read_all();

if (records.is_err())
{
    return 1;
}
```

For replay:

```cpp
replay::WalReplayer replayer{"data/node-a.wal"};

auto result = replayer.replay(
    [&](const core::WalRecord &record)
    {
        // apply record
    });

if (result.is_err())
{
    return 1;
}
```

## Summary

`wal` is the durability module of Softadastra Engine.

It provides:

- `WalConfig`
- `WalRecord`
- `WalWriter`
- `WalReader`
- `WalReplayer`
- append
- flush
- read
- stream
- replay

The key idea is:

```txt
WAL records durable operation history before sync depends on it.
```

WAL does not own current state, networking, discovery, or conflict resolution.

## Next step

Continue with store:

[Go to Store](./store)
