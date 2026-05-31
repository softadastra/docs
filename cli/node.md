# Node

Node commands let you inspect the local Softadastra node and start node services for the current CLI session.

The command group is:

```sh
softadastra node
```

## Commands

```sh
softadastra node info
softadastra node start
```

## Show node help

Run:

```sh
softadastra node
```

Output:

```txt
Softadastra node

Usage
  softadastra node info
  softadastra node start

Commands
  info     Show local node information
  start    Start local node services for this CLI session
```

## Inspect the local node

Use `node info` to show information about the local node.

```sh
softadastra node info
```

This command shows values such as:

- node id
- display name
- hostname
- operating system
- version
- start time
- uptime
- capabilities
- whether node services are running

Example output:

```txt
Softadastra node

Field          Value
node_id        node-1
display_name   Softadastra Node
hostname       local-machine
os             linux
version        0.1.0
started_at     1760000000000
uptime_ms      1250
capabilities   6
node_running   no
```

The exact values depend on your machine and runtime state.

## Start node services

Use `node start` to start local node services for the current CLI session.

```sh
softadastra node start
```

When it succeeds, the CLI shows which services are running.

Example output:

```txt
Starting Softadastra node

✓ Softadastra node services started for this CLI session.
node_id    node-1
transport  running
discovery  running
metadata   running
```

This command starts the local runtime services used by the CLI session:

- transport
- discovery
- metadata

It does not turn the CLI into a permanent background daemon.

For a long-running node, use the Softadastra node app.

## If the node is already running

If node services are already running in the current CLI session, `node start` does not start them again.

```sh
softadastra node start
```

Example output:

```txt
Softadastra node is already running.
node_id  node-1
```

## Check node state

After starting the node, run:

```sh
softadastra node info
```

You should see `node_running` set to `yes`.

```txt
node_running   yes
```

You can also run:

```sh
softadastra status
```

This gives a wider view of the runtime: node, store, sync, transport, discovery, and metadata.

## Typical workflow

Use this flow when checking the local node:

```sh
softadastra status
softadastra node info
softadastra node start
softadastra node info
softadastra peers
```

What this does:

1. checks the runtime status
2. prints current node information
3. starts node services for the current CLI session
4. prints node information again
5. checks known discovery and transport peers

## Node info without live metadata

If metadata is not available yet, `node info` still shows basic information.

Example output:

```txt
Softadastra node

Field          Value
node_id        node-1
node_running   no
metadata       unavailable
```

In interactive mode, start the node first:

```sh
softadastra node start
```

Then run:

```sh
softadastra node info
```

## Interactive mode

You can use node commands inside an interactive session.

Start the CLI:

```sh
softadastra
```

Then run:

```txt
softadastra> node info
softadastra> node start
softadastra> node info
softadastra> peers
softadastra> exit
```

This is useful when you want services to stay available while you run several commands in the same CLI session.

## Common issues

### Unknown node command

If you run an unknown subcommand:

```sh
softadastra node something
```

The CLI returns an error like:

```txt
Unknown node command: something
Usage: node <info|start>
```

Use one of:

```sh
softadastra node info
softadastra node start
```

### Metadata is unavailable

If `node info` says metadata is unavailable, start the node services in the current CLI session:

```sh
softadastra node start
```

Then run:

```sh
softadastra node info
```

### No peers after starting the node

That can be normal.

Starting node services does not guarantee that another node exists on the network.

Check peers with:

```sh
softadastra peers
```

If no peers are found, it usually means no other node is running or discoverable yet.

## Summary

Use:

```sh
softadastra node info
```

to inspect the local node.

Use:

```sh
softadastra node start
```

to start local node services for the current CLI session.

Next, continue with [Store](./store).
