# Store Commands

Store commands let you read and write local key-value data from the Softadastra CLI.

The store is local-first. That means a store command should work locally without requiring a remote server, an active peer, discovery, or transport.

The main command group is:

```sh
softadastra store <subcommand>
```

## Why store commands exist

Softadastra is built around local work first.

Store commands let you test that model directly from the terminal:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra store remove app/name
```

The goal is simple: write locally, read locally, sync later.

## Command overview

```txt
softadastra store put <key> <value>     -> write a local value
softadastra store get <key>             -> read a local value
softadastra store remove <key>          -> remove a local value
softadastra store list                  -> list local values, if supported
```

The first stable commands should be `put`, `get`, and `remove`. `list` can be added when the CLI implementation supports it reliably.

## Store mental model

The store provides current local state.

```txt
key
  ↓
value
```

Example:

```txt
app/name -> Softadastra
```

At a higher level, a store write can also be tracked by sync:

```txt
store put
  ↓
local write
  ↓
WAL, if enabled
  ↓
store apply
  ↓
sync tracking
```

The CLI should hide the internal wiring and expose a simple command interface.

## `softadastra store put`

Writes a local value.

```sh
softadastra store put <key> <value>
```

Example:

```sh
softadastra store put app/name Softadastra
```

Expected output style:

```txt
Stored value

  key     : app/name
  value   : Softadastra
  created : yes
```

If the key already exists, the command can update it:

```sh
softadastra store put app/name "Softadastra Runtime"
```

Expected output style:

```txt
Stored value

  key     : app/name
  value   : Softadastra Runtime
  created : no
```

### Keys

A key identifies a local value.

Examples:

```txt
app/name
settings/theme
profile/name
message/1
cache/session
```

Recommended key style: `domain/name` or `domain/id/field`.

Good examples:

```txt
profile/name
settings/theme
files/docs/readme.txt
```

Avoid empty keys. This should fail with a clear error:

```sh
softadastra store put "" value
```

Expected output style:

```txt
error: invalid key
reason: key must not be empty
```

### Values

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

The parser should treat the quoted string as one value: `Softadastra Runtime`.

## `softadastra store get`

Reads a local value.

```sh
softadastra store get <key>
```

Example:

```sh
softadastra store get app/name
```

Expected output style:

```txt
Value

  key   : app/name
  value : Softadastra
```

If the key is missing:

```txt
error: key not found
key: app/name
```

A missing key is not a runtime crash. It is a normal store error.

## `softadastra store remove`

Removes a local value.

```sh
softadastra store remove <key>
```

Example:

```sh
softadastra store remove app/name
```

Expected output style:

```txt
Removed value

  key     : app/name
  removed : yes
```

After removal:

```sh
softadastra store get app/name
```

Expected output style:

```txt
error: key not found
key: app/name
```

Remove should be safe and clear. If the key does not exist, the CLI should explain that nothing was removed.

Example:

```txt
Removed value

  key     : app/name
  removed : no
  reason  : key not found
```

## `softadastra store list`

Lists local values if supported.

```sh
softadastra store list
```

Example output style:

```txt
Store

Key             Value
app/name        Softadastra
settings/theme  dark
message/1       hello
```

If the store is empty:

```txt
Store

  no values found
```

If `list` is not implemented yet, do not include it in the stable CLI reference.

## Local-first behavior

Store commands should be local-first.

This command should not require network access:

```sh
softadastra store put draft/1 hello
```

It should not require a server, a connected peer, transport, discovery, or cloud availability.

The write is local work. Synchronization is a separate step.

## Store and WAL

If WAL is enabled, a store write can be persisted before or during local application.

Conceptually:

```txt
store put
  ↓
operation created
  ↓
WAL append
  ↓
store apply
```

The WAL is the durable history. The store is the current local state.

```txt
WAL   -> what happened
Store -> current value
```

From the CLI perspective, the command stays simple:

```sh
softadastra store put settings/theme dark
```

The runtime decides whether WAL is enabled.

## Store and sync

A store write can also create sync work.

```txt
store put
  ↓
local state updated
  ↓
sync operation created
  ↓
