# Transport

`transport` is the peer communication module of Softadastra Engine.

It moves messages between nodes.

The core rule is:

```txt
Transport sends messages.
Sync decides what messages mean.

Transport is not the sync engine.

Transport is not the store.

Transport is not discovery.

It is the communication layer used when nodes need to exchange messages.

Why transport exists

Softadastra is local-first.

A node can write locally without a peer.

But when a peer is available, the node needs a way to send sync work to that peer.

Transport exists for that.

local operation
  ↓
store apply
  ↓
sync outbox
  ↓
sync batch
  ↓
transport message
  ↓
remote peer

Transport allows the engine to move operations, pings, hello messages, and other protocol messages between nodes.

What transport provides

The transport module provides:

TransportConfig
TransportContext
TransportMessage
TcpTransportBackend
TransportClient
TransportServer
TransportEngine
PeerInfo
PeerRegistry
MessageDispatcher
MessageEncoder
MessageDecoder
sync bridge
ping / pong
hello messages

It allows the engine to:

start a local transport backend
listen for messages
connect to peers
send hello messages
send ping messages
send sync batches
receive messages
decode frames
dispatch messages
track peer connection state
What transport does not do

transport must not:

own current application state
decide conflict resolution
discover peers by itself
own metadata identity
own CLI parsing
format terminal output
delete local data on connection failure
decide whether a store operation is valid

The rule is:

Store applies state.
Sync tracks propagation.
Transport moves messages.
Discovery finds peers.
Metadata describes nodes.
Include

Use the top-level include:

#include <softadastra/transport/Transport.hpp>
Module location

The module lives in:

modules/transport/

Typical structure:

modules/transport/
├── include/
│   └── softadastra/transport/
│       ├── backend/
│       ├── client/
│       ├── core/
│       ├── dispatcher/
│       ├── encoding/
│       ├── engine/
│       ├── peer/
│       ├── server/
│       ├── types/
│       └── Transport.hpp
├── src/
├── examples/
├── tests/
├── README.md
├── CMakeLists.txt
└── CHANGELOG.md

The exact structure can evolve, but the responsibility should stay stable:

connect peers and move protocol messages
Main concepts

The transport module is built around these concepts:

TransportConfig
TransportContext
TransportMessage
TransportBackend
TransportClient
TransportServer
TransportEngine
PeerInfo
PeerRegistry
MessageDispatcher
MessageEncoder
MessageDecoder

The normal flow is:

TransportConfig
  ↓
TransportBackend
  ↓
TransportEngine
  ↓
connect peer
  ↓
send message
  ↓
receive message
  ↓
dispatch message
TransportConfig

TransportConfig configures the local transport layer.

It can define:

bind host
bind port
node id, when needed
timeout values, when supported
backend type, when supported

Example:

auto config =
    transport::core::TransportConfig::local(7000);

For local examples, the usual host is:

127.0.0.1

and the port changes per node.

Local transport config

A local transport config usually means:

bind host = 127.0.0.1
bind port = selected local port

Example:

auto config =
    transport::core::TransportConfig::local(7000);

This is useful for local development and two-node tests.

TransportContext

TransportContext wires transport to sync.

Example:

transport::core::TransportContext transport_context{
    transport_config,
    sync_engine};

Transport can use the sync engine when dispatching sync messages.

The important boundary is:

Transport can deliver sync operations.
Sync still owns operation meaning.
TransportMessage

TransportMessage is the message unit sent between peers.

A message can represent:

hello
ping
pong
sync batch
ACK, if supported
error, if supported

A message can contain:

type
from node id
to node id
correlation id
payload

The exact fields depend on the current implementation.

Message types

Common transport message types include:

Hello
Ping
Pong
SyncBatch
Ack
Error
Unknown

The exact enum values depend on the implementation.

Use helpers when printing:

transport::types::to_string(message.type)
PeerInfo

PeerInfo describes a remote peer.

Example:

transport::core::PeerInfo peer{
    "node-server",
    "127.0.0.1",
    7000};

A peer contains:

node id
host
port

The node id identifies the peer.

The host and port tell transport where to connect.

Peer rules

A peer should have:

non-empty node id
valid host
valid port

Good examples:

node-a 127.0.0.1:7000
node-b 127.0.0.1:7001
drive-server 127.0.0.1:7200

Avoid empty node ids and invalid ports.

TcpTransportBackend

TcpTransportBackend is the TCP backend used by the transport layer.

It owns lower-level TCP behavior:

bind
listen
connect
send
receive
stop

The transport API should stay stable even if more backend types are added later.

TransportServer

TransportServer listens for inbound messages.

It uses a backend and exposes server behavior.

Basic server flow:

create backend
  ↓
create server
  ↓
start server
  ↓
poll inbound message
  ↓
stop server
Basic server example
#include <iostream>

#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== TRANSPORT BASIC SERVER EXAMPLE ==\n";

    auto config =
        transport::core::TransportConfig::local(7000);

    transport::backend::TcpTransportBackend backend{config};
    transport::server::TransportServer server{backend};

    if (!server.start())
    {
        std::cerr << "failed to start server\n";
        return 1;
    }

    std::cout << "server running on "
              << config.bind_host
              << ":"
              << config.bind_port
              << "\n";

    std::cout << "polling once...\n";

    auto inbound = server.poll();

    if (inbound.has_value())
    {
        std::cout << "received message from: "
                  << inbound->message.from_node_id
                  << "\n";

        std::cout << "message type: "
                  << transport::types::to_string(inbound->message.type)
                  << "\n";
    }
    else
    {
        std::cout << "no inbound message available\n";
    }

    server.stop();

    return 0;
}
TransportClient

TransportClient connects to peers and sends messages.

Basic client flow:

create backend
  ↓
start backend
  ↓
create client
  ↓
connect peer
  ↓
send hello / ping / sync
  ↓
stop backend
Basic client example
#include <iostream>

#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== TRANSPORT BASIC CLIENT EXAMPLE ==\n";

    auto config =
        transport::core::TransportConfig::local(7001);

    transport::backend::TcpTransportBackend backend{config};

    if (!backend.start())
    {
        std::cerr << "failed to start local backend\n";
        return 1;
    }

    transport::client::TransportClient client{backend};

    transport::core::PeerInfo peer{
        "node-server",
        "127.0.0.1",
        7000};

    if (!client.connect(peer))
    {
        std::cerr << "failed to connect to peer\n";
        backend.stop();
        return 1;
    }

    if (!client.send_hello(peer, "node-client"))
    {
        std::cerr << "failed to send hello\n";
        backend.stop();
        return 1;
    }

    std::cout << "hello sent to "
              << peer.node_id
              << "\n";

    backend.stop();

    return 0;
}
TransportEngine

TransportEngine composes the backend, context, dispatcher, peer state, and higher-level send behavior.

It is the main runtime object for peer communication.

It can:

start transport
stop transport
connect peers
send hello
send sync batch
poll one message
poll many messages
dispatch inbound messages
track peers

The exact methods depend on the implementation.

Transport startup flow

Transport startup follows this model:

TransportConfig
  ↓
TcpTransportBackend
  ↓
TransportEngine
  ↓
start
  ↓
bind host and port
  ↓
transport running

If startup fails, the error should be visible.

Possible failures:

invalid host
invalid port
port already in use
permission denied
socket creation failed
bind failed
listen failed

Transport startup failure should not delete local store data.

Connect flow

Connecting to a peer follows this model:

PeerInfo
  ↓
validate peer
  ↓
open connection
  ↓
send hello, if required
  ↓
mark peer connected

If connection fails:

connection refused
  ↓
return failure
  ↓
local store remains valid

A peer being unavailable is normal in local-first systems.

Hello message

A hello message introduces one node to another.

Conceptual flow:

node-client
  ↓
hello message
  ↓
node-server

The hello message can include:

from node id
to node id
correlation id
payload, if needed

Hello is useful for connection setup and debugging.

Ping and pong

Ping checks whether a peer or dispatcher can respond.

Flow:

ping
  ↓
dispatcher
  ↓
pong

This is useful for:

health checks
peer liveness
transport diagnostics
test messages
Dispatcher ping example
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== TRANSPORT DISPATCHER PING EXAMPLE ==\n";

    const std::string wal_path = "dispatcher_ping_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("node-local");

    sync::core::SyncContext sync_context{store, sync_config};
    sync::engine::SyncEngine sync_engine{sync_context};

    auto transport_config =
        transport::core::TransportConfig::local(7000);

    transport::core::TransportContext transport_context{
        transport_config,
        sync_engine};

    transport::dispatcher::MessageDispatcher dispatcher{
        transport_context};

    auto ping =
        transport::core::TransportMessage::ping("node-remote");

    ping.to_node_id = "node-local";
    ping.correlation_id = "ping-1";

    auto result = dispatcher.dispatch(ping);

    if (result.is_err())
    {
        std::cerr << "dispatch failed: "
                  << result.error().message()
                  << "\n";

        std::filesystem::remove(wal_path);
        return 1;
    }

    if (result.value().reply.has_value())
    {
        std::cout << "reply type: "
                  << transport::types::to_string(result.value().reply->type)
                  << "\n";
    }

    std::filesystem::remove(wal_path);

    return 0;
}
Message encoding

Transport messages must be encoded before they are sent over the wire.

Encoding flow:

TransportMessage
  ↓
MessageEncoder
  ↓
frame bytes
  ↓
backend send

Decoding flow:

frame bytes
  ↓
MessageDecoder
  ↓
TransportMessage
  ↓
dispatcher

Invalid frames should fail clearly.

Message codec example
#include <iostream>

#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== TRANSPORT MESSAGE CODEC EXAMPLE ==\n";

    auto message =
        transport::core::TransportMessage::ping("node-a");

    message.to_node_id = "node-b";
    message.correlation_id = "ping-1";

    auto frame =
        transport::encoding::MessageEncoder::encode_frame(message);

    if (frame.empty())
    {
        std::cerr << "failed to encode message\n";
        return 1;
    }

    auto decoded =
        transport::encoding::MessageDecoder::decode_framed_message(frame);

    if (!decoded.has_value())
    {
        std::cerr << "failed to decode framed message\n";
        return 1;
    }

    std::cout << "decoded type: "
              << transport::types::to_string(decoded->type)
              << "\n";

    std::cout << "from: "
              << decoded->from_node_id
              << "\n";

    std::cout << "to: "
              << decoded->to_node_id
              << "\n";

    std::cout << "correlation: "
              << decoded->correlation_id
              << "\n";

    return 0;
}
Frame

A frame is the encoded transport representation of a message.

Frames are useful because transport needs boundaries.

A frame can contain:

message length
message type
headers or ids
payload bytes
checksum, if supported later

The exact format depends on the implementation.

The important rule is:

invalid frames must not become valid messages
MessageDispatcher

MessageDispatcher routes decoded messages to the correct behavior.

It can handle:

ping
hello
sync batch
ACK, if supported
unknown message

Conceptual flow:

TransportMessage
  ↓
MessageDispatcher::dispatch
  ↓
message type switch
  ↓
handler result

For sync messages:

sync batch message
  ↓
decode sync operation
  ↓
SyncEngine receives remote operation
Sync bridge

The sync bridge converts sync operations into transport payloads.

Flow:

SyncOperation
  ↓
encode sync operation
  ↓
TransportMessage::sync_batch
  ↓
transport frame

This is the boundary between sync and transport.

Sync owns operation meaning.

Transport owns message delivery.

Sync bridge example
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== TRANSPORT SYNC BRIDGE EXAMPLE ==\n";

    const std::string wal_path = "sync_bridge_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("node-a");

    sync::core::SyncContext sync_context{store, sync_config};
    sync::engine::SyncEngine sync_engine{sync_context};

    auto operation = store::core::Operation::put(
        store::types::Key{"doc:1"},
        store::types::Value::from_string("hello from node-a"));

    auto submitted =
        sync_engine.submit_local_operation(operation);

    if (submitted.is_err())
    {
        std::cerr << "failed to submit local operation\n";
        std::filesystem::remove(wal_path);
        return 1;
    }

    auto batch =
        sync_engine.next_batch();

    if (batch.empty())
    {
        std::cerr << "no sync envelope ready\n";
        std::filesystem::remove(wal_path);
        return 1;
    }

    auto payload =
        transport::dispatcher::MessageDispatcher::encode_sync_operation(
            batch.front().operation);

    auto message =
        transport::core::TransportMessage::sync_batch(
            "node-a",
            payload);

    message.to_node_id = "node-b";
    message.correlation_id = batch.front().operation.sync_id;

    auto frame =
        transport::encoding::MessageEncoder::encode_frame(message);

    std::cout << "sync id: "
              << batch.front().operation.sync_id
              << "\n";

    std::cout << "encoded transport frame size: "
              << frame.size()
              << "\n";

    std::filesystem::remove(wal_path);

    return 0;
}
PeerRegistry

PeerRegistry tracks peer connection state.

It can track:

known peers
connected peers
faulted peers
last seen peers
peer addresses

A registry helps transport answer:

which peers do we know?
which peers are connected?
which peers failed?
Peer registry example
#include <iostream>

#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== TRANSPORT PEER REGISTRY EXAMPLE ==\n";

    transport::peer::PeerRegistry registry;

    transport::core::PeerInfo peer{
        "node-b",
        "127.0.0.1",
        7000};

    registry.upsert_peer(peer);

    registry.mark_connected("node-b");

    std::cout << "registry size: "
              << registry.size()
              << "\n";

    std::cout << "connected peers: "
              << registry.connected_peers().size()
              << "\n";

    registry.mark_faulted("node-b");

    std::cout << "faulted peers: "
              << registry.faulted_peers().size()
              << "\n";

    return 0;
}
Peer states

Common peer states can include:

known
connected
faulted
disconnected
stale

The exact states depend on the implementation.

The important rule is:

peer connection state should be visible

Do not hide peer failure.

Send sync batch

Transport can send a batch produced by sync.

Flow:

SyncEngine::next_batch
  ↓
TransportEngine::send_sync_batch
  ↓
encode operations
  ↓
send to peer

The transport should return how many messages or envelopes were sent.

If sending fails, sync should be able to retry later.

Full sync client example
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== FULL SYNC DEMO CLIENT ==\n";

    const std::string wal_path = "full_sync_client_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("node-client");

    sync::core::SyncContext sync_context{store, sync_config};
    sync::engine::SyncEngine sync_engine{sync_context};

    auto transport_config =
        transport::core::TransportConfig::local(7101);

    transport::core::TransportContext transport_context{
        transport_config,
        sync_engine};

    transport::backend::TcpTransportBackend backend{transport_config};

    transport::engine::TransportEngine engine{
        transport_context,
        backend};

    if (!engine.start())
    {
        std::cerr << "failed to start transport client\n";
        std::filesystem::remove(wal_path);
        return 1;
    }

    transport::core::PeerInfo server{
        "node-server",
        "127.0.0.1",
        7100};

    if (!engine.connect_peer(server))
    {
        std::cerr << "failed to connect to server\n";
        engine.stop();
        std::filesystem::remove(wal_path);
        return 1;
    }

    engine.send_hello(server);

    auto operation = store::core::Operation::put(
        store::types::Key{"message:1"},
        store::types::Value::from_string("hello server"));

    auto submitted =
        sync_engine.submit_local_operation(operation);

    if (submitted.is_err())
    {
        std::cerr << "failed to submit operation\n";
        engine.stop();
        std::filesystem::remove(wal_path);
        return 1;
    }

    auto batch =
        sync_engine.next_batch();

    const auto sent =
        engine.send_sync_batch(server, batch);

    std::cout << "sync envelopes sent: "
              << sent
              << "\n";

    engine.stop();

    std::filesystem::remove(wal_path);

    return 0;
}
Full sync server example
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== FULL SYNC DEMO SERVER ==\n";

    const std::string wal_path = "full_sync_server_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("node-server");

    sync::core::SyncContext sync_context{store, sync_config};
    sync::engine::SyncEngine sync_engine{sync_context};

    auto transport_config =
        transport::core::TransportConfig::local(7100);

    transport::core::TransportContext transport_context{
        transport_config,
        sync_engine};

    transport::backend::TcpTransportBackend backend{transport_config};

    transport::engine::TransportEngine engine{
        transport_context,
        backend};

    if (!engine.start())
    {
        std::cerr << "failed to start transport server\n";
        std::filesystem::remove(wal_path);
        return 1;
    }

    std::cout << "server started on 127.0.0.1:7100\n";
    std::cout << "polling one message...\n";

    const bool handled = engine.poll_once();

    std::cout << "handled: "
              << handled
              << "\n";

    engine.stop();

    std::filesystem::remove(wal_path);

    return 0;
}
Drive end-to-end client example
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DRIVE END TO END DEMO CLIENT ==\n";

    const std::string wal_path = "drive_client_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("drive-client");

    sync::core::SyncContext sync_context{store, sync_config};
    sync::engine::SyncEngine sync_engine{sync_context};

    auto transport_config =
        transport::core::TransportConfig::local(7201);

    transport::core::TransportContext transport_context{
        transport_config,
        sync_engine};

    transport::backend::TcpTransportBackend backend{transport_config};

    transport::engine::TransportEngine engine{
        transport_context,
        backend};

    if (!engine.start())
    {
        std::cerr << "failed to start drive client\n";
        std::filesystem::remove(wal_path);
        return 1;
    }

    transport::core::PeerInfo server{
        "drive-server",
        "127.0.0.1",
        7200};

    if (!engine.connect_peer(server))
    {
        std::cerr << "failed to connect to drive server\n";
        engine.stop();
        std::filesystem::remove(wal_path);
        return 1;
    }

    auto file_operation = store::core::Operation::put(
        store::types::Key{"files/docs/readme.txt"},
        store::types::Value::from_string("offline-first file content"));

    auto submitted =
        sync_engine.submit_local_operation(file_operation);

    if (submitted.is_err())
    {
        std::cerr << "failed to submit drive operation\n";
        engine.stop();
        std::filesystem::remove(wal_path);
        return 1;
    }

    auto batch =
        sync_engine.next_batch();

    const auto sent =
        engine.send_sync_batch(server, batch);

    std::cout << "drive sync messages sent: "
              << sent
              << "\n";

    engine.stop();

    std::filesystem::remove(wal_path);

    return 0;
}
Drive end-to-end server example
#include <filesystem>
#include <iostream>

#include <softadastra/store/Store.hpp>
#include <softadastra/sync/Sync.hpp>
#include <softadastra/transport/Transport.hpp>

using namespace softadastra;

int main()
{
    std::cout << "== DRIVE END TO END DEMO SERVER ==\n";

    const std::string wal_path = "drive_server_store.wal";
    std::filesystem::remove(wal_path);

    store::engine::StoreEngine store{
        store::core::StoreConfig::durable(wal_path)};

    auto sync_config =
        sync::core::SyncConfig::durable("drive-server");

    sync::core::SyncContext sync_context{store, sync_config};
    sync::engine::SyncEngine sync_engine{sync_context};

    auto transport_config =
        transport::core::TransportConfig::local(7200);

    transport::core::TransportContext transport_context{
        transport_config,
        sync_engine};

    transport::backend::TcpTransportBackend backend{transport_config};

    transport::engine::TransportEngine engine{
        transport_context,
        backend};

    if (!engine.start())
    {
        std::cerr << "failed to start drive server\n";
        std::filesystem::remove(wal_path);
        return 1;
    }

    std::cout << "drive server ready on 127.0.0.1:7200\n";

    const auto processed =
        engine.poll_many(8);

    std::cout << "processed messages: "
              << processed
              << "\n";

    std::cout << "store entries: "
              << store.entries().size()
              << "\n";

    engine.stop();

    std::filesystem::remove(wal_path);

    return 0;
}
Transport and sync

Transport depends on sync for sync message dispatch.

Relationship:

SyncEngine
  ↓
produces batch
  ↓
TransportEngine
  ↓
sends batch

Remote side:

TransportEngine
  ↓
receives message
  ↓
MessageDispatcher
  ↓
SyncEngine
  ↓
receive_remote_operation

The boundary must stay clear.

Sync owns propagation state.

Transport owns message movement.

Transport and store

Transport should not apply store operations directly.

Wrong:

Transport receives frame
  ↓
StoreEngine.put directly

Better:

Transport receives frame
  ↓
MessageDispatcher
  ↓
SyncEngine receives remote operation
  ↓
SyncEngine applies store operation if valid

This keeps conflict policy inside sync.

Transport and WAL

Transport should not own WAL writes.

WAL belongs to durability.

Transport belongs to communication.

Good flow:

local operation
  ↓
WAL append
  ↓
store apply
  ↓
sync track
  ↓
transport send

If transport fails, WAL history remains valid.

Transport and discovery

Discovery finds peers.

Transport connects to them.

Relationship:

DiscoveryRegistry
  ↓
available peers
  ↓
TransportEngine::connect_peer

Discovery does not send sync messages.

Transport does not find peers by itself.

Transport and metadata

Metadata describes nodes.

Transport moves messages between nodes.

A transport message may include node ids.

Metadata can provide richer descriptions later.

Keep the responsibilities separate:

metadata -> who the node is
transport -> how messages move
Transport and CLI

CLI can expose transport status and peer commands.

Correct direction:

CLI command
  ↓
TransportEngine

Wrong direction:

TransportEngine
  ↓
CLI output

Transport should return structured state.

CLI should format it.

Transport and SDK

The SDK wraps transport behind simpler methods.

C++ SDK:

client.start_transport()
client.connect(peer)
client.transport_running()

JavaScript SDK:

client.startTransport()
client.connect(peer)
client.transportRunning()

The engine transport module remains lower-level.

Local-first behavior

Transport must not be required for local writes.

Correct:

transport unavailable
  ↓
store put still works
  ↓
sync work remains pending

Wrong:

transport unavailable
  ↓
local writes rejected

unless the application explicitly chooses a transport-required policy.

Softadastra’s engine default should favor local correctness.

Offline behavior

When offline:

transport connect fails
  ↓
sync work remains queued or failed
  ↓
retry later
  ↓
local state remains readable

Transport failure is a delivery problem, not a local data problem.

Transport failure behavior

Transport can fail for normal reasons:

peer unavailable
connection refused
timeout
port already in use
invalid host
socket failure
message decode failed
remote closed connection

Each failure should be visible.

Do not silently drop important messages.

Connection refused

Connection refused usually means:

no process is listening on target host and port

This should be a clean failure.

It should not corrupt local state.

Port already in use

If the local backend cannot bind:

address already in use

Use another port or stop the existing process.

On Linux:

ss -ltnp | grep 7000
Invalid frame

If a frame cannot be decoded:

decode frame
  ↓
failure
  ↓
return explicit error
  ↓
do not dispatch fake message

Invalid data should not become a valid transport message.

Unknown message type

Unknown message types should be handled explicitly.

Possible behavior:

return unsupported message error
ignore safely with diagnostics
reply with error message

Do not crash the runtime.

Peer unavailable

A peer may be unavailable because:

peer process is stopped
wrong host
wrong port
firewall blocks connection
network unavailable
transport not started

This is normal in local-first systems.

The sync layer can retry later.

Transport API reference

Main areas:

Area	Purpose
core	Config, context, messages, peers
backend	TCP backend
client	Outbound peer client
server	Inbound message server
engine	Composed transport runtime
dispatcher	Message dispatch
encoding	Message encoding and decoding
peer	Peer registry
types	Message types and peer state
Main types
Type	Purpose
TransportConfig	Configures transport
TransportContext	Wires transport to sync
TransportMessage	Protocol message
PeerInfo	Remote peer address
TcpTransportBackend	TCP backend
TransportClient	Outbound client
TransportServer	Inbound server
TransportEngine	Main transport runtime
MessageDispatcher	Dispatches messages
MessageEncoder	Encodes messages
MessageDecoder	Decodes messages
PeerRegistry	Tracks peers
Common methods
Method	Purpose
start()	Start transport backend or engine
stop()	Stop transport
connect_peer(peer)	Connect to a peer
send_hello(peer)	Send hello message
send_sync_batch(peer, batch)	Send sync operations
poll_once()	Process one inbound message
poll_many(count)	Process multiple inbound messages

Only document a method as stable when it exists in the current public API.

Examples

Current useful examples include:

basic_server.cpp
basic_client.cpp
message_codec.cpp
peer_registry.cpp
dispatcher_ping.cpp
sync_bridge.cpp
full_sync_demo_server.cpp
full_sync_demo_client.cpp
drive_end_to_end_demo_server.cpp
drive_end_to_end_demo_client.cpp

Recommended order:

1. message_codec.cpp
2. peer_registry.cpp
3. basic_server.cpp
4. basic_client.cpp
5. dispatcher_ping.cpp
6. sync_bridge.cpp
7. full_sync_demo_server.cpp
8. full_sync_demo_client.cpp
9. drive_end_to_end_demo_server.cpp
10. drive_end_to_end_demo_client.cpp

This order moves from message structure to peer communication and end-to-end demos.

Run examples

From the engine repository:

cd ~/softadastra/softadastra

Build:

vix build

Or with CMake:

cmake --preset dev-ninja
cmake --build --preset build-ninja

Find binaries:

find build-ninja -type f -executable

Run the relevant transport example binary from the build output.

For server and client examples, start the server first in one terminal, then run the client in another terminal.

Two-terminal example

Terminal 1:

./path/to/full_sync_demo_server

Terminal 2:

./path/to/full_sync_demo_client

Use the actual binary paths from your build output.

Testing transport

Transport tests should verify:

message encoding
message decoding
invalid frame behavior
peer registry insert
peer registry connected state
peer registry faulted state
dispatcher ping
sync operation payload encoding
server start failure
client connection failure
connect to unavailable peer
send sync batch behavior
poll once behavior
poll many behavior
Good transport test flow

Codec test:

create message
encode frame
decode frame
expect same type and ids

Peer registry test:

insert peer
mark connected
expect connected count = 1
mark faulted
expect faulted count = 1

Dispatcher ping test:

create ping message
dispatch
expect pong reply

Connection failure test:

create client
connect to unused port
expect failure
local runtime remains valid

Sync bridge test:

create store operation
submit sync operation
create batch
encode sync message
decode message
expect valid payload
Design rules

The transport module should follow these rules:

1. Move messages between peers.
2. Do not own current application state.
3. Do not decide sync conflicts.
4. Do not discover peers by itself.
5. Return explicit failures.
6. Keep message encoding strict.
7. Keep peer state observable.
8. Do not delete local work on connection failure.
9. Keep sync and transport boundaries clear.
10. Keep examples small and focused.
Common mistakes
Making transport own sync logic

Wrong:

TransportEngine decides retry policy

Better:

SyncEngine decides retry policy
TransportEngine reports delivery result
Making transport apply store values directly

Wrong:

Transport message -> StoreEngine.put

Better:

Transport message -> SyncEngine.receive_remote_operation -> StoreEngine
Treating connection failure as local data loss

Wrong:

connect failed
  ↓
delete local operation

Better:

connect failed
  ↓
mark delivery failed or pending
  ↓
retry later
Making discovery part of transport

Wrong:

TransportEngine scans LAN by itself

Better:

DiscoveryEngine finds peers
TransportEngine connects peers
Ignoring decode failures

Wrong:

invalid frame
  ↓
dispatch default message

Better:

invalid frame
  ↓
return decode error
Hiding peer state

A developer should be able to inspect connected and faulted peers.

Recommended usage pattern

Create store and sync:

store::engine::StoreEngine store{
    store::core::StoreConfig::durable("data/node-a.wal")};

auto sync_config =
    sync::core::SyncConfig::durable("node-a");

sync::core::SyncContext sync_context{store, sync_config};
sync::engine::SyncEngine sync_engine{sync_context};

Create transport:

auto transport_config =
    transport::core::TransportConfig::local(7001);

transport::core::TransportContext transport_context{
    transport_config,
    sync_engine};

transport::backend::TcpTransportBackend backend{
    transport_config};

transport::engine::TransportEngine engine{
    transport_context,
    backend};

Start transport:

if (!engine.start())
{
    return 1;
}

Connect peer:

transport::core::PeerInfo peer{
    "node-b",
    "127.0.0.1",
    7000};

if (!engine.connect_peer(peer))
{
    engine.stop();
    return 1;
}

Send sync batch:

auto batch = sync_engine.next_batch();

const auto sent =
    engine.send_sync_batch(peer, batch);

Stop transport:

engine.stop();
Summary

transport is the peer communication module of Softadastra Engine.

It provides:

TransportConfig
TransportContext
TransportMessage
TcpTransportBackend
TransportClient
TransportServer
TransportEngine
PeerInfo
PeerRegistry
MessageDispatcher
MessageEncoder
MessageDecoder

The key idea is:

Transport moves messages between nodes without owning application state.

It does not decide conflicts, discover peers by itself, or make local writes depend on the network.

Next step

Continue with discovery:

Go to Discovery
