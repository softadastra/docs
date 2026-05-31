# Releases

This section tracks Softadastra releases.

Use it when you want to check what changed, how to verify a build, and which release artifacts are expected.

## What this section contains

The release section has two main pages:

1. [Changelog](./changelog)
2. [Builds](./builds)

## Changelog

Use the changelog to see what changed between releases.

It includes:

- new features
- fixes
- behavior changes
- removed features
- upgrade notes
- known limitations
- release verification notes

Read: [Changelog](./changelog)

## Builds

Use the builds page when you are working inside the repositories and need to build or verify Softadastra.

It covers:

- engine repository builds
- CLI builds
- node app builds
- C++ SDK builds
- documentation builds
- release artifact names
- artifact contents
- release verification steps
- common build issues

Read: [Builds](./builds)

## Current release

The current documented release is:

```txt
v0.1.0
```

This release introduces the first public Softadastra surface:

- official installer
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
- documentation structure

## Install the latest release

Linux and macOS:

```sh
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://softadastra.com/install.ps1 | iex
```

By default, this installs:

- Softadastra CLI
- Softadastra C++ SDK

## Verify a release

After installation, run:

```sh
softadastra version
softadastra status
```

Then test local store:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
```

Then test sync visibility:

```sh
softadastra sync status
softadastra sync tick
```

Then check node and peers:

```sh
softadastra node info
softadastra peers
```

No peers is a valid state. Local store commands should still work without peers.

## Release artifact naming

Softadastra release artifacts should be clear and predictable.

CLI artifacts:

```txt
softadastra-linux-x86_64.tar.gz
softadastra-linux-aarch64.tar.gz
softadastra-macos-x86_64.tar.gz
softadastra-macos-aarch64.tar.gz
softadastra-windows-x86_64.zip
```

C++ SDK artifacts:

```txt
softadastra-sdk-linux-x86_64.tar.gz
softadastra-sdk-linux-aarch64.tar.gz
softadastra-sdk-macos-x86_64.tar.gz
softadastra-sdk-macos-aarch64.tar.gz
softadastra-sdk-windows-x86_64.zip
```

Each release archive should have:

```txt
<archive>.sha256
```

If available, it can also have:

```txt
<archive>.minisig
```

## Release rule

Do not ship a release that cannot be verified.

A good release should prove:

- the CLI starts
- the CLI version is correct
- local store works
- sync state is visible
- manual tick works
- peers empty state is handled
- the C++ SDK can be used by a C++ project
- the documentation builds
- artifacts match the installer expectations

## Related pages

- [Installation](../installation)
- [Quick Start](../quick-start)
- [SDKs](../sdks)
- [CLI Reference](../cli/reference)
- [C++ API Reference](../reference/cpp-api)
- [Configuration Reference](../reference/config)
- [Errors Reference](../reference/errors)
