# Configuration Reference

This page explains the public configuration model of Softadastra.

Use it when you need to understand how Softadastra chooses:

- the local node id
- where the SDK is installed
- where the CLI is installed
- where the C++ SDK is installed
- which version is installed
- whether the installer installs the CLI, the SDK, or both

For SDK runtime options, read the SDK-specific pages:

- [C++ Client Options](/sdk-cpp/client-options)
- [SDKs](/sdks)

## Installation configuration

The official installer supports a few environment variables.

Most users do not need them.

The default install is enough:

```sh
curl -fsSL https://softadastra.com/install.sh | sh
```

On Windows:

```powershell
irm https://softadastra.com/install.ps1 | iex
```

By default, this installs:

- Softadastra CLI
- Softadastra C++ SDK

## Install kind

Use `SOFTADASTRA_INSTALL_KIND` when you only want part of Softadastra.

Supported values:

| Value | Meaning                  |
| ----- | ------------------------ |
| `all` | Install CLI and C++ SDK  |
| `cli` | Install only the CLI     |
| `sdk` | Install only the C++ SDK |

Default:

```txt
all
```

Linux and macOS:

```sh
SOFTADASTRA_INSTALL_KIND=cli \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_INSTALL_KIND="cli"
irm https://softadastra.com/install.ps1 | iex
```

## Version

Use `SOFTADASTRA_VERSION` to install a specific CLI version.

Default:

```txt
latest
```

Linux and macOS:

```sh
SOFTADASTRA_VERSION=v0.1.0 \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_VERSION="v0.1.0"
irm https://softadastra.com/install.ps1 | iex
```

## SDK version

Use `SOFTADASTRA_SDK_VERSION` to install a specific C++ SDK version.

If this value is not set, it uses the same version as `SOFTADASTRA_VERSION`.

Linux and macOS:

```sh
SOFTADASTRA_VERSION=v0.1.0 \
SOFTADASTRA_SDK_VERSION=v0.1.0 \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_VERSION="v0.1.0"
$env:SOFTADASTRA_SDK_VERSION="v0.1.0"
irm https://softadastra.com/install.ps1 | iex
```

Use the same version for the CLI and SDK unless you know you need a different SDK version.

## Install root

Use `SOFTADASTRA_HOME` to change the Softadastra install root.

Linux and macOS default:

```txt
~/.softadastra
```

Windows default:

```txt
%LOCALAPPDATA%\Softadastra
```

Linux and macOS:

```sh
SOFTADASTRA_HOME="$HOME/.softadastra" \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_HOME="$env:LOCALAPPDATA\Softadastra"
irm https://softadastra.com/install.ps1 | iex
```

## CLI binary directory

Use `SOFTADASTRA_BIN_DIR` to change where the CLI binary is installed.

Linux and macOS default:

```txt
~/.local/bin
```

Windows default:

```txt
%LOCALAPPDATA%\Softadastra\bin
```

Linux and macOS:

```sh
SOFTADASTRA_BIN_DIR="$HOME/.local/bin" \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_BIN_DIR="$env:LOCALAPPDATA\Softadastra\bin"
irm https://softadastra.com/install.ps1 | iex
```

After installation, the CLI should be available as:

```sh
softadastra
```

If it is not available immediately, open a new terminal.

## C++ SDK directory

Use `SOFTADASTRA_SDK_DIR` to change where the C++ SDK is installed.

Linux and macOS default:

```txt
~/.softadastra/sdk
```

Windows default:

```txt
%LOCALAPPDATA%\Softadastra\sdk
```

Linux and macOS:

```sh
SOFTADASTRA_SDK_DIR="$HOME/.softadastra/sdk" \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_SDK_DIR="$env:LOCALAPPDATA\Softadastra\sdk"
irm https://softadastra.com/install.ps1 | iex
```

Use this path with CMake:

```sh
-DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

On Windows:

```powershell
-DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

## Repository variables

The installer downloads release archives from GitHub.

The default repositories are:

| Variable               | Default                   |
| ---------------------- | ------------------------- |
| `SOFTADASTRA_REPO`     | `softadastra/softadastra` |
| `SOFTADASTRA_SDK_REPO` | `softadastra/sdk`         |

Most users should not change these.

