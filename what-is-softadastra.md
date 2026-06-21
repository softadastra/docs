# What is Softadastra Engine?

Softadastra Engine is an offline-first runtime foundation for C++ applications.

It helps applications keep useful work local, durable, recoverable, and ready to synchronize when the network is slow, unstable, expensive, or unavailable.

Softadastra Engine is part of the Softadastra C++ tooling ecosystem.
Softadastra Company is focused on building and maintaining open tooling for modern C++ development.

## Definition

Softadastra Engine is a local-first runtime layer.

That means an application can treat the local machine as a real working environment, not only as a temporary cache waiting for a remote server.

The application can:

- save data locally
- persist important operations
- recover after interruption
- retry failed work
- synchronize when communication becomes available

## Why it exists

Many applications depend too much on a perfect network.

When the connection is weak, slow, expensive, or unavailable, the application may stop completely, lose work, duplicate actions, or fail to recover cleanly.

Softadastra Engine exists to give applications a stronger local foundation.

The network should be a delivery layer, not the only place where useful work can happen.

## The Softadastra Engine model

Softadastra Engine is built around a simple model:

1. Work is accepted locally.
2. Important operations are persisted.
3. Local state remains usable.
4. Failed delivery can be retried.
5. The system can recover after interruption.
6. Synchronization can happen when communication is available.

```txt
write locally
persist safely
recover after failure
retry when needed
sync when possible
```

## What Softadastra Engine provides

Softadastra Engine provides foundations for:

- local state
- write-ahead logging
- durable storage
- operation tracking
- retry queues
- synchronization foundations
- transport foundations
- recovery after interruption
- local diagnostics and inspection

These pieces help applications remain useful even when the network is not reliable.

## Main parts

### Runtime

The runtime manages local engine behavior, operation flow, and recovery rules.

### WAL

The write-ahead log records important operations before they are considered durable.

### Store

The store keeps local state available while the application is offline or online.

### Retry

The retry layer tracks operations that could not be delivered and prepares them for later execution.

### Sync

The sync layer provides the foundation for moving local changes toward another node, service, or remote system.

### Transport

The transport layer is responsible for moving operations when communication is available.

### SDK

The SDK gives C++ applications a developer-facing API for using Softadastra Engine.

Repository:

[github.com/softadastra/sdk](https://github.com/softadastra/sdk)

## Ecosystem role

Softadastra Engine is one layer inside a larger C++ tooling ecosystem.

```txt
Vix.cpp
  -> C++ runtime and developer tooling foundation

Softadastra Engine
  -> offline-first runtime layer

Cnerium
  -> retry-safe backend reliability for Vix applications

Kordex
  -> JavaScript and TypeScript runtime built on Vix.cpp

Pico
  -> validation application proving Vix.cpp in a real backend
```

## How Softadastra Engine is different

Softadastra Engine does not start from the idea that the cloud is always available.

It starts from the reality that applications may need to continue locally first.

It focuses on:

- continuity of work
- local durability
- recovery after interruption
- retry-safe delivery
- synchronization when possible
- visibility into local state

## What Softadastra Engine is not

Softadastra Engine is not:

- the whole Softadastra company
- a SaaS product
- a cloud platform
- a file sharing product
- only a database
- only a CLI tool
- a replacement for application-specific business logic
- a replacement for Vix.cpp

It is a focused offline-first runtime layer for C++ applications.

## Entry points

- Runtime and engine: [github.com/softadastra/softadastra](https://github.com/softadastra/softadastra)
- C++ SDK: [github.com/softadastra/sdk](https://github.com/softadastra/sdk)
- Website: [softadastra.com](https://softadastra.com)
- Vix.cpp: [vixcpp.com](https://vixcpp.com)

## In one sentence

Softadastra Engine is an offline-first runtime foundation for C++ applications that need to write locally, recover safely, retry work, and synchronize when communication becomes available.
