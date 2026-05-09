# Builds

This page explains how Softadastra builds should be produced, checked, and verified.

Use this page when you want to build the engine, CLI, node app, SDK examples, documentation, or release artifacts.

The core rule is:

```txt
A build is useful only if it can be reproduced and verified.
```

## What this page covers

This page covers:

- development builds
- release builds
- CLI builds
- node app builds
- engine builds
- C++ SDK verification
- JavaScript SDK verification
- documentation builds
- artifact naming
- release verification
- common build issues

Softadastra has several build surfaces:

- engine repository
- product CLI
- node app
- C++ SDK
- JavaScript SDK
- documentation site
- release artifacts

## Repository layout

The main engine repository is usually:

```bash
~/softadastra/softadastra
```

Expected structure:

```txt
softadastra/
├── apps/
│   ├── cli/
│   ├── node/
│   └── CMakeLists.txt
├── modules/
│   ├── cli/
│   ├── core/
│   ├── discovery/
│   ├── fs/
│   ├── metadata/
│   ├── store/
│   ├── sync/
│   ├── transport/
│   └── wal/
├── examples/
├── data/
├── cmake/
├── CMakeLists.txt
├── CMakePresets.json
├── CHANGELOG.md
├── README.md
├── cmd.md
├── vix.json
└── LICENSE
```

The most important folders are:

```txt
modules/  -> reusable engine modules
apps/     -> runnable applications
examples/ -> focused examples
data/     -> local runtime data
cmake/    -> build helpers
```

## Requirements

Recommended tools:

- C++20 compiler
- CMake
- Ninja
- Git
- Vix
- Node.js
- npm

Check tools:

```bash
g++ --version
cmake --version
ninja --version
git --version
vix --version
node --version
npm --version
```

For the engine and CLI, the important build tools are:

- C++20 compiler
- CMake
- Ninja
- Vix

For the documentation and JavaScript SDK, the important tools are:

- Node.js
- npm

## Development build

Go to the engine repository:

```bash
cd ~/softadastra/softadastra
```

Run the default build:

```bash
vix build
```

This should configure and build the project using the default project settings.

If the project uses a development preset:

```bash
vix build --preset dev
```

If Ninja is the default development generator:

```bash
vix build --preset dev-ninja
```

The exact preset names depend on `CMakePresets.json`.

Inspect presets:

```bash
cat CMakePresets.json
```

## Release build

For release mode:

```bash
vix build --preset release
```

If the project requires app options explicitly:

```bash
vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

If the release should include both CLI and node app:

```bash
vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

## Build with CMake directly

Vix is the recommended developer entry point, but CMake can be used directly.

Configure:

```bash
cmake --preset dev-ninja
```

Build:

```bash
cmake --build --preset build-ninja
```

Release configure:

```bash
cmake --preset release
```

Release build:

```bash
cmake --build --preset build-release
```

If these preset names do not exist, inspect:

```bash
cat CMakePresets.json
```

Then use the actual preset names from the repository.

## Build options

Common build options can include:

- `SOFTADASTRA_BUILD_APPS`
- `SOFTADASTRA_BUILD_CLI_APP`
- `SOFTADASTRA_BUILD_NODE_APP`
- `SOFTADASTRA_BUILD_EXAMPLES`
- `SOFTADASTRA_BUILD_TESTS`

Only rely on options that exist in the current `CMakeLists.txt` and `CMakePresets.json`.

Example:

```bash
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

With node app:

```bash
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

With examples and tests, if supported:

```bash
vix build -- \
  -DSOFTADASTRA_BUILD_EXAMPLES=ON \
  -DSOFTADASTRA_BUILD_TESTS=ON
```

## Export the CLI binary

If your Vix build supports binary export:

```bash
vix build --bin
```

Expected result:

```txt
./softadastra
```

Then verify:

```bash
./softadastra help
./softadastra version
./softadastra status
```

If `--bin` is not supported in the current setup, find the binary manually.

## Find build artifacts

Depending on the current build layout, the CLI binary can be in one of these paths:

```txt
./softadastra
build-ninja/softadastra
build-ninja/apps/cli/softadastra
build-ninja/apps/cli/softadastra_cli
build-release/softadastra
build-release/apps/cli/softadastra
```

Find binaries:

```bash
find . -type f -executable -name "softadastra*"
```

