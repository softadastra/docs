# Installation

This page shows how to install the Softadastra C++ SDK and link it in a C++ project.

## Requirements

Before installing the SDK, make sure your system has:

```txt
C++20 compiler
CMake
Ninja
Git
curl
```

On Linux, you should also have the usual build tools installed.

For Ubuntu or Debian:

```bash
sudo apt update
sudo apt install -y build-essential cmake ninja-build git curl
```

## Install on Linux or macOS

Use the official install script:

```bash
curl -fsSL https://softadastra.com/install.sh | bash
```

This installs Softadastra in your user environment.

After installation, verify that the command is available:

```bash
softadastra --version
```

## Install on Windows

Use PowerShell:

```powershell
irm https://softadastra.com/install.ps1 | iex
```

Then verify the installation:

```powershell
softadastra --version
```

## Project setup

Create a small C++ project:

```bash
mkdir softadastra-sdk-app
cd softadastra-sdk-app
```

Create `main.cpp`:

```cpp
#include <softadastra/sdk.hpp>

#include <iostream>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::persistent(
            "my-app",
            "data/my-app.wal"
        )
    };

    const auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << opened.error().code_string()
                  << ": "
                  << opened.error().message()
                  << "\n";

        return 1;
    }

    const auto saved = client.put("hello", "world");

    if (saved.is_err())
    {
        std::cerr << saved.error().code_string()
                  << ": "
                  << saved.error().message()
                  << "\n";

        return 1;
    }

    const auto value = client.get("hello");

    if (value.is_err())
    {
        std::cerr << value.error().code_string()
                  << ": "
                  << value.error().message()
                  << "\n";

        return 1;
    }

    std::cout << value.value().to_string() << "\n";

    client.close();

    return 0;
}
```

Create `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.20)
project(softadastra_sdk_app LANGUAGES CXX)
find_package(sdk-cpp REQUIRED)
add_executable(app main.cpp)
target_compile_features(app PRIVATE cxx_std_20)
target_link_libraries(app PRIVATE softadastra::sdk)
```

## Build with Vix

If you use Vix, build the project with:

```bash
vix build -- -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
```

Run the app:

```bash
./build-ninja/app
```

Expected output:

```txt
world
```

## Build with CMake directly

You can also build with CMake and Ninja:

```bash
cmake -S . -B build-ninja \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"

cmake --build build-ninja
```

Run the app:

```bash
./build-ninja/app
```

Expected output:

```txt
world
```

## Main include

Use this include in applications:

```cpp
#include <softadastra/sdk.hpp>
```

This header includes the public SDK API:

```cpp
softadastra::sdk::Client
softadastra::sdk::ClientOptions
softadastra::sdk::Result
softadastra::sdk::Error
softadastra::sdk::Key
softadastra::sdk::Value
softadastra::sdk::Peer
softadastra::sdk::NodeInfo
softadastra::sdk::SyncState
softadastra::sdk::TickResult
```

## Link target

Use this CMake target:

```cmake
target_link_libraries(app PRIVATE softadastra::sdk)
```

## Persistent data directory

When using a persistent client:

```cpp
ClientOptions::persistent(
    "my-app",
    "data/my-app.wal"
)
```

the SDK writes local durable data to the WAL path you provide.

Create the data directory before running the application if it does not already exist:

```bash
mkdir -p data
```

## Recommended first test

After installation, the best first test is:

```bash
mkdir -p data
vix build -- -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="$HOME/.softadastra/sdk"
./build-ninja/app
```

If the program prints:

```txt
world
```

the SDK is installed and linked correctly.

## Next step

Continue with [Quick Start](./quick-start).