outbox entry added
```

After writing a value, inspect sync state:

```sh
softadastra sync status
```

Then move sync forward:

```sh
softadastra sync tick
```

This keeps local writes separate from synchronization.

## Store and transport

Transport is not required for store commands.

If transport is stopped, this should still work:

```sh
softadastra store put local/key value
```

Transport is only needed when the sync layer wants to send operations to peers.

## Store and discovery

Discovery is not required for store commands.

If no peer is discovered, this should still work:

```sh
softadastra store get app/name
```

Discovery helps find peers later. It does not decide whether local state can be read or written.

## Example workflow

Write a value:

```sh
softadastra store put app/name Softadastra
```

Read the value:

```sh
softadastra store get app/name
```

Inspect sync state:

```sh
softadastra sync status
```

Run one tick:

```sh
softadastra sync tick
```

Remove the value:

```sh
softadastra store remove app/name
```

Verify it is gone:

```sh
softadastra store get app/name
```

## Interactive mode

Inside interactive mode, use the same store commands without the binary name.

```txt
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> store remove app/name
```

Do not write:

```txt
softadastra> softadastra store get app/name
```

Inside interactive mode, the prompt already represents the CLI.

## Error handling

Store errors should be clear.

### Missing key

```txt
error: key not found
key: settings/theme
```

### Missing value

Command:

```sh
softadastra store put app/name
```

Expected output:

```txt
error: missing value
usage: softadastra store put <key> <value>
```

### Missing key argument

Command:

```sh
softadastra store get
```

Expected output:

```txt
error: missing key
usage: softadastra store get <key>
```

### Invalid key

Command:

```sh
softadastra store put "" value
```

Expected output:

```txt
error: invalid key
reason: key must not be empty
```

### Runtime unavailable

Expected output style:

```txt
error: store unavailable
reason: runtime is not initialized
```

The user should know what failed and why.

## Output style

Prefer readable grouped output.

For `put`:

```txt
Stored value

  key     : app/name
  value   : Softadastra
  created : yes
```

For `get`:

```txt
Value

  key   : app/name
  value : Softadastra
```

For `remove`:

```txt
Removed value

  key     : app/name
  removed : yes
```

For scripts, stable output matters. Avoid unnecessary changes to labels and structure.

## Store command principles

Store commands should follow these principles:

- local-first
- explicit errors
- stable output
- safe key validation
- quoted values supported
- network not required
- sync separate from store

## How store commands map to the SDK

The CLI store commands map closely to SDK methods.

CLI:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra store remove app/name
```

C++ SDK:

```cpp
client.put("app/name", "Softadastra");
client.get("app/name");
client.remove("app/name");
```

JavaScript SDK:

```js
await client.put("app/name", "Softadastra");
await client.get("app/name");
await client.remove("app/name");
```

The model is the same across CLI, C++ SDK, and JavaScript SDK.

## Common mistakes

### Expecting store commands to sync immediately

A store write is local first. Synchronization is separate:

```sh
softadastra sync tick
```

### Expecting a peer to be required

Store commands do not need a peer. Peers are needed for remote synchronization, not local writes.

### Forgetting quotes around values with spaces

Wrong:

```sh
softadastra store put app/title Softadastra Runtime
```

Better:

```sh
softadastra store put app/title "Softadastra Runtime"
```

### Treating missing key as a crash

A missing key is a normal store result. The CLI should show a clear not-found error.

### Treating the store as the WAL

The store is current state. The WAL is operation history. They are related, but not the same.

## Recommended first store test

Run:

```sh
softadastra store put app/name Softadastra
softadastra store get app/name
softadastra sync status
softadastra sync tick
softadastra store remove app/name
softadastra store get app/name
```

This tests local write, local read, sync tracking, manual sync tick, local remove, and missing key behavior.

## Summary

Store commands let you interact with Softadastra local state from the terminal.

They provide `put`, `get`, `remove`, and optionally `list`.

The key idea is: store commands are local-first. A local write should be useful before the network, before peers, and before synchronization.

## Next step

Continue with sync commands:

[Go to Sync Commands](/cli/sync)
