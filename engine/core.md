# Core

`core` is the foundation module of Softadastra Engine.

It provides the shared primitives used by every other module:

```txt
Result
Error
ErrorCode
Severity
StrongType
IDs
Timestamp
Duration
Clock
Hash
Config
ScopeGuard
StringUtils
Assert
```

The core rule is:

```txt
Core defines primitives.
Core does not define product behavior.
```

Everything else is built on top of core.

## Why core exists

Softadastra needs a stable foundation.

The engine has many modules:

```txt
fs
wal
store
sync
transport
discovery
metadata
cli
```

These modules need common building blocks.

Without core, every module would define its own error type, result type, identifiers, time model, and utilities.

That would make the engine hard to maintain.

`core` solves this by providing one shared foundation.

## What core provides

The core module provides:

- explicit error handling
- typed results
- strong identifiers
- time utilities
- hash primitives
- configuration primitives
- low-level utilities

It is designed to be: minimal, deterministic, stable, dependency-free, reusable.

## What core does not do

core must not contain:

- filesystem scanning
- WAL writing
- store operations
- sync logic
- transport logic
- discovery logic
- metadata service logic
- CLI command logic
- application behavior
- business rules

The rule is simple:

> If it belongs to a specific runtime module, it should not be in core.

## Include

Use the top-level include:

```cpp
#include <softadastra/core/Core.hpp>
```

This exposes the public core API.

## Module location

The module lives in:

```txt
modules/core/
```

Typical structure:

```txt
modules/core/
├── include/
│   └── softadastra/core/
│       ├── config/
│       ├── errors/
│       ├── hash/
│       ├── ids/
│       ├── time/
│       ├── types/
│       ├── utils/
│       └── Core.hpp
├── src/
├── README.md
├── CMakeLists.txt
└── CHANGELOG.md
```

## Core responsibilities

core owns the primitives that are shared across the engine.

Main areas:

```txt
types
errors
ids
time
hash
config
utils
```

Each area is small and focused.

## Types

The types area contains generic reusable types.

Important types:

```txt
Result<T, E>
StrongType<T, Tag>
NonCopyable
```

These are not specific to store, sync, transport, or discovery. They are generic primitives used by many modules.

## Result

`Result<T, E>` represents either success or failure.

Conceptually:

```txt
Result<T, E>
  -> ok(T)
  -> err(E)
```

Softadastra uses Result to make failures explicit.

Instead of hiding errors, functions can return a success value or a structured error.

### Result example

```cpp
#include <iostream>

#include <softadastra/core/Core.hpp>

using namespace softadastra::core;

using IntResult = types::Result<int, errors::Error>;

IntResult divide(int a, int b)
{
    if (b == 0)
    {
        return IntResult::err(
            errors::Error::make(
                errors::ErrorCode::InvalidArgument,
                "division by zero"));
    }

    return IntResult::ok(a / b);
}

int main()
{
    auto result = divide(10, 0);

    if (result.is_err())
    {
        std::cout << "Error: "
                  << result.error().message()
                  << "\n";

        return 1;
    }

    std::cout << "Result: "
              << result.value()
              << "\n";

    return 0;
}
```

### Why Result matters

Result makes failure part of the API.

Good:

```cpp
auto result = operation();

if (result.is_err())
{
    return result.error();
}

auto value = result.value();
```

Bad:

```cpp
auto value = operation().value();
```

The bad version assumes success. Softadastra should make failure visible.

### Result rules

Use Result when:

- the operation can fail normally
- the caller should handle the failure
- the error should be explicit
- the failure is part of runtime behavior

Examples: invalid argument, missing key, WAL append failed, file scan failed, sync conflict, transport connect failed, discovery start failed.

Do not use Result for impossible internal invariants. For invariants, use assertions or internal checks.

## Errors

The errors area contains structured error types.

Important types:

```txt
Error
ErrorCode
Severity
ErrorContext
```

Errors should explain: what failed, why it failed, where it failed, what context matters.

### ErrorCode

ErrorCode identifies the category of failure.

Example categories can include:

```txt
InvalidArgument
NotFound
AlreadyExists
Unavailable
PermissionDenied
IoError
Internal
Unknown
```

The exact list depends on the current implementation.

The important idea is:

```txt
code for machines
message for humans
```

### Error example

```cpp
#include <iostream>

#include <softadastra/core/Core.hpp>

using namespace softadastra::core;

int main()
{
    auto error =
        errors::Error::make(
            errors::ErrorCode::InvalidArgument,
            "invalid node id");

    std::cout << error.message() << "\n";

    return 0;
}
```