Run the found binary:

```bash
./path/to/softadastra help
```

## Verify the CLI build

After building the CLI, run:

```bash
softadastra help
softadastra version
softadastra status
```

If the binary is not in `PATH`, run it directly:

```bash
./softadastra help
./softadastra version
./softadastra status
```

Expected behavior:

```txt
help     -> prints available commands
version  -> prints the CLI version
status   -> prints local runtime status
```

## Verify store commands

Run:

```bash
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra store remove app/name
```

Expected output style:

```txt
Stored value

  key     : app/name
  value   : Softadastra
  created : yes
```

Then:

```txt
Value

  key   : app/name
  value : Softadastra
```

Then:

```txt
Removed value

  key     : app/name
  removed : yes
```

If a missing key is read:

```bash
softadastra store get app/name
```

Expected output style:

```txt
error: key not found
key: app/name
```

## Verify sync commands

Run:

```bash
softadastra sync status
softadastra sync tick
```

Expected output style:

```txt
Sync status

  outbox       : 0
  queued       : 0
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0
```

Tick output style:

```txt
Sync tick

  retried : 0
  pruned  : 0
  batch   : 0
```

Exact numbers can differ depending on previous local writes and runtime configuration.

## Verify node commands

Run:

```bash
softadastra node info
```

Expected output style:

```txt
Node

  id           : node-a
  display name : Local Node
  hostname     : softadastra-dev
  os           : linux
  version      : 0.1.0
  uptime ms    : 18420
  capabilities : core, store, sync, transport, discovery, metadata
```

If the node app is available:

```bash
softadastra node start
```

Expected output style:

```txt
Softadastra node

  id       : node-a
  address  : 127.0.0.1:4041
  state    : running
```

If the node app is not available:

```txt
error: node app is not available in this build
hint: rebuild with SOFTADASTRA_BUILD_NODE_APP=ON
```

## Verify peers command

Run:

```bash
softadastra peers
```

Expected output when no peer exists:

```txt
Peers

  no peers found
```

This is valid.

No peers found should not break local store behavior.

## Verify interactive mode

If interactive mode is enabled:

```bash
softadastra
```

Expected prompt:

```txt
softadastra>
```

Try:

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

Inside interactive mode, do not repeat the binary name.

Wrong:

```txt
softadastra> softadastra status
```

Correct:

```txt
softadastra> status
```

## Verify persistence behavior

Create the data directory:

```bash
mkdir -p data
```

Run a persistent example from the SDK or application.

The verification flow should be:

```txt
open runtime
  ↓
write value
  ↓
close runtime
  ↓
open runtime with same WAL path
  ↓
read value
```

Expected result:

```txt
recovered value is readable
```

This verifies WAL-backed recovery.

## Verify local-first behavior

A release build should preserve local-first behavior.

Run:

```bash
softadastra store put draft/1 hello
softadastra store get draft/1
softadastra peers
```

Even if peers output says:

```txt
Peers

  no peers found
```

The local value should still be readable.

The rule is:

```txt
no peer
  ↓
local store still works
```

## Verify transport failure behavior

If transport or peer connection fails, local state should remain valid.

Expected behavior:

```txt
peer connection failed
  ↓
sync work remains pending
  ↓
local data remains readable
```

A release should not treat transport failure as local data failure.

## Verify discovery empty state

If no peer is discovered:

```bash
softadastra peers
```

Expected output:

```txt
Peers

  no peers found
```

This should be treated as a valid empty state.

It should not be a crash.

## Verify C++ SDK

Go to the C++ SDK repository:

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

Run the examples according to the SDK repository build setup.

If the SDK uses Vix:

```bash
vix build
```

If it uses CMake:

