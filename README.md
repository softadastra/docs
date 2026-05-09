# Softadastra Documentation

This repository contains the documentation for Softadastra.

Softadastra is a local-first and offline-first runtime foundation for building applications that keep working under real-world failure conditions.

The core idea is:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

Softadastra is designed around one principle:

```txt
The network is an optimization.
Local correctness comes first.
```

## What this documentation covers

The documentation explains Softadastra from several levels:

```txt
concepts  -> why Softadastra exists
CLI       -> how to use Softadastra from the terminal
SDK C++   -> how to use Softadastra from C++
SDK JS    -> how to use Softadastra from JavaScript
engine    -> how Softadastra works internally
guides    -> how to use Softadastra in practical workflows
reference -> quick lookup for APIs, commands, config, and errors
releases  -> changelog and build notes
```

## Main sections

### Concepts

The concepts section explains the mental model behind Softadastra.

It covers:

- offline-first
- local-first
- failure model
- WAL
- outbox
- sync engine
- convergence

Start here if you want to understand the principles before using the runtime.

### CLI

The CLI section explains how to use Softadastra from the terminal.

It covers:

- `softadastra status`
- `softadastra node info`
- `softadastra store put`
- `softadastra store get`
- `softadastra store remove`
- `softadastra sync status`
- `softadastra sync tick`
- `softadastra peers`
- interactive mode

Use this section when you want to inspect and test Softadastra locally.

### SDK C++

The C++ SDK section explains the public C++ API.

It covers:

- `Client`
- `ClientOptions`
- local store
- persistent store
- sync
- transport
- discovery
- metadata
- errors
- examples

Use this section when building C++ applications with Softadastra.

### SDK JS

The JavaScript SDK section explains the public JavaScript API.

It covers:

- `Client`
- `ClientOptions`
- local store
- persistent store
- `syncStateInfo`
- `tick`
- transport
- discovery
- metadata
- errors
- examples

Use this section when building JavaScript or Node.js applications with Softadastra.

### Engine

The engine section explains the internal runtime architecture.

It covers:

- core
- fs
- wal
- store
- sync
- transport
- discovery
- metadata
- cli

Use this section when contributing to Softadastra internals or understanding how the runtime is built.

### Guides

The guides section gives practical workflows.

It covers:

- build an offline-first app
- run a local node
- persist data locally
- sync between nodes
- use the C++ SDK with the engine
- use the JavaScript SDK with the engine
- prepare for production

Use this section when you want to build something end to end.

### Reference

The reference section gives compact lookup pages.

It covers:

- CLI reference
- C++ API reference
- JavaScript API reference
- configuration reference
- errors reference

Use this section when you already understand the model and need exact names quickly.

### Releases

The releases section documents version changes and build verification.

It covers:

- changelog
- builds
- release checks
- artifact verification

Use this section when preparing or checking a release.

## Recommended reading path

For new users:

1. What is Softadastra?
2. Quick Start
3. Concepts
4. Build an Offline-first App
5. Run a Local Node
6. Persist Data Locally
7. Sync Between Nodes

For SDK users:

1. SDK C++
2. SDK JS
3. Configuration Reference
4. Errors Reference

For engine contributors:

1. Engine
2. Architecture
3. Runtime Flow
4. Modules

For release work:

1. Releases
2. Changelog
3. Builds

## Install dependencies

From the documentation project root, install dependencies:

```bash
npm install
```

## Run the documentation locally

Start the local documentation server:

```bash
npm run dev
```

Then open the local URL printed by VitePress.

If the project uses the default VitePress command, this usually serves the docs locally with hot reload.

## Build the documentation

Build the static documentation site:

```bash
npm run build
```

For VitePress, the generated output should be:

```txt
.vitepress/dist
```

## Preview the production build

After building:

```bash
npm run preview
```

This serves the generated production output locally.

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

If your project uses another layout, adapt the commands to the directory that contains `.vitepress/`.

## Common issue: missing package.json

If you run `npm run dev` from the wrong directory, you may see:

```txt
Could not read package.json
```

Fix:

```bash
cd /path/to/softadastra/docs
ls package.json
npm install
npm run dev
```

If `package.json` does not exist yet, create one for the VitePress docs project.

## Documentation style

Each documentation page should be clear, practical, and consistent.

Recommended structure:

- definition
- core rule
- why it exists
- usage
- examples
- expected output
- common mistakes
- summary
- next step

The writing should stay focused on one idea per section.

## Core writing rules

Use clear sentences.

Prefer concrete examples.

Keep local-first behavior visible.

Separate responsibilities clearly:

```txt
store      -> current local state
WAL        -> durable operation history
sync       -> propagation tracking
transport  -> peer delivery
discovery  -> peer finding
metadata   -> node identity
CLI        -> terminal interface
SDK        -> application API
engine     -> internal runtime modules
```

Do not present unstable behavior as stable.

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
- unique per node

## Sync rule

Sync is propagation tracking.

```txt
Store      -> current local state
Sync       -> tracks work that should be propagated
Transport  -> sends messages to peers
Discovery  -> finds peers
```

A successful local write does not mean remote delivery completed.

A sync failure does not mean local data disappeared.

## Error rule

Softadastra APIs should make errors explicit.

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

JavaScript:

```js
const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  process.exit(1);
}

console.log(result.value().toString());
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
what-is-softadastra
installation
quick-start

/concepts/
/cli/
/sdk-cpp/
/sdk-js/
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
4. Add a next step link if it belongs to a learning path.
5. Run the docs build.

Example:

```bash
npm run build
```

Fix broken links before publishing.

## Repository relationship

This documentation is part of the broader Softadastra ecosystem.

Related repositories can include:

```txt
softadastra/softadastra      -> engine
softadastra/sdk-cpp          -> C++ SDK
softadastra/sdk-js           -> JavaScript SDK
softadastra/docs             -> documentation
```

The exact repository names may evolve, but the documentation should keep the same conceptual structure.

## License

Use the same license as the Softadastra documentation repository.

If the repository contains a `LICENSE` file, that file is the source of truth.

## Summary

This documentation explains Softadastra from the first concept to production-oriented usage.

The core model remains:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

Softadastra starts with local correctness.

The network comes later.
