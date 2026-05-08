# Production

This guide explains how to prepare a Softadastra-based application for production-oriented usage.

Production does not mean only deployment. In Softadastra, production means making local-first behavior reliable, observable, recoverable, and understandable under real failure conditions.

The core rule is:

```txt
Production reliability starts with explicit local state, durable history, observable sync, and clear failure behavior.
What you will learn

You will learn how to think about:

stable node ids
data directories
WAL paths
runtime configuration
local store behavior
sync visibility
transport ports
discovery behavior
error handling
logs
backups
monitoring
deployment
failure recovery

This guide does not replace application-specific production planning. It gives the Softadastra-specific checklist you should follow before using the runtime in serious environments.

Production mindset

Softadastra is built for systems where failure is normal.

Production usage should assume:

network can fail
peer can disappear
transport can disconnect
discovery can find no peers
ACK can be delayed
sync can be interrupted
process can restart
disk can fail
configuration can be wrong

The system should not pretend those states do not exist.

The production goal is not to avoid every failure. The goal is to make failures safe, visible, retryable, and recoverable.

Use stable node ids

Every production node should have a stable node id.

Good examples:

edge-store-kampala-01
warehouse-node-01
clinic-tablet-17
drive-client-laptop-01
sync-agent-prod-01

Avoid random node ids when sync, persistence, diagnostics, or peer identity depend on them.

Bad examples:

node-123-random-every-start
test
local
default

A node id is used by:

metadata
sync operation origin
transport messages
discovery announcements
CLI status
SDK node info
logs
diagnostics

The node id should remain stable across restarts.

Use one WAL path per node

Each node should have its own WAL file.

Good:

data/node-a.wal
data/node-b.wal
data/edge-store-kampala-01.wal

Bad:

data/shared.wal
data/default.wal
/tmp/softadastra.wal

A WAL belongs to one local runtime.

Do not share one WAL path between unrelated nodes.

Create and protect the data directory

Before running a persistent node, create the data directory:

mkdir -p data

For production, prefer an explicit path outside temporary directories.

Examples:

/var/lib/softadastra/node-a/
/var/lib/softadastra/edge-store-kampala-01/
./data/

The process must have permission to read and write this directory.

Check permissions:

ls -ld data

For a service user, make sure ownership is correct:

sudo chown -R softadastra:softadastra /var/lib/softadastra

The exact user depends on your deployment.

Avoid temporary WAL paths

Do not store important WAL files in temporary directories.

Avoid:

/tmp/node-a.wal
/var/tmp/node-a.wal

Temporary directories can be cleaned by the system.

Use a stable application data path.

Enable persistence for important local data

Memory-only mode is useful for tests, demos, and temporary local tools.

For production local data, enable WAL-backed persistence.

C++:

ClientOptions options =
    ClientOptions::persistent(
        "edge-store-kampala-01",
        "/var/lib/softadastra/edge-store-kampala-01/node.wal");

options.auto_flush = true;

JavaScript:

const options = ClientOptions.persistent(
  "edge-store-kampala-01",
  "/var/lib/softadastra/edge-store-kampala-01/node.wal",
);

options.autoFlush = true;

The model is:

local write
  ↓
WAL append
  ↓
store apply
  ↓
recover after restart
Use auto flush for safer persistence

For production-like usage, prefer auto flush enabled.

C++:

options.auto_flush = true;

JavaScript:

options.autoFlush = true;

This favors safer durability behavior.

Disabling flush can reduce overhead, but it may weaken durability depending on the implementation and operating system.

Use relaxed flushing only when you understand the tradeoff.

Treat open errors as serious

Always check open().

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

If open() fails, the runtime may not have initialized persistence, store, sync, transport, discovery, or metadata correctly.

Do not continue as if the node is healthy.

Do not ignore write errors

A local write can fail.

Possible causes:

invalid key
invalid value
WAL path invalid
WAL append failed
disk full
permission denied
store unavailable
runtime not open

Always check the result.

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

If WAL append fails, the operation should not be treated as durably accepted.

Separate local success from sync success

A successful local write does not mean remote delivery completed.

put succeeds
  ↓
local state updated
  ↓
sync work may be pending
  ↓
peer may not have received it yet

Always separate these two questions:

Did the local write succeed?
Did synchronization complete?

Use sync state to inspect propagation:

C++:

auto state = client.sync_state();

JavaScript:

const state = await client.syncStateInfo();

CLI:

softadastra sync status
Monitor sync state

Production systems should make sync state visible.

Important fields:

outbox
queued
in flight
acknowledged
failed
total retries
last submitted version
last applied remote version

A healthy offline-first system can have pending work.

Pending work means:

local operations exist
  ↓
sync has not completed delivery yet

Failed work requires attention.

Example:

Sync status

  outbox       : 4
  queued       : 0
  in flight    : 0
  acknowledged : 0
  failed       : 4
  retries      : 12

This means local data may still be valid, but propagation failed according to the current retry policy.

Make failed sync visible to users or operators

A production application should not hide sync failure.

The UI or logs should be able to show states like:

saved locally
waiting to sync
syncing
synced
retrying
sync failed
conflict detected

This matters because local-first does not mean invisible background magic.

Users and operators should understand whether work is local only or already synchronized.

Use manual ticks intentionally

Softadastra exposes manual sync ticks because explicit synchronization is easier to test and debug.

C++:

auto tick = client.tick();

JavaScript:

const tick = await client.tick();

CLI:

softadastra sync tick

In production, decide where ticks happen:

application event loop
background worker
scheduled job
CLI operation
service loop
manual operator action

The important rule is: tick behavior should be intentional, observable, and controlled.

Use pruning carefully

Pruning removes completed sync work when it is safe.

C++:

auto tick = client.tick(true);

JavaScript:

const tick = await client.tick({
  prune: true,
});

CLI:

softadastra sync tick --prune

Pruning must not remove pending, queued, in-flight, or failed work unless the command explicitly supports that behavior and the operator understands the effect.

The safe default is:

prune completed work only
Configure transport ports explicitly

When transport is enabled, each node needs a clear host and port.

C++:

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

JavaScript:

options.enableTransport = true;
options.transportHost = "127.0.0.1";
options.transportPort = 4041;

For local testing:

node-a -> 127.0.0.1:4041
node-b -> 127.0.0.1:4042

For production, choose ports that are:

documented
not already in use
allowed by firewall rules
unique per local node
monitored

Check local ports:

ss -ltnp | grep 4041
Treat transport as delivery, not correctness

Transport failure should not corrupt local state.

Correct behavior:

transport connect fails
  ↓
sync work remains tracked
  ↓
local value remains readable
  ↓
retry later

Transport is only the delivery layer.

It does not decide whether local data is valid.

Configure discovery intentionally

Discovery is optional.

Enable discovery only when the runtime should find peers automatically.

C++:

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;

JavaScript:

options.enableDiscovery = true;
options.discoveryHost = "127.0.0.1";
options.discoveryPort = 5051;
options.discoveryBroadcastHost = "127.0.0.1";
options.discoveryBroadcastPort = 5052;

Production discovery needs clear decisions:

which network interfaces are allowed?
which ports are used?
is discovery local only?
is broadcast allowed?
are peers manually configured instead?
how are stale peers removed?

No discovered peer should not break local work.

Monitor peers

Use the CLI:

softadastra peers

Expected output style:

Peers

Node ID        Host        Port    State
node-b         127.0.0.1   4042    available
node-c         127.0.0.1   4043    stale

Important peer states include:

available
connected
stale
expired
faulted
unknown

A faulted peer means delivery may be failing, not that local data is gone.

Use metadata for diagnostics

Metadata helps identify the local node.

CLI:

softadastra node info

SDK C++:

auto info = client.refresh_node_info();

SDK JS:

const info = await client.refreshNodeInfo();

Metadata should expose useful fields:

node id
display name
hostname
operating system
version
uptime
capabilities

This is important when debugging multi-node systems.

Build production commands carefully

For the engine repository:

cd ~/softadastra/softadastra

Build:

vix build --preset release

If you need the CLI and node apps:

vix build --preset release -- \
  -DSOFTADASTRA_BUILD_APPS=ON \
  -DSOFTADASTRA_BUILD_CLI_APP=ON \
  -DSOFTADASTRA_BUILD_NODE_APP=ON

If your Vix build supports exporting the binary:

vix build --bin

Verify:

./softadastra help
./softadastra version
./softadastra status
Run as a service

For Linux deployments, run the node or application under a service manager such as systemd.

A conceptual service should define:

working directory
binary path
environment variables
data directory
restart policy
service user
logs

Example shape:

[Unit]
Description=Softadastra Node
After=network.target

[Service]
Type=simple
User=softadastra
WorkingDirectory=/opt/softadastra
ExecStart=/usr/local/bin/softadastra node start
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target

Adapt paths, user, and command to your real deployment.

Keep configuration explicit

A production node should not depend on hidden defaults.

Document:

node id
data directory
WAL path
transport host
transport port
discovery host
discovery port
sync retry policy
ACK timeout
log level
runtime version

Use a config file, environment variables, or deployment script depending on your application.

The important point is: operators should know how the node is configured.

Log important runtime events

Production logs should make these events visible:

runtime started
runtime stopped
client open failed
WAL open failed
WAL append failed
store write failed
sync tick result
sync failed work
transport start failed
peer connection failed
discovery start failed
node metadata refreshed

Logs should answer:

what happened?
where did it happen?
which node was affected?
is local state still valid?
can it be retried?

Avoid logs that only say:

failed
error
unknown
Back up local data

WAL-backed persistence helps local recovery, but it is not a full backup strategy.

For important production data, plan backups for:

data directory
WAL files
snapshots, if supported
configuration files
deployment metadata

A basic backup policy should answer:

what is backed up?
how often?
where is it stored?
how is restore tested?
how long is it retained?
who can access it?

Recovery is only real if restore has been tested.

Test restart recovery

Before production, test recovery manually.

Flow:

start runtime
  ↓
write data
  ↓
stop runtime
  ↓
start runtime again
  ↓
read data

CLI shape:

softadastra store put app/name Softadastra
softadastra store get app/name

# restart runtime or service

softadastra store get app/name

SDK shape:

open client
put value
close client
open client with same WAL path
get value

Expected result:

recovered value is readable
Test peer failure

Test what happens when a peer is unavailable.

Expected behavior:

peer unavailable
  ↓
transport connection fails
  ↓
sync work remains pending
  ↓
local data remains readable

CLI workflow:

softadastra store put draft/1 hello
softadastra sync status
softadastra sync tick
softadastra peers
softadastra store get draft/1

Local read should still work.

Test network interruption

For production readiness, test interrupted delivery.

The runtime should keep local work tracked and retry later.

Expected behavior:

network interruption
  ↓
transport fails
  ↓
ACK may be missing
  ↓
operation remains tracked
  ↓
retry later

The exact test method depends on your deployment.

The important output is visible sync state.

Test disk failure behavior

Disk failure can happen.

Examples:

data directory missing
permission denied
disk full
invalid WAL path

The runtime should return explicit errors.

It should not claim durability if WAL append failed.

Test at least:

missing data directory
unwritable data directory
invalid WAL path
Use clear exit codes

For CLI usage, recommended exit behavior is:

0 -> command completed successfully
1 -> command failed
2 -> invalid usage or arguments

Scripts should check exit codes.

Example:

softadastra status

if [ "$?" -ne 0 ]; then
  echo "Softadastra status failed"
  exit 1
fi
Use JSON output only when stable

If the CLI supports JSON output later:

softadastra status --json
softadastra sync status --json
softadastra peers --json

Do not rely on JSON output as a stable production API until the schema is documented and versioned.

For automation, stable schemas matter.

Production checklist

Before production, verify:

node id is stable
WAL is enabled for important data
WAL path is unique per node
data directory exists
data directory permissions are correct
auto flush is enabled when durability matters
open errors are handled
write errors are handled
sync state is observable
failed sync work is visible
transport ports are configured
discovery behavior is intentional
logs show useful runtime events
restart recovery is tested
peer failure is tested
backup and restore are planned
deployment command is documented
runtime version is known
Minimal production-oriented C++ shape
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::persistent(
            "edge-store-kampala-01",
            "/var/lib/softadastra/edge-store-kampala-01/node.wal");

    options.auto_flush = true;

    options.enable_transport = true;
    options.transport_host = "0.0.0.0";
    options.transport_port = 4041;

    options.enable_discovery = false;

    options.display_name = "Edge Store Kampala 01";
    options.version = "0.1.0";

    Client client{options};

    auto opened = client.open();

    if (opened.is_err())
    {
        std::cerr << "open failed: "
                  << opened.error().message()
                  << "\n";

        return 1;
    }

    auto node = client.refresh_node_info();

    if (node.is_ok())
    {
        std::cout << "node: "
                  << node.value().node_id
                  << "\n";
    }

    auto state = client.sync_state();

    if (state.is_ok() && state.value().has_failed())
    {
        std::cerr << "warning: sync has failed work\n";
    }

    client.close();

    return 0;
}
Minimal production-oriented JavaScript shape
import {
  Client,
  ClientOptions,
} from "@softadastra/sdk";

const options = ClientOptions.persistent(
  "edge-store-kampala-01",
  "/var/lib/softadastra/edge-store-kampala-01/node.wal",
);

options.autoFlush = true;

options.enableTransport = true;
options.transportHost = "0.0.0.0";
options.transportPort = 4041;

options.enableDiscovery = false;

options.displayName = "Edge Store Kampala 01";
options.version = "0.1.0";

const client = new Client(options);

const opened = await client.open();

if (opened.isErr()) {
  console.error(`open failed: ${opened.error().message}`);
  process.exit(1);
}

const node = await client.refreshNodeInfo();

if (node.isOk()) {
  console.log(`node: ${node.value().nodeId}`);
}

const state = await client.syncStateInfo();

if (state.isOk() && state.value().hasFailed()) {
  console.error("warning: sync has failed work");
}

await client.close();
What production should guarantee

A production-ready Softadastra setup should guarantee:

local writes are handled explicitly
local persistence is configured intentionally
accepted durable work can be recovered
sync state can be inspected
failed sync work is visible
transport failure does not delete local data
discovery failure does not block local work
operators can identify the node
logs explain important runtime events
restart recovery has been tested
What production does not automatically guarantee

Softadastra does not automatically give you:

backups
monitoring
alerting
access control
deployment automation
schema migration strategy
conflict-free application semantics
infinite disk space
perfect network delivery
instant convergence

Those are application and infrastructure responsibilities.

Softadastra gives the runtime model and primitives. Production systems still need operational discipline.

Summary

Production usage should keep the Softadastra model visible:

write locally
persist locally
track operation
sync when possible
retry when needed
converge later

The production goal is to make every step explicit, observable, and recoverable.

Next step

Continue with the reference section:

Reference