### Error message rule

A good error message is specific.

Good:

```txt
invalid node id: value is empty
```

Less useful:

```txt
invalid input
```

Good:

```txt
failed to append WAL record: permission denied
```

Less useful:

```txt
write failed
```

## StrongType

`StrongType<T, Tag>` prevents primitive misuse.

Example:

```cpp
#include <string>

#include <softadastra/core/Core.hpp>

using namespace softadastra::core;

struct UserIdTag {};
struct FileIdTag {};

using UserId = types::StrongType<std::string, UserIdTag>;
using FileId = types::StrongType<std::string, FileIdTag>;
```

This avoids mixing values that have the same underlying type but different meaning.

Without strong types:

```cpp
void load_file(std::string id);
```

The caller can accidentally pass a user id.

With strong types:

```cpp
void load_file(FileId id);
```

The compiler helps protect the API.

### StrongType rule

Use strong types when raw primitives could be confused.

Good use cases: FileId, DeviceId, OperationId, NodeId, Key, SequenceNumber.

Avoid using raw strings for important identity values when a strong type improves safety.

## NonCopyable

NonCopyable is a small utility base for types that should not be copied.

Use it for resources such as: file handles, network backends, runtime services, watchers, engines with ownership.

Example concept:

```cpp
class RuntimeService : private types::NonCopyable
{
public:
    RuntimeService() = default;
    ~RuntimeService() = default;
};
```

This prevents accidental copies.

## IDs

The ids area contains strongly typed identifiers.

Examples:

```txt
FileId
DeviceId
OperationId
```

IDs help identify runtime objects safely.

### FileId example

```cpp
#include <iostream>

#include <softadastra/core/Core.hpp>

using namespace softadastra::core::ids;

int main()
{
    auto id = FileId::generate();

    if (id.is_valid())
    {
        std::cout << "FileId: "
                  << id.str()
                  << "\n";
    }

    return 0;
}
```

### ID rules

IDs should be: non-empty, stable when required, comparable, serializable when needed, strongly typed.

Avoid passing important identifiers as raw strings across modules.

## Time

The time area provides deterministic time utilities.

Important types:

```txt
Timestamp
Duration
Clock
```

These types make time usage explicit.

### Timestamp

Timestamp represents persistent wall-clock time.

Use it for: record creation time, WAL record timestamp, metadata refresh time, last seen peer time, operation timestamp.

Example:

```cpp
#include <iostream>

#include <softadastra/core/Core.hpp>

using namespace softadastra::core::time;

int main()
{
    auto now = Timestamp::now();

    if (now.is_valid())
    {
        std::cout << "Now ms: "
                  << now.millis()
                  << "\n";
    }

    return 0;
}
```

### Duration

Duration represents a time interval.

Use it for: ACK timeout, retry interval, discovery interval, peer TTL, watcher interval.

Example:

```cpp
#include <iostream>

#include <softadastra/core/Core.hpp>

using namespace softadastra::core::time;

int main()
{
    auto duration = Duration::from_seconds(2);

    std::cout << "Duration ms: "
              << duration.millis()
              << "\n";

    return 0;
}
```

### Clock

Clock provides time sources.

Use wall time for persistent timestamps. Use monotonic time for measuring elapsed time.

Conceptually:

```txt
wall clock
  -> record timestamps

monotonic clock
  -> elapsed durations
```

This prevents bugs caused by system clock changes.

### Time rules

Use:

- Timestamp for persisted time
- Duration for intervals
- Clock::monotonic_now for elapsed runtime measurement

Avoid using raw integers for important time values when a core type exists.

## Hash

The hash area provides hash primitives.

Important types:

```txt
Hash
Hasher
HashAlgorithm
```

Use hashes for: content identity, operation payload checks, file identity, deduplication, integrity checks.

### Hash example

```cpp
#include <softadastra/core/Core.hpp>

using namespace softadastra::core::hash;

int main()
{
    Hash hash{
        HashAlgorithm::SHA256,
        {0x12, 0x34}
    };

    return hash.is_valid() ? 0 : 1;
}
```

### Hasher interface

Hasher is an abstraction for hash implementations.

Conceptually:

```cpp
class SHA256Hasher : public Hasher
{
public:
    Hash hash(const Buffer &data) const override;
};
```

The interface lets higher-level modules depend on a stable abstraction.

### Hash rules

Hash primitives should remain generic.

