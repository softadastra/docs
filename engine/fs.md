# Filesystem

`fs` is the filesystem observation module of Softadastra Engine.

It provides a portable and deterministic way to observe local filesystem state.

The core rule is:

```txt
FS observes changes.
FS does not sync files by itself.
```

The filesystem module is useful for file synchronization, backup tools, local indexing, watchers, and any feature that needs to understand what changed on disk.

## Why fs exists

Softadastra is local-first.

Some local-first systems need to observe files:

```txt
documents
folders
local app data
user files
cached assets
metadata files
sync folders
```

Operating systems expose filesystem events differently.

Linux uses one API. macOS uses another. Windows uses another. Polling may be needed as a fallback.

The fs module gives Softadastra one consistent model:

```txt
Path
Snapshot
Diff
Event
Watcher
```

Instead of letting every higher-level module handle filesystem differences, fs centralizes filesystem observation.

## What fs provides

The fs module provides:

```txt
Path
Scanner
Snapshot
SnapshotBuilder
SnapshotDiff
Watcher
FileEvent
EventBatch
FileState
FileMetadata
FileType
```

These primitives let the engine:

- normalize paths
- scan directories
- build snapshots
- compare snapshots
- detect created files
- detect updated files
- detect deleted files
- watch folders
- emit deterministic events

## What fs does not do

fs must not:

- sync files over the network
- decide conflict resolution
- write application data
- own WAL persistence
- own sync policy
- connect peers
- discover peers
- own CLI command behavior

The rule is:

```txt
fs observes.
sync decides.
transport sends.
store persists state.
```

## Include

Use the top-level include:

```cpp
#include <softadastra/fs/Fs.hpp>
```

## Module location

The module lives in:

```txt
modules/fs/
```

Typical structure:

```txt
modules/fs/
├── include/
│   └── softadastra/fs/
│       ├── events/
│       ├── path/
│       ├── scanner/
│       ├── snapshot/
│       ├── state/
│       ├── types/
│       ├── utils/
│       ├── watcher/
│       └── Fs.hpp
├── platform/
│   ├── linux/
│   ├── mac/
│   └── windows/
├── src/
├── README.md
├── CMakeLists.txt
└── CHANGELOG.md
```

The exact structure can evolve, but the responsibility should stay stable: observe the filesystem and produce structured state or events.

## Main concepts

The filesystem module is built around five concepts:

```txt
Path
FileState
Snapshot
Diff
Watcher
```

The flow is:

```txt
Path
  ↓
Scanner
  ↓
Snapshot
  ↓
SnapshotDiff
  ↓
FileEvent / EventBatch
```

For real-time behavior:

```txt
Watcher
  ↓
scan current state
  ↓
compare with previous state
  ↓
emit events
```

## Path

Path is the strong path abstraction.

It avoids passing raw strings everywhere.

Example:

```cpp
auto root_result = softadastra::fs::path::Path::from("./data");
```

A path should be: validated, normalized, comparable, safe to pass across fs APIs.

### Path example

```cpp
#include <iostream>

#include <softadastra/fs/Fs.hpp>

using namespace softadastra::fs;

int main()
{
    auto result = path::Path::from("./data");

    if (result.is_err())
    {
        std::cerr << "Invalid path: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    auto root = result.value();

    std::cout << "Path: "
              << root.str()
              << "\n";

    return 0;
}
```

### Path rules

Use Path instead of raw strings inside the filesystem module.

Good:

```cpp
auto root = path::Path::from("./data");
```

Avoid passing raw strings deep into fs logic.

Bad (unless the API intentionally accepts strings for convenience):

```cpp
Scanner::scan("./data");
```

## FileMetadata

FileMetadata describes a file or directory.

It can include: type, size, modified timestamp.

Example conceptual shape:

```txt
FileMetadata {
    type
    size
    modified
}
```

The metadata helps detect changes between snapshots.

## FileType

FileType identifies what kind of filesystem entry exists.

Common types:

```txt
File
Directory
Symlink
Other
```

The exact enum values depend on the current implementation.

Use the module helpers to convert types to strings when printing:

```cpp
types::to_string(file.metadata.type)
```

## FileState

FileState represents the state of one filesystem entry.

It usually includes: path, metadata, optional content hash or extra state.

Conceptual shape:

```txt
FileState {
    path
    metadata
    hash
}
```

A snapshot is a collection of file states.

## Snapshot

A Snapshot represents the filesystem at one moment.

