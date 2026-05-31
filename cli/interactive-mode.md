# Interactive Mode

Interactive mode lets you run several Softadastra CLI commands inside one session.
Instead of typing `softadastra` before every command, you start the CLI once:

```sh
softadastra
```

Then you run commands directly:

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

This is useful when you are testing the local runtime, checking sync state, starting node services, or trying store commands step by step.

## Start interactive mode

Run:

```sh
softadastra
```

You should see the interactive prompt:

```txt
softadastra>
```

From there, type commands without repeating the binary name.

Correct:

```txt
softadastra> status
```

Wrong:

```txt
softadastra> softadastra status
```

## Exit interactive mode

Use:

```txt
exit
```

or:

```txt
quit
```

Example:

```txt
softadastra> exit
```

## Basic session

Start with a small session like this:

```txt
softadastra> help
softadastra> version
softadastra> status
softadastra> exit
```

This checks that the CLI starts correctly and that the runtime can be inspected.

## Store session

Use interactive mode to write and read local values.

```txt
softadastra> store put app/name Softadastra
softadastra> store get app/name
```

Expected idea:

```txt
store put writes the value locally
store get reads the value back from the local store
```

A store write does not need a remote server, a peer, transport, or discovery.

If the value contains spaces, quote it:

```txt
softadastra> store put app/title "Softadastra Runtime"
softadastra> store get app/title
```

## Sync session

Use sync commands to inspect and move the sync pipeline.

```txt
softadastra> store put message/1 hello
softadastra> sync status
softadastra> sync tick
softadastra> sync status
```

This flow shows what happens after a local write:

```txt
write local value
inspect sync state
run one sync tick
inspect sync state again
```

A tick can produce a batch and try to send it to connected peers. If no peer is connected, that is fine. Local data still stays local.

## Node session

Use node commands to inspect or start local node services.

```txt
softadastra> node info
```

If metadata is not available yet, start node services for this interactive session:

```txt
softadastra> node start
softadastra> node info
```

`node start` starts transport, discovery, and metadata for the current CLI session.

This is one of the main reasons interactive mode is useful: services stay available while you run the next commands.

## Peers session

Use `peers` to inspect known discovery and transport peers.

```txt
softadastra> node start
softadastra> peers
```

If no peers are found, that is not automatically an error.

It can simply mean no other node is running or discoverable yet.

You can still use local store commands:

```txt
softadastra> store put draft/1 hello
softadastra> store get draft/1
```

## Help inside interactive mode

Use:

```txt
softadastra> help
```

To inspect a command group, use the group name:

```txt
softadastra> node
softadastra> store
softadastra> sync
```

For example:

```txt
softadastra> store
```

prints:

```txt
Softadastra store

Usage
  softadastra store put <key> <value>
  softadastra store get <key>

Commands
  put      Write a key/value pair
  get      Read one key
```

Inside interactive mode, you still type:

```txt
softadastra> store put app/name Softadastra
softadastra> store get app/name
```

## Recommended first interactive workflow

Use this as your first full test:

```txt
softadastra> status
softadastra> node info
softadastra> node start
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> status
softadastra> exit
```

This checks:

1. runtime status
2. node information
3. node services startup
4. local write
5. local read
6. sync state
7. one manual sync cycle
8. peer visibility
9. final runtime status

## Local-first behavior

Interactive mode follows the same local-first model as the rest of Softadastra.

This command should work locally:

```txt
softadastra> store put draft/1 hello
```

And this should read the local value back:

```txt
softadastra> store get draft/1
```

The network is not required for local work.

Sync and peers matter when the node needs to exchange data with another node.

## Errors inside interactive mode

Interactive mode should show the error and keep the session alive.

Example:

```txt
softadastra> store get missing/key
Key not found: missing/key

softadastra> status
```

The failed command should not close the session.

## Common errors

### Unknown command

If you type a command that does not exist:

```txt
softadastra> unknown
```

The CLI should report that the command is unknown.

Run:

```txt
softadastra> help
```

to see available commands.

### Missing store value

If you run:

```txt
softadastra> store put app/name
```

The CLI reports:

```txt
Missing key or value argument.
Usage: store-put <key> <value>
```

Fix it by passing both key and value:

```txt
softadastra> store put app/name Softadastra
```

### Missing store key

If you run:

```txt
softadastra> store get
```

The CLI reports:

```txt
Missing key argument.
Usage: store-get <key>
```

Fix it by passing a key:

```txt
softadastra> store get app/name
```

### Empty key

If you pass an empty key:

```txt
softadastra> store put "" value
```

The CLI reports:

```txt
Key cannot be empty.
```

Use a real key:

```txt
softadastra> store put app/name value
```

### No peers found

This is normal when no other node is running.

Check:

```txt
softadastra> node start
softadastra> peers
```

If there are still no peers, local store commands can still work.

### Sync tick sends nothing

A tick can produce no delivery when there are no connected peers.

Check:

```txt
softadastra> sync status
softadastra> peers
softadastra> status
```

Local data is still valid even if delivery did not happen yet.

## Use normal mode for scripts

Interactive mode is made for humans.

For scripts, use one command at a time:

```sh
softadastra status
softadastra store get app/name
softadastra sync tick
```

This is better for automation because each command has its own process result and output.

## Summary

Interactive mode lets you keep one Softadastra CLI session open while you run multiple commands.

Use it for local testing, demos, store experiments, sync checks, node startup, and peer inspection.

The rule is simple:

```txt
outside interactive mode: softadastra status
inside interactive mode:  status
```

Next, continue with [Node](./node).
