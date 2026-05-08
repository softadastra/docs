# C++ API Reference

This page is the compact reference for the Softadastra C++ SDK.

Use it when you already understand the C++ SDK and need to quickly check public types, method names, option fields, result fields, or common usage patterns.

For explanations, read the SDK C++ section first:

- [SDK C++](/sdk-cpp/)
- [Installation](/sdk-cpp/installation)
- [First App](/sdk-cpp/first-app)
- [Client](/sdk-cpp/client)
- [Client Options](/sdk-cpp/client-options)
- [Local Store](/sdk-cpp/local-store)
- [Persistent Store](/sdk-cpp/persistent-store)
- [Sync](/sdk-cpp/sync)
- [Transport](/sdk-cpp/transport)
- [Discovery](/sdk-cpp/discovery)
- [Metadata](/sdk-cpp/metadata)
- [Errors](/sdk-cpp/errors)
- [Examples](/sdk-cpp/examples)

The core rule is:

```txt
The C++ SDK exposes a stable public API over the Softadastra engine.
Header

Use the main SDK header:

#include <softadastra/sdk.hpp>

Recommended namespace for examples:

using namespace softadastra::sdk;

Without the namespace:

softadastra::sdk::Client client{
    softadastra::sdk::ClientOptions::local("node-a")};
Main public types

The C++ SDK exposes these main public types:

Type	Purpose
Client	Main SDK object
ClientOptions	Runtime configuration
Value	Local store value
Peer	Remote peer description
NodeInfo	Local node metadata
Result	Success or failure result
Error	Structured error
SyncResult	Sync state result value
TickResult	Sync tick result value
Minimal client
#include <iostream>

#include <softadastra/sdk.hpp>

int main()
{
    using namespace softadastra::sdk;

    Client client{
        ClientOptions::local("node-local")};

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

    auto value = client.get("app/name");

    if (value.is_ok())
    {
        std::cout << value.value().to_string() << "\n";
    }

    client.close();

    return value.is_ok() ? 0 : 1;
}
Client

Client is the main SDK object.

It provides one public API for local store, persistence, sync, transport, discovery, peers, and metadata.

Lifecycle methods
Method	Purpose
open()	Open and initialize the local runtime
close()	Close the runtime and release resources

Example:

Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    std::cerr << opened.error().message() << "\n";
    return 1;
}

// use client

client.close();
Store methods
Method	Purpose
put(key, value)	Write or update a local value
get(key)	Read a local value
remove(key)	Remove a local value
contains(key)	Check whether a key exists
size()	Return the number of local entries
empty()	Check whether the local store is empty

Example:

client.put("settings/theme", "dark");

auto value = client.get("settings/theme");

if (value.is_ok())
{
    std::cout << value.value().to_string() << "\n";
}
Sync methods
Method	Purpose
sync_state()	Return current synchronization state
tick()	Run one sync tick
tick(true)	Run one sync tick and prune completed work, if supported

Example:

auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << state.value().outbox_size << "\n";
}
auto tick = client.tick();

if (tick.is_ok())
{
    std::cout << tick.value().batch_size << "\n";
}
Transport methods
Method	Purpose
start_transport()	Start local transport
stop_transport()	Stop transport, if exposed
transport_running()	Check whether transport is running
connect(peer)	Connect to a peer

Example:

Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

auto connected = client.connect(peer);

if (connected.is_err())
{
    std::cout << connected.error().message() << "\n";
}
Discovery methods
Method	Purpose
start_discovery()	Start peer discovery
stop_discovery()	Stop discovery, if exposed
discovery_running()	Check whether discovery is running
peers()	List known peers

Example:

auto peers = client.peers();

if (peers.is_ok())
{
    for (const auto &peer : peers.value())
    {
        std::cout << peer.node_id << " "
                  << peer.host << ":"
                  << peer.port << "\n";
    }
}
Metadata methods
Method	Purpose
refresh_node_info()	Refresh and return local node metadata
node_info()	Return cached node metadata, if exposed

Example:

auto info = client.refresh_node_info();

if (info.is_ok())
{
    std::cout << info.value().node_id << "\n";
    std::cout << info.value().display_name << "\n";
    std::cout << info.value().hostname << "\n";
    std::cout << info.value().os_name << "\n";
    std::cout << info.value().version << "\n";
}
ClientOptions

ClientOptions configures the SDK runtime.

Common pattern:

ClientOptions options =
    ClientOptions::local("node-a");

Client client{options};
Factory helpers
Helper	Purpose
ClientOptions::local(node_id)	Create local options
ClientOptions::persistent(node_id, wal_path)	Create WAL-backed persistent options
ClientOptions::memory_only(node_id)	Create memory-only options, if exposed

Example:

ClientOptions options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");
Identity fields
Field	Purpose
node_id	Local node identifier
display_name	Human-friendly node label
version	Runtime or application version

Example:

options.display_name = "Node A";
options.version = "0.1.0";
WAL fields
Field	Purpose
enable_wal	Enable WAL-backed persistence
wal_path	WAL file path
auto_flush	Flush WAL writes automatically when configured

Example:

options.enable_wal = true;
options.wal_path = "data/node-a.wal";
options.auto_flush = true;

Persistent helper:

ClientOptions options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");

options.auto_flush = true;
Transport fields
Field	Purpose
enable_transport	Enable transport configuration
transport_host	Local transport bind host
transport_port	Local transport bind port

Example:

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
Discovery fields
Field	Purpose
enable_discovery	Enable discovery configuration
discovery_host	Local discovery bind host
discovery_port	Local discovery bind port
discovery_broadcast_host	Discovery target host
discovery_broadcast_port	Discovery target port

Example:

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
Common configurations
Local-only

No WAL, no transport, no discovery.

ClientOptions options =
    ClientOptions::local("node-local");

options.enable_wal = false;
options.enable_transport = false;
options.enable_discovery = false;

Use for tests, demos, temporary state, and first examples.

Persistent local

WAL enabled, no transport, no discovery.

ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/node-persistent.wal");

options.auto_flush = true;
options.enable_transport = false;
options.enable_discovery = false;

Use when local writes should survive restart.

Transport-enabled
ClientOptions options =
    ClientOptions::persistent(
        "node-a",
        "data/node-a.wal");

options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

options.enable_discovery = false;

Use when the node should connect to peers manually.

Discovery-enabled
ClientOptions options =
    ClientOptions::persistent(
        "node-discovery-a",
        "data/node-discovery-a.wal");

options.auto_flush = true;

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4051;

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;

Use when the node should find peers automatically.

Value

Value represents a local store value.

The SDK accepts strings directly:

client.put("message", "hello");

You can also create a value explicitly:

Value value =
    Value::from_string("hello");

client.put("message", value);

Read values can be converted back to strings:

auto result = client.get("message");

if (result.is_ok())
{
    std::cout << result.value().to_string() << "\n";
}
Peer

Peer describes another node.

Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

Common fields:

Field	Purpose
node_id	Remote node identifier
host	Remote host
port	Remote transport port

Use with:

client.connect(peer);

A failed peer connection should not invalidate local state.

NodeInfo

NodeInfo describes the local node.

Common fields:

Field	Purpose
node_id	Local node identifier
display_name	Human-friendly label
hostname	Machine hostname
os_name	Operating system
version	Runtime or app version
capabilities	Supported runtime capabilities
uptime_ms()	Runtime uptime in milliseconds

Example:

auto result = client.refresh_node_info();

if (result.is_ok())
{
    const auto &node = result.value();

    std::cout << node.node_id << "\n";
    std::cout << node.display_name << "\n";
    std::cout << node.hostname << "\n";
    std::cout << node.os_name << "\n";
    std::cout << node.version << "\n";
    std::cout << node.uptime_ms() << "\n";
}
Result

Most SDK operations return a Result.

Conceptually:

Result<T>
  -> success: T
  -> failure: Error

Common methods:

Method	Purpose
is_ok()	Check whether the result is successful
is_err()	Check whether the result failed
value()	Access success value
error()	Access error

Correct pattern:

auto result = client.get("app/name");

if (result.is_err())
{
    std::cerr << result.error().message() << "\n";
    return 1;
}

std::cout << result.value().to_string() << "\n";

Avoid:

auto value = client.get("app/name").value();

That assumes the operation succeeded.

Error

Error describes what failed.

Common methods:

Method	Purpose
message()	Human-readable error message
code_string()	Stable error code string, when exposed

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
SyncResult

SyncResult describes current sync state.

Common fields:

Field	Meaning
outbox_size	Local operations waiting for synchronization
queued_count	Operations ready to be selected for sending
in_flight_count	Operations prepared or sent, possibly waiting for ACK
acknowledged_count	Operations confirmed by the remote side
failed_count	Operations that exceeded retry policy or hit a sync error
total_retries	Total retry attempts
last_submitted_version	Last local submitted version, if exposed
last_applied_remote_version	Last remote applied version, if exposed

Example:

auto state = client.sync_state();

if (state.is_ok())
{
    std::cout << "outbox: "
              << state.value().outbox_size
              << "\n";

    std::cout << "queued: "
              << state.value().queued_count
              << "\n";

    std::cout << "failed: "
              << state.value().failed_count
              << "\n";
}

If exposed:

if (state.is_ok() && state.value().has_failed())
{
    std::cerr << "sync has failed work\n";
}
TickResult

TickResult describes the result of one sync tick.

Common fields:

Field	Meaning
retried_count	Operations retried during the tick
pruned_count	Completed entries removed during the tick
batch_size	Operations produced in the current batch

Example:

auto tick = client.tick();

if (tick.is_ok())
{
    std::cout << "retried: "
              << tick.value().retried_count
              << "\n";

    std::cout << "pruned: "
              << tick.value().pruned_count
              << "\n";

    std::cout << "batch: "
              << tick.value().batch_size
              << "\n";
}
Local store reference
put
auto result = client.put("profile/name", "Ada");

Success means the value is available locally.

If WAL is enabled, the operation can also be persisted.

If sync is enabled, the operation can also be tracked for propagation.

get
auto result = client.get("profile/name");

Success returns a Value.

Missing key returns an explicit error.

remove
auto result = client.remove("profile/name");

Removes the local value.

If sync is enabled, a delete operation can be tracked for propagation.

contains
bool exists = client.contains("profile/name");

Returns whether the key exists locally.

size
auto count = client.size();

Returns the number of local entries.

empty
bool is_empty = client.empty();

Returns whether the local store is empty.

Sync reference
sync_state
auto state = client.sync_state();

Use it to inspect pending sync work.

tick
auto tick = client.tick();

Runs one sync tick.

tick with pruning
auto tick = client.tick(true);

Runs one sync tick and asks the runtime to prune completed work, if supported.

Transport reference
start_transport
auto result = client.start_transport();

Starts local transport.

Transport requires:

options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;
transport_running
if (client.transport_running())
{
    std::cout << "transport is running\n";
}
connect
Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

auto result = client.connect(peer);

Connects to a peer.

A connection failure should not make local store data invalid.

Discovery reference
start_discovery
auto result = client.start_discovery();

Starts peer discovery.

Discovery requires:

options.enable_discovery = true;
options.discovery_host = "127.0.0.1";
options.discovery_port = 5051;
options.discovery_broadcast_host = "127.0.0.1";
options.discovery_broadcast_port = 5052;
discovery_running
if (client.discovery_running())
{
    std::cout << "discovery is running\n";
}
peers
auto result = client.peers();

Returns known peers.

No peers is a valid state.

Metadata reference
refresh_node_info
auto result = client.refresh_node_info();

Refreshes and returns local node metadata.

node_info

If exposed:

auto result = client.node_info();

Returns cached node metadata without forcing a refresh.

Common flows
Local-only flow
ClientOptions options =
    ClientOptions::local("node-local");

options.enable_wal = false;
options.enable_transport = false;
options.enable_discovery = false;

Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

client.put("app/name", "Softadastra");

auto value = client.get("app/name");

client.close();
Persistent flow
ClientOptions options =
    ClientOptions::persistent(
        "node-persistent",
        "data/node-persistent.wal");

options.auto_flush = true;
options.enable_transport = false;
options.enable_discovery = false;
Client client{options};

auto opened = client.open();

if (opened.is_err())
{
    return 1;
}

client.put("settings/theme", "dark");

client.close();
Sync flow
client.put("message/1", "hello");

auto state = client.sync_state();

auto tick = client.tick();
Transport flow
options.enable_transport = true;
options.transport_host = "127.0.0.1";
options.transport_port = 4041;

Client client{options};

client.open();
client.start_transport();

Peer peer{
    "node-b",
    "127.0.0.1",
    4042};

client.connect(peer);
client.tick();

client.close();
Metadata flow
auto node = client.refresh_node_info();

if (node.is_ok())
{
    std::cout << node.value().node_id << "\n";
}
Naming style

The C++ SDK uses snake_case for fields and methods.

Examples:

options.enable_wal = true;
options.wal_path = "data/node-a.wal";

client.sync_state();
client.start_transport();
client.start_discovery();
client.refresh_node_info();

This differs from the JavaScript SDK, which uses camelCase.

Local-first behavior

The C++ API should preserve Softadastra's local-first model.

A local store operation should not require:

remote server
connected peer
transport
discovery
cloud access

This should work locally:

options.enable_transport = false;
options.enable_discovery = false;

client.put("draft/1", "hello");
client.get("draft/1");

Transport failure should not delete local data.

Discovery failure should not block local store access.

Sync failure should be visible, but local values should remain readable.

Stability rule

This reference should only document public SDK behavior that is implemented and intended to remain stable.

Recommended rule:

public SDK type          -> include here
public SDK method        -> include here
experimental method      -> mention carefully or keep out
internal engine class    -> document in engine section, not here
implementation detail    -> keep out of public API reference
Related pages
SDK C++
Client
Client Options
Local Store
Persistent Store
Sync
Transport
Discovery
Metadata
Errors
Configuration Reference
Errors Reference
