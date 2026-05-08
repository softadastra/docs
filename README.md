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

Softadastra is designed around one principle:

The network is an optimization.
Local correctness comes first.
What this documentation covers

The documentation explains Softadastra from several levels:

concepts  -> why Softadastra exists
CLI       -> how to use Softadastra from the terminal
SDK C++   -> how to use Softadastra from C++
SDK JS    -> how to use Softadastra from JavaScript
engine    -> how Softadastra works internally
guides    -> how to use Softadastra in practical workflows
reference -> quick lookup for APIs, commands, config, and errors
releases  -> changelog and build notes
Documentation structure
docs/
├── index.md
├── what-is-softadastra.md
├── installation.md
├── quick-start.md
│
├── concepts/
│   ├── index.md
│   ├── offline-first.md
│   ├── local-first.md
│   ├── failure-model.md
│   ├── wal.md
│   ├── outbox.md
│   ├── sync-engine.md
│   └── convergence.md
│
├── cli/
│   ├── index.md
│   ├── installation.md
│   ├── commands.md
│   ├── interactive-mode.md
│   ├── node.md
│   ├── store.md
│   ├── sync.md
│   ├── peers.md
│   └── reference.md
│
├── sdk-cpp/
│   ├── index.md
│   ├── installation.md
│   ├── first-app.md
│   ├── client.md
│   ├── client-options.md
│   ├── local-store.md
│   ├── persistent-store.md
│   ├── sync.md
│   ├── transport.md
│   ├── discovery.md
│   ├── metadata.md
│   ├── errors.md
│   └── examples.md
│
├── sdk-js/
│   ├── index.md
│   ├── installation.md
│   ├── first-app.md
│   ├── client.md
│   ├── client-options.md
│   ├── local-store.md
│   ├── persistent-store.md
│   ├── sync.md
│   ├── transport.md
│   ├── discovery.md
│   ├── metadata.md
│   ├── errors.md
│   └── examples.md
│
├── engine/
│   ├── index.md
│   ├── architecture.md
│   ├── runtime-flow.md
│   ├── modules.md
│   ├── core.md
│   ├── fs.md
│   ├── wal.md
│   ├── store.md
│   ├── sync.md
│   ├── transport.md
│   ├── discovery.md
│   ├── metadata.md
│   └── cli.md
│
├── guides/
│   ├── index.md
│   ├── build-offline-first-app.md
│   ├── run-local-node.md
│   ├── persist-data-locally.md
│   ├── sync-between-nodes.md
│   ├── use-cpp-sdk-with-engine.md
│   ├── use-js-sdk-with-engine.md
│   └── production.md
│
├── reference/
│   ├── index.md
│   ├── cli.md
│   ├── cpp-api.md
│   ├── js-api.md
│   ├── config.md
│   └── errors.md
│
├── releases/
│   ├── index.md
│   ├── changelog.md
│   └── builds.md
│
└── .vitepress/
    ├── config.mjs
    └── theme/
        ├── index.js
        └── custom.css
Main sections
Concepts

The concepts section explains the mental model behind Softadastra.

It covers:

offline-first
local-first
failure model
WAL
outbox
sync engine
convergence

Start here if you want to understand the principles before using the runtime.

CLI

The CLI section explains how to use Softadastra from the terminal.

It covers:

softadastra status
softadastra node info
softadastra store put
softadastra store get
softadastra store remove
softadastra sync status
softadastra sync tick
softadastra peers
interactive mode

Use this section when you want to inspect and test Softadastra locally.

SDK C++

The C++ SDK section explains the public C++ API.

It covers:

Client
ClientOptions
local store
persistent store
sync
transport
discovery
metadata
errors
examples

Use this section when building C++ applications with Softadastra.

SDK JS

The JavaScript SDK section explains the public JavaScript API.

It covers:

Client
ClientOptions
local store
persistent store
syncStateInfo
tick
transport
discovery
metadata
errors
examples

Use this section when building JavaScript or Node.js applications with Softadastra.

Engine

The engine section explains the internal runtime architecture.

It covers:

core
fs
wal
store
sync
transport
discovery
metadata
cli

Use this section when contributing to Softadastra internals or understanding how the runtime is built.

Guides

The guides section gives practical workflows.

It covers:

build an offline-first app
run a local node
persist data locally
sync between nodes
use the C++ SDK with the engine
use the JavaScript SDK with the engine
prepare for production

