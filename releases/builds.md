# Builds

This page explains how to build and verify the Softadastra repositories.

Use it when you are working inside the source repositories and need to build the CLI, the node app, the C++ SDK, the documentation, or release artifacts.

This page is for repository maintainers and contributors.

For normal installation, use the official installer:

```sh
curl -fsSL https://softadastra.com/install.sh | sh
```

On Windows:

```powershell
irm https://softadastra.com/install.ps1 | iex
```

## Main rule

A build is useful only if it can be reproduced and verified.

Before publishing or trusting a build, verify at least:

- the project builds
- the CLI starts
- the version command works
- the status command works
- local store put/get works
- sync status works
- sync tick works
- peers handles the empty state
- docs build successfully
- release artifacts have the expected names and contents

## Repositories

Softadastra currently has several repository surfaces.

```txt
softadastra/softadastra   -> runtime, modules, CLI, node app
softadastra/sdk           -> C++ SDK
softadastra/docs          -> documentation site
```

Future SDK repositories can be added later.

## Engine repository

The main runtime repository contains the runtime modules and product applications.

Typical local path:

```sh
cd ~/softadastra/softadastra
```

Important areas:

```txt
apps/       -> runnable applications
modules/    -> runtime modules
examples/   -> examples
cmake/      -> CMake helpers
data/       -> local runtime data
```

Build with Vix:

```sh
vix build
```

Build release mode:

```sh
vix build --preset release
```

Build with the CLI app enabled:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

Build with the CLI and node app enabled:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

Build release with apps enabled:

```sh
vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

## Build with CMake directly

Vix is the recommended developer command, but CMake can still be used directly.

Configure:

```sh
cmake --preset dev-ninja
```

Build:

```sh
cmake --build --preset build-ninja
```

Release configure:

```sh
cmake --preset release
```

Release build:

```sh
cmake --build --preset build-release
```

If a preset does not exist, check the repository presets:

```sh
cat CMakePresets.json
```

## Build options

Common build options can include:

```txt
SOFTADASTRA_BUILD_APPS
SOFTADASTRA_BUILD_CLI_APP
SOFTADASTRA_BUILD_NODE_APP
SOFTADASTRA_BUILD_EXAMPLES
SOFTADASTRA_BUILD_TESTS
```

Only use options that exist in the current repository.

Check:

```sh
grep -R "SOFTADASTRA_BUILD_" -n CMakeLists.txt apps modules cmake
```

## Export the CLI binary

If the Vix project supports binary export, run:

```sh
vix build --bin
```

Expected result:

```txt
./softadastra
```

Verify:

```sh
./softadastra version
./softadastra status
```

If `--bin` does not export the binary in the current setup, find it manually:

```sh
find . -type f -executable -name "softadastra*"
```

Then run the binary using its full path.

## Verify the CLI

After building the CLI, verify the stable command surface.

```sh
softadastra version
softadastra status
```

If the binary is not in `PATH`, run it directly:

```sh
./softadastra version
./softadastra status
```

Then verify local store commands:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
```

Then verify sync commands:

```sh
softadastra sync status
softadastra sync tick
```

Then verify node and peers:

```sh
softadastra node info
softadastra peers
```

If you need node services for the current CLI session:

```sh
softadastra node start
softadastra peers
```

## Expected CLI commands

The current stable CLI surface is:

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

Do not use non-existing commands in build verification.

For example, do not verify with:

```sh
softadastra store remove app/name
```

unless that command is implemented and stable.

## Verify interactive mode

Start the CLI without arguments:

```sh
softadastra
```

Inside the session:

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

Correct:

```txt
softadastra> status
```

Wrong:

```txt
softadastra> softadastra status
```

## Verify local-first behavior

Softadastra must keep local work useful without peers.

Run:

```sh
softadastra store put draft/1 hello
softadastra store get draft/1
softadastra peers
```

Even if peers are empty, the local value should still be readable.

The rule is:

```txt
no peer
  ↓
local store still works
```

## Verify sync visibility

After a local write, sync should be inspectable.

```sh
softadastra store put message/1 hello
softadastra sync status
softadastra sync tick
softadastra sync status
```

A tick may show no connected peers.

That is normal when no peer is connected.

The important part is that sync state is visible and local data is still readable.

## Verify node behavior

Run:

```sh
softadastra node info
```

If metadata is unavailable, the CLI should still show basic node information.

Then start node services:

```sh
softadastra node start
```

Verify:

```sh
softadastra node info
softadastra status
softadastra peers
```

`node start` starts services for the current CLI runtime.

For a long-running daemon, use the Softadastra node app.