They are useful for testing forks or release pipelines.

Linux and macOS:

```sh
SOFTADASTRA_REPO="softadastra/softadastra" \
SOFTADASTRA_SDK_REPO="softadastra/sdk" \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_REPO="softadastra/softadastra"
$env:SOFTADASTRA_SDK_REPO="softadastra/sdk"
irm https://softadastra.com/install.ps1 | iex
```

## Full Linux/macOS example

Install CLI and SDK into custom paths:

```sh
SOFTADASTRA_VERSION=v0.1.0 \
SOFTADASTRA_SDK_VERSION=v0.1.0 \
SOFTADASTRA_INSTALL_KIND=all \
SOFTADASTRA_HOME="$HOME/.softadastra" \
SOFTADASTRA_BIN_DIR="$HOME/.local/bin" \
SOFTADASTRA_SDK_DIR="$HOME/.softadastra/sdk" \
curl -fsSL https://softadastra.com/install.sh | sh
```

## Full Windows example

Install CLI and SDK into custom paths:

```powershell
$env:SOFTADASTRA_VERSION="v0.1.0"
$env:SOFTADASTRA_SDK_VERSION="v0.1.0"
$env:SOFTADASTRA_INSTALL_KIND="all"
$env:SOFTADASTRA_HOME="$env:LOCALAPPDATA\Softadastra"
$env:SOFTADASTRA_BIN_DIR="$env:LOCALAPPDATA\Softadastra\bin"
$env:SOFTADASTRA_SDK_DIR="$env:LOCALAPPDATA\Softadastra\sdk"

irm https://softadastra.com/install.ps1 | iex
```

## Verify configuration

After installation, verify the CLI:

```sh
softadastra version
softadastra status
```

Verify the C++ SDK path:

Linux and macOS:

```sh
ls "$HOME/.softadastra/sdk"
```

Windows PowerShell:

```powershell
Test-Path "$env:LOCALAPPDATA\Softadastra\sdk"
```

## Use the SDK path with Vix

Linux and macOS:

```sh
vix build -- -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

Windows PowerShell:

```powershell
vix build -- -DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

## Use the SDK path with CMake

Linux and macOS:

```sh
cmake -S . -B build \
  -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

Windows PowerShell:

```powershell
cmake -S . -B build `
  -DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

## Supported install targets

Linux and macOS installer:

```txt
linux-x86_64
linux-aarch64
macos-x86_64
macos-aarch64
```

Windows installer:

```txt
windows-x86_64
```

Windows ARM64 is not supported yet.

## Security checks

The installer verifies the downloaded release archive before installing it.

Required check:

```txt
SHA256 checksum
```

Optional check when `minisign` is installed:

```txt
minisign signature
```

If checksum verification fails, installation stops.

## Common issues

## `softadastra` command not found

Open a new terminal.

If it still does not work, check the binary path.

Linux and macOS:

```sh
ls "$HOME/.local/bin/softadastra"
```

Windows PowerShell:

```powershell
Test-Path "$env:LOCALAPPDATA\Softadastra\bin\softadastra.exe"
```

## Latest version cannot be resolved

Set the version explicitly.

Linux and macOS:

```sh
SOFTADASTRA_VERSION=v0.1.0 \
curl -fsSL https://softadastra.com/install.sh | sh
```

Windows PowerShell:

```powershell
$env:SOFTADASTRA_VERSION="v0.1.0"
irm https://softadastra.com/install.ps1 | iex
```

## SDK cannot be found by CMake

Pass `CMAKE_PREFIX_PATH`.

Linux and macOS:

```sh
-DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

Windows PowerShell:

```powershell
-DCMAKE_PREFIX_PATH="$env:LOCALAPPDATA\Softadastra\sdk"
```

## Summary

Softadastra configuration is mainly controlled through installer environment variables.

Most users only need:

```sh
curl -fsSL https://softadastra.com/install.sh | sh
```

or on Windows:

```powershell
irm https://softadastra.com/install.ps1 | iex
```

Use custom variables only when you need a specific version, a custom install directory, or CLI-only / SDK-only installation.

## Related pages

- [Installation](/installation)
- [Quick Start](/quick-start)
- [SDKs](/sdks)
- [CLI Reference](/cli/reference)
