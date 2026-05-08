# Builds

This page explains how Softadastra builds should be produced, checked, and verified.

Use this page when you want to build the engine, CLI, node app, SDK examples, documentation, or release artifacts.

The core rule is:

```txt
A build is useful only if it can be reproduced and verified.
What this page covers

This page covers:

development builds
release builds
CLI builds
node app builds
engine builds
C++ SDK verification
JavaScript SDK verification
documentation builds
artifact naming
release verification
common build issues

Softadastra has several build surfaces:

engine repository
product CLI
node app
C++ SDK
JavaScript SDK
documentation site
release artifacts
Repository layout

The main engine repository is usually:

~/softadastra/softadastra

Expected structure:

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

The most important folders are:

modules/  -> reusable engine modules
apps/     -> runnable applications
examples/ -> focused examples
data/     -> local runtime data
cmake/    -> build helpers
Requirements

Recommended tools:

C++20 compiler
CMake
Ninja
Git
Vix
Node.js
npm

Check tools:

g++ --version
cmake --version
ninja --version
git --version
vix --version
node --version
npm --version

For the engine and CLI, the important build tools are:

C++20 compiler
CMake
Ninja
Vix

For the documentation and JavaScript SDK, the important tools are:

Node.js
npm
Development build

Go to the engine repository:

cd ~/softadastra/softadastra

Run the default build:

vix build

This should configure and build the project using the default project settings.

If the project uses a development preset:

vix build --preset dev

If Ninja is the default development generator:

vix build --preset dev-ninja

The exact preset names depend on CMakePresets.json.

Inspect presets:

cat CMakePresets.json
Release build

For release mode:

vix build --preset release

If the project requires app options explicitly:

vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON

If the release should include both CLI and node app:

vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
Build with CMake directly

Vix is the recommended developer entry point, but CMake can be used directly.

Configure:

cmake --preset dev-ninja

Build:

cmake --build --preset build-ninja

Release configure:

cmake --preset release

Release build:

cmake --build --preset build-release

If these preset names do not exist, inspect:

cat CMakePresets.json

Then use the actual preset names from the repository.

Build options

Common build options can include:

SOFTADASTRA_BUILD_APPS
SOFTADASTRA_BUILD_CLI_APP
SOFTADASTRA_BUILD_NODE_APP
SOFTADASTRA_BUILD_EXAMPLES
SOFTADASTRA_BUILD_TESTS

Only rely on options that exist in the current CMakeLists.txt and CMakePresets.json.

Example:

vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON

With node app:

vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON

With examples and tests, if supported:

vix build -- \
  -DSOFTADASTRA_BUILD_EXAMPLES=ON \
  -DSOFTADASTRA_BUILD_TESTS=ON
Export the CLI binary

If your Vix build supports binary export:

vix build --bin

Expected result:

./softadastra

Then verify:

./softadastra help
./softadastra version
./softadastra status

If --bin is not supported in the current setup, find the binary manually.

Find build artifacts

Depending on the current build layout, the CLI binary can be in one of these paths:

./softadastra
build-ninja/softadastra
build-ninja/apps/cli/softadastra
build-ninja/apps/cli/softadastra_cli
build-release/softadastra
build-release/apps/cli/softadastra

Find binaries:

find . -type f -executable -name "softadastra*"

Run the found binary:

./path/to/softadastra help
Verify the CLI build

After building the CLI, run:

softadastra help
softadastra version
softadastra status

If the binary is not in PATH, run it directly:

./softadastra help
./softadastra version
./softadastra status

Expected behavior:

help     -> prints available commands
version  -> prints the CLI version
status   -> prints local runtime status
Verify store commands

Run:

softadastra store put app/name Softadastra
softadastra store get app/name
softadastra store remove app/name

Expected output style:

Stored value

  key     : app/name
  value   : Softadastra
  created : yes

Then:

Value

  key   : app/name
  value : Softadastra

Then:

Removed value

  key     : app/name
  removed : yes

If a missing key is read:

softadastra store get app/name

Expected output style:

error: key not found
key: app/name
Verify sync commands

Run:

softadastra sync status
softadastra sync tick

Expected output style:

Sync status

  outbox       : 0
  queued       : 0
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0

Tick output style:

Sync tick

  retried : 0
  pruned  : 0
  batch   : 0

Exact numbers can differ depending on previous local writes and runtime configuration.

Verify node commands

Run:

softadastra node info

Expected output style:

Node

  id           : node-a
  display name : Local Node
  hostname     : softadastra-dev
  os           : linux
  version      : 0.1.0
  uptime ms    : 18420
  capabilities : core, store, sync, transport, discovery, metadata

If the node app is available:

softadastra node start

Expected output style:

Softadastra node

  id       : node-a
  address  : 127.0.0.1:4041
  state    : running

If the node app is not available:

error: node app is not available in this build
hint: rebuild with SOFTADASTRA_BUILD_NODE_APP=ON
Verify peers command

Run:

softadastra peers

Expected output when no peer exists:

Peers

  no peers found

This is valid.

No peers found should not break local store behavior.

Verify interactive mode

If interactive mode is enabled:

softadastra

Expected prompt:

softadastra>

Try:

softadastra> status
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> exit

Inside interactive mode, do not repeat the binary name.

Wrong:

softadastra> softadastra status

Correct:

softadastra> status
Verify persistence behavior

Create the data directory:

mkdir -p data

Run a persistent example from the SDK or application.

The verification flow should be:

open runtime
  ↓
write value
  ↓
close runtime
  ↓
open runtime with same WAL path
  ↓
read value

Expected result:

recovered value is readable

This verifies WAL-backed recovery.

Verify local-first behavior

A release build should preserve local-first behavior.

Run:

softadastra store put draft/1 hello
softadastra store get draft/1
softadastra peers

Even if peers output says:

Peers

  no peers found

The local value should still be readable.

The rule is:

no peer
  ↓
local store still works
Verify transport failure behavior

If transport or peer connection fails, local state should remain valid.

Expected behavior:

peer connection failed
  ↓
sync work remains pending
  ↓
local data remains readable

A release should not treat transport failure as local data failure.

Verify discovery empty state

If no peer is discovered:

softadastra peers

Expected output:

Peers

  no peers found

This should be treated as a valid empty state.

It should not be a crash.

Verify C++ SDK

Go to the C++ SDK repository:

cd ~/softadastra/sdk-cpp

Expected example areas:

local store
persistent store
remove value
basic sync
transport
discovery
metadata
errors

Run the examples according to the SDK repository build setup.

If the SDK uses Vix:

vix build

If it uses CMake:

cmake --preset dev-ninja
cmake --build --preset build-ninja

If examples are built as binaries, find them:

find . -type f -executable

Recommended verification:

local store example prints stored value
persistent store example creates WAL file
remove value example returns not_found after remove
basic sync example shows outbox and tick result
transport example handles missing peer cleanly
discovery example handles no peers cleanly
metadata example prints node info
errors example shows explicit errors
Verify JavaScript SDK

Go to the JavaScript SDK repository:

cd ~/softadastra/sdk-js

Install dependencies:

npm install

Create data directory:

mkdir -p data

Run examples:

npm run examples:local-store
npm run examples:persistent-store
npm run examples:remove-value
npm run examples:basic-sync
npm run examples:tcp-peer-sync
npm run examples:discovery
npm run examples:node-metadata

Run tests:

npm test

Expected verification:

local store example prints stored value
persistent store example creates WAL file
remove value example returns not_found after remove
basic sync example shows outbox and tick result
TCP peer sync handles missing peer cleanly
discovery handles no peers cleanly
metadata prints node info
tests pass
Verify documentation build

Go to the documentation project root.

If the docs have a package file:

npm install

Build:

npm run build

or, depending on scripts:

npm run docs:build

For VitePress, a successful build should generate:

.vitepress/dist

The build should not fail on broken links, missing pages, or invalid sidebar entries.

Verify documentation routes

Check that these sections exist:

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

Important guide routes:

/guides/build-offline-first-app
/guides/run-local-node
/guides/persist-data-locally
/guides/sync-between-nodes
/guides/use-cpp-sdk-with-engine
/guides/use-js-sdk-with-engine
/guides/production

Important reference routes:

/reference/cli
/reference/cpp-api
/reference/js-api
/reference/config
/reference/errors

Important release routes:

/releases/changelog
/releases/builds
Release artifacts

Release artifacts should be named clearly.

Possible artifact names:

softadastra-linux-x86_64.tar.gz
softadastra-cli-linux-x86_64.tar.gz
softadastra-engine-linux-x86_64.tar.gz
softadastra-sdk-cpp-linux-x86_64.tar.gz
softadastra-sdk-js.tgz

Use names that include:

project
component
platform
architecture
version

Example:

softadastra-cli-v0.1.0-linux-x86_64.tar.gz
Artifact contents

A CLI artifact can include:

softadastra
README.md
LICENSE
CHANGELOG.md

An engine artifact can include:

include/
lib/
cmake/
README.md
LICENSE
CHANGELOG.md

A C++ SDK artifact can include:

include/
lib/
cmake/
examples/
README.md
LICENSE
CHANGELOG.md

A JavaScript SDK artifact is usually published as an npm package or archive:

package.json
src/
README.md
LICENSE
CHANGELOG.md
Artifact verification

After producing an artifact, test it in a clean directory.

Example:

mkdir -p /tmp/softadastra-release-test
cd /tmp/softadastra-release-test
tar -xzf /path/to/softadastra-cli-v0.1.0-linux-x86_64.tar.gz
./softadastra help
./softadastra version

For SDK artifacts, test a minimal application that imports or links the SDK.

Version verification

Before publishing, check:

softadastra version

Expected output style:

Softadastra 0.1.0

Also verify version references in:

CHANGELOG.md
README.md
docs
package.json, for JavaScript SDK
vix.json, if used
CMake project version, if used
Build logs

Keep build logs useful.

Important information:

compiler
CMake version
Ninja version
Vix version
build preset
build type
enabled options
target platform
commit hash
version

A release build should be traceable.

Common build issues
Missing package.json in docs

If you run npm in the wrong directory, you may see:

Could not read package.json

Fix:

cd /path/to/docs-project-root
ls package.json
npm install
npm run build

If the docs directory only contains markdown files and .vitepress/, create or use the correct VitePress project root.

Missing data directory

Persistent examples can fail if data/ does not exist.

Fix:

mkdir -p data
CLI binary not found

Find it:

find . -type f -executable -name "softadastra*"

Then run the full path:

./build-ninja/apps/cli/softadastra help
Command not found

If softadastra is not in PATH, run:

./softadastra help

Or install locally:

mkdir -p ~/.local/bin
cp ./softadastra ~/.local/bin/softadastra
chmod +x ~/.local/bin/softadastra
export PATH="$HOME/.local/bin:$PATH"
Port already in use

If transport fails to start:

ss -ltnp | grep 4041

Use another port:

node-a -> 4041
node-b -> 4042
Node app not available

If softadastra node start fails:

error: node app is not available in this build

Rebuild with:

vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
Documentation broken links

If VitePress reports missing pages, check:

docs tree
sidebar config
nav links
relative links
file names
case sensitivity

Route names should match file names.

Example:

/guides/sync-between-nodes

should map to:

guides/sync-between-nodes.md
Build verification checklist

Before publishing a build, verify:

engine builds successfully
release build succeeds
CLI binary exists
CLI help works
CLI version works
CLI status works
store put/get/remove works
sync status works
sync tick works
peers handles empty state
node info works
persistent recovery works
transport failure does not delete local data
discovery empty state is handled
C++ SDK examples build or run
JavaScript SDK examples run
JavaScript SDK tests pass
docs build succeeds
changelog is updated
version is correct
artifacts are named consistently
Release safety checklist

Softadastra builds should protect local-first behavior.

Before release, verify:

local writes work without network
local reads work without network
missing keys return explicit errors
WAL paths are validated
WAL recovery works
sync status exposes pending work
sync tick exposes batch information
transport failure is visible
transport failure does not invalidate local state
discovery no-peers state is valid
metadata identifies the node
CLI errors are actionable
SDK errors are explicit
Minimal release command sequence

A useful local release verification sequence:

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

Adjust ./softadastra if the binary is generated elsewhere.

Documentation release command sequence

A useful docs verification sequence:

cd ~/softadastra/docs

npm install
npm run build

If the docs project uses another root, run the command from the directory containing package.json.

If VitePress is used, check:

ls .vitepress/dist
JavaScript SDK release command sequence
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

If publishing to npm later, verify package contents:

npm pack --dry-run
C++ SDK release command sequence
cd ~/softadastra/sdk-cpp

vix build

or:

cmake --preset dev-ninja
cmake --build --preset build-ninja

Then run available examples or tests according to the SDK repository layout.

What a good build proves

A good build proves:

the code compiles
the CLI starts
the SDK examples work
the docs build
local-first behavior still works
persistence can be verified
sync state is visible
errors are explicit

It does not automatically prove:

production readiness
perfect convergence
all network failures
all conflict cases
all platform-specific behavior
all deployment environments

Those require deeper testing.

Stable versus experimental artifacts

Only publish artifacts as stable when they are intended to be supported.

Recommended rule:

stable CLI binary        -> publish as release artifact
stable SDK package       -> publish as SDK artifact
experimental node app    -> mark as experimental
unstable JSON schema     -> do not advertise as stable
internal test binary     -> do not publish as public artifact
Summary

Softadastra builds should be reproducible, verifiable, and clear.

The release build process should verify:

build
CLI
SDKs
docs
local-first behavior
persistence
sync visibility
error handling
artifacts

The most important build rule is:

do not ship a build that cannot be verified
Related pages
Releases
Changelog
Production Guide
CLI Reference
C++ API Reference
JavaScript API Reference
Configuration Reference
Errors Reference
