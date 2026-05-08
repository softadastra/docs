# Interactive Mode

Interactive mode lets you run multiple Softadastra CLI commands inside one session.

Instead of typing:

```sh
softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync tick
```

You can start one interactive session:

```sh
softadastra
```

Then run commands directly:

```txt
softadastra> status
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync tick
softadastra> exit
```

## Why interactive mode exists

Interactive mode is useful when you want to inspect or test a local Softadastra runtime without restarting the CLI process for every command.

It is especially useful for local demos, debugging, manual testing, store experiments, sync inspection, peer inspection, and learning the command model.

The goal is simple: start the CLI once, run many commands.

## Start interactive mode

Run the CLI without a command:

```sh
softadastra
```

Expected prompt style:

```txt
softadastra>
```

Then enter commands:

```txt
softadastra> help
softadastra> status
softadastra> node info
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

The session should stop cleanly.

## Basic session

A basic interactive session can look like this:

```txt
softadastra> help
softadastra> version
softadastra> status
softadastra> exit
```

This is the simplest way to verify that the CLI is working.

## Store session

Use interactive mode to test the local store.

```txt
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> store remove app/name
softadastra> store get app/name
```

Expected behavior:

- `store put` writes the local value
- `store get` reads the local value
- `store remove` removes the local value
- `store get` after remove reports that the key was not found

The store remains local-first. It should not require a connected peer.

## Sync session

Use interactive mode to inspect synchronization.

```txt
softadastra> store put message/1 hello
softadastra> sync status
softadastra> sync tick
softadastra> sync status
```

The flow is:

```txt
local write
  ↓
sync state changes
  ↓
tick moves sync forward
  ↓
status shows the result
```

A sync tick can retry expired work, produce the next batch, and prune completed work.

## Node session

Use node commands to inspect the local node.

```txt
softadastra> node info
```

This should show metadata such as node id, display name, hostname, operating system, version, uptime, and capabilities.

Example output style:

```txt
Node

  id           : node-a
  display name : Local Node
  hostname     : softadastra-dev
  os           : linux
  version      : 0.1.0
  uptime ms    : 18420
  capabilities : core, store, sync, metadata
```

## Peers session

Use peers to inspect known peers.

```txt
softadastra> peers
```

If no peers are known yet:

```txt
Peers

  no peers found
```

That is not necessarily an error. A local Softadastra node can still write and read local data without discovered peers.

## Help inside interactive mode

Use:

```txt
help
```

To inspect a command group:

```txt
help store
help sync
help node
```

The help output should show available subcommands and expected arguments.

Example:

```txt
softadastra> help store
```

Expected output style:

```txt
Store commands

  store put <key> <value>     Write a local value
  store get <key>             Read a local value
  store remove <key>          Remove a local value
```

## Commands are the same

Interactive mode should use the same command model as normal CLI mode.

Normal mode:

```sh
softadastra store put app/name Softadastra
```

Interactive mode:

```txt
softadastra> store put app/name Softadastra
```

The only difference is that you do not repeat `softadastra`.

## Recommended interactive workflow

For a first test, run:

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

This tests runtime status, node metadata, local store, sync state, manual sync tick, and peer visibility.

## Local-first behavior

Interactive mode follows the same local-first model as the rest of Softadastra.

A command like this:

```txt
softadastra> store put draft/1 hello
```

should not depend on a remote server, a connected peer, discovery, transport, or cloud availability.

The write is local work. Sync can happen later.

## Error behavior

Interactive errors should be clear and should not crash the session when possible.

Example:

```txt
softadastra> store get missing/key
error: key not found
key: missing/key

softadastra> status
```

The session should continue after the error.

### Invalid command

If the user enters an unknown command:

```txt
softadastra> unknown
```

The CLI should explain the problem:

```txt
error: unknown command: unknown
hint: run `help` to list available commands
```

### Invalid arguments

If the user enters an incomplete command:

```txt
softadastra> store put app/name
```

The CLI should show what is missing:

```txt
error: missing value
usage: store put <key> <value>
```

### Empty input

If the user presses Enter on an empty line, the CLI should do nothing and show the prompt again.

```txt
softadastra>
softadastra>
```

This keeps the session smooth.

## Comments and whitespace

If supported, interactive mode can ignore extra whitespace:

```txt
softadastra>    status
softadastra> store   get   app/name
```

The command parser should normalize input before execution.

## Quoted values

Interactive mode should support quoted values when a value contains spaces.

```txt
softadastra> store put app/title "Softadastra Runtime"
```

The value should be parsed as:

```txt
Softadastra Runtime
```

This relies on the CLI parser and tokenizer.

## Parser behavior

The internal CLI framework can tokenize and parse commands like:

```txt
deploy app --host=localhost --port 8080 --verbose --ratio=0.75
```

This allows interactive commands to support positional arguments, boolean flags, string options, integer options, floating-point options, and quoted strings.

The product CLI can use this parser to keep command behavior consistent.

## Scriptability

Interactive mode is for humans.

For scripts, prefer normal one-command mode:

```sh
softadastra status
softadastra store get app/name
softadastra sync tick
```

Normal command mode is easier to automate because each command has a clear process exit code.

## Exit codes

In interactive mode, individual commands should report errors visibly.

The final process exit code should usually indicate whether the interactive session itself ended cleanly.

For scripts, use non-interactive commands when exit codes matter.

## Output style

Interactive output should stay readable.

Good output:

```txt
Value

  key   : app/name
  value : Softadastra
```

Good status output:

```txt
Sync status

  outbox       : 1
  queued       : 1
  in flight    : 0
  acknowledged : 0
  failed       : 0
```

Avoid noisy internal output unless debug mode is enabled.

## Debugging with interactive mode

Interactive mode is a good way to debug a local workflow:

```txt
softadastra> status
softadastra> store put message/1 hello
softadastra> sync status
softadastra> sync tick
softadastra> sync status
```

If sync does not move forward, inspect outbox size, queued count, failed count, transport state, and peer list.

Then check peers:

```txt
softadastra> peers
```

And node metadata:

```txt
softadastra> node info
```

## Common mistakes

### Running full commands inside interactive mode

Inside interactive mode, do not repeat the binary name.

Wrong:

```txt
softadastra> softadastra status
```

Correct:

```txt
softadastra> status
```

### Expecting peers immediately

If no peer appears, it may be normal. Discovery may be disabled, no peer may be running, or the local network may not have another node. Local store commands should still work.

### Expecting sync to mean network delivery

`sync tick` moves the sync pipeline. Transport and peer connection are separate concerns. A tick can produce work even when no peer is connected.

### Using interactive mode for automation

For scripts, use one command per process.

```sh
softadastra sync tick
```

This makes exit codes and logs easier to manage.

## Summary

Interactive mode lets you run multiple Softadastra commands in one CLI session.

It is useful for local testing, demos, debugging, inspecting runtime state, trying store and sync commands, and learning the command model.

The mental model is:

```txt
start session
run commands
inspect output
exit cleanly
```

## Next step

Continue with node commands:

[Go to Node Commands](/cli/node)