```bash
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

If examples are built as binaries, find them:

```bash
find . -type f -executable
```

Recommended verification:

- local store example prints stored value
- persistent store example creates WAL file
- remove value example returns `not_found` after remove
- basic sync example shows outbox and tick result
- transport example handles missing peer cleanly
- discovery example handles no peers cleanly
- metadata example prints node info
- errors example shows explicit errors

## Verify JavaScript SDK

Go to the JavaScript SDK repository:

```bash
cd ~/softadastra/sdk-js
```

Install dependencies:

```bash
npm install
```

Create data directory:

```bash
mkdir -p data
```

Run examples:

```bash
npm run examples:local-store
npm run examples:persistent-store
npm run examples:remove-value
npm run examples:basic-sync
npm run examples:tcp-peer-sync
npm run examples:discovery
npm run examples:node-metadata
```

Run tests:

```bash
npm test
```

Expected verification:

- local store example prints stored value
- persistent store example creates WAL file
- remove value example returns `not_found` after remove
- basic sync example shows outbox and tick result
- TCP peer sync handles missing peer cleanly
- discovery handles no peers cleanly
- metadata prints node info
- tests pass

## Verify documentation build

Go to the documentation project root.

If the docs have a package file:

```bash
npm install
```

Build:

```bash
npm run build
```

or, depending on scripts:

```bash
npm run docs:build
```

For VitePress, a successful build should generate:

```txt
.vitepress/dist
```

The build should not fail on broken links, missing pages, or invalid sidebar entries.

## Verify documentation routes

Check that these sections exist:

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

Important guide routes:

```txt
/guides/build-offline-first-app
/guides/run-local-node
/guides/persist-data-locally
/guides/sync-between-nodes
/guides/use-cpp-sdk-with-engine
/guides/use-js-sdk-with-engine
/guides/production
```

Important reference routes:

```txt
/reference/cli
/reference/cpp-api
/reference/js-api
/reference/config
/reference/errors
```

Important release routes:

```txt
/releases/changelog
/releases/builds
```

## Release artifacts

Release artifacts should be named clearly.

Possible artifact names:

```txt
softadastra-linux-x86_64.tar.gz
softadastra-cli-linux-x86_64.tar.gz
softadastra-engine-linux-x86_64.tar.gz
softadastra-sdk-cpp-linux-x86_64.tar.gz
softadastra-sdk-js.tgz
```

Use names that include:

- project
- component
- platform
- architecture
- version

Example:

```txt
softadastra-cli-v0.1.0-linux-x86_64.tar.gz
```

## Artifact contents

A CLI artifact can include:

```txt
softadastra
README.md
LICENSE
CHANGELOG.md
```

An engine artifact can include:

```txt
include/
lib/
cmake/
README.md
LICENSE
CHANGELOG.md
```

A C++ SDK artifact can include:

```txt
include/
lib/
cmake/
examples/
README.md
LICENSE
CHANGELOG.md
```

A JavaScript SDK artifact is usually published as an npm package or archive:

```txt
package.json
src/
README.md
LICENSE
CHANGELOG.md
```

## Artifact verification

After producing an artifact, test it in a clean directory.

Example:

```bash
mkdir -p /tmp/softadastra-release-test
cd /tmp/softadastra-release-test
tar -xzf /path/to/softadastra-cli-v0.1.0-linux-x86_64.tar.gz
./softadastra help
./softadastra version
```

For SDK artifacts, test a minimal application that imports or links the SDK.

## Version verification

Before publishing, check:

```bash
softadastra version
```

Expected output style:

```txt
Softadastra 0.1.0
```

Also verify version references in:

- `CHANGELOG.md`
- `README.md`
- docs
- `package.json`, for JavaScript SDK
- `vix.json`, if used
- CMake project version, if used

## Build logs

Keep build logs useful.

Important information:

- compiler
- CMake version
- Ninja version
- Vix version
- build preset
- build type
- enabled options
- target platform
- commit hash
- version

A release build should be traceable.

## Common build issues

### Missing package.json in docs

If you run npm in the wrong directory, you may see:

```txt
Could not read package.json
```

Fix:

```bash
cd /path/to/docs-project-root
ls package.json
npm install
npm run build
```

If the docs directory only contains markdown files and `.vitepress/`, create or use the correct VitePress project root.

### Missing data directory

Persistent examples can fail if `data/` does not exist.

Fix:

```bash
mkdir -p data
```

### CLI binary not found

Find it:

```bash
find . -type f -executable -name "softadastra*"
```

Then run the full path:

```bash
./build-ninja/apps/cli/softadastra help
```

### Command not found

If `softadastra` is not in `PATH`, run:

```bash
./softadastra help
```

Or install locally:

```bash
mkdir -p ~/.local/bin
cp ./softadastra ~/.local/bin/softadastra
chmod +x ~/.local/bin/softadastra
export PATH="$HOME/.local/bin:$PATH"
```

### Port already in use

If transport fails to start:

```bash
ss -ltnp | grep 4041
```

Use another port:

```txt
node-a -> 4041
node-b -> 4042
```

### Node app not available

If `softadastra node start` fails:

```txt
error: node app is not available in this build
```

Rebuild with:

```bash
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