It answers:

- which files exist?
- what paths exist?
- what type is each entry?
- what size is each file?
- when was it modified?

A snapshot is useful because it gives a stable view that can be compared later.

### Build a snapshot

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

    auto result =
        snapshot::SnapshotBuilder::build(root_result.value());

    if (result.is_err())
    {
        std::cerr << "Error: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    const auto &snap = result.value();

    for (const auto &[_, state] : snap.all())
    {
        std::cout
            << types::to_string(state.metadata.type)
            << " | "
            << state.path.str()
            << " | "
            << state.metadata.size
            << " bytes\n";
    }

    return 0;
}
```

## Scanner

Scanner reads a directory and produces a snapshot.

Use it when you want a direct scan API:

```cpp
auto result = scanner::Scanner::scan(root);
```

The scanner should return explicit errors when scanning fails.

Possible failures:

- invalid path
- path does not exist
- permission denied
- filesystem error
- unsupported file type

### Scan example

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

    auto root = root_result.value();

    auto result = scanner::Scanner::scan(root);

    if (result.is_err())
    {
        std::cerr << "Error: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    const auto &snapshot = result.value();

    for (const auto &[_, file] : snapshot.all())
    {
        std::cout
            << types::to_string(file.metadata.type)
            << " | "
            << file.path.str()
            << " | "
            << file.metadata.size
            << " bytes\n";
    }

    return 0;
}
```

## SnapshotDiff

SnapshotDiff compares two filesystem states.

It answers:

- what was created?
- what was updated?
- what was deleted?

The flow is:

```txt
before snapshot
  ↓
after snapshot
  ↓
SnapshotDiff::compute
  ↓
events
```

### Diff example

```cpp
#include <iostream>
#include <thread>

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

    auto root = root_result.value();

    auto before_result = snapshot::SnapshotBuilder::build(root);

    if (before_result.is_err())
    {
        std::cerr << "Error building snapshot before\n";
        return 1;
    }

    auto before = std::move(before_result.value());

    std::cout << "Modify files now...\n";
    std::this_thread::sleep_for(std::chrono::seconds(5));

    auto after_result = snapshot::SnapshotBuilder::build(root);

    if (after_result.is_err())
    {
        std::cerr << "Error building snapshot after\n";
        return 1;
    }

    auto after = std::move(after_result.value());

    auto events =
        snapshot::SnapshotDiff::compute(
            before.all(),
            after.all());

    for (const auto &event : events)
    {
        std::cout << "Change: "
                  << types::to_string(event.type)
                  << " "
                  << event.current.path.str()
                  << "\n";
    }

    return 0;
}
```

## FileEvent

A FileEvent represents one filesystem change.

It can describe: Created, Updated, Deleted.

Conceptual shape:

```txt
FileEvent {
    type
    current
    previous
}
```

For created files:

```txt
type = Created
current = new state
previous = empty
```

For updated files:

```txt
type = Updated
current = new state
previous = old state
```

For deleted files:

```txt
type = Deleted
current = deleted state or previous state
previous = old state
```

The exact representation depends on the current implementation.

## EventBatch

EventBatch groups many filesystem events.

It is useful because filesystem changes often happen together.

Example:

```txt
save file
  ↓
temporary file created
original file updated
temporary file deleted
```

A watcher can emit these changes as one batch.

## Watcher

Watcher monitors a path and emits events.

The current model can be implemented by:

```txt
build initial snapshot
  ↓
wait
  ↓
build next snapshot
  ↓
compute diff
  ↓
emit batch
```

Platform-specific backends can improve efficiency, but the public model should remain deterministic.

### Watch example

```cpp
#include <chrono>
#include <iostream>
#include <thread>

#include <softadastra/fs/Fs.hpp>

using namespace softadastra::fs;

int main()
{
    auto root_result = path::Path::from("./watched");

    if (root_result.is_err())
    {
        std::cerr << "Invalid path\n";
        return 1;
    }

    auto root = root_result.value();

    watcher::Watcher watcher;

    auto result =
        watcher.start(
            root,
            [](const events::EventBatch &batch)
            {
                for (const auto &event : batch.all())
                {
                    std::cout << "Event: "
                              << types::to_string(event.type)
                              << " "
                              << event.current.path.str()
                              << "\n";
                }
            });

    if (result.is_err())
    {
        std::cerr << "Error: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Watching... press Ctrl+C to exit\n";

    while (true)
    {
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }

    return 0;
}
```

