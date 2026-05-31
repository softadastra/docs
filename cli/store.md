# Store

Store commands let you write and read local key/value data from the terminal.
The command group is:

```sh
softadastra store
```

## Commands

```sh
softadastra store put <key> <value>
softadastra store get <key>
```

## Show store help

Run:

```sh
softadastra store
```

Output:

```txt
Softadastra store

Usage
  softadastra store put <key> <value>
  softadastra store get <key>

Commands
  put      Write a key/value pair
  get      Read one key
```

## Write a value

Use `store put` to write a local value.

```sh
softadastra store put app/name Softadastra
```

When the write succeeds, the CLI prints the key, version, and mutation status.

Example output:

```txt
✓ Stored value.

Field    Value
key      app/name
version  1
status   created
```

If the key already exists, the status can be `updated`.

```sh
softadastra store put app/name "Softadastra Runtime"
```

Example output:

```txt
✓ Stored value.

Field    Value
key      app/name
version  2
status   updated
```

If the value did not change, the status can be `unchanged`.

## Read a value

Use `store get` to read one local value.

```sh
softadastra store get app/name
```

Example output:

```txt
Store entry

Field      Value
key        app/name
value      Softadastra
version    1
timestamp  1760000000000
```

The exact version and timestamp depend on your local runtime.

## Keys

A key identifies a local value.

Good examples:

```txt
app/name
settings/theme
profile/name
message/1
cache/session
```

Use stable and readable keys. A good pattern is:

```txt
domain/name
domain/id/field
```

Examples:

```txt
profile/name
settings/theme
files/docs/readme.txt
```

An empty key is invalid.

```sh
softadastra store put "" value
```

Expected error:

```txt
Key cannot be empty.
```

## Values

A value is the data stored under a key.

Examples:

```sh
softadastra store put profile/name Ada
softadastra store put settings/theme dark
softadastra store put message/1 hello
```

When a value contains spaces, quote it:

```sh
softadastra store put app/title "Softadastra Runtime"
```

## Local-first behavior

Store commands work locally.
This command does not need a remote server:

```sh
softadastra store put draft/1 hello
```

And this command reads from the local store:

```sh
softadastra store get draft/1
```

Peers, discovery, and transport are not required for local store commands.
That is the main idea: local work should be useful before the network is available.

## Store and sync

A store write can create local work that sync can later process.
A simple flow is:

```sh
softadastra store put app/name Softadastra
softadastra sync status
softadastra sync tick
```

`store put` writes locally.

`sync status` shows what the sync pipeline is tracking.

`sync tick` moves the sync pipeline forward once.

## Example workflow

Write a value:

```sh
softadastra store put app/name Softadastra
```

Read it back:

```sh
softadastra store get app/name
```

Check sync:

```sh
softadastra sync status
```

Run one sync tick:

```sh
softadastra sync tick
```

Read the value again:

```sh
softadastra store get app/name
```

## Interactive mode

Inside interactive mode, do not repeat `softadastra`.

Start the CLI:

```sh
softadastra
```

Then run:

```txt
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> exit
```

## Common errors

### Missing key or value

This happens when `store put` does not receive both arguments.

```sh
softadastra store put app/name
```

Output:

```txt
Missing key or value argument.
Usage: store-put <key> <value>
```

Fix:

```sh
softadastra store put app/name Softadastra
```

### Missing key

This happens when `store get` does not receive a key.

```sh
softadastra store get
```

Output:

```txt
Missing key argument.
Usage: store-get <key>
```

Fix:

```sh
softadastra store get app/name
```

### Empty key

This happens when the key is empty.

```sh
softadastra store put "" value
```

Output:

```txt
Key cannot be empty.
```

Use a non-empty key:

```sh
softadastra store put app/name value
```

### Key not found

This happens when the key does not exist in the local store.

```sh
softadastra store get missing/key
```

Output:

```txt
Key not found: missing/key
```

This is not a crash. It only means the local store does not have that key.

### Unknown store command

If you run an unsupported store command:

```sh
softadastra store remove app/name
```

The CLI returns:

```txt
Unknown store command: remove
Usage: store <put|get>
```

For now, use:

```sh
softadastra store put <key> <value>
softadastra store get <key>
```

## Good first test

Run:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
```

This tests local write, local read, sync inspection, and one manual sync step.

## Summary

Use:

```sh
softadastra store put <key> <value>
```

to write a local value.

Use:

```sh
softadastra store get <key>
```

to read a local value.
Store commands are local-first. They do not need peers, discovery, transport, or a remote server to be useful.
Next, continue with [Sync](./sync).
