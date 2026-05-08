# Persist Data Locally

This guide shows how to persist local data with Softadastra.

The goal is to make accepted local operations recoverable after a process restart, application crash, or interrupted execution.

The core rule is:

```txt
Write locally.
Persist locally.
Recover later.

Persistence is what turns a simple memory-only local store into a safer local-first runtime.

What you will do

You will learn how to:

enable WAL-backed persistence
choose a WAL path
create a data directory
write local data
read local data
restart the runtime
recover local state
inspect sync state
avoid common persistence mistakes

The basic flow is:

create data directory
  ↓
enable WAL
  ↓
open client
  ↓
write local data
  ↓
close client
  ↓
open client again
  ↓
recover value
Why persistence matters

The first offline-first app used memory-only state.

Memory-only state is useful for tests and demos, but it does not guarantee recovery after restart.

memory-only write
  ↓
process exits
  ↓
state may be lost

For real local-first applications, accepted work often needs to survive:

process restart
application crash
machine restart
network interruption
sync interruption
temporary power loss

This is why Softadastra uses WAL-backed persistence.

What WAL means here

WAL means Write-Ahead Log.

The idea is simple:

operation
  ↓
write operation to local log
  ↓
apply operation to local store
  ↓
recover from log later

The WAL is the durable operation history.

The store is the current local state.

WAL   -> what happened
Store -> current value
Persistence is still local-first

Persistence does not require a server.

It does not require a peer.

It does not require transport.

It does not require discovery.

A persistent local write is still local work:

local write
  ↓
WAL append
  ↓
store apply
  ↓
sync tracking, if enabled

The network can come later.

Create the data directory

Before using a WAL path under data/, create the directory:

mkdir -p data

This matters because a missing directory can make the runtime fail to open or fail to persist data.

A good WAL path is:

data/<node-id>.wal

Examples:

data/node-a.wal
data/node-persistent.wal
data/sdk-persistent-store.wal
data/softadastra.wal
Option A: C++ persistent app

Use this version if you want to persist data with the C++ SDK.

Create the app
mkdir softadastra-cpp-persistent-app
cd softadastra-cpp-persistent-app
mkdir -p data
nano main.cpp

Paste this code:

#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::persistent(
            "node-persistent",
            "data/node-persistent.wal");

    options.auto_flush = true;
    options.enable_transport = false;
    options.enable_discovery = false;

    Client client{options};

    auto open_result = client.open();

    if (open_result.is_err())
    {
        std::cerr << "failed to open client: "
                  << open_result.error().message()
                  << "\n";

        return 1;
    }

    auto put_result = client.put(
        "settings/theme",
        "dark");

    if (put_result.is_err())
    {
        std::cerr << "failed to write value: "
                  << put_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    auto value_result = client.get("settings/theme");

    if (value_result.is_err())
    {
        std::cerr << "failed to read value: "
                  << value_result.error().message()
                  << "\n";

        client.close();
        return 1;
    }

    std::cout << "persistent write\n";
    std::cout << "  key      : settings/theme\n";
    std::cout << "  value    : "
              << value_result.value().to_string()
              << "\n";
    std::cout << "  wal path : "
              << options.wal_path
              << "\n";
    std::cout << "  size     : "
              << client.size()
              << "\n";

    client.close();

    return 0;
}
What this configuration means
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/node-persistent.wal");

This creates a persistent local node.

The node id is:

node-persistent

The WAL path is:

data/node-persistent.wal

The write flow becomes:

client.put()
  ↓
WAL append
  ↓
local store apply
  ↓
local value readable
Run the app

Build and run using your normal project setup.

Expected output style:

persistent write
  key      : settings/theme
  value    : dark
  wal path : data/node-persistent.wal
  size     : 1
Option B: JavaScript persistent app

Use this version if you want to persist data with the JavaScript SDK.

Create the app
mkdir softadastra-js-persistent-app
cd softadastra-js-persistent-app

npm init -y
npm pkg set type=module
npm install @softadastra/sdk

mkdir -p data
nano main.js

Paste this code:

import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.persistent(
  "node-persistent",
  "data/node-persistent.wal",
);

options.autoFlush = true;
options.enableTransport = false;
options.enableDiscovery = false;

const client = new Client(options);

const openResult = await client.open();

if (openResult.isErr()) {
  console.error(`failed to open client: ${openResult.error().message}`);
  process.exit(1);
}

const putResult = await client.put(
  "settings/theme",
  "dark",
);

if (putResult.isErr()) {
  console.error(`failed to write value: ${putResult.error().message}`);
  await client.close();
  process.exit(1);
}

const valueResult = await client.get("settings/theme");

if (valueResult.isErr()) {
  console.error(`failed to read value: ${valueResult.error().message}`);
  await client.close();
  process.exit(1);
}

console.log("persistent write");
console.log("  key      : settings/theme");
console.log(`  value    : ${valueResult.value().toString()}`);
console.log(`  wal path : ${options.walPath}`);
console.log(`  size     : ${client.size()}`);

await client.close();
Run the app
node main.js

Expected output:

persistent write
  key      : settings/theme
  value    : dark
  wal path : data/node-persistent.wal
  size     : 1
Test recovery manually

A persistence guide should prove recovery.

The next example opens a client, writes a value, closes it, opens a second client with the same WAL path, then reads the value back.

C++ recovery test

Create:

nano recovery.cpp

Paste this code:

#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    ClientOptions options =
        ClientOptions::persistent(
            "node-recovery",
            "data/node-recovery.wal");

    options.auto_flush = true;
    options.enable_transport = false;
    options.enable_discovery = false;

    {
        Client client{options};

        auto opened = client.open();

        if (opened.is_err())
        {
            std::cerr << opened.error().message() << "\n";
            return 1;
        }

        auto written = client.put("app/name", "Softadastra");

        if (written.is_err())
        {
            std::cerr << written.error().message() << "\n";
            client.close();
            return 1;
        }

        std::cout << "first run value written\n";

        client.close();
    }

    {
        Client client{options};

        auto opened = client.open();

        if (opened.is_err())
        {
            std::cerr << opened.error().message() << "\n";
            return 1;
        }

        auto value = client.get("app/name");

        if (value.is_err())
        {
            std::cerr << "recovery failed: "
                      << value.error().message()
                      << "\n";

            client.close();
            return 1;
        }

        std::cout << "recovered value: "
                  << value.value().to_string()
                  << "\n";

        client.close();
    }

    return 0;
}

Expected output style:

first run value written
recovered value: Softadastra
JavaScript recovery test

Create:

nano recovery.js

Paste this code:

import { Client, ClientOptions } from "@softadastra/sdk";

const options = ClientOptions.persistent(
  "node-recovery",
  "data/node-recovery.wal",
);

options.autoFlush = true;
options.enableTransport = false;
options.enableDiscovery = false;

{
  const client = new Client(options);

  const opened = await client.open();

  if (opened.isErr()) {
    console.error(opened.error().message);
    process.exit(1);
  }

  const written = await client.put("app/name", "Softadastra");

  if (written.isErr()) {
    console.error(written.error().message);
    await client.close();
    process.exit(1);
  }

  console.log("first run value written");

  await client.close();
}

{
  const client = new Client(options);

  const opened = await client.open();

  if (opened.isErr()) {
    console.error(opened.error().message);
    process.exit(1);
  }

  const value = await client.get("app/name");

  if (value.isErr()) {
    console.error(`recovery failed: ${value.error().message}`);
    await client.close();
    process.exit(1);
  }

  console.log(`recovered value: ${value.value().toString()}`);

  await client.close();
}

Run:

node recovery.js

Expected output:

first run value written
recovered value: Softadastra
What happened during recovery

The recovery flow is:

first runtime
  ↓
open client
  ↓
write app/name
  ↓
append operation to WAL
  ↓
apply to local store
  ↓
close client

second runtime
  ↓
open client
  ↓
read WAL
  ↓
replay valid operations
  ↓
restore local store
  ↓
get app/name

The value comes back because the operation history was persisted.

Persistent store and sync state

A persistent local write can also create sync work.

C++:

client.put("profile/name", "Ada");

auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: "
              << state.value().outbox_size
              << "\n";
}

JavaScript:

await client.put("profile/name", "Ada");

const state = await client.syncStateInfo();

if (state.isOk()) {
  console.log(`outbox: ${state.value().outboxSize}`);
}

The relationship is:

Persistence -> makes local operation recoverable
Sync        -> tracks operation for propagation

A persisted operation is not automatically synchronized with a peer. Sync still needs transport, peers, and ticks to move work forward.

Use the CLI to test persistence

You can use the CLI to inspect local behavior:

softadastra status
softadastra store put settings/theme dark
softadastra store get settings/theme
softadastra sync status

If WAL is enabled in the runtime, status may show:

WAL
  enabled  : yes
  path     : data/softadastra.wal
  durable  : yes

The exact output depends on your CLI implementation and runtime configuration.

WAL path rules

Use one WAL path per local node.

Good:

data/node-a.wal
data/node-b.wal
data/desktop-client.wal

Avoid sharing the same WAL file between unrelated local nodes:

data/shared.wal

A WAL path should be:

non-empty
inside an existing directory
writable by the process
stable across restarts
unique per node
not manually edited
Why auto flush matters

Auto flush controls how aggressively the runtime flushes WAL writes.

C++:

options.auto_flush = true;

JavaScript:

options.autoFlush = true;

For normal persistent examples, use true.

The safer model is:

operation accepted
  ↓
WAL write
  ↓
flush when configured
  ↓
local state can be recovered

If flushing is relaxed, performance may improve, but durability guarantees can become weaker depending on the implementation and operating system.

Persistence does not mean synchronization

Persistence and synchronization solve different problems.

Persistence -> can I recover local work after restart?
Sync        -> can I propagate local work to another node?

A write can be persistent but not synchronized yet.

Example:

local write persisted
  ↓
peer unavailable
  ↓
sync work remains pending
  ↓
retry later

This is normal.

Persistence does not mean conflict-free

Persistence protects local operation history.

It does not remove the possibility of conflicts.

For example:

node A writes doc/1 = local
node B writes doc/1 = remote
both nodes were offline
both nodes reconnect

The WAL can preserve each node's local history, but the sync layer still needs deterministic conflict rules.

Persistence does not replace backups

WAL-backed persistence helps local recovery.

It does not replace backups for important production data.

For production, think about:

data directory backups
WAL file integrity
disk monitoring
permissions
retention
snapshots
restore procedures

The production guide covers this later.

Common mistakes
Missing data directory

This is a common mistake:

wal path : data/node-a.wal
data/ directory does not exist

Fix:

mkdir -p data
Empty WAL path

Avoid:

options.wal_path = "";

Avoid:

options.walPath = "";

Use:

data/node-a.wal
Reusing the same WAL path for multiple nodes

Avoid:

node-a -> data/shared.wal
node-b -> data/shared.wal

Use:

node-a -> data/node-a.wal
node-b -> data/node-b.wal
Assuming persistence means peer delivery

A recovered value only proves local recovery.

It does not prove that another peer received the operation.

Use sync and transport guides for that.

Ignoring open errors

Always check open().

C++:

auto opened = client.open();

if (opened.is_err())
{
    std::cerr << opened.error().message() << "\n";
    return 1;
}

JavaScript:

const opened = await client.open();

if (opened.isErr()) {
  console.error(opened.error().message);
  process.exit(1);
}

If opening fails, persistence may not be available.

What this guide proves

This guide proves that Softadastra can:

write local data
persist operation history
close the runtime
open the runtime again
replay local history
restore current local state
keep persistence independent from transport
keep persistence independent from discovery
What this guide does not prove

This guide does not prove multi-node synchronization.

It does not prove conflict resolution.

It does not prove convergence between nodes.

It does not prove production backup safety.

It does not prove remote delivery.

Those topics are covered in later guides.

Summary

You enabled local persistence with Softadastra.

The core model is:

local write
  ↓
WAL-backed persistence
  ↓
local store apply
  ↓
recover after restart

The next step is to synchronize local operations between two nodes.

Next step

Continue with:

Sync Between Nodes
