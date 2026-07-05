# Backend

Actix service for Rust lesson validation and production frontend serving.

## Run Locally

From the repository root, run the full local stack with:

```bash
make dev-full
```

That target builds the runner image, starts the backend with `RUST_DAILY_ENV=local`,
and starts the Vite frontend with
`VITE_RUST_DAILY_BACKEND_URL=http://127.0.0.1:8080`.

Build the runner image first:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.95 .
```

Then start the API:

```bash
RUST_DAILY_ENV=local cargo run --manifest-path backend/Cargo.toml
```

The service listens on `127.0.0.1:8080` by default and exposes `POST /run`.
It also serves the built frontend from `frontend.dist`, configured in
`config/default.yaml` and overridden by `config/local.yaml` or `config/prod.yaml`.

The frontend uses `http://127.0.0.1:8080` by default in local development.
Production frontend builds default to the same origin that served the page.
Override either mode at build or dev-server start with
`VITE_RUST_DAILY_BACKEND_URL`, or inject `window.__RUST_DAILY_BACKEND_URL__`
before the app bundle loads.

## Configuration

Settings are loaded in this order:

1. `config/default.yaml`
2. `config/{RUST_DAILY_ENV}.yaml`, with `local` as the default environment
3. `RUST_DAILY_*` environment overrides

Use nested environment override names for new configuration:

- `RUST_DAILY_SERVER__HOST`
- `RUST_DAILY_SERVER__PORT`
- `RUST_DAILY_SERVER__CORS_ORIGIN`
- `RUST_DAILY_FRONTEND__DIST`
- `RUST_DAILY_RUNNER__IMAGE`
- `RUST_DAILY_RUNNER__WORKSPACE_ROOT`
- `RUST_DAILY_RUNNER__QUEUE_CAPACITY`
- `RUST_DAILY_RUNNER__WORKERS`
- `RUST_DAILY_RUNNER__TIMEOUT_SECS`
- `RUST_DAILY_RUNNER__MAX_OUTPUT_BYTES`
- `RUST_DAILY_VALIDATION__MAX_FILES`
- `RUST_DAILY_VALIDATION__MAX_FILE_BYTES`
- `RUST_DAILY_VALIDATION__MAX_TOTAL_BYTES`
- `RUST_DAILY_API__MAX_JSON_PAYLOAD_BYTES`

The older flat names such as `RUST_DAILY_HOST`, `RUST_DAILY_PORT`, and
`RUST_DAILY_CORS_ORIGIN` are still accepted as compatibility overrides.
