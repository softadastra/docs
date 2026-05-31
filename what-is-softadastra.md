# What is Softadastra?

Softadastra is a reliability foundation for applications that must continue working outside perfect network conditions.

It provides the base system needed to keep application data usable locally, recover after interruption, and synchronize changes when communication becomes available.

Softadastra is not only a library, a database, or a command-line tool. It is a runtime foundation for building software that remains useful when the network is slow, unstable, expensive, or unavailable.

## Definition

Softadastra is a local-first runtime and synchronization foundation.
That means an application built with Softadastra can treat the local device as a real working environment, not just a temporary cache waiting for a server.
The application can keep data locally, continue operating, and synchronize later with other nodes or services.

## Why it exists

Many applications are built with one central assumption:
The server must be reachable.
When that assumption fails, the application often becomes unusable.
Softadastra exists for systems where this is not acceptable:

- public services
- government platforms
- schools and universities
- hospitals and health systems
- logistics and field operations
- local businesses
- remote teams
- edge environments

In these contexts, software must not stop completely just because the network is weak or unavailable.

## The Softadastra model

Softadastra is built around a simple operating model:

1. Work can be accepted locally.
2. Data is kept on the device.
3. The application remains usable.
4. Changes can be synchronized later.
5. The system can recover after interruption.

This model makes local work a first-class part of the application.

## What Softadastra provides

Softadastra provides several building blocks for reliable applications:

- a local runtime
- a command-line interface
- local data storage
- recovery support
- synchronization support
- peer communication foundations
- node metadata
- SDKs for application developers

These pieces work together to help applications remain reliable in real-world environments.

## Main parts of Softadastra

### Runtime

The runtime is the local foundation of Softadastra.
It manages local state, runtime behavior, and the internal flow needed to keep work recoverable and ready for synchronization.

### CLI

The `softadastra` command-line tool is used to run, inspect, and control Softadastra locally.
It is useful for developers, operators, testing, diagnostics, and local runtime visibility.

### Node

A Softadastra node is a local runtime instance.
A node can operate independently and later communicate with other nodes when connectivity becomes available.

### C++ SDK

The C++ SDK is the developer-facing API for native C++ applications.

Repository:

[github.com/softadastra/sdk](https://github.com/softadastra/sdk)

### JavaScript SDK

The JavaScript SDK is the developer-facing API for JavaScript and TypeScript applications.

Package:

[npmjs.com/package/@softadastra/sdk](https://www.npmjs.com/package/@softadastra/sdk)

## How Softadastra is different

Softadastra does not start from the idea that the cloud is always available.
It starts from the reality that applications may need to continue locally first.
This makes it different from systems that depend entirely on a server before work can be accepted.

Softadastra focuses on:

- continuity of work
- local reliability
- recovery after interruption
- synchronization when possible
- visibility into local state

## What Softadastra is not

Softadastra is not:

- a Dropbox clone
- a Google Drive clone
- a file sharing product
- only a database
- only a CLI tool
- a replacement for application-specific business logic

Softadastra is the foundation underneath applications that need reliable local operation and later synchronization.

## Entry points

- Runtime and CLI: [github.com/softadastra/softadastra](https://github.com/softadastra/softadastra)
- C++ SDK: [github.com/softadastra/sdk](https://github.com/softadastra/sdk)
- JavaScript SDK: [npmjs.com/package/@softadastra/sdk](https://www.npmjs.com/package/@softadastra/sdk)
- Website: [softadastra.com](https://softadastra.com)
- Documentation: [docs.softadastra.com](https://docs.softadastra.com)

## In one sentence

Softadastra is a local-first reliability foundation for applications that need to keep working, recover safely, and synchronize when communication becomes available.