## Verify peers empty state

Run:

```sh
softadastra peers
```

If no peer exists, this is valid:

```txt
No discovery peers found.
No transport peers found.
```

No peers should not break local store behavior.

## Verify persistent recovery

Persistent recovery is verified with the C++ SDK or a runtime example.

The flow is:

```txt
open persistent runtime
write value
close runtime
open again with the same WAL path
read value
```

Before running persistent examples, create the data directory:

```sh
mkdir -p data
```

Expected result:

```txt
the value written before restart is readable after restart
```

## C++ SDK repository

The C++ SDK repository is the developer-facing C++ API.

Typical local path:

```sh
cd ~/softadastra/sdk
```

Build with Vix:

```sh
vix build
```

Or with CMake:

```sh
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

If examples are enabled, run the current examples from the repository.

Useful verification areas:

```txt
local store
persistent store
restart recovery
sync state
manual tick
transport
discovery
metadata
```

Do not verify with old examples that no longer exist.

## Verify installed C++ SDK

After installing Softadastra, the SDK should be available here:

Linux and macOS:

```txt
~/.softadastra/sdk
```

Windows:

```txt
%LOCALAPPDATA%\Softadastra\sdk
```

Use it with Vix:

```sh
vix build -- -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

On Windows:

```powershell
vix build -- -DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

Use it with CMake:

```sh
cmake -S . -B build \
  -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

## Documentation repository

Typical local path:

```sh
cd ~/softadastra/docs
```

Install dependencies:

```sh
npm install
```

Run the docs locally:

```sh
npm run dev
```

Build the docs:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

For VitePress, a successful build should produce:

```txt
.vitepress/dist
```

The docs build should not fail because of:

- broken links
- missing pages
- invalid sidebar entries
- invalid nav links
- wrong relative links
- case-sensitive filename mismatch

## Verify documentation routes

Check the main public routes:

```txt
/
installation
quick-start
sdks

/cli/
/sdk-cpp/
/reference/
/releases/
```

Important CLI routes:

```txt
/cli/
/cli/commands
/cli/interactive-mode
/cli/node
/cli/store
/cli/sync
/cli/peers
/cli/reference
```

Important C++ SDK routes:

```txt
/sdk-cpp/
/sdk-cpp/installation
/sdk-cpp/quick-start
/sdk-cpp/client
/sdk-cpp/client-options
/sdk-cpp/results-and-errors
/sdk-cpp/local-store
/sdk-cpp/persistent-store
/sdk-cpp/restart-recovery
/sdk-cpp/sync-state
/sdk-cpp/tick
/sdk-cpp/transport
/sdk-cpp/discovery
/sdk-cpp/metadata
/sdk-cpp/examples
```

Important reference routes:

```txt
/reference/
/reference/cli
/reference/cpp-api
/reference/config
/reference/errors
```

Important release routes:

```txt
/releases/
/releases/changelog
/releases/builds
```

## Release artifacts

Release artifacts should be named clearly.

The installer expects platform archives for the CLI and C++ SDK.

CLI archive names:

```txt
softadastra-linux-x86_64.tar.gz
softadastra-linux-aarch64.tar.gz
softadastra-macos-x86_64.tar.gz
softadastra-macos-aarch64.tar.gz
softadastra-windows-x86_64.zip
```

C++ SDK archive names:

```txt
softadastra-sdk-linux-x86_64.tar.gz
softadastra-sdk-linux-aarch64.tar.gz
softadastra-sdk-macos-x86_64.tar.gz
softadastra-sdk-macos-aarch64.tar.gz
softadastra-sdk-windows-x86_64.zip
```

Each archive must also have a SHA256 file:

```txt
<archive>.sha256
```

If available, add a minisign signature:

```txt
<archive>.minisig
```

## CLI artifact contents

The Linux and macOS CLI archive should contain the binary in one of these accepted layouts:

```txt
bin/softadastra
```

or:

```txt
softadastra
```

The Windows CLI archive should contain:

```txt
softadastra.exe
```

The installer searches recursively for `softadastra.exe` on Windows.

## C++ SDK artifact contents

The SDK archive must contain:

```txt
include/softadastra/sdk
lib/cmake/sdk-cpp/sdk-cppConfig.cmake
```

A good SDK archive can also include:

```txt
include/softadastra/sdk.hpp
lib/
README.md
LICENSE
CHANGELOG.md
examples/
```

The installer fails if the required include directory or CMake config is missing.

## Verify release artifacts

Create a clean test directory:

```sh
mkdir -p /tmp/softadastra-release-test
cd /tmp/softadastra-release-test
```

