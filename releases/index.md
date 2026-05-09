# Releases

The releases section documents Softadastra versions, changelog entries, build notes, and release artifacts.

Use this section when you want to know what changed, which version is available, how builds are produced, and what should be checked before using a release.

The core rule is:

```txt
A release should explain what changed, why it matters, and how to verify it.
```

## What the releases section is for

The releases section gives a stable place for release information.

It should help users and contributors answer:

- What is the latest version?
- What changed in this version?
- Was anything added, changed, fixed, or removed?
- How do I build this release?
- Which artifacts are available?
- Which commands should I run to verify the release?
- Are there migration notes?
- Are there known limitations?

Softadastra is a local-first runtime, so release notes should be especially clear about changes that affect local data, WAL behavior, sync behavior, transport, discovery, metadata, SDK APIs, and CLI commands.

## Release pages

The release section contains:

```txt
releases/
├── index.md
├── changelog.md
└── builds.md
```

## Recommended reading order

Read the release pages in this order:

1. [Changelog](./changelog.md)
2. [Builds](./builds.md)

`changelog.md` explains what changed.

`builds.md` explains how builds and artifacts should be produced or verified.

## Changelog

Use the changelog when you want to inspect version history.

The changelog should group changes by version:

```md
## v0.1.0

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
```

A good changelog entry should be short, clear, and useful.

It should avoid vague entries like:

```txt
improved stuff
fixed bugs
updated code
```

Prefer specific entries:

```txt
Added WAL-backed local persistence for SDK clients.
Fixed missing key handling in local store reads.
Changed sync status output to include failed work count.
```

Read: [Changelog](./changelog.md)

## Builds

Use the builds page when you want to understand how a Softadastra release is built and verified.

It should cover:

- development builds
- release builds
- CLI builds
- SDK builds
- engine builds
- build presets
- build artifacts
- verification commands
- common build issues

The build page should help users reproduce a release locally.

Read: [Builds](./builds.md)

## What a release should include

A Softadastra release should clearly describe:

- version number
- release date
- summary
- added features
- changed behavior
- fixed issues
- removed behavior
- breaking changes, if any
- migration notes, if needed
- build instructions
- verification commands
- known limitations

For example:

```md
## v0.1.0

Initial Softadastra foundation release.

### Added
- Added engine modules for core, WAL, store, sync, transport, discovery, metadata, and CLI.
- Added C++ SDK client API.
- Added JavaScript SDK client API.
- Added product CLI commands for status, node, store, sync, and peers.

### Known limitations
- Multi-node sync behavior is still experimental.
- JSON CLI output is not yet stable.
```

## Release naming

Use a clear semantic version when possible:

```txt
v0.1.0
v0.1.1
v0.2.0
v1.0.0
```

Recommended meaning:

```txt
patch version -> fixes and small safe changes
minor version -> new features or larger additions
major version -> breaking changes
```

Before `v1.0.0`, breaking changes can still happen more often, but the changelog should still explain them clearly.

## Release categories

Use these categories in changelog entries:

- Added
- Changed
- Fixed
- Removed
- Deprecated
- Security
- Known limitations
- Migration notes

## Added

Use `Added` for new features.

Examples:

- Added `softadastra status`.
- Added `ClientOptions::persistent`.
- Added JavaScript `syncStateInfo()`.
- Added WAL-backed local recovery.

## Changed

Use `Changed` when existing behavior changed.

Examples:

- Changed sync status output to include retry count.
- Changed CLI store errors to show the key that failed.
- Changed default local examples to disable transport and discovery.

## Fixed

Use `Fixed` for bug fixes.

Examples:

- Fixed missing data directory error handling for WAL paths.
- Fixed local store reads after remove operations.
- Fixed discovery status when no peers are available.

## Removed

Use `Removed` when something is no longer available.

Examples:

- Removed unstable CLI command alias.
- Removed deprecated SDK field name.

## Deprecated

Use `Deprecated` when something still exists but should no longer be used.

Examples:

- Deprecated old sync status field names.
- Deprecated unstable transport option name.

## Security

Use `Security` for security-relevant changes.

Examples:

- Improved validation for WAL paths.
- Improved peer input validation.