## Platform backends

The filesystem module can support different platform backends.

Conceptual backend mapping:

```txt
Linux   -> inotify
macOS   -> FSEvents
Windows -> ReadDirectoryChangesW
Fallback -> polling
```

The public API should remain stable even if the backend changes.

The goal is:

```txt
same public model
different platform implementation
```

## Polling fallback

Polling is the simplest portable model.

It works like this:

```txt
scan directory
  ↓
wait interval
  ↓
scan again
  ↓
compute diff
  ↓
emit events
```

Polling is less efficient than native event APIs, but it is easier to reason about and can be used as a fallback.

## Determinism rule

The filesystem module should aim for deterministic output.

Same input state should produce the same snapshot. Same before and after snapshots should produce the same diff.

```txt
same before snapshot
same after snapshot
  ↓
same events
```

This is important for sync and tests.

## Normalized path rule

Paths should be normalized.

Example:

```txt
a/./b/../c
  ↓
a/c
```

This avoids treating equivalent paths as different files.

Path normalization should happen at the boundary.

## Filesystem event ordering

When events are produced from a diff, the ordering should be stable when possible.

Recommended stable ordering:

```txt
sort by path
then by event type if needed
```

Stable ordering makes tests easier and sync behavior easier to debug.

## Filesystem and WAL

The fs module can produce file events. The wal module can record events.

Relationship:

```txt
fs
  -> observes file change

wal
  -> records the event when required
```

fs should not write to the WAL by itself unless a higher-level component explicitly wires that behavior.

A good separation is:

```txt
Watcher emits event
  ↓
Higher-level sync service receives event
  ↓
WAL records event
  ↓
Sync tracks operation
```

## Filesystem and store

The store contains current application state. The filesystem module observes disk state.

Relationship:

```txt
fs snapshot
  ↓
higher-level mapping
  ↓
store operation
```

For example, a file sync product may map:

```txt
file created
  ↓
store put file metadata
```

But that mapping should not live inside the generic fs module.

## Filesystem and sync

fs does not sync files by itself.

Instead:

```txt
fs detects file change
  ↓
sync layer or higher-level service decides operation
  ↓
sync tracks operation
  ↓
transport sends later
```

This prevents the filesystem module from becoming too coupled.

## Filesystem and transport

fs should not depend on transport.

Wrong:

```txt
fs watcher directly sends TCP message
```

Better:

```txt
fs watcher emits FileEvent
higher-level service converts event to operation
sync tracks operation
transport sends operation
```

This keeps the architecture clean.

## Filesystem and discovery

fs should not know about discovery. Discovery finds peers. FS observes files. They are separate concerns.

## Filesystem and metadata

Metadata can describe a node. FS can observe files. They should remain separate.

A higher-level service can combine them:

```txt
node metadata
  +
filesystem snapshot
  ↓
diagnostic report
```

But the generic fs module should not own metadata behavior.

## Filesystem and CLI

The CLI can expose filesystem commands or examples later.

But fs should not depend on CLI.

Correct direction:

```txt
cli command
  ↓
fs module
```

Wrong direction:

```txt
fs module
  ↓
cli output
```

The filesystem module should return structured data, not terminal UI.

## Common use cases

Use fs for:

- file sync engines
- backup tools
- local indexing
- folder watchers
- document tracking
- cache invalidation
- local-first file apps
- development tools

Do not use fs when you only need key-value store operations. For key-value state, use store.

## Local file sync flow

A file sync flow can look like this:

```txt
watch folder
  ↓
file created
  ↓
FileEvent emitted
  ↓
higher-level service creates operation
  ↓
WAL records operation
  ↓
store updates metadata
  ↓
sync tracks operation
  ↓
transport sends later
```

The fs module is only responsible for the first part:

```txt
watch folder
  ↓
file event emitted
```

## Scan flow

```txt
Path::from("./data")
  ↓
Scanner::scan(path)
  ↓
Snapshot
  ↓
iterate snapshot entries
```

Use this when you need the full state.

## Diff flow

```txt
Snapshot before
  ↓
Snapshot after
  ↓
SnapshotDiff::compute
  ↓
FileEvents
```

Use this when you need to detect changes between two states.

## Watch flow

```txt
Watcher::start(path, callback)
  ↓
initial snapshot
  ↓
observe changes
  ↓
event batch callback
```

Use this when you need ongoing monitoring.

## Error handling