core can define hash abstractions. Specific business meaning should live outside core.

For example:

```txt
core/hash
  -> Hash, Hasher, HashAlgorithm

store or fs
  -> how hashes are used for entries or files
```

## Config

The config area provides configuration primitives.

Important types:

```txt
Config
ConfigValue
ConfigValidator
```

Use config primitives when runtime settings need validation.

### Config example

```cpp
#include <iostream>

#include <softadastra/core/Core.hpp>

using namespace softadastra::core;

int main()
{
    config::Config cfg;

    cfg.set("port", config::ConfigValue(8080));
    cfg.set("debug", config::ConfigValue(true));

    auto port =
        config::ConfigValidator::require<std::int64_t>(
            cfg.get("port"),
            "port");

    if (port.is_err())
    {
        std::cout << port.error().message() << "\n";
        return 1;
    }

    std::cout << "port: "
              << port.value()
              << "\n";

    return 0;
}
```

### Config rules

Config should be: explicit, validated, typed, clear on error.

Avoid hidden runtime defaults that are hard to inspect.

Good:

```txt
transport port is missing
```

Bad:

```txt
transport failed
```

The first error tells the developer what to fix.

## Utils

The utils area contains low-level utilities.

Examples:

```txt
ScopeGuard
StringUtils
Assert
```

Utilities should remain generic. They should not contain module-specific behavior.

### ScopeGuard

ScopeGuard runs cleanup when a scope exits.

Example:

```cpp
#include <softadastra/core/Core.hpp>

using namespace softadastra::core;

void example()
{
    bool rolled_back = false;

    auto guard = utils::make_scope_guard([&] {
        rolled_back = true;
    });

    // success path
    guard.dismiss();
}
```

Use it for cleanup paths such as: rollback, temporary file cleanup, resource release, state restoration.

### Assert

Assertions are for internal invariants.

Example:

```cpp
SA_ASSERT(x > 0);
SA_ASSERT_MSG(ptr != nullptr, "pointer must not be null");
```

Use assertions when a condition should never be false if the program is correct.

Do not use assertions for normal runtime failures. For normal failures, return Result.

### StringUtils

StringUtils provides common string helpers.

Example:

```cpp
#include <softadastra/core/Core.hpp>

using namespace softadastra::core;

int main()
{
    auto trimmed =
        utils::StringUtils::trim("  hello  ");

    auto parts =
        utils::StringUtils::split("a,b,c", ',');

    return trimmed == "hello" && parts.size() == 3 ? 0 : 1;
}
```

String utilities should remain small and generic.

## Core dependency rule

core must not depend on any other Softadastra module.

Correct:

```txt
core
  -> C++ standard library only
```

Wrong:

```txt
core -> store
core -> sync
core -> transport
core -> cli
```

The dependency direction must stay clean.

## Who depends on core

Other modules can depend on core.

Examples:

```txt
fs       -> core
wal      -> core
store    -> core
sync     -> core
transport -> core
discovery -> core
metadata  -> core
cli       -> core
```

This is why core must remain stable. A breaking change in core affects the whole engine.

## Core and fs

`fs` uses core for: errors, results, time, types, utilities.

Example:

```txt
Path::from()
  -> Result<Path, Error>
```

## Core and WAL

`wal` uses core for: Error, Result, Timestamp, Duration, WalRecord primitives.

The WAL needs stable time and error primitives.

## Core and store

`store` uses core for: Result, Error, time, types, operation primitives.

Store operations should report errors explicitly.

## Core and sync

`sync` uses core for: Duration, Timestamp, Error, Result, node identifiers, operation identifiers.

Retry and ACK behavior depends on time primitives.

## Core and transport

`transport` uses core for: Result, Error, time, ids, message primitives.

Transport failures must be reported clearly.

## Core and discovery

`discovery` uses core for: Duration, Timestamp, Result, Error, node ids, peer TTL.

Discovery needs time to mark peers stale or expired.

## Core and metadata

`metadata` uses core for: Timestamp, Duration, Result, Error, node identity primitives.

Metadata needs stable runtime identity and timing.

## Core and CLI

`cli` uses core indirectly through engine modules and can also use shared utility patterns.

The CLI should display core errors clearly instead of hiding them.

## Core examples

Current useful examples include:

```txt
result and error
file id generation
timestamp and duration
configuration validation
scope guard
string utilities
```

Recommended example files:

```txt
core_result.cpp
core_ids.cpp
core_time.cpp
core_config.cpp
core_scope_guard.cpp
core_string_utils.cpp
```

