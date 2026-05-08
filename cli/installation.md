# CLI Installation

This page explains how to build and run the Softadastra CLI locally.

The Softadastra CLI is built from the engine repository:

```txt
~/softadastra/softadastra
```

It provides the terminal entry point:

```txt
softadastra
```

## Requirements

Before building the CLI, make sure you have:

- a C++20 compiler
- CMake
- Ninja
- Git
- Vix

Recommended tools:

```sh
g++ --version
cmake --version
ninja --version
git --version
vix --version
```

## Repository location

Go to the engine repository:

```sh
cd ~/softadastra/softadastra
```

You should see files like:

```txt
CMakeLists.txt
CMakePresets.json
vix.json
apps/
modules/
README.md
```

The CLI application lives under `apps/cli`. The reusable CLI framework lives under `modules/cli`.

This page is about building the product CLI binary.

## Build the CLI

The simplest build command is:

```sh
vix build
```

If the CLI app is behind CMake options, enable the app build explicitly:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

To build both the CLI and the node app:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
```

## Build in release mode

For a release build:

```sh
vix build --preset release
```

If you want to pass CMake options too:

```sh
vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

## Export the binary

If your Vix build supports binary export, build and copy the final executable to the project root:

```sh
vix build --bin
```

After that, you should be able to run:

```sh
./softadastra help
```

## Build with CMake directly

You can also build with CMake.

Configure:

```sh
cmake --preset dev-ninja
```

Build:

```sh
cmake --build --preset build-ninja
```

For release:

```sh
cmake --preset release
cmake --build --preset build-release
```

If your presets use different names, inspect them with:

```sh
cat CMakePresets.json
```

## Find the binary

Depending on your build configuration, the CLI binary can be in one of these places:

```txt
./softadastra
build-ninja/softadastra
build-ninja/apps/cli/softadastra
build-ninja/apps/cli/softadastra_cli
```

Find it with:

```sh
find . -type f -executable -name "softadastra*"
```

Then run:

```sh
./path/to/softadastra help
```

## Add the CLI to PATH

For local development, you can create a local bin directory:

```sh
mkdir -p ~/.local/bin
```

Copy the binary:

```sh
cp ./softadastra ~/.local/bin/softadastra
```

Make sure it is executable:

```sh
chmod +x ~/.local/bin/softadastra
```

Add `~/.local/bin` to your PATH if needed:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

To make it permanent, add this line to your shell profile:

```sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

Reload your shell:

```sh
source ~/.bashrc
```

Verify:

```sh
softadastra help
```

## Verify the installation

Run:

```sh
softadastra help
softadastra version
softadastra status
```

Expected behavior:

- `softadastra help` prints available commands
- `softadastra version` prints the CLI version
- `softadastra status` prints local runtime status

## Try local store commands

Write a value:

```sh
softadastra store put app/name Softadastra
```

Read it:

```sh
softadastra store get app/name
```

Remove it:

```sh
softadastra store remove app/name
```

The local store commands are useful for checking that the CLI can interact with the local runtime.

## Try sync commands

Check sync state:

```sh
softadastra sync status
```

Run one sync tick:

```sh
softadastra sync tick
```

A sync tick moves the sync pipeline forward once. It can retry expired work, produce the next batch, and prune completed work when requested.

## Try node commands

Inspect the local node:

```sh
softadastra node info
```

Start the node if your build includes the node runtime:

```sh
softadastra node start
```

The node command should expose metadata such as node id, display name, hostname, operating system, version, uptime, and capabilities.

## Try peers

List known peers:

```sh
softadastra peers
```

If no peer is available yet, the command should still fail cleanly or print an empty list. This is expected in local development.

## Interactive mode

If the CLI supports interactive mode, run:

```sh
softadastra
```

Then try:

```txt
status
node info
store put app/name Softadastra
store get app/name
sync status
sync tick
peers
exit
```

Interactive mode is useful for local testing because the same process can execute multiple commands.

## Recommended development flow

During development, use:

```sh
cd ~/softadastra/softadastra
vix build --bin
./softadastra help
```

After changes:

```sh
vix build --bin
./softadastra status
```

For debugging build configuration:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

## Common issues

### `softadastra: command not found`

The CLI binary is not in your PATH.

Run it directly:

```sh
./softadastra help
```

Or add it to `~/.local/bin`:

```sh
mkdir -p ~/.local/bin
cp ./softadastra ~/.local/bin/softadastra
chmod +x ~/.local/bin/softadastra
export PATH="$HOME/.local/bin:$PATH"
```

### No such file or directory

You may be running the command from the wrong directory.

Check your current directory:

```sh
pwd
ls
```

If you are building the engine, you should be in:

```txt
~/softadastra/softadastra
```

### CMake preset error

If CMake cannot find a preset, inspect the available presets:

```sh
cat CMakePresets.json
```

Then use the preset names defined in that file.

### CLI app not built

If the engine builds but no CLI binary is produced, enable app builds:

```sh
vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON
```

Then search for the executable:

```sh
find . -type f -executable -name "softadastra*"
```

### Permission denied

Make the binary executable:

```sh
chmod +x ./softadastra
```

### Store command fails

If a store command fails, check:

```sh
softadastra status
softadastra help
softadastra store --help
```

Possible causes: invalid key, missing value, runtime not initialized, store path not available, or permission issue.

### Sync command shows no work

This can be normal. If there is no local operation waiting to sync, the outbox can be empty.

Try writing a value first:

```sh
softadastra store put message/1 hello
softadastra sync status
softadastra sync tick
```

## Summary

To install and verify the CLI locally:

```sh
cd ~/softadastra/softadastra
vix build --bin
./softadastra help
./softadastra status
```

Then optionally add it to your PATH:

```sh
mkdir -p ~/.local/bin
cp ./softadastra ~/.local/bin/softadastra
chmod +x ~/.local/bin/softadastra
```

The CLI is now ready for local Softadastra development.

## Next step

Continue with the CLI commands overview:

[Go to CLI Commands](/cli/commands)