Test the CLI archive:

```sh
tar -xzf /path/to/softadastra-linux-x86_64.tar.gz
./softadastra version
./softadastra status
```

If the archive contains `bin/softadastra`:

```sh
./bin/softadastra version
./bin/softadastra status
```

Test the SDK archive by installing or extracting it into a clean prefix, then building a tiny C++ app with:

```sh
-DCMAKE_PREFIX_PATH=/path/to/sdk
```

## Version verification

Before publishing, check:

```sh
softadastra version
```

Also verify version references in:

```txt
CHANGELOG.md
README.md
docs
vix.json
CMake project version
release tag
```

For the C++ SDK, verify the SDK version helpers if needed:

```cpp
softadastra::sdk::sdk_version()
```

## Build logs

Keep build logs useful.

A good build log should make these clear:

- compiler
- CMake version
- Ninja version
- Vix version
- build preset
- build type
- enabled options
- target platform
- commit hash
- release version

## Common build issues

## Missing data directory

Persistent examples can fail if `data/` does not exist.

Fix:

```sh
mkdir -p data
```

## CLI binary not found

Find it:

```sh
find . -type f -executable -name "softadastra*"
```

Then run the full path:

```sh
./path/to/softadastra version
```

## Command not found

If `softadastra` is not in `PATH`, run the binary directly:

```sh
./softadastra version
```

Or install the official release:

```sh
curl -fsSL https://softadastra.com/install.sh | sh
```

## Port already in use

If transport fails to start, check the port:

```sh
ss -ltnp | grep 9100
```

Use another port if needed.

## Node app not available

If a long-running node app is not built, rebuild with:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

## Documentation broken links

If VitePress reports broken links, check:

- the file exists
- the route matches the filename
- the sidebar points to the right path
- the header nav points to the right path
- relative links do not include wrong extensions
- file case matches the link case

Example:

```txt
/reference/cpp-api
```

should map to:

```txt
reference/cpp-api.md
```

## Build verification checklist

Before publishing a build, verify:

- engine repository builds
- release preset builds
- CLI binary exists
- CLI version works
- CLI status works
- store put/get works
- sync status works
- sync tick works
- node info works
- peers handles empty state
- local-first behavior still works
- persistent recovery works
- C++ SDK builds
- C++ SDK can be found with `CMAKE_PREFIX_PATH`
- documentation builds
- changelog is updated
- version is correct
- release artifacts are named correctly
- release artifacts contain required files
- release artifacts have `.sha256`
- installer can install the release

## Minimal release verification sequence

From the engine repository:

```sh
cd ~/softadastra/softadastra

vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON

find . -type f -executable -name "softadastra*"
```

Then run the built binary:

```sh
./softadastra version
./softadastra status

./softadastra store put app/name Softadastra
./softadastra store get app/name

./softadastra sync status
./softadastra sync tick

./softadastra node info
./softadastra peers
```

Adjust `./softadastra` if the binary is generated in another folder.

## Documentation verification sequence

```sh
cd ~/softadastra/docs

npm install
npm run build
```

Then check:

```sh
ls .vitepress/dist
```

## C++ SDK verification sequence

```sh
cd ~/softadastra/sdk

vix build
```

or:

```sh
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

Then run the available examples or tests from the SDK repository.

## What a good build proves

A good build proves:

- the code compiles
- the CLI starts
- the CLI stable commands work
- the C++ SDK builds
- the docs build
- local-first behavior still works
- persistence can be verified
- sync state is visible
- errors are explicit
- release artifacts can be installed

It does not prove everything about production behavior.

Production reliability still needs deeper testing, including network failures, crash recovery, conflict cases, and real deployment constraints.

## Stable versus experimental artifacts

Only publish artifacts as stable when they are intended to be supported.

Good rule:

```txt
stable CLI binary        -> publish as release artifact
stable C++ SDK package   -> publish as SDK artifact
experimental node app    -> mark clearly if needed
internal test binary     -> do not publish as public artifact
```

## Summary

Softadastra builds should be reproducible, verifiable, and clear.

The release process should verify:

- repositories
- CLI
- C++ SDK
- docs
- local-first behavior
- persistence
- sync visibility
- error handling
- artifacts
- installer compatibility

The most important rule is:

```txt
do not ship a build that cannot be verified
```

## Related pages

- [Releases](./index)
- [Changelog](./changelog)
- [Installation](../installation)
- [CLI Reference](../reference/cli)
- [C++ API Reference](../reference/cpp-api)
- [Configuration Reference](../reference/config)
- [Errors Reference](../reference/errors)
