# Installation

This is the official installation page for Softadastra.

By default, the installer installs:

- the Softadastra CLI
- the Softadastra C++ SDK

The CLI gives you the `softadastra` command in your terminal.
The C++ SDK lets C++ applications use Softadastra with:

```cpp
#include <softadastra/sdk.hpp>
```

## Linux and macOS

Install Softadastra with:

```sh
curl -fsSL https://softadastra.com/install.sh | sh
```

This installs the CLI and the C++ SDK.

After installation, open a new terminal if `softadastra` is not found immediately.

Then verify:

```sh
softadastra version
softadastra status
```

## Windows

Install Softadastra from PowerShell:

```powershell
irm https://softadastra.com/install.ps1 | iex
```

This installs the CLI and the C++ SDK.

After installation, open a new PowerShell window if `softadastra` is not found immediately.

Then verify:

```powershell
softadastra version
softadastra status
```

## What gets installed

The default installation installs both the CLI and the C++ SDK.
On Linux and macOS, the default locations are:

```txt
CLI binary : ~/.local/bin/softadastra
SDK        : ~/.softadastra/sdk
Home       : ~/.softadastra
```

On Windows, the default locations are:

```txt
CLI binary : %LOCALAPPDATA%\Softadastra\bin\softadastra.exe
SDK        : %LOCALAPPDATA%\Softadastra\sdk
Home       : %LOCALAPPDATA%\Softadastra
```

The installer also updates your user environment so the `softadastra` command can be used from the terminal.

## Install only the CLI

Use this when you only want the terminal command.
Linux and macOS:

```sh
curl -fsSL https://softadastra.com/install.sh | sh -s -- --cli-only
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_INSTALL_KIND="cli"
irm https://softadastra.com/install.ps1 | iex
```

Verify:

```sh
softadastra version
softadastra status
```

## Install only the C++ SDK

Use this when you only want the C++ SDK files.

Linux and macOS:

```sh
curl -fsSL https://softadastra.com/install.sh | sh -s -- --sdk-only
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_INSTALL_KIND="sdk"
irm https://softadastra.com/install.ps1 | iex
```

The SDK is installed in:

```txt
~/.softadastra/sdk
```

on Linux and macOS, and in:

```txt
%LOCALAPPDATA%\Softadastra\sdk
```

on Windows.

## Install a specific version

By default, the installer uses the latest release.

To install a specific version on Linux or macOS:

```sh
SOFTADASTRA_VERSION=v0.1.0 \
SOFTADASTRA_SDK_VERSION=v0.1.0 \
curl -fsSL https://softadastra.com/install.sh | sh
```

On Windows PowerShell:

```powershell
$env:SOFTADASTRA_VERSION="v0.1.0"
$env:SOFTADASTRA_SDK_VERSION="v0.1.0"
irm https://softadastra.com/install.ps1 | iex
```

Use the same version for the CLI and SDK unless you know you need a different SDK version.

## Custom install directory

Linux and macOS:

```sh
SOFTADASTRA_HOME="$HOME/.softadastra" \
SOFTADASTRA_BIN_DIR="$HOME/.local/bin" \
SOFTADASTRA_SDK_DIR="$HOME/.softadastra/sdk" \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_HOME="$env:LOCALAPPDATA\Softadastra"
$env:SOFTADASTRA_BIN_DIR="$env:LOCALAPPDATA\Softadastra\bin"
$env:SOFTADASTRA_SDK_DIR="$env:LOCALAPPDATA\Softadastra\sdk"
irm https://softadastra.com/install.ps1 | iex
```

## Use the C++ SDK in a project

After installing the SDK, include the main header:

```cpp
#include <softadastra/sdk.hpp>
```

With CMake:

```cmake
find_package(sdk-cpp REQUIRED)

target_link_libraries(my_app PRIVATE softadastra::sdk)
```

If CMake cannot find the SDK, pass the SDK install path:

```sh
cmake -S . -B build \
  -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

With Vix:

```sh
vix build -- -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

On Windows PowerShell:

```powershell
vix build -- -DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

## Verify the CLI

Run:

```sh
softadastra version
softadastra status
```

Then try a local write:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
```

If this works, the CLI is ready.

## Verify the C++ SDK

Create a small C++ project and make sure it can include:

```cpp
#include <softadastra/sdk.hpp>
```

Then configure with the SDK path:

```sh
vix build -- -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

On Windows:

```powershell
vix build -- -DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

If the project builds, the SDK is ready.

## Security checks

The installer downloads release archives from the official Softadastra GitHub releases.
It verifies the SHA256 checksum before installing.
If `minisign` is available on your machine, the installer also verifies the release signature.
If checksum verification fails, installation stops.

## Common issues

## `softadastra` command not found

Open a new terminal first.
If it still does not work, check that the binary directory is in your PATH.

Linux and macOS:

```sh
echo "$PATH"
ls "$HOME/.local/bin/softadastra"
```

Windows PowerShell:

```powershell
$env:Path
Test-Path "$env:LOCALAPPDATA\Softadastra\bin\softadastra.exe"
```

## Latest version cannot be resolved

Set the version explicitly.
Linux and macOS:

```sh
SOFTADASTRA_VERSION=v0.1.0 curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_VERSION="v0.1.0"
irm https://softadastra.com/install.ps1 | iex
```

## CMake cannot find the SDK

Pass the SDK path with `CMAKE_PREFIX_PATH`.
Linux and macOS:

```sh
-DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

Windows PowerShell:

```powershell
-DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

## Unsupported platform

The Linux and macOS installer supports:

```txt
linux-x86_64
linux-aarch64
macos-x86_64
macos-aarch64
```

The Windows installer supports:

```txt
windows-x86_64
```

Windows ARM64 is not supported yet.

## Next step

Continue with [Quick Start](./quick-start).