## Known limitations

Use `Known limitations` when a feature exists but is not complete or not production-ready.

Examples:

- Discovery is intended for local development in this release.
- JSON output is not yet a stable automation API.
- Conflict resolution behavior is still evolving.

## Migration notes

Use `Migration notes` when users must change code, config, commands, or data paths.

Examples:

- Rename `sync_state_info()` to `syncStateInfo()` in JavaScript code.
- Use one WAL path per node.
- Create `data/` before running persistent examples.

## What to verify before release

Before publishing a release, verify the main surfaces.

## Engine verification

```bash
vix build
```

If release preset is available:

```bash
vix build --preset release
```

If using CMake directly:

```bash
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

## CLI verification

```bash
softadastra help
softadastra version
softadastra status
softadastra node info
```

Store commands:

```bash
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra store remove app/name
```

Sync commands:

```bash
softadastra sync status
softadastra sync tick
```

Peers:

```bash
softadastra peers
```

## C++ SDK verification

Run the C++ SDK examples:

```bash
cd ~/softadastra/sdk-cpp
```

Expected example areas:

- local store
- persistent store
- remove value
- basic sync
- transport
- discovery
- metadata
- errors

The exact command depends on the SDK repository build setup.

## JavaScript SDK verification

Run the JavaScript SDK examples:

```bash
cd ~/softadastra/sdk-js
npm install
mkdir -p data
npm run examples:local-store
npm run examples:persistent-store
npm run examples:remove-value
npm run examples:basic-sync
npm run examples:tcp-peer-sync
npm run examples:discovery
npm run examples:node-metadata
npm test
```

## Documentation verification

Before releasing docs, verify that the documentation site builds.

From the docs project root:

```bash
npm install
npm run docs:build
```

or, depending on the package scripts:

```bash
npm run build
```

If the docs are VitePress-based, the output should be generated without broken links.

## Release safety checks

For Softadastra, release checks should pay special attention to local-first behavior.

Verify:

- local store works without network
- persistent store recovers after restart
- missing keys return explicit errors
- WAL path errors are visible
- sync status exposes pending work
- sync tick returns useful fields
- transport failure does not delete local data
- discovery with no peers does not break local work
- node metadata is readable
- CLI errors are clear
- SDK errors are explicit

## Release notes should protect users

Softadastra deals with local data, persistence, and sync.

So release notes should clearly mention any change that affects:

- WAL format
- WAL path behavior
- store operation behavior
- recovery behavior
- sync state fields
- sync retry behavior
- transport protocol
- discovery behavior
- metadata fields
- SDK method names
- CLI command names
- configuration fields

If a change can affect local data or sync behavior, it should not be hidden.

## Stable versus experimental behavior

Only present behavior as stable when it is implemented and intended to remain supported.

Recommended rule:

```txt
stable CLI command      -> document in reference
stable SDK method       -> document in API reference
experimental behavior   -> mention as experimental
internal implementation -> keep in engine docs
unstable JSON schema    -> do not present as stable automation API
```

## Release checklist

Before tagging a release, check:

- version updated
- changelog updated
- build passes
- tests pass
- CLI basic commands work
- C++ SDK examples work
- JavaScript SDK examples work
- docs build successfully
- release notes mention breaking changes
- migration notes are included if needed
- known limitations are documented
- artifacts are named consistently

## Example release summary

A release summary should be short and useful.

Example:

```md
## v0.1.0

Softadastra v0.1.0 introduces the first public local-first runtime foundation.

It includes the engine modules, product CLI, C++ SDK, JavaScript SDK, and documentation for local store, WAL-backed persistence, sync state, transport, discovery, metadata, and explicit errors.

The release focuses on local-first correctness before production-scale distributed behavior.
```

## Related pages

- [Changelog](./changelog.md)
- [Builds](./builds.md)
- [Production Guide](../guides/production.md)
- [CLI Reference](../reference/cli.md)
- [C++ API Reference](../reference/cpp-api.md)
- [JavaScript API Reference](../reference/js-api.md)
- [Configuration Reference](../reference/config.md)
- [Errors Reference](../reference/errors.md)
