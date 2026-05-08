# Reference

The reference section gives compact technical information for Softadastra.

Use this section when you already understand the concepts and want to quickly check command shapes, API names, configuration fields, or error behavior.

The core rule is:

```txt
Reference pages are for quick lookup.
Guides are for learning workflows.
What the reference is for

The reference section answers practical lookup questions:

What is the CLI command shape?
What methods exist in the C++ SDK?
What methods exist in the JavaScript SDK?
Which configuration fields matter?
How should errors be handled?
Which output or result shape should I expect?

It is intentionally more compact than the concepts, SDK, engine, and guides sections.

Reference pages

The reference section contains:

CLI reference
C++ API reference
JavaScript API reference
Configuration reference
Error reference
Recommended order

Read the reference pages in this order:

CLI Reference
C++ API Reference
JavaScript API Reference
Configuration Reference
Errors Reference
CLI Reference

Use the CLI reference when you need the exact command shape.

It covers commands like:

softadastra help
softadastra version
softadastra status

softadastra node info
softadastra node start

softadastra store put app/name Softadastra
softadastra store get app/name
softadastra store remove app/name

softadastra sync status
softadastra sync tick
softadastra sync tick --prune

softadastra peers

The CLI reference is useful for terminal usage, scripts, local debugging, demos, and operational checks.

Read: CLI Reference

C++ API Reference

Use the C++ API reference when you need the public C++ SDK surface.

It covers types and methods such as:

Client
ClientOptions
Value
Peer
NodeInfo
Result
Error
SyncResult
TickResult

Common C++ SDK calls:

client.open();
client.close();

client.put("key", "value");
client.get("key");
client.remove("key");

client.contains("key");
client.size();
client.empty();

client.sync_state();
client.tick();

client.start_transport();
client.connect(peer);

client.start_discovery();
client.peers();

client.refresh_node_info();

The C++ API reference is for quick lookup. For step-by-step usage, read the SDK C++ section first.

Read: C++ API Reference

JavaScript API Reference

Use the JavaScript API reference when you need the public JavaScript SDK surface.

It covers types and methods such as:

Client
ClientOptions
Value
Peer
NodeInfo
Result
SoftadastraError
SyncResult
TickResult

Common JavaScript SDK calls:

await client.open();
await client.close();

await client.put("key", "value");
await client.get("key");
await client.remove("key");

client.contains("key");
client.size();
client.empty();

await client.syncStateInfo();
await client.tick();

await client.startTransport();
await client.connect(peer);

await client.startDiscovery();
await client.peers();

await client.refreshNodeInfo();

The JavaScript API reference uses camelCase names because that is the public JavaScript style.

Read: JavaScript API Reference

Configuration Reference

Use the configuration reference when you need to check runtime options.

It covers common fields such as:

node id
display name
version

WAL enabled
WAL path
auto flush

transport enabled
transport host
transport port

discovery enabled
discovery host
discovery port
discovery broadcast host
discovery broadcast port

sync retry behavior
ACK timeout

Configuration controls how the local runtime starts.

The most important production rule is:

make configuration explicit

Read: Configuration Reference

Errors Reference

Use the errors reference when you need to understand result handling and failure behavior.

Softadastra APIs should make failures explicit.

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

The main rule is:

Check the result before using the value.

Read: Errors Reference

Reference versus concepts

Concepts explain why Softadastra exists.

Reference pages give quick lookup information.

Example:

concepts/wal.md       -> explains why WAL matters
reference/config.md   -> lists WAL-related configuration fields
reference/errors.md   -> explains what happens when WAL fails

Use concepts when you need understanding.

Use reference when you need exact names.

Reference versus guides

Guides show complete workflows.

Reference pages show compact details.

Example:

guides/persist-data-locally.md -> step-by-step persistence workflow
reference/config.md            -> WAL path and auto flush fields
reference/errors.md            -> persistence error behavior

Use guides when building something.

Use reference when checking details.

Reference versus SDK pages

SDK pages explain each API area with examples.

Reference pages summarize the public API surface.

Example:

sdk-cpp/client.md       -> explains Client in detail
reference/cpp-api.md    -> compact Client method list

sdk-js/client.md        -> explains Client in detail
reference/js-api.md     -> compact Client method list

Use SDK pages to learn.

Use reference pages to verify.

Reference versus engine pages

Engine pages explain internal modules.

Reference pages focus on stable user-facing surfaces.

Example:

engine/sync.md          -> explains SyncEngine internals
reference/cpp-api.md    -> lists client.sync_state() and client.tick()
reference/js-api.md     -> lists client.syncStateInfo() and client.tick()
reference/cli.md        -> lists softadastra sync status and sync tick

The reference should not expose unstable internal details as stable user-facing behavior.

Stability rule

Only document behavior as stable when it is implemented and intended to remain stable.

For example:

stable command       -> include in reference
experimental command -> mention carefully or keep out
unstable JSON shape  -> do not present as final API
internal class       -> keep in engine docs, not public reference

The reference should be accurate and conservative.

Naming differences

Softadastra uses different naming styles depending on the interface.

C++ SDK:

snake_case fields and methods

Examples:

options.enable_wal = true;
options.wal_path = "data/node-a.wal";
client.sync_state();
client.start_transport();
client.refresh_node_info();

JavaScript SDK:

camelCase fields and methods

Examples:

options.enableWal = true;
options.walPath = "data/node-a.wal";
await client.syncStateInfo();
await client.startTransport();
await client.refreshNodeInfo();

CLI:

space-separated commands

Examples:

softadastra sync status
softadastra sync tick
softadastra node info

The model is the same. Only the interface style changes.

Core model reminder

All reference pages still follow the same Softadastra model:

write locally
persist locally
track operation
sync when possible
retry when needed
converge later

When checking any API or command, keep the separation clear:

store      -> current local state
WAL        -> durable operation history
sync       -> propagation tracking
transport  -> peer delivery
discovery  -> peer finding
metadata   -> node identity
CLI        -> terminal interface
SDK        -> application API
What to read next

Start with the CLI reference:

CLI Reference
