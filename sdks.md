# SDKs

Softadastra Engine SDKs let applications use the engine directly from application code.

The goal is to give developers a simple API for local state, durable writes, recovery, retry, and synchronization foundations.

## Available SDK

## C++ SDK

The C++ SDK is the official SDK for Softadastra Engine.

Use it when you want to integrate Softadastra Engine into a native C++ application.

It gives your application access to:

- local writes
- local reads
- durable storage
- WAL-backed persistence
- restart recovery
- engine state inspection
- retry foundations
- sync foundations

Start here:

[C++ SDK documentation](./sdk-cpp/)

## Why C++ first?

Softadastra is a C++ tooling company.

The engine is built for applications that need native control, durability, predictable runtime behavior, and local-first foundations.

The C++ SDK is therefore the main SDK and the recommended entry point.

## JavaScript and TypeScript

JavaScript and TypeScript support belongs to **Kordex**.

Kordex is a JavaScript and TypeScript runtime built on Vix.cpp. It can connect JavaScript code to Softadastra Engine through explicit runtime permissions and native modules.

Use Kordex when you want local-first JavaScript on top of the native C++ foundation.

Repository:

[github.com/softadastra/kordex](https://github.com/softadastra/kordex)

## Recommended path

New to Softadastra Engine?

Start here:

1. [C++ SDK Overview](./sdk-cpp/)
2. [C++ SDK Installation](./sdk-cpp/installation)
3. [C++ SDK Quick Start](./sdk-cpp/quick-start)
4. [C++ SDK Examples](./sdk-cpp/examples)

## In one sentence

Use the C++ SDK when you want to embed Softadastra Engine into a native application and keep local data durable, recoverable, and ready to synchronize.