Filesystem operations should return explicit errors.

Example:

```cpp
auto result = scanner::Scanner::scan(root);

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}
```

Possible errors:

- invalid path
- path does not exist
- permission denied
- scan failed
- watcher failed
- unsupported platform backend
- filesystem API error

Do not hide filesystem failures.

### Invalid path

An invalid path should return an error:

```cpp
auto result = path::Path::from("");

if (result.is_err())
{
    std::cout << result.error().message() << "\n";
}
```

Empty paths should not be accepted silently.

### Path does not exist

Scanning a missing path should return an explicit error:

```txt
path does not exist: ./data
```

This is more useful than:

```txt
scan failed
```

### Permission denied

Some files or directories may not be readable. The scanner should either return an error or record partial scan behavior explicitly if supported.

Do not silently ignore permission errors unless the API explicitly documents that behavior.

### Watcher failure

A watcher can fail when: path is invalid, path does not exist, permission denied, native backend cannot start, too many watched files, platform API fails.

The watcher should report a clear error.

## Deleted files

If a file is deleted, the current filesystem state no longer contains it. The event should still tell the caller which path was deleted.

The event model should preserve enough information to identify the deleted entry.

## Updated files

Updated files can be detected through metadata.

Common signals: modified timestamp changed, size changed, hash changed (if supported).

If only timestamp and size are used, some changes may be missed. Hash support can improve accuracy but costs more.

## Created files

Created files appear in the after snapshot but not the before snapshot.

Diff rule:

```txt
missing before
present after
  ↓
Created
```

## Deleted files (diff rule)

Present before, missing after.

```txt
present before
missing after
  ↓
Deleted
```

## Updated files (diff rule)

Present in both snapshots but with changed metadata.

```txt
present before
present after
metadata differs
  ↓
Updated
```

## Ignore rules

A future filesystem module may support ignore files.

Example:

```txt
.softadastraignore
```

Possible ignore patterns:

```txt
build/
node_modules/
*.tmp
*.log
.git/
```

Ignore support should be implemented carefully because it affects sync behavior.

## Hash enrichment

A future filesystem module may enrich metadata with hashes.

This helps detect content changes more accurately.

Possible flow:

```txt
scan file
  ↓
read metadata
  ↓
optionally hash content
  ↓
FileState includes hash
```

Hashing can be expensive, so it should be configurable.

## Backpressure

Watchers can produce many events quickly.

A future watcher pipeline may need backpressure.

Possible strategies:

- batch events
- debounce rapid changes
- limit queue size
- drop duplicate updates safely
- rescan when overflow happens

The public API should make overflow behavior visible.

## Cross-platform behavior

Cross-platform filesystem behavior can be difficult.

Different systems handle: case sensitivity, symlinks, permissions, timestamps, rename events, atomic saves, watcher overflow.

The fs module should normalize what it can and expose what it cannot.

## Rename behavior

Some platforms expose rename as a specific event.

A snapshot diff may represent rename as:

```txt
deleted old path
created new path
```

This is acceptable for a deterministic snapshot-based model. A future optimized watcher can add rename detection if needed.

## Symlink behavior

Symlink handling should be explicit.

Possible policies:

- treat symlink as its own entry
- follow symlink
- ignore symlink
- error on symlink

The current policy should be documented in implementation-specific docs when stable.

## Large directory behavior

Scanning large directories can be expensive.

Possible improvements: incremental scanning, native watcher backends, ignore rules, hash only when needed, batching, parallel scanning.

But correctness and deterministic output should come before premature optimization.

## Basic test cases

The fs module should test:

- valid path creation
- invalid path rejection
- path normalization
- scan empty directory
- scan file directory
- snapshot build
- diff created file
- diff updated file
- diff deleted file
- watcher start failure
- event batch behavior

### Diff test example

A good diff test flow:

```txt
create temp directory
build before snapshot
create file
build after snapshot
compute diff
expect Created event
cleanup temp directory
```

Another:

```txt
create file
build before snapshot
modify file
build after snapshot
compute diff
expect Updated event
```

Another:

```txt
create file
build before snapshot
delete file
build after snapshot
compute diff
expect Deleted event
```

### Watcher test strategy

Watcher tests can be more fragile because they depend on timing.

Recommended strategy:

- prefer snapshot and diff unit tests
- keep watcher tests small
- use temporary directories
- use short but safe waits
- avoid platform-specific assumptions

Use native watcher tests separately if needed.

