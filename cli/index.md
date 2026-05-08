# CLI

The Softadastra CLI is the command-line entry point for working with a local Softadastra runtime.
It lets you inspect local state, control node behavior, read and write local store values, check sync status, run sync ticks, and inspect peers.
The CLI is designed for humans, scripts, local development, diagnostics, and operational workflows.

## What the CLI is for

Use the CLI when you want to interact with Softadastra from the terminal.

Typical use cases:

```txt
check runtime status
inspect local node information
write local values
read local values
run sync manually
inspect sync state
list known peers
debug local runtime behavior
```

The CLI gives a simple product-level interface over the engine.

## Basic commands

```sh
softadastra help
softadastra version
softadastra status
```

Store commands:

```sh
softadastra store put app/name "Softadastra"
softadastra store get app/name
softadastra store remove app/name
```

Sync commands:

```sh
softadastra sync status
softadastra sync tick
```

Node and peer commands:

```sh
softadastra node info
softadastra node start
softadastra peers
```

## CLI mental model

The CLI follows the same Softadastra model:

```txt
write locally
persist locally
track operation
sync when possible
retry when needed
converge later
```

A CLI store write should be local-first.

```sh
softadastra store put profile/name Ada
```

That operation should not require a remote server to be useful locally.

Synchronization can happen later:

```sh
softadastra sync tick
```

## Product CLI versus internal CLI module

Softadastra has two CLI-related layers.

```txt
apps/cli
  -> product-level softadastra command

modules/cli
  -> reusable internal CLI framework
```

The product CLI is what users run:

```sh
softadastra status
softadastra node info
softadastra sync tick
```

The internal CLI module provides reusable building blocks such as `Tokenizer`, `ArgParser`, `CommandRegistry`, `CliCommand`, `ICommandHandler`, `CliService`, `CliEngine`, `TableFormatter`, and UI style helpers.

This section documents the product CLI. The internal CLI framework is documented in the engine section.

[Read: Engine CLI Framework](/engine/cli)

## How the CLI fits into the engine

The CLI is an interaction layer above the runtime modules.

```txt
CLI
  ↓
store
sync
transport
discovery
metadata
```

It can expose operations from the engine without forcing the user to manually write C++ code.

For example:

```txt
softadastra store put
  ↓
store operation
  ↓
WAL, if enabled
  ↓
sync tracking
```

And:

```txt
softadastra sync tick
  ↓
sync scheduler
  ↓
retry expired work
  ↓
produce next batch
```

## Status command

The status command gives a quick overview of the local runtime.

```sh
softadastra status
```

It should answer: is the runtime available, is the local node healthy, is sync enabled, is transport running, is discovery running, and is there pending sync work?

Status is usually the first command to run when debugging.

## Node commands

Node commands inspect or control the local Softadastra node.

```sh
softadastra node info
softadastra node start
```

`node info` should show metadata such as node id, display name, hostname, operating system, version, uptime, and capabilities.

This maps to the metadata layer.

## Store commands

Store commands interact with local key-value state.

```sh
softadastra store put settings/theme dark
softadastra store get settings/theme
softadastra store remove settings/theme
```

The store command is useful for quick local tests and demos.

Conceptually:

```txt
store put
  ↓
local write
  ↓
local state
  ↓
sync tracking
```

If persistence is enabled, the write can also pass through the WAL.

## Sync commands

Sync commands inspect and move the sync pipeline.

```sh
softadastra sync status
softadastra sync tick
```

`sync status` should expose fields like outbox size, queued count, in-flight count, acknowledged count, failed count, and total retries.

`sync tick` moves the sync pipeline forward once. A tick can retry expired work, produce the next batch, and prune completed work.

Manual ticks are useful because they make sync explicit and debuggable.

## Peers command

The peers command lists peers known to the local runtime.

```sh
softadastra peers
```

Peers can come from discovery or manual configuration.

The peer flow is:

```txt
discovery finds peers
transport connects peers
sync sends operations
```

## Interactive mode

The CLI can also support an interactive session.

```sh
softadastra
```

In interactive mode, the user can run multiple commands without restarting the CLI process.

Example session:

```txt
softadastra> status
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync tick
softadastra> peers
softadastra> exit
```

Interactive mode is useful for local testing and debugging.

## Error handling

CLI errors should be clear and actionable. Good CLI errors should explain what failed, why it failed, what command or argument caused it, and what the user can do next.

Example:

```txt
error: failed to read key
reason: key not found
key: settings/theme
```

This is better than exposing raw internal errors without context.

## Output style

The CLI should prefer readable output.

For simple values:

```txt
key   : app/name
value : Softadastra
```

For lists, use tables:

```txt
Command      Type      Description
status       info      Show runtime status
version      info      Show CLI version
node         admin     Manage local node
store        data      Read and write local values
sync         sync      Inspect and tick sync pipeline
peers        net       List known peers
```

For status output, use grouped sections:

```txt
Softadastra status

Node
  id       : node-a
  version  : 0.1.0

Store
  entries  : 12

Sync
  outbox   : 3
  queued   : 3
  failed   : 0
```

## Recommended first commands

After installing Softadastra, start with:

```sh
softadastra help
softadastra version
softadastra status
```

Then try local store commands:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
```

Then inspect sync:

```sh
softadastra sync status
softadastra sync tick
```

Then inspect node and peers:

```sh
softadastra node info
softadastra peers
```

## CLI section structure

This CLI documentation is organized as:

1. [Overview](/cli/)
2. [Installation](/cli/installation)
3. [Commands](/cli/commands)
4. [Interactive Mode](/cli/interactive-mode)
5. [Node](/cli/node)
6. [Store](/cli/store)
7. [Sync](/cli/sync)
8. [Peers](/cli/peers)
9. [Reference](/cli/reference)

Read it in that order if you are new to the CLI.

## Summary

The Softadastra CLI is the terminal interface for local runtime interaction.

It helps you inspect runtime status, inspect node metadata, write and read local store values, inspect sync state, run manual sync ticks, inspect known peers, and debug local-first behavior.

The CLI is the simplest way to observe Softadastra without writing application code.

## Next step

Install and run the CLI:

[Go to CLI Installation](/cli/installation)