### Documentation broken links

If VitePress reports missing pages, check:

- docs tree
- sidebar config
- nav links
- relative links
- file names
- case sensitivity

Route names should match file names.

Example:

```txt
/guides/sync-between-nodes
```

should map to:

```txt
guides/sync-between-nodes.md
```

## Build verification checklist

Before publishing a build, verify:

- engine builds successfully
- release build succeeds
- CLI binary exists
- CLI help works
- CLI version works
- CLI status works
- store put/get/remove works
- sync status works
- sync tick works
- peers handles empty state
- node info works
- persistent recovery works
- transport failure does not delete local data
- discovery empty state is handled
- C++ SDK examples build or run
- JavaScript SDK examples run
- JavaScript SDK tests pass
- docs build succeeds
- changelog is updated
- version is correct
- artifacts are named consistently

## Release safety checklist

Softadastra builds should protect local-first behavior.

Before release, verify:

- local writes work without network
- local reads work without network
- missing keys return explicit errors
- WAL paths are validated
- WAL recovery works
- sync status exposes pending work
- sync tick exposes batch information
- transport failure is visible
- transport failure does not invalidate local state
- discovery no-peers state is valid
- metadata identifies the node
- CLI errors are actionable
- SDK errors are explicit

## Minimal release command sequence

A useful local release verification sequence:

```bash
cd ~/softadastra/softadastra

vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON

find . -type f -executable -name "softadastra*"

./softadastra help
./softadastra version
./softadastra status

./softadastra store put app/name Softadastra
./softadastra store get app/name
./softadastra sync status
./softadastra sync tick
./softadastra peers
```

Adjust `./softadastra` if the binary is generated elsewhere.

## Documentation release command sequence

A useful docs verification sequence:

```bash
cd ~/softadastra/docs

npm install
npm run build
```

If the docs project uses another root, run the command from the directory containing `package.json`.

If VitePress is used, check:

```bash
ls .vitepress/dist
```

## JavaScript SDK release command sequence

```bash
cd ~/softadastra/sdk-js

npm install
mkdir -p data

npm test

npm run examples:local-store
npm run examples:persistent-store
npm run examples:remove-value
npm run examples:basic-sync
npm run examples:tcp-peer-sync
npm run examples:discovery
npm run examples:node-metadata
```

If publishing to npm later, verify package contents:

```bash
npm pack --dry-run
```

## C++ SDK release command sequence

```bash
cd ~/softadastra/sdk-cpp

vix build
```

or:

```bash
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

Then run available examples or tests according to the SDK repository layout.

## What a good build proves

A good build proves:

- the code compiles
- the CLI starts
- the SDK examples work
- the docs build
- local-first behavior still works
- persistence can be verified
- sync state is visible
- errors are explicit

It does not automatically prove:

- production readiness
- perfect convergence
- all network failures
- all conflict cases
- all platform-specific behavior
- all deployment environments

Those require deeper testing.

## Stable versus experimental artifacts

Only publish artifacts as stable when they are intended to be supported.

Recommended rule:

```txt
stable CLI binary        -> publish as release artifact
stable SDK package       -> publish as SDK artifact
experimental node app    -> mark as experimental
unstable JSON schema     -> do not advertise as stable
internal test binary     -> do not publish as public artifact
```

## Summary

Softadastra builds should be reproducible, verifiable, and clear.

The release build process should verify:

- build
- CLI
- SDKs
- docs
- local-first behavior
- persistence
- sync visibility
- error handling
- artifacts

The most important build rule is:

```txt
do not ship a build that cannot be verified
```

## Related pages

- [Releases](./index.md)
- [Changelog](./changelog.md)
- [Production Guide](../guides/production.md)
- [CLI Reference](../reference/cli.md)
- [C++ API Reference](../reference/cpp-api.md)
- [JavaScript API Reference](../reference/js-api.md)
- [Configuration Reference](../reference/config.md)
- [Errors Reference](../reference/errors.md)