## Filesystem examples

Current useful examples include:

```txt
scan.cpp
snapshot.cpp
diff.cpp
watch.cpp
```

Recommended order:

1. `scan.cpp`
2. `snapshot.cpp`
3. `diff.cpp`
4. `watch.cpp`

This order moves from simple to real-time behavior.

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

Create example folders if needed:

```sh
mkdir -p data
mkdir -p watched
```

Find binaries:

```sh
find build-ninja -type f -executable
```

Run the relevant filesystem example binary from the build output.

## Example summaries

**scan.cpp** teaches: create Path, scan directory, iterate snapshot, print file metadata. Use it when learning how to read the full filesystem state.

**snapshot.cpp** teaches: build snapshot, iterate entries, inspect file states. Use it when learning the snapshot model.

**diff.cpp** teaches: build before snapshot, wait for changes, build after snapshot, compute diff, print changes. Use it when learning change detection.

**watch.cpp** teaches: start watcher, receive event batches, print event type and path, keep process alive. Use it when learning real-time observation.

## Design rules

The fs module should follow these rules:

1. Observe filesystem state.
2. Do not own sync decisions.
3. Do not own transport.
4. Use strong path types.
5. Return explicit errors.
6. Keep snapshots deterministic.
7. Keep diffs stable.
8. Keep platform differences behind backends.
9. Make event batches inspectable.
10. Keep examples small.

## Common mistakes

### Making fs sync files directly

Wrong:

```txt
Watcher detects file
  ↓
fs sends network message
```

Better:

```txt
Watcher detects file
  ↓
FileEvent emitted
  ↓
higher-level service creates sync operation
```

### Using raw strings everywhere

Wrong:

```cpp
scan("./data");
```

Better:

```cpp
auto root = path::Path::from("./data");
scanner::Scanner::scan(root.value());
```

### Ignoring scan errors

Wrong:

```cpp
auto snapshot = scanner::Scanner::scan(root).value();
```

Better:

```cpp
auto result = scanner::Scanner::scan(root);

if (result.is_err())
{
    return 1;
}
```

### Treating no changes as an error

No changes is normal. A diff can return an empty list.

```txt
before == after
  ↓
no events
```

### Assuming watcher events are perfect

Native watchers can overflow or behave differently across platforms. Snapshot diff remains the safer deterministic model.

### Mixing CLI output into fs

fs should return data. CLI should format that data.

## API reference

| Area | Purpose |
|------|---------|
| path | Strong path abstraction |
| scanner | Directory scanning |
| snapshot | Filesystem snapshots and diffs |
| state | File state and metadata |
| events | File events and batches |
| watcher | Real-time observation |
| types | File types and event types |
| utils | Filesystem helpers |

### Main types

| Type | Purpose |
|------|---------|
| Path | Normalized filesystem path |
| Scanner | Scans a directory |
| Snapshot | Represents filesystem state |
| SnapshotBuilder | Builds snapshots |
| SnapshotDiff | Computes changes |
| FileState | State of one file entry |
| FileMetadata | Metadata for one file entry |
| FileEvent | One filesystem change |
| EventBatch | Group of filesystem changes |
| Watcher | Watches a path for changes |

### Recommended public include

```cpp
#include <softadastra/fs/Fs.hpp>
```

### Recommended usage pattern

For scanning:

```cpp
auto root = path::Path::from("./data");

if (root.is_err()) { return 1; }

auto snapshot = scanner::Scanner::scan(root.value());

if (snapshot.is_err()) { return 1; }
```

For diffing:

```cpp
auto before = snapshot::SnapshotBuilder::build(root.value());
auto after  = snapshot::SnapshotBuilder::build(root.value());

auto events =
    snapshot::SnapshotDiff::compute(
        before.value().all(),
        after.value().all());
```

For watching:

```cpp
watcher::Watcher watcher;

auto result =
    watcher.start(root.value(), [](const events::EventBatch &batch)
    {
        for (const auto &event : batch.all())
        {
            // handle event
        }
    });
```

## Summary

fs is the filesystem observation module of Softadastra Engine.

It provides:

```txt
Path
Scanner
Snapshot
SnapshotDiff
FileState
FileEvent
EventBatch
Watcher
```

The key idea is:

> fs observes filesystem changes and exposes them as deterministic state or events.

It does not sync files, send network messages, or decide conflicts.

## Next step

Continue with WAL:

[Go to WAL](./wal)
