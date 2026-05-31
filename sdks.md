# SDKs

Softadastra SDKs let you use Softadastra inside your own applications.

Each SDK is designed to give your application a simple way to work locally first, keep important data after restart, and synchronize when networking is available.

The goal is simple: your app should keep working even when the network is slow, unstable, or unavailable.

## Available SDKs

## C++ SDK

The C++ SDK is the first official Softadastra SDK.

Use it when you want to embed Softadastra directly inside a C++ application.

It gives your app:

- local writes
- local reads
- WAL-backed persistence
- restart recovery
- sync state inspection
- manual sync ticks
- optional transport
- optional discovery
- node metadata

Start here:

[C++ SDK documentation](./sdk-cpp/)

## JavaScript SDK

The JavaScript SDK is planned for JavaScript and TypeScript applications.

It will bring Softadastra to apps built with JavaScript runtimes, frontend tooling, backend services, and local-first application layers.

Status:

```txt
planned
```

Start here:

[JavaScript SDK documentation](./sdk-js/)

## Python SDK

The Python SDK is planned.

It will be useful for tools, automation, backend services, data workflows, and scripts that need reliable local data.

Status:

```txt
planned
```

## Go SDK

The Go SDK is planned.

It will be useful for services, agents, infrastructure tools, and distributed systems written in Go.

Status:

```txt
planned
```

## Future SDKs

Softadastra is designed to grow across languages.

Future SDKs may include:

- Rust
- Java
- C#
- Swift
- Kotlin

Each SDK should follow the same direction:

- simple API
- local-first data
- durable writes
- restart recovery
- clear errors
- visible sync state
- optional networking

## Which SDK should I use?

Use the C++ SDK today if you want the most complete SDK.

Use the JavaScript SDK when it becomes available for JavaScript or TypeScript applications.

Use the Python SDK when you need Softadastra inside automation, scripts, services, or data tools.

Use the Go SDK when you need Softadastra inside services, agents, or infrastructure tools.

## Recommended path

New to Softadastra?

Start with the C++ SDK:

1. [C++ SDK Overview](./sdk-cpp/)
2. [C++ SDK Installation](./sdk-cpp/installation)
3. [C++ SDK Quick Start](./sdk-cpp/quick-start)
4. [C++ SDK Examples](./sdk-cpp/examples)
