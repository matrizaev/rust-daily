# Backend

Actix service for optional remote Rust lesson validation.

## Run Locally

From the repository root, run the full local stack with:

```bash
make dev-full
```

That target builds the runner image, starts the backend with
`RUST_DAILY_CORS_ORIGIN=http://localhost:5173`, and starts the Vite frontend
with `VITE_RUST_DAILY_BACKEND_URL=http://127.0.0.1:8080`.

Build the runner image first:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.96 .
```

Then start the API:

```bash
RUST_DAILY_CORS_ORIGIN=http://localhost:5173 cargo run --manifest-path backend/Cargo.toml
```

The service listens on `127.0.0.1:8080` by default and exposes `POST /run`.
The frontend uses `http://127.0.0.1:8080` by default in local development.
Override it at build or dev-server start with `VITE_RUST_DAILY_BACKEND_URL`,
or inject `window.__RUST_DAILY_BACKEND_URL__` before the app bundle loads.

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