Use this section when you want to build something end to end.

Reference

The reference section gives compact lookup pages.

It covers:

CLI reference
C++ API reference
JavaScript API reference
configuration reference
errors reference

Use this section when you already understand the model and need exact names quickly.

Releases

The releases section documents version changes and build verification.

It covers:

changelog
builds
release checks
artifact verification

Use this section when preparing or checking a release.

Recommended reading path

For new users:

What is Softadastra?
Quick Start
Concepts
Build an Offline-first App
Run a Local Node
Persist Data Locally
Sync Between Nodes

For SDK users:

SDK C++
SDK JS
Configuration Reference
Errors Reference

For engine contributors:

Engine
Architecture
Runtime Flow
Modules

For release work:

Releases
Changelog
Builds
Install dependencies

From the documentation project root, install dependencies:

npm install
Run the documentation locally

Start the local documentation server:

npm run dev

Then open the local URL printed by VitePress.

If the project uses the default VitePress command, this usually serves the docs locally with hot reload.

Build the documentation

Build the static documentation site:

npm run build

For VitePress, the generated output should be:

.vitepress/dist
Preview the production build

After building:

npm run preview

This serves the generated production output locally.

Expected package scripts

A typical package.json can expose:

{
  "scripts": {
    "dev": "vitepress dev .",
    "build": "vitepress build .",
    "preview": "vitepress preview ."
  }
}

If your project uses another layout, adapt the commands to the directory that contains .vitepress/.

Common issue: missing package.json

If you run npm run dev from the wrong directory, you may see:

Could not read package.json

Fix:

cd /path/to/softadastra/docs
ls package.json
npm install
npm run dev

If package.json does not exist yet, create one for the VitePress docs project.

Documentation style

Each documentation page should be clear, practical, and consistent.

Recommended structure:

definition
core rule
why it exists
usage
examples
expected output
common mistakes
summary
next step

The writing should stay focused on one idea per section.

Core writing rules

Use clear sentences.

Prefer concrete examples.

Keep local-first behavior visible.

Separate responsibilities clearly:

store      -> current local state
WAL        -> durable operation history
sync       -> propagation tracking
transport  -> peer delivery
discovery  -> peer finding
metadata   -> node identity
CLI        -> terminal interface
SDK        -> application API
engine     -> internal runtime modules

Do not present unstable behavior as stable.

If a command, option, API, or output format is experimental, say so or keep it out of the stable reference.

Local-first rule

Every section should preserve this idea:

local work should not depend on network availability

A local store operation should not require:

remote server
connected peer
transport
discovery
cloud access

Sync can happen later.

Persistence rule

When persistence is enabled:

local write
  ↓
WAL append
  ↓
store apply
  ↓
recover later

A WAL path should be:

non-empty
inside an existing directory
writable
stable across restarts
unique per node
Sync rule

Sync is propagation tracking.

Store      -> current local state
Sync       -> tracks work that should be propagated
Transport  -> sends messages to peers
Discovery  -> finds peers

A successful local write does not mean remote delivery completed.

A sync failure does not mean local data disappeared.

Error rule

Softadastra APIs should make errors explicit.

C++:

auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";

JavaScript:

const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  process.exit(1);
}

console.log(result.value().toString());

CLI:

error: key not found
key: app/name

The rule is:

Check the result before using the value.
Build verification

Before publishing documentation, run:

npm install
npm run build

Then verify that important sections exist:

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

Also check that sidebar links match actual file names.

Contributing to docs

When adding a new page:

Create the markdown file.
Add it to .vitepress/config.mjs.
Link it from the relevant section index.
Add a next step link if it belongs to a learning path.
Run the docs build.

Example:

npm run build

Fix broken links before publishing.

Repository relationship

This documentation is part of the broader Softadastra ecosystem.

Related repositories can include:

softadastra/softadastra      -> engine
softadastra/sdk-cpp          -> C++ SDK
softadastra/sdk-js           -> JavaScript SDK
softadastra/docs             -> documentation

The exact repository names may evolve, but the documentation should keep the same conceptual structure.

License

Use the same license as the Softadastra documentation repository.

If the repository contains a LICENSE file, that file is the source of truth.

Summary

This documentation explains Softadastra from the first concept to production-oriented usage.

The core model remains:

write locally
persist locally
track operation
sync when possible
retry when needed
converge later

Softadastra starts with local correctness.

The network comes later.
