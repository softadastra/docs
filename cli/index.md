# CLI

The Softadastra CLI is the terminal interface for working with a local Softadastra runtime.

Use it when you want to check the runtime, inspect the local node, write and read local values, look at sync state, run a manual sync tick, or see known peers.

It is the fastest way to try Softadastra without writing application code.

## What you can do with the CLI

With the CLI, you can:

- check the local runtime status
- inspect node information
- start node services for the current CLI session
- write values into the local store
- read values from the local store
- inspect sync state
- run one sync tick
- list discovery and transport peers

## Main commands

Start with these commands:

```sh
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra peers
```

## Status

Use `status` when you want a quick view of the local runtime.

```sh
softadastra status
```

It shows the current state of the main runtime pieces:

- node
- store
- sync
- transport
- discovery
- metadata

This is usually the first command to run when something does not look right.

## Node

Use `node info` to inspect the local node.

```sh
softadastra node info
```

It shows information such as:

- node id
- display name
- hostname
- operating system
- version
- uptime
- capabilities
- whether the node services are running

Use `node start` when you want to start local node services for the current CLI session.

```sh
softadastra node start
```

This starts transport, discovery, and metadata for the current CLI runtime.

For a long-running node, use the Softadastra node app instead.

## Store

Use `store put` to write a local key/value pair.

```sh
softadastra store put app/name Softadastra
```

Use `store get` to read a value.

```sh
softadastra store get app/name
```

The store command is useful for quick local tests.

A write is local first. You do not need a remote server just to store and read a local value.

## Sync

Use `sync status` to inspect the sync pipeline.

```sh
softadastra sync status
```

It shows values such as:

- outbox size
- queued count
- in-flight count
- acknowledged count
- failed count
- last submitted version
- last applied remote version
- total retries

Use `sync tick` to move sync forward once.

```sh
softadastra sync tick
```

A tick can retry expired work, produce a batch, and attempt delivery to connected peers.

## Peers

Use `peers` to list known peers.

```sh
softadastra peers
```

The command shows peers from discovery and transport.

If no peers are shown, it does not always mean something is broken. It can simply mean no other node is running or connected yet.

## A simple first session

Try this flow after installing Softadastra:

```sh
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra peers
```

This gives you a quick feel for the CLI without needing a full application.

## Interactive mode

You can also run Softadastra interactively.

```sh
softadastra
```

Then run commands inside the session:

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

Interactive mode is useful when you want to test several commands without restarting the CLI each time.

## How to think about it

The CLI follows the same idea as the SDK:

```txt
write locally
read locally
keep state locally
inspect sync
move sync forward when needed
connect with peers when available
```

Softadastra does not need the network to make local work useful.

You can write a value locally:

```sh
softadastra store put profile/name Ada
```

Read it back:

```sh
softadastra store get profile/name
```

Then inspect sync:

```sh
softadastra sync status
```

And move sync forward:

```sh
softadastra sync tick
```

## Errors

CLI errors should help you fix the command.

For example, if a key is missing:

```txt
Key not found: settings/theme
```

If an argument is missing:

```txt
Missing key or value argument.
```

If a command is unknown:

```txt
Unknown store command: remove
```

When you see an error, check the command usage and the arguments first.

## Recommended reading order

Read the CLI docs in this order:

1. [Installation](/installation)
2. [Commands](./commands)
3. [Interactive Mode](./interactive-mode)
4. [Node](./node)
5. [Store](./store)
6. [Sync](./sync)
7. [Peers](./peers)
8. [Reference](./reference)

## Summary

The Softadastra CLI helps you work with the local runtime from the terminal.

Use it to inspect status, check node information, write and read local values, inspect sync, run manual ticks, and list peers.

## Next step

Continue with [Installation](/installation).
