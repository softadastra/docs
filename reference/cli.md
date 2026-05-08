# CLI Reference

This page is the compact reference for the Softadastra CLI.

Use it when you already know what you want to do and need the exact command shape quickly.

For explanations, read the CLI section first:

- [CLI Overview](/cli/)
- [CLI Commands](/cli/commands)
- [Interactive Mode](/cli/interactive-mode)
- [Node Commands](/cli/node)
- [Store Commands](/cli/store)
- [Sync Commands](/cli/sync)
- [Peers](/cli/peers)

The core rule is:

```txt
The CLI exposes Softadastra runtime behavior from the terminal.
Command shape
softadastra <command> [subcommand] [arguments] [options]

Examples:

softadastra status
softadastra node info
softadastra store put app/name Softadastra
softadastra sync tick
softadastra peers
Main commands
Command	Purpose
softadastra help	Show available commands
softadastra version	Show CLI version
softadastra status	Show local runtime status
softadastra node info	Show local node metadata
softadastra node start	Start a local node runtime, if available
softadastra store put <key> <value>	Write a local value
softadastra store get <key>	Read a local value
softadastra store remove <key>	Remove a local value
softadastra store list	List local values, if supported
softadastra sync status	Show sync state
softadastra sync tick	Run one sync tick
softadastra sync tick --prune	Run one tick and prune completed work, if supported
softadastra peers	List known peers
softadastra	Start interactive mode, if enabled
Global commands
softadastra help

Shows available commands.

softadastra help

Show help for a command group:

softadastra help node
softadastra help store
softadastra help sync

Expected use:

show available commands
show command usage
show subcommands
show arguments
show options, if supported
softadastra version

Shows the current Softadastra CLI version.

softadastra version

Example output style:

Softadastra 0.1.0

Use this for release verification, bug reports, and debugging.

softadastra status

Shows local runtime status.

softadastra status

Expected output style:

Softadastra status

Node
  id       : node-a
  version  : 0.1.0
  state    : healthy

Store
  entries  : 12

Sync
  outbox   : 3
  queued   : 3
  failed   : 0

Transport
  running  : no

Discovery
  running  : no

The exact fields can depend on the current runtime configuration.

Useful status sections:

Node       -> local runtime identity
Store      -> current local data state
WAL        -> persistence state, if enabled
Sync       -> pending synchronization work
Transport  -> peer delivery state
Discovery  -> peer discovery state
Peers      -> known peer summary, if available

Transport and discovery being stopped does not automatically mean the runtime is unhealthy.

Local store operations can still work.

Node commands

Node commands inspect or control the local Softadastra node.

softadastra node <subcommand>
Command	Purpose
softadastra node info	Show local node metadata
softadastra node start	Start a local node runtime, if available
softadastra node info

Shows metadata for the local node.

softadastra node info

Expected output style:

Node

  id           : node-a
  display name : Local Node
  hostname     : softadastra-dev
  os           : linux
  version      : 0.1.0
  uptime ms    : 18420
  capabilities : core, store, sync, transport, discovery, metadata

Expected fields:

node id
display name
hostname
operating system
version
uptime
capabilities

Node metadata describes the local runtime.

It does not store application data.

softadastra node start

Starts a local Softadastra node runtime if the node app is available in the current build.

softadastra node start

Example output style:

Softadastra node

  id       : node-a
  address  : 127.0.0.1:4041
  state    : running

If the node app is not available:

error: node app is not available in this build
hint: rebuild with SOFTADASTRA_BUILD_NODE_APP=ON

Build with the node app enabled:

vix build -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON
Store commands

Store commands read and write local key-value data.

softadastra store <subcommand>
Command	Purpose
softadastra store put <key> <value>	Write or update a local value
softadastra store get <key>	Read a local value
softadastra store remove <key>	Remove a local value
softadastra store list	List local values, if supported

The store command is local-first.

A store operation should not require a remote server, connected peer, transport, discovery, or cloud access.

softadastra store put

Writes a local value.

softadastra store put <key> <value>

Example:

softadastra store put app/name Softadastra

With a value containing spaces:

softadastra store put app/title "Softadastra Runtime"

Example output style:

Stored value

  key     : app/name
  value   : Softadastra
  created : yes

If the key already existed:

Stored value

  key     : app/name
  value   : Softadastra Runtime
  created : no

Conceptual flow:

store put
  ↓
local write
  ↓
WAL, if enabled
  ↓
store apply
  ↓
sync tracking, if enabled

Possible errors:

error: missing key
error: missing value
error: invalid key
error: store unavailable
error: WAL append failed
softadastra store get

Reads a local value.

softadastra store get <key>

Example:

softadastra store get app/name

Example output style:

Value

  key   : app/name
  value : Softadastra

If the key is missing:

error: key not found
key: app/name

A missing key is a normal store error.

It should not crash the runtime.

softadastra store remove

Removes a local value.

softadastra store remove <key>

Example:

softadastra store remove app/name

Example output style:

Removed value

  key     : app/name
  removed : yes

If the key does not exist:

Removed value

  key     : app/name
  removed : no
  reason  : key not found

A remove operation can also create sync work so another node can learn about the delete later.

softadastra store list

Lists local values if supported by the current CLI implementation.

softadastra store list

Example output style:

Store

Key             Value
app/name        Softadastra
settings/theme  dark
message/1       hello

If the store is empty:

Store

  no values found

If store list is not implemented yet, do not expose it as stable behavior in product documentation.

Sync commands

Sync commands inspect and move the synchronization pipeline.

softadastra sync <subcommand>
Command	Purpose
softadastra sync status	Show current sync state
softadastra sync tick	Run one manual sync tick
softadastra sync tick --prune	Run one tick and prune completed work, if supported

Sync does not mean network.

Sync means operation propagation tracking.

Store      -> current local state
Sync       -> tracks work that should be propagated
Transport  -> sends messages to peers
Discovery  -> finds peers
softadastra sync status

Shows current synchronization state.

softadastra sync status

Expected output style:

Sync status

  outbox       : 3
  queued       : 3
  in flight    : 0
  acknowledged : 0
  failed       : 0
  retries      : 0

Expected fields:

Field	Meaning
outbox	Local operations waiting for synchronization
queued	Operations ready to be selected for sending
in flight	Operations prepared or sent, possibly waiting for ACK
acknowledged	Operations confirmed by the remote side or sync layer
failed	Operations that exceeded retry policy or hit a sync error
retries	Total retry attempts

Failed sync work does not mean local data disappeared.

It means propagation failed according to the current sync policy.

softadastra sync tick

Runs one synchronization tick.

softadastra sync tick

A tick can:

retry expired work
collect the next batch
prepare work for transport delivery
return batch information

Example output style:

Sync tick

  retried : 0
  pruned  : 0
  batch   : 1

Tick result fields:

Field	Meaning
retried	Number of expired operations retried during this tick
pruned	Number of completed entries removed during this tick
batch	Number of operations produced in the current batch

A batch greater than zero means sync found work ready for delivery.

It does not always mean a remote peer has already applied the work.

softadastra sync tick --prune

Runs one sync tick and prunes completed work if supported.

softadastra sync tick --prune

Example output style:

Sync tick

  retried : 0
  pruned  : 2
  batch   : 0

Pruning should only remove work that is completed or safe to remove.

It should not remove local store values.

Peers command

The peers command lists peers known to the local runtime.

softadastra peers

Example output style:

Peers

Node ID        Host        Port    State
node-b         127.0.0.1   4042    available
node-c         127.0.0.1   4043    stale

If no peers are known:

Peers

  no peers found

This is not necessarily an error.

A local Softadastra runtime can still write and read local data without peers.

Peer fields

A peer can expose:

node id
host
port
state
last seen time, if available
capabilities, if available

Common peer states:

State	Meaning
available	Peer is known and may be reachable
connected	Transport has an active connection
stale	Peer was seen before but not refreshed recently
expired	Peer passed its time-to-live
faulted	Peer is known but transport reported an error
unknown	Peer state is not known

A faulted peer means delivery may be failing.

It does not mean local data is gone.

Interactive mode

Start interactive mode by running the CLI without a command:

softadastra

Expected prompt style:

softadastra>

Inside interactive mode, run commands without repeating the binary name.

Normal mode:

softadastra store put app/name Softadastra

Interactive mode:

softadastra> store put app/name Softadastra

Wrong:

softadastra> softadastra store put app/name Softadastra

Correct:

softadastra> store put app/name Softadastra

Exit interactive mode:

exit

or:

quit
Recommended interactive session
softadastra> status
softadastra> node info
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> peers
softadastra> exit

This verifies:

runtime status
node metadata
local store write
local store read
sync status
manual sync tick
peer visibility
Options

The first stable CLI surface should keep options minimal.

Common options can include:

Option	Purpose
--help	Show help for a command, if supported
--prune	Used with sync tick, if supported
--json	Output machine-readable JSON, if supported and stable
--verbose	Show more details, if supported
--quiet	Reduce output, if supported

Only document an option publicly when it is implemented and stable.

--help

Show help for a command or command group, if supported.

softadastra store --help
softadastra sync --help
softadastra node --help

Equivalent command-group help can also be:

softadastra help store
softadastra help sync
softadastra help node
--prune

Used with sync tick, if supported.

softadastra sync tick --prune

Meaning:

run one sync tick
remove completed sync work when safe
--json

If supported, output machine-readable JSON.

softadastra status --json
softadastra sync status --json
softadastra peers --json

Example shape:

{
  "sync": {
    "outbox": 3,
    "queued": 3,
    "in_flight": 0,
    "acknowledged": 0,
    "failed": 0,
    "retries": 0
  }
}

Do not treat JSON output as stable until the schema is documented and versioned.

Exit codes

Recommended exit code behavior:

Exit code	Meaning
0	Command completed successfully
1	Command failed
2	Invalid usage or invalid arguments

Examples:

store get missing/key -> 1
store put app/name    -> 2
status failed         -> 1
help                  -> 0

Scripts should check exit codes.

softadastra status

if [ "$?" -ne 0 ]; then
  echo "Softadastra status failed"
  exit 1
fi
Error output

CLI errors should be clear and actionable.

Good error shape:

error: failed to read key
reason: key not found
key: settings/theme

Another example:

error: missing value
usage: softadastra store put <key> <value>

For unknown commands:

error: unknown command: deploy
hint: run `softadastra help` to list available commands

The CLI should avoid exposing raw low-level errors without context.

Output style

For simple values, prefer aligned fields:

Value

  key   : app/name
  value : Softadastra

For lists, prefer tables:

Peers

Node ID        Host        Port    State
node-b         127.0.0.1   4042    available

For empty lists, print a clear empty state:

Peers

  no peers found

For failed operations, explain what failed and why:

error: key not found
key: missing/key
Local-first behavior

The CLI should preserve Softadastra's local-first rules.

This should work without a peer:

softadastra store put draft/1 hello
softadastra store get draft/1

This should not require:

remote server
connected peer
transport
discovery
cloud access

A peer failure should affect delivery, not local state.

A discovery failure should affect peer finding, not local store access.

A sync failure should be visible, but local data should remain readable.

Stable versus experimental behavior

Only stable commands should be documented as reference behavior.

Recommended rule:

implemented and stable      -> include in reference
implemented but experimental -> mention carefully or keep out
not implemented yet          -> do not present as stable

For example, if store list, --json, or node start is not stable yet, document it as conditional or keep it out of the stable reference.

Quick workflow

A useful first workflow is:

softadastra status
softadastra node info

softadastra store put app/name Softadastra
softadastra store get app/name

softadastra sync status
softadastra sync tick

softadastra peers

This checks the full local runtime surface:

status
metadata
local store
sync
peers
Related pages
CLI Overview
CLI Commands
Interactive Mode
Node Commands
Store Commands
Sync Commands
Peers
Configuration Reference
Errors Reference
