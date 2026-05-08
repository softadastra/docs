# Changelog

This page documents notable changes in Softadastra releases.

The changelog should help users understand what changed, why it matters, and whether they need to update code, configuration, commands, or deployment behavior.

The core rule is:

```txt
A changelog entry should be specific, useful, and verifiable.
Format

Use one section per version.

Recommended shape:

## v0.1.0

Release summary.

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...

### Known limitations
- ...

Use only the categories that apply to the release.

Categories

Recommended changelog categories:

Added
Changed
Fixed
Removed
Deprecated
Security
Migration notes
Known limitations
Added

Use Added for new features, commands, APIs, modules, examples, or documentation.

Good examples:

Added `softadastra status`.
Added WAL-backed persistent store examples.
Added JavaScript `syncStateInfo()`.
Added C++ `ClientOptions::persistent`.

Avoid vague entries:

Added stuff.
Added many things.
Changed

Use Changed when existing behavior changed.

Good examples:

Changed sync status output to include retry count.
Changed persistent examples to use `data/<node-id>.wal`.
Changed CLI errors to include the failing key when possible.
Fixed

Use Fixed for bug fixes.

Good examples:

Fixed missing key handling in local store reads.
Fixed WAL path validation when the data directory does not exist.
Fixed discovery output when no peers are available.
Removed

Use Removed when behavior, commands, fields, or APIs are no longer available.

Good examples:

Removed unstable CLI alias.
Removed deprecated SDK option name.
Deprecated

Use Deprecated when something still exists but should no longer be used.

Good examples:

Deprecated old sync status field names.
Deprecated experimental transport option names.
Security

Use Security for security-relevant changes.

Good examples:

Improved validation for WAL paths.
Improved peer input validation.
Improved error handling for invalid transport messages.
Migration notes

Use Migration notes when users need to change something.

Examples:

Create the `data/` directory before using WAL-backed examples.
Use one WAL path per node.
Rename JavaScript `sync_state_info()` to `syncStateInfo()` when using the preferred public API.
Known limitations

Use Known limitations when a feature exists but is not fully production-ready.

Examples:

Discovery is intended for local development in this release.
JSON CLI output is not yet a stable automation API.
Conflict resolution behavior is still evolving.
v0.1.0

Initial Softadastra foundation release.

This release introduces the first documented Softadastra local-first runtime foundation, including the engine structure, product CLI surface, C++ SDK documentation, JavaScript SDK documentation, guides, reference pages, and release documentation.

The focus of this release is the core model:

write locally
persist locally
track operation
sync when possible
retry when needed
converge later
Added
Added the main documentation structure for Softadastra.
Added top-level pages for introduction, installation, quick start, and project overview.
Added concept documentation for offline-first behavior.
Added concept documentation for local-first behavior.
Added concept documentation for the failure model.
Added concept documentation for WAL.
Added concept documentation for outbox.
Added concept documentation for sync engine behavior.
Added concept documentation for convergence.
Added product CLI documentation.
Added CLI installation documentation.
Added CLI command overview.
Added CLI interactive mode documentation.
Added CLI node command documentation.
Added CLI store command documentation.
Added CLI sync command documentation.
Added CLI peers command documentation.
Added CLI reference documentation.
Added C++ SDK overview.
Added C++ SDK installation documentation.
Added C++ SDK first app documentation.
Added C++ SDK Client documentation.
Added C++ SDK ClientOptions documentation.
Added C++ SDK local store documentation.
Added C++ SDK persistent store documentation.
Added C++ SDK sync documentation.
Added C++ SDK transport documentation.
Added C++ SDK discovery documentation.
Added C++ SDK metadata documentation.
Added C++ SDK errors documentation.
Added C++ SDK examples documentation.
Added JavaScript SDK overview.
Added JavaScript SDK installation documentation.
Added JavaScript SDK first app documentation.
Added JavaScript SDK Client documentation.
Added JavaScript SDK ClientOptions documentation.
Added JavaScript SDK local store documentation.
Added JavaScript SDK persistent store documentation.
Added JavaScript SDK sync documentation.
Added JavaScript SDK transport documentation.
Added JavaScript SDK discovery documentation.
Added JavaScript SDK metadata documentation.
Added JavaScript SDK errors documentation.
Added JavaScript SDK examples documentation.
Added engine overview documentation.
Added engine architecture documentation.
Added engine runtime flow documentation.
Added engine modules documentation.
Added engine core module documentation.
Added engine fs module documentation.
Added engine wal module documentation.
Added engine store module documentation.
Added engine sync module documentation.
Added engine transport module documentation.
Added engine discovery module documentation.
Added engine metadata module documentation.
Added engine internal CLI module documentation.
Added practical guide for building an offline-first app.
Added practical guide for running a local node.
Added practical guide for persisting data locally.
Added practical guide for syncing between nodes.
Added practical guide for using the C++ SDK with the engine.
Added practical guide for using the JavaScript SDK with the engine.
Added production guide.
Added reference index.
Added CLI reference.
Added C++ API reference.
Added JavaScript API reference.
Added configuration reference.
Added errors reference.
Added releases index.
Added changelog page.
Added builds page.
Added: CLI
Added documentation for softadastra help.
Added documentation for softadastra version.
Added documentation for softadastra status.
Added documentation for softadastra node info.
Added documentation for softadastra node start, when the node app is available.
Added documentation for softadastra store put <key> <value>.
Added documentation for softadastra store get <key>.
Added documentation for softadastra store remove <key>.
Added documentation for softadastra store list, when supported.
Added documentation for softadastra sync status.
Added documentation for softadastra sync tick.
Added documentation for softadastra sync tick --prune, when supported.
Added documentation for softadastra peers.
Added documentation for interactive mode through softadastra.
Added: C++ SDK
Added documentation for the main C++ SDK header:
#include <softadastra/sdk.hpp>
Added documentation for Client.
Added documentation for ClientOptions.
Added documentation for ClientOptions::local.
Added documentation for ClientOptions::persistent.
Added documentation for ClientOptions::memory_only, when exposed.
Added documentation for client.open().
Added documentation for client.close().
Added documentation for client.put().
Added documentation for client.get().
Added documentation for client.remove().
Added documentation for client.contains().
Added documentation for client.size().
Added documentation for client.empty().
Added documentation for client.sync_state().
Added documentation for client.tick().
Added documentation for client.start_transport().
Added documentation for client.connect(peer).
Added documentation for client.start_discovery().
Added documentation for client.peers().
Added documentation for client.refresh_node_info().
Added documentation for explicit Result handling.
Added documentation for Value, Peer, NodeInfo, SyncResult, and TickResult.
Added: JavaScript SDK
Added documentation for the main JavaScript package:
@softadastra/sdk
Added documentation for the main JavaScript import:
import { Client, ClientOptions } from "@softadastra/sdk";
Added documentation for ESM usage.
Added documentation for Client.
Added documentation for ClientOptions.
Added documentation for ClientOptions.local.
Added documentation for ClientOptions.persistent.
Added documentation for ClientOptions.memoryOnly, when exposed.
Added documentation for await client.open().
Added documentation for await client.close().
Added documentation for await client.put().
Added documentation for await client.get().
Added documentation for await client.remove().
Added documentation for client.contains().
Added documentation for client.size().
Added documentation for client.empty().
Added documentation for await client.syncStateInfo().
Added documentation for await client.tick().
Added documentation for await client.startTransport().
Added documentation for await client.connect(peer).
Added documentation for await client.startDiscovery().
Added documentation for await client.peers().
Added documentation for await client.refreshNodeInfo().
Added documentation for explicit Result handling.
Added documentation for Value, Peer, NodeInfo, SoftadastraError, SyncResult, and TickResult.
Added: Engine
Added documentation for the modular engine layout.
Added documentation for the core module.
Added documentation for the fs module.
Added documentation for the wal module.
Added documentation for the store module.
Added documentation for the sync module.
Added documentation for the transport module.
Added documentation for the discovery module.
Added documentation for the metadata module.
Added documentation for the internal cli module.
Added module responsibility boundaries.
Added module dependency direction guidance.
Added runtime flow explanations for local-only, persistent, sync-aware, and peer-aware flows.
Added: Guides
Added a guide for building an offline-first app.
Added a guide for running a local node.
Added a guide for persisting data locally.
Added a guide for syncing between nodes.
Added a guide for mapping the C++ SDK to the engine.
Added a guide for mapping the JavaScript SDK to the engine.
Added a production guide with operational checks.
Added: Reference
Added compact CLI reference.
Added compact C++ API reference.
Added compact JavaScript API reference.
Added configuration reference.
Added errors reference.
Added release reference pages.
Changed
Organized the documentation around a clear learning path:
concepts
CLI
SDK C++
SDK JS
engine
guides
reference
releases
Standardized the documentation style around a simple structure:
definition
core rule
why it exists
usage
examples
expected output
common mistakes
summary
next step
Standardized local-first wording across concepts, SDKs, engine, CLI, guides, and reference.
Standardized the separation between store, WAL, sync, transport, discovery, metadata, SDK, and CLI.
Standardized C++ examples around is_ok(), is_err(), value(), and error().
Standardized JavaScript examples around isOk(), isErr(), value(), and error().
Standardized JavaScript public naming around camelCase.
Standardized C++ public naming around snake_case.
Standardized CLI examples around space-separated commands.
Fixed
Clarified that local store operations should not require a server, peer, transport, discovery, or cloud access.
Clarified that persistence and synchronization are different responsibilities.
Clarified that a successful local write does not mean remote delivery has completed.
Clarified that a sync failure does not mean local data disappeared.
Clarified that no peers found is a valid local-first state.
Clarified that transport failure is a delivery problem, not a local state problem.
Clarified that discovery failure should not block local store access.
Clarified that WAL append failure should not be treated as durable success.
Clarified that missing keys are normal store errors, not runtime crashes.
Clarified that data/ should exist before using WAL paths under data/.
Clarified that each node should use a separate WAL path.
Clarified that each local node should use a separate transport port.
Migration notes

This is the initial documented release, so there is no previous public documentation version to migrate from.

For new users:

Start with What is Softadastra?
.
Read Quick Start
.
Follow Build an Offline-first App
.
Use Configuration Reference
 before persistent or multi-node examples.
Use Errors Reference
 when handling failures.
Known limitations
Some CLI commands may depend on the current product CLI implementation.
softadastra store list should only be treated as stable if implemented in the current CLI.
softadastra node start should only be treated as stable if the node app is built and available.
--json output should not be treated as stable until the JSON schema is documented and versioned.
Some SDK aliases may be conditional depending on the current SDK version.
Multi-node sync behavior may depend on the current transport, ACK, and remote apply implementation.
Discovery behavior may be intended primarily for local development until production discovery rules are finalized.
Conflict resolution behavior is still expected to evolve as the runtime matures.
Unreleased

Use this section for changes that are planned or already merged but not released yet.

Added
Changed
Fixed
Removed
Known limitations
Changelog maintenance rules

When adding a new release, keep entries specific.

Good:

Added `client.sync_state()` to inspect pending sync work.
Fixed missing WAL directory error handling.
Changed CLI sync status output to include failed count.

Avoid:

Updated docs.
Improved runtime.
Fixed bugs.
Release note checklist

Before publishing a release, check whether the changelog mentions changes to:

CLI commands
C++ SDK methods
JavaScript SDK methods
configuration fields
WAL behavior
store behavior
sync behavior
transport behavior
discovery behavior
metadata fields
error codes
data recovery behavior
build commands
known limitations

If a change can affect local data, sync behavior, recovery, or deployment, document it clearly.

Related pages
Releases
Builds
Production Guide
CLI Reference
C++ API Reference
JavaScript API Reference
Configuration Reference
Errors Reference
