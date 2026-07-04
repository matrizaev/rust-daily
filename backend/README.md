# Backend

Actix service for optional remote Rust lesson validation.

## Run Locally

Build the runner image first:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.96 .
```

Then start the API:

```bash
cd backend
cargo run
```

The service listens on `127.0.0.1:8080` by default and exposes `POST /run`.

## Configuration

Environment variables:

- `RUST_DAILY_HOST` default `127.0.0.1`
- `RUST_DAILY_PORT` default `8080`
- `RUST_DAILY_QUEUE_CAPACITY` default `20`
- `RUST_DAILY_WORKERS` default `2`
- `RUST_DAILY_TIMEOUT_SECS` default `10`
- `RUST_DAILY_MAX_OUTPUT_BYTES` default `65536`
- `RUST_DAILY_RUNNER_IMAGE` default `rust-runner:1.96`
- `RUST_DAILY_WORKSPACE_ROOT` default `/tmp/rust-daily-runs`
- `RUST_DAILY_CORS_ORIGIN` default empty
