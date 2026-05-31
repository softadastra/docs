# Changelog

This page tracks important Softadastra releases.

It is written for developers who want to quickly understand what changed, what was added, what was fixed, and what needs attention before upgrading.

## Versioning

Softadastra uses semantic versioning:

```txt
MAJOR.MINOR.PATCH
```

Meaning:

```txt
MAJOR -> breaking changes
MINOR -> new features without breaking existing usage
PATCH -> fixes and small improvements
```

Example:

```txt
v0.1.0
```

## Latest release

## v0.1.0

Initial public release of Softadastra.

This release introduces the first stable developer surface for:

- Softadastra CLI
- C++ SDK
- local store
- WAL-backed persistence
- restart recovery
- sync state inspection
- manual sync tick
- optional transport
- optional discovery
- node metadata
- official installer
- documentation structure

## Added

### Installer

Added the official installer for Linux, macOS, and Windows.

Linux and macOS:

```sh
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://softadastra.com/install.ps1 | iex
```

The default installation installs:

- Softadastra CLI
- Softadastra C++ SDK

The installer also supports:

```txt
CLI only
SDK only
specific versions
custom install directories
checksum verification
optional minisign verification
```

### CLI

Added the first stable Softadastra CLI surface.

Available commands:

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

Also added interactive mode:

```sh
softadastra
```

Inside interactive mode:

```txt
softadastra> status
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> exit
```

### C++ SDK

Added the first official C++ SDK.

Main include:

```cpp
#include <softadastra/sdk.hpp>
```

Main public types:

```txt
Client
ClientOptions
Result
Error
Key
Value
Peer
NodeInfo
SyncState
TickResult
```

The SDK supports:

```txt
memory-only local store
persistent local store
restart recovery
sync state inspection
manual sync tick
transport
discovery
metadata
explicit result/error handling
```

### Local store

Added local key/value storage.

CLI example:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
```

C++ SDK example:

```cpp
client.put("app/name", "Softadastra");
client.get("app/name");
```

### Persistence

Added WAL-backed persistence through the C++ SDK.

Persistent clients can reopen the same WAL path and recover previously written values.

### Sync visibility

Added sync state inspection.

CLI:

```sh
softadastra sync status
```

C++ SDK:

```cpp
client.sync_state();
```

### Manual tick

Added manual sync tick support.

CLI:

```sh
softadastra sync tick
```

C++ SDK:

```cpp
client.tick();
```

A tick can retry work, produce a batch, and expose sync progress.

### Node services

Added node inspection and session-level node startup.

```sh
softadastra node info
softadastra node start
```

`node start` starts local services for the current CLI runtime.

For a long-running node, use the Softadastra node app.

### Peers

Added peer inspection.

```sh
softadastra peers
```

The command shows discovery peers and transport peers.

No peers is a valid state. Local store commands still work without peers.

### Documentation

Added documentation sections for:

```txt
Installation
Quick Start
SDKs
CLI
C++ SDK
Reference
Releases
```

Added C++ SDK pages:

```txt
Overview
Installation
Quick Start
Client
Client Options
Results and Errors
Local Store
Persistent Store
Restart Recovery
Sync State
Manual Tick
Transport
Discovery
Metadata
Examples
```

Added CLI pages:

```txt
Overview
Commands
Interactive Mode
Node
Store
Sync
Peers
Reference
```

Added reference pages:

```txt
CLI Reference
C++ API Reference
Configuration Reference
Errors Reference
```

## Fixed

This is the first public release, so there are no previous public fixes to list.

## Changed

This is the first public release, so there are no previous public behavior changes to list.

## Removed

Nothing removed in this release.

## Upgrade notes

No upgrade action is needed for `v0.1.0`.

For a clean install, use:

```sh
curl -fsSL https://softadastra.com/install.sh | sh
```

On Windows:

```powershell
irm https://softadastra.com/install.ps1 | iex
```

## Known limitations

The current stable CLI store surface supports:

```txt
put
get
```

Commands such as `store remove` or `store list` are not part of the stable CLI surface yet.

The current stable sync CLI surface supports:

```txt
status
tick
```

Options such as `sync tick --prune` are not part of the stable CLI surface yet.

The C++ SDK is the first official SDK.

Other SDKs can be added later when they are ready.

## Release verification

Before publishing this release, verify:

```sh
softadastra version
softadastra status

softadastra store put app/name Softadastra
softadastra store get app/name

softadastra sync status
softadastra sync tick

softadastra node info
softadastra peers
```

Also verify the C++ SDK with:

```sh
vix build -- -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

On Windows:

```powershell
vix build -- -DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

## Related pages

- [Installation](../installation)
- [Quick Start](../quick-start)
- [SDKs](../sdks)
- [CLI Reference](../cli/reference)
- [C++ API Reference](../reference/cpp-api)
- [Builds](./builds)
