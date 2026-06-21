# Quick Start

This page gives you the fastest way to try Softadastra Engine.

You will:

- check the local engine status
- write a local value
- read it back
- inspect sync state
- run one sync tick

## 1. Check Softadastra Engine

Run:

```sh
softadastra status
```

You should see the local engine status.

Example:

```txt
Softadastra status

Component   Metric        Value
store       entries       0
sync        queued        0
sync        in_flight     0
sync        acknowledged  0
sync        failed        0
```

If this command works, Softadastra Engine is installed and the CLI is available.

## 2. Write a local value

Run:

```sh
softadastra store put app/name Softadastra
```

Example output:

```txt
✓ Stored value.

Field    Value
key      app/name
version  1
status   created
```

This writes a value locally.

No server is required.
No peer is required.
No network is required.

## 3. Read the value

Run:

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
```

You have now written and read local data with Softadastra Engine.

## 4. Inspect sync state

Run:

```sh
softadastra sync status
```

Example output:

```txt
Softadastra sync status

Metric                  Value
queued_count            1
in_flight_count         0
acknowledged_count      0
failed_count            0
total_retries           0
```

This shows what the engine is tracking for synchronization.

A local write can create sync work, but the value is already available locally.

Sync is for delivery later.
Local usefulness comes first.

## 5. Run one sync tick

Run:

```sh
softadastra sync tick
```

Example output:

```txt
Softadastra sync tick

Metric           Value
retried_count    0
batch_size       1
sent_count       0
pruned_count     0

No connected transport peers available.
```

This is normal if no peer or transport is connected.

The important point is that the local value is still safe and readable.

## Full first flow

You can copy this whole flow:

```sh
softadastra status

softadastra store put app/name Softadastra
softadastra store get app/name

softadastra sync status
softadastra sync tick

softadastra status
```

## Interactive mode

You can also run commands inside one interactive session:

```sh
softadastra
```

Then type:

```txt
softadastra> status
softadastra> store put app/name Softadastra
softadastra> store get app/name
softadastra> sync status
softadastra> sync tick
softadastra> status
softadastra> exit
```

Inside interactive mode, do not repeat `softadastra`.

Use:

```txt
softadastra> status
```

not:

```txt
softadastra> softadastra status
```

## What you just learned

You used Softadastra Engine to:

- check local engine status
- write data locally
- read data locally
- inspect sync state
- run one sync tick

The core idea is simple:

```txt
write locally
persist safely
recover after failure
retry when needed
sync when possible
```

## Next step

Continue with [CLI](./cli/) to learn the command-line interface.

Or continue with [SDKs](./sdks) if you want to use Softadastra Engine inside a C++ application.