## Build examples

From the engine repository:

```sh
cd ~/softadastra/softadastra
```

Build:

```sh
vix build
```

Or with CMake:

```sh
cmake --preset dev-ninja
cmake --build --preset build-ninja
```

Find example binaries:

```sh
find build-ninja -type f -executable
```

## Core testing

Core tests should be small and deterministic.

Recommended test areas:

```txt
Result
Error
ErrorCode
StrongType
IDs
Timestamp
Duration
Clock
Hash
Config
ScopeGuard
StringUtils
Assert behavior where appropriate
```

Core tests should not require: network, filesystem watchers, transport sockets, discovery ports, external services.

Core should be fast to test.

## Core failure behavior

Core should make failure explicit.

Examples:

```txt
invalid argument
missing config value
wrong config type
invalid id
invalid timestamp
hash algorithm unsupported
```

Functions that can fail normally should return Result. Internal invariants can use assertions.

## Good core API design

A good core API is: small, explicit, typed, documented, deterministic, hard to misuse, easy to test.

Good:

```cpp
types::Result<Value, errors::Error> parse_value(std::string_view input);
```

Bad (if parsing can fail normally):

```cpp
Value parse_value(std::string_view input);
```

## Bad core API design

Avoid APIs that:

- silently ignore invalid input
- return raw strings for important IDs
- throw for normal runtime failures
- depend on higher modules
- hide error context
- use global mutable state unnecessarily

Core should keep the rest of the engine clean.

## When to add something to core

Add a type or utility to core only if:

- it is needed by multiple modules
- it is generic
- it has no module-specific behavior
- it does not create coupling
- it improves safety or clarity

Good candidates:

```txt
Result
Error
Duration
Timestamp
StrongType
ScopeGuard
```

Bad candidates:

```txt
SyncOperation
TransportMessage
StoreEntry
DiscoveryPeer
CliCommand
```

Those belong to their own modules.

## When not to add something to core

Do not add something to core if it belongs to one module.

Examples:

```txt
WAL record encoding
store snapshot builder
sync retry policy
transport frame decoder
discovery registry
metadata service
CLI parser
```

These should stay outside core.

## Core stability

core is the most sensitive module.

Breaking changes in core can break:

```txt
fs
wal
store
sync
transport
discovery
metadata
cli
apps
SDK C++
SDK JS bindings or conversions
examples
tests
```

Change core carefully. Prefer additive changes when possible.

## Core design checklist

Before adding or changing core code, ask:

- Is this generic?
- Is it needed by multiple modules?
- Does it avoid higher-level coupling?
- Does it improve safety?
- Is failure explicit?
- Is the API deterministic?
- Can it be tested without external services?
- Will this break many modules?

If the answer is unclear, keep the logic in the specific module first.

## Common mistakes

### Putting business logic in core

Wrong:

```txt
core/sync_retry_policy
core/transport_message
core/store_entry
```

Better:

```txt
sync/retry
transport/message
store/entry
```

### Using raw strings for important IDs

Wrong:

```cpp
void apply_operation(std::string operation_id);
```

Better:

```cpp
void apply_operation(ids::OperationId operation_id);
```

### Throwing for normal runtime failures

Wrong (if key can be missing):

```cpp
Value get(Key key);
```

Better:

```cpp
types::Result<Value, errors::Error> get(Key key);
```

### Hiding error context

Wrong:

```txt
failed
```

Better:

```txt
failed to open WAL path data/node-a.wal: permission denied
```

### Making core depend on modules

Wrong: core includes store headers.

This creates architectural coupling.

## Core API reference

| Area | Purpose |
|------|---------|
| types | Generic reusable types |
| errors | Structured errors |
| ids | Strong identifiers |
| time | Timestamp, Duration, Clock |
| hash | Hash primitives and interfaces |
| config | Configuration values and validation |
| utils | Low-level helpers |

## Core include reference

Recommended top-level include:

```cpp
#include <softadastra/core/Core.hpp>
```

Use specific headers only when you need finer compile boundaries.

## Core summary

core is the foundation of Softadastra Engine.

It provides:

```txt
Result
Error
StrongType
IDs
Timestamp
Duration
Clock
Hash
Config
ScopeGuard
StringUtils
Assert
```

The key idea is:

> Core must stay small, stable, deterministic, and independent.

If core stays clean, every module above it becomes easier to build.

## Next step

Continue with filesystem:

[Go to Filesystem](./fs)
