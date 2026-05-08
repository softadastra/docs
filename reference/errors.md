# Errors Reference

This page is the compact reference for Softadastra error behavior.

Use it when you need to quickly check result handling, error shapes, common failure cases, CLI error output, SDK error patterns, and local-first failure rules.

The core rule is:

```txt
Check the result before using the value.

Softadastra APIs should make failure explicit.

Why errors are explicit

Softadastra is designed for local-first and offline-first systems.

In this kind of runtime, failure is normal:

network unavailable
peer unavailable
transport failed
discovery found no peers
WAL path invalid
data directory missing
key not found
sync work failed
runtime not open

The system should not hide those states.

Instead, operations should return clear success or failure results.

Error model

The general model is:

operation
  ↓
Result
  ↓
success value
or
error value

C++:

auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";

JavaScript:

const result = await client.get("app/name");

if (result.isErr()) {
  console.error(result.error().message);
  process.exit(1);
}

console.log(result.value().toString());

CLI:

softadastra store get app/name

If the key is missing:

error: key not found
key: app/name
Result rules

Use the result object in this order:

call operation
  ↓
check success or failure
  ↓
handle error if needed
  ↓
use value only after success

Do not access the value before checking the result.

C++ result pattern

Correct:

auto result = client.get("settings/theme");

if (result.is_err())
{
    std::cerr << "read failed: "
              << result.error().message()
              << "\n";

    return 1;
}

std::cout << result.value().to_string() << "\n";

Wrong:

auto value = client.get("settings/theme").value();

The wrong version assumes the key exists and the operation succeeded.

JavaScript result pattern

Correct:

const result = await client.get("settings/theme");

if (result.isErr()) {
  console.error(`read failed: ${result.error().message}`);
  process.exit(1);
}

console.log(result.value().toString());

Wrong:

const value = (await client.get("settings/theme")).value();

The wrong version assumes success.

CLI error pattern

CLI errors should be clear and actionable.

Good shape:

error: failed to read key
reason: key not found
key: settings/theme

Another good shape:

error: missing value
usage: softadastra store put <key> <value>

Unknown command:

error: unknown command: deploy
hint: run `softadastra help` to list available commands

The CLI should explain what failed, why it failed, and what the user can do next.

C++ Error

In the C++ SDK, an error can expose:

Method	Purpose
message()	Human-readable error message
code_string()	Stable error code string, if exposed

Example:

auto result = client.get("missing/key");

if (result.is_err())
{
    std::cout << "code    : "
              << result.error().code_string()
              << "\n";

    std::cout << "message : "
              << result.error().message()
              << "\n";
}

Expected output style:

code    : not_found
message : key not found
JavaScript SoftadastraError

In the JavaScript SDK, an error can expose:

Field or method	Purpose
message	Human-readable error message
codeString()	Stable error code string, if exposed

Example:

const result = await client.get("missing/key");

if (result.isErr()) {
  console.log(`code    : ${result.error().codeString()}`);
  console.log(`message : ${result.error().message}`);
}

Expected output style:

code    : not_found
message : key not found
Error code versus message

Use the code for program logic.

Use the message for humans.

code    -> stable machine-readable category
message -> human-readable explanation

Example JavaScript logic:

const result = await client.get("settings/theme");

if (result.isErr() && result.error().codeString() === "not_found") {
  await client.put("settings/theme", "light");
}

Example C++ logic:

auto result = client.get("settings/theme");

if (result.is_err() &&
    result.error().code_string() == "not_found")
{
    client.put("settings/theme", "light");
}
Common error categories

Common Softadastra error categories can include:

invalid_argument
not_found
already_exists
unavailable
permission_denied
io_error
transport_error
discovery_error
sync_error
wal_error
store_error
metadata_error
internal
unknown

The exact set depends on the current implementation.

Only treat an error code as stable when it is documented and supported.

Store errors

Store errors happen when reading, writing, or removing local values.

Key not found

A missing key is a normal store error.

C++:

auto result = client.get("missing/key");

if (result.is_err())
{
    std::cout << result.error().code_string() << "\n";
}

JavaScript:

const result = await client.get("missing/key");

if (result.isErr()) {
  console.log(result.error().codeString());
}

CLI:

softadastra store get missing/key

Expected output style:

error: key not found
key: missing/key

This should not crash the runtime.

Invalid key

An empty key should fail clearly.

C++:

auto result = client.put("", "value");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
}

JavaScript:

const result = await client.put("", "value");

if (result.isErr()) {
  console.error(result.error().message);
}

CLI:

softadastra store put "" value

Expected output style:

error: invalid key
reason: key must not be empty
Missing CLI value

CLI:

softadastra store put app/name

Expected output style:

error: missing value
usage: softadastra store put <key> <value>

This is an invalid usage error.

Recommended exit code:

2
Remove missing key

Removing a missing key can be reported clearly.

softadastra store remove app/name

Expected output style:

Removed value

  key     : app/name
  removed : no
  reason  : key not found

This is not the same as a runtime crash.

Client lifecycle errors

Some operations require an opened client.

Wrong C++:

Client client{options};

client.put("app/name", "Softadastra");

Correct C++:

Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    std::cerr << opened.error().message() << "\n";
    return 1;
}

client.put("app/name", "Softadastra");

Wrong JavaScript:

const client = new Client(options);

await client.put("app/name", "Softadastra");

Correct JavaScript:

const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

await client.put("app/name", "Softadastra");
Open errors

open() can fail.

Possible causes:

invalid node id
invalid WAL path
missing data directory
permission denied
WAL open failed
store recovery failed
runtime configuration invalid

C++:

auto opened = client.open();

if (opened.is_err())
{
    std::cerr << "open failed: "
              << opened.error().message()
              << "\n";

    return 1;
}

JavaScript:

const opened = await client.open();

if (opened.isErr()) {
  console.error(`open failed: ${opened.error().message}`);
  process.exit(1);
}

If open() fails, do not continue as if the runtime is healthy.

Cleanup after errors

After the client is open, close it before returning.

C++:

auto written = client.put("app/name", "Softadastra");

if (written.is_err())
{
    std::cerr << written.error().message() << "\n";
    client.close();
    return 1;
}

JavaScript:

const written = await client.put("app/name", "Softadastra");

if (written.isErr()) {
  console.error(written.error().message);
  await client.close();
  process.exit(1);
}
WAL and persistence errors

WAL errors happen when local operation history cannot be written or read.

Common causes:

missing data directory
empty WAL path
permission denied
disk full
invalid WAL file
WAL append failed
WAL flush failed
WAL replay failed
Missing data directory

Wrong:

wal path: data/node-a.wal
data directory does not exist

Fix:

mkdir -p data
Empty WAL path

Wrong C++:

options.enable_wal = true;
options.wal_path = "";

Correct C++:

options.enable_wal = true;
options.wal_path = "data/node-a.wal";

Wrong JavaScript:

options.enableWal = true;
options.walPath = "";

Correct JavaScript:

options.enableWal = true;
options.walPath = "data/node-a.wal";
WAL append failed

If WAL append fails, the operation should not be treated as durably accepted.

The correct model is:

local operation
  ↓
WAL append fails
  ↓
return error
  ↓
do not claim durable success

This keeps persistence honest.

WAL recovery failed

If recovery fails during open(), the runtime should return an explicit error.

Example output style:

error: failed to recover local store
reason: WAL replay failed
path: data/node-a.wal

The application should not silently ignore recovery failure.

Sync errors

Sync errors happen when propagation tracking or delivery preparation fails.

Sync does not mean local data is gone.

store failure -> local state problem
sync failure  -> propagation problem
Sync status error

C++:

auto state = client.sync_state();

if (state.is_err())
{
    std::cerr << "failed to read sync state: "
              << state.error().message()
              << "\n";
}

JavaScript:

const state = await client.syncStateInfo();

if (state.isErr()) {
  console.error(`failed to read sync state: ${state.error().message}`);
}

CLI:

softadastra sync status

Expected error shape:

error: failed to read sync state
reason: sync engine unavailable
Tick error

C++:

auto tick = client.tick();

if (tick.is_err())
{
    std::cerr << "failed to tick sync pipeline: "
              << tick.error().message()
              << "\n";
}

JavaScript:

const tick = await client.tick();

if (tick.isErr()) {
  console.error(`failed to tick sync pipeline: ${tick.error().message}`);
}

CLI:

softadastra sync tick

Expected error shape:

error: failed to tick sync pipeline
reason: sync engine unavailable
Failed sync work

Failed sync work means propagation failed according to the current sync policy.

Example:

Sync status

  outbox       : 4
  queued       : 0
  in flight    : 0
  acknowledged : 0
  failed       : 4
  retries      : 12

This does not mean local data disappeared.

You should still be able to read the local value:

softadastra store get draft/1

The correct model is:

local value remains readable
sync work remains visible
operator or app can retry later
Transport errors

Transport errors happen when peer delivery fails.

Common causes:

transport disabled
port already in use
peer unavailable
connection refused
timeout
socket closed
invalid frame
message delivery failed
Transport disabled

Wrong JavaScript:

options.enableTransport = false;

await client.startTransport();

Correct JavaScript:

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

await client.startTransport();

Wrong C++:

options.enable_transport = false;

client.start_transport();

Correct C++:

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

client.start_transport();
Port already in use

Check:

ss -ltnp | grep 4041

Use another port:

node-a -> 4041
node-b -> 4042

Expected error shape:

error: failed to start transport
reason: port already in use
address: 127.0.0.1:4041
Peer unavailable

C++:

Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

auto connected = client.connect(peer);

if (connected.is_err())
{
    std::cout << "peer connection failed\n";
    std::cout << "  error: "
              << connected.error().message()
              << "\n";
}

JavaScript:

const peer = new Peer(
  "node-b",
  "127.0.0.1",
  4042,
);

const connected = await client.connect(peer);

if (connected.isErr()) {
  console.log("peer connection failed");
  console.log(`  error: ${connected.error().message}`);
}

CLI expected output style:

peer connection failed
  peer    : node-b
  address : 127.0.0.1:4042
  error   : connection refused

A peer connection failure should not invalidate local data.

transport failed
  ↓
local value remains readable
  ↓
sync work remains pending
Discovery errors

Discovery errors happen when peer finding fails.

Common causes:

discovery disabled
discovery port already in use
invalid discovery target
no peers found
stale peers
expired peers
Discovery disabled

Wrong JavaScript:

options.enableDiscovery = false;

await client.startDiscovery();

Correct JavaScript:

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;

await client.startDiscovery();

Wrong C++:

options.enable_discovery = false;

client.start_discovery();

Correct C++:

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;

client.start_discovery();
No peers found

No peers found is usually not an error.

CLI:

softadastra peers

Expected output style:

Peers

  no peers found

This means the local runtime currently has no known peer.

Local store operations should still work:

softadastra store put draft/1 hello
softadastra store get draft/1
Metadata errors

Metadata errors happen when local node information cannot be created or refreshed.

Possible causes:

invalid node id
metadata service unavailable
hostname unavailable
platform info unavailable
invalid version

C++:

auto info = client.refresh_node_info();

if (info.is_err())
{
    std::cerr << "failed to refresh node info: "
              << info.error().message()
              << "\n";
}

JavaScript:

const info = await client.refreshNodeInfo();

if (info.isErr()) {
  console.error(`failed to refresh node info: ${info.error().message}`);
}

CLI:

softadastra node info

Expected error shape:

error: failed to read node metadata
reason: metadata service unavailable
Configuration errors

Configuration errors happen before or during runtime initialization.

Common mistakes:

empty node id
empty WAL path
missing data directory
same WAL path reused by multiple nodes
same transport port reused by multiple nodes
invalid discovery target
transport enabled but invalid port
discovery enabled but invalid port

A configuration error should fail early.

Example CLI shape:

error: invalid configuration
reason: node id must not be empty
CLI invalid usage errors

Invalid usage means the command shape is wrong.

Examples:

softadastra store put
softadastra store put app/name
softadastra sync unknown
softadastra node

Expected output style:

error: missing arguments
usage: softadastra store put <key> <value>

Recommended exit code:

2
CLI command failure errors

Command failure means the command shape was valid, but the operation failed.

Example:

softadastra store get missing/key

Expected output:

error: key not found
key: missing/key

Recommended exit code:

1
CLI exit codes

Recommended exit code behavior:

Exit code	Meaning
0	Command completed successfully
1	Command failed
2	Invalid usage or invalid arguments

Examples:

Command	Recommended exit
softadastra help	0
softadastra status success	0
softadastra store get missing/key	1
softadastra store put app/name	2
softadastra sync unknown	2
Error handling checklist

When handling errors, check:

Did the operation fail?
What is the error code?
What is the message?
Is local state still valid?
Is the failure retryable?
Should the runtime close?
Should the user or operator be notified?
Local-first failure rules

Softadastra should preserve these rules:

network failure should not delete local data
transport failure should not delete local data
discovery failure should not block local store access
sync failure should remain visible
WAL failure should not be hidden
store failure should return explicit errors
metadata failure should not pretend the node is healthy

The most important distinction is:

local acceptance
  is different from
remote synchronization

A local write can succeed while synchronization remains pending.

A synchronization failure can happen while local data remains readable.

Retryable versus non-retryable failures

Some failures are naturally retryable:

peer unavailable
transport timeout
ACK missing
network interruption
temporary discovery failure

Some failures usually need configuration or operator action:

invalid node id
invalid WAL path
permission denied
disk full
port already in use
invalid command arguments

Retry logic should not hide failures forever.

Failed work should stay visible.

Production error behavior

In production, errors should be:

explicit
logged
observable
actionable
associated with node id
associated with operation when possible
safe for local state
clear about retry behavior

Good production error output should answer:

what failed?
where did it fail?
which node was affected?
is local data still valid?
can the operation be retried?
what should the operator check?
Stable versus experimental errors

Only document error codes as stable when they are implemented and intended to remain supported.

Recommended rule:

stable error code      -> document and use in program logic
unstable error message -> do not depend on exact wording
experimental error     -> mention carefully or keep out
internal-only error    -> keep in engine documentation

Error messages can improve over time.

Error codes should be more stable than messages when supported.

Summary

Softadastra errors should be explicit and safe.

The main rule is:

Check the result before using the value.

The main distinction is:

store error      -> local state problem
WAL error        -> durability problem
sync error       -> propagation problem
transport error  -> delivery problem
discovery error  -> peer finding problem
metadata error   -> node identity problem
CLI usage error  -> command shape problem

A good Softadastra application handles those failures directly instead of hiding them.

Related pages
CLI Reference
C++ API Reference
JavaScript API Reference
Configuration Reference
Errors C++
Errors JS
Production Guide
