# Softadastra Engine Documentation

This repository contains the documentation for **Softadastra Engine**.

Softadastra Engine is the offline-first runtime layer inside the Softadastra C++ tooling ecosystem.

It helps C++ applications keep useful work local, durable, recoverable, and ready to synchronize when the network is slow, unstable, expensive, or unavailable.

The core model is:

```txt
write locally
persist safely
recover after failure
retry when needed
sync when possible
```

Softadastra Company is focused on one clear direction:

```txt
The C++ Tooling Company
```

This documentation is for the engine layer, not for a broad SaaS product or cloud platform.

## What this documentation covers

```txt
concepts  -> why the engine exists
CLI       -> how to inspect and control the engine locally
SDK C++   -> how to use the engine from C++
engine    -> how the runtime works internally
guides    -> practical workflows
reference -> commands, APIs, configuration, and errors
releases  -> changelog and build notes
```

## Main sections

### Concepts

The concepts section explains the mental model behind Softadastra Engine.

It covers:

- offline-first
- local-first
- failure model
- WAL
- durable store
- retry
- sync
- recovery

Start here if you want to understand the system before using it.

### CLI

The CLI section explains how to use Softadastra Engine from the terminal.

It covers:

- `softadastra status`
- `softadastra version`
- `softadastra store put`
- `softadastra store get`
- `softadastra store remove`
- runtime inspection
- local diagnostics

Use this section when you want to inspect and test the engine locally.

### C++ SDK

The C++ SDK section explains the public C++ API.

It covers:

- `Client`
- `ClientOptions`
- local store
- persistent store
- durable writes
- reads
- recovery
- errors
- examples

Use this section when building C++ applications with Softadastra Engine.

### Engine

The engine section explains the internal runtime architecture.

It covers:

- core
- WAL
- store
- retry
- sync
- transport
- metadata
- CLI integration

Use this section when contributing to internals or understanding how the engine is built.

### Guides

The guides section gives practical workflows.

It covers:

- build an offline-first C++ app
- persist data locally
- recover after restart
- inspect local state
- use the C++ SDK with the engine
- prepare for release

Use this section when you want to build something end to end.

### Reference

The reference section gives compact lookup pages.

It covers:

- CLI reference
- C++ API reference
- configuration reference
- error reference

Use this section when you already understand the model and need exact names quickly.

### Releases

The releases section documents version changes and build verification.

It covers:

- changelog
- builds
- release checks
- artifact verification

Use this section when preparing or checking a release.

## JavaScript and TypeScript

JavaScript and TypeScript runtime work belongs to **Kordex**.

Kordex is a JavaScript and TypeScript runtime built on Vix.cpp for reliable local-first applications.

Softadastra Engine can be exposed to JavaScript through Kordex native modules, but this documentation keeps the main SDK path focused on C++.

## Ecosystem role

```txt
Vix.cpp
  -> C++ runtime and developer tooling foundation

Softadastra Engine
  -> offline-first runtime layer

Cnerium
  -> retry-safe backend reliability for Vix applications

Kordex
  -> JavaScript and TypeScript runtime built on Vix.cpp

Pico
  -> validation application proving Vix.cpp in a real backend
```

## Recommended reading path

For new users:

1. What is Softadastra Engine?
2. Installation
3. Quick Start
4. Concepts
5. C++ SDK Overview
6. Engine Overview

For C++ SDK users:

1. C++ SDK Overview
2. C++ SDK Installation
3. C++ SDK Quick Start
4. C++ SDK Examples
5. Errors Reference

For engine contributors:

1. Engine Overview
2. Architecture
3. Runtime Flow
4. Modules
5. Releases

## Install dependencies

From the documentation project root:

```bash
npm install
```

## Run locally

Start the documentation server:

```bash
npm run dev
```

Then open the local URL printed by VitePress.

## Build

Build the static documentation site:

```bash
npm run build
```

For VitePress, the generated output is usually:

```txt
.vitepress/dist
```

## Preview

After building:

```bash
npm run preview
```

## Expected package scripts

A typical `package.json` can expose:

```json
{
  "scripts": {
    "dev": "vitepress dev .",
    "build": "vitepress build .",
    "preview": "vitepress preview ."
  }
}
```

If the project uses another layout, adapt the commands to the directory that contains `.vitepress/`.

## Documentation style

Each page should stay clear, practical, and focused.

Recommended structure:

```txt
definition
why it exists
core model
usage
example
expected output
common mistakes
next step
```

Write for developers who need to understand how the engine works and how to use it inside real C++ applications.

## Core writing rules

Use clear sentences.

Prefer concrete examples.

Keep responsibilities separate:

```txt
store     -> current local state
WAL       -> durable operation history
retry     -> failed work tracking
sync      -> propagation foundation
transport -> delivery layer
metadata  -> node and runtime information
CLI       -> terminal interface
SDK       -> application API
engine    -> internal runtime modules
```

Do not present experimental behavior as stable.

If a command, option, API, or output format is experimental, say so or keep it out of the stable reference.

## Local-first rule

Every section should preserve this idea:

```txt
local work should not depend on network availability
```

A local store operation should not require:

- remote server
- connected peer
- transport
- discovery
- cloud access

Sync can happen later.

## Persistence rule

When persistence is enabled:

```txt
local write
  ↓
WAL append
  ↓
store apply
  ↓
recover later
```

A WAL path should be:

- non-empty
- inside an existing directory
- writable
- stable across restarts
- unique per node or application store

## Error rule

Softadastra Engine APIs should make errors explicit.

C++:

```cpp
auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";
```

CLI:

```txt
error: key not found
key: app/name
```

The rule is:

```txt
Check the result before using the value.
```

## Build verification

Before publishing documentation, run:

```bash
npm install
npm run build
```

Then verify that important sections exist:

```txt
/
welcome
what-is-softadastra
installation
quick-start

/concepts/
/cli/
/sdk-cpp/
/engine/
/guides/
/reference/
/releases/
```

Also check that sidebar links match actual file names.

## Contributing to docs

When adding a new page:

1. Create the markdown file.
2. Add it to `.vitepress/config.mjs`.
3. Link it from the relevant section index.
4. Add a next-step link if it belongs to a learning path.
5. Run the docs build.

```bash
npm run build
```

Fix broken links before publishing.

## Related repositories

```txt
softadastra/softadastra  -> Softadastra Engine
softadastra/sdk          -> C++ SDK
softadastra/docs         -> documentation
softadastra/cnerium      -> backend reliability layer for Vix
softadastra/kordex       -> JS/TS runtime built on Vix.cpp
vixcpp/vix               -> C++ runtime and developer tooling foundation
```

## License

Use the same license as the Softadastra documentation repository.

If the repository contains a `LICENSE` file, that file is the source of truth.

## Summary

Softadastra Engine documentation explains the offline-first engine from first concepts to C++ integration.

The core model remains:

```txt
write locally
persist safely
recover after failure
retry when needed
sync when possible
```

Softadastra Engine starts with local durability.

The network comes later.
