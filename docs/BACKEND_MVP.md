## Simplest viable architecture

```text
PWA
  ↓ POST /run
Backend API
  ↓ bounded channel queue
N worker tasks
  ↓ podman run --rm ...
Sandbox container
  ↓ cargo test
Result returned
```

## Use Rust backend

Use:

* `actix` for HTTP
* `tokio::sync::mpsc` for bounded queue
* `tokio::sync::oneshot` for returning job result
* `tokio::process::Command` to run `podman`
* `tower_http` for CORS if needed

## Job model

```rust
struct RunRequest {
    files: Vec<SubmittedFile>,
}

struct SubmittedFile {
    path: String,
    content: String,
}

struct RunResult {
    status: RunStatus,
    stdout: String,
    stderr: String,
    duration_ms: u64,
}
```

## Worker model

Use a fixed-size queue:

```text
queue capacity: 20
workers: 2
timeout: 10s
max output: 64 KB
```

If the queue is full:

```text
HTTP 429 Too Many Requests
```

## Runner flow

For each job:

1. Create temp dir.
2. Write submitted files.
3. Add your hidden tests.
4. Run Podman.
5. Capture stdout/stderr.
6. Delete temp dir.
7. Return result.

## Podman command shape

Conceptually:

```bash
podman run --rm \
  --network none \
  --memory 256m \
  --cpus 0.5 \
  --pids-limit 128 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  -v /tmp/job-123:/workspace:Z \
  -w /workspace \
  rust-runner:stable \
  timeout 10s cargo test --offline
```

## Important container restrictions

Use:

```text
--network none
--memory
--cpus
--pids-limit
--read-only
--tmpfs /tmp
--security-opt no-new-privileges
--cap-drop all
timeout
```

Also use a prebuilt image with dependencies already cached, otherwise `cargo test` will be slow.

## Simplest image

```dockerfile
FROM rust:slim
WORKDIR /workspace
RUN rustup component add clippy rustfmt
```

For real use, pre-cache a template crate:

```text
Cargo.toml
src/lib.rs
tests/hidden.rs
```

and copy user code into it.

## MVP recommendation

Start with:

```text
actix API
2 workers
mpsc queue
oneshot response
podman run per job
cargo test --offline
10 second timeout
no network
```

Do **not** start with Kubernetes, Firecracker, async job polling, auth, or multi-language support.


```text
POST /run
→ Actix handler
→ bounded tokio mpsc queue
→ fixed worker pool
→ podman run
→ oneshot result
```

Recommended stack:

```text
actix-web
tokio
serde
tempfile
uuid
anyhow / custom error
```

Handler shape conceptually:

```text
/run receives RunRequest
creates oneshot channel
tries to enqueue RunJob
if queue full -> 429
awaits oneshot result
returns JSON
```

Worker shape:

```text
loop:
  receive job
  create temp workspace
  write Cargo.toml/src/tests
  run podman with timeout
  send RunResult back
```

Actix works fine here because it runs on Tokio, so `tokio::sync::mpsc`, `oneshot`, and `tokio::process::Command` fit naturally.

Main rule: keep the Actix handler thin. It should only validate, enqueue, await result, and return. The Podman logic belongs in a separate runner module.
