# Production Deployment

## Live Service

Rust Daily is deployed at
[https://borrowquest.qzz.io/](https://borrowquest.qzz.io/).

Production uses one public origin:

```text
Cloudflare -> Nginx -> Actix -> Vite files
                         |
                         +-> bounded validation queue -> rootless Podman
```

Actix listens on `127.0.0.1:8080`, serves the frontend, exposes
`GET /healthz`, and handles `POST /run`. Nginx terminates TLS and proxies every
request to Actix. Production does not require CORS or a separate frontend API
URL.

## Automatic Deployment

`.github/workflows/deploy_dev.yml` deploys every push to `main`.

The workflow:

1. Installs Node.js 24 dependencies with `npm ci`.
2. Validates generated lesson content.
3. Builds the Vite frontend with `VITE_BASE_PATH=/`.
4. Builds the Rust 1.95 backend in release mode.
5. Copies the backend, `config/`, `docker/`, and `frontend/dist/`.
6. Installs the systemd unit and Nginx vhost.
7. Swaps the uploaded files into place.
8. Starts Actix, validates Nginx configuration, and reloads Nginx.

Required GitHub repository secrets:

| Secret | Purpose |
| --- | --- |
| `CICD_PRIVATE_KEY` | SSH private key for the deploy account |
| `CICD_KNOWN_HOSTS` | Pinned SSH host key entry |
| `DEPLOY_HOST` | VPS hostname or address |

The workflow assumes:

```text
SSH user:        cicd
Deploy root:     /var/www12/html
Service:         rust-daily-backend.service
Nginx vhost:     borrowquest.qzz.io.conf
Runtime user:    www-data12
Runtime group:   www-data
```

The deployment workflow does **not** rebuild the Podman runner image. Rebuild it
separately whenever Rust, lesson dependencies, the Dockerfile, or
`run-advanced-lesson-tests.sh` changes.

## Installed Files

```text
/var/www12/html/rust-daily-backend
/var/www12/html/config/
/var/www12/html/docker/
/var/www12/html/frontend/dist/
/etc/systemd/system/rust-daily-backend.service
/etc/nginx/sites-available/borrowquest.qzz.io.conf
/etc/nginx/sites-enabled/borrowquest.qzz.io.conf
```

`config/prod.yaml` points Actix at
`/var/www12/html/frontend/dist`.

## Service

The repository root contains `rust-daily-backend.service`. Production runs with:

```text
RUST_DAILY_ENV=prod
HOME=/var/www12
XDG_CONFIG_HOME=/var/www12/.config
XDG_DATA_HOME=/var/www12/.local/share
```

The XDG and home paths are important: rootless Podman must use the same storage
when invoked manually and by systemd.

Useful service commands:

```bash
sudo systemctl status rust-daily-backend.service
sudo journalctl -u rust-daily-backend.service -n 200 --no-pager
sudo systemctl restart rust-daily-backend.service
```

The backend writes structured JSON logs through `tracing` to journald.

## Runner Image

Build the image from the deployed repository as the runtime user:

```bash
cd /var/www12/html
sudo -H -u www-data12 podman build \
  -f docker/rust-runner.Dockerfile \
  -t rust-runner:1.95 .
sudo -H -u www-data12 podman run --rm \
  rust-runner:1.95 rustc --version
```

The image caches all `advanced` lesson crates and their compiled test
artifacts. The runtime copies that cache into each writable lesson workspace
and runs Cargo offline.

Rootless Podman requires subordinate ID ranges:

```bash
grep '^www-data12:' /etc/subuid /etc/subgid
```

Both files should contain a range such as:

```text
www-data12:100000:65536
```

After rebuilding the image, restart the backend and run a lesson from both
dependency sets in the browser.

## Nginx and TLS

`borrowquest.qzz.io.conf`:

- redirects HTTP to HTTPS;
- uses the certificate at `/etc/ssl/certs/borrowquest.qzz.io.pem`;
- uses the key at `/etc/ssl/private/borrowquest.qzz.io.key`;
- limits request bodies to 1 MB;
- forwards the original host, client address, and scheme;
- proxies to `http://127.0.0.1:8080`.

Actix, not Nginx, serves static assets and owns `/run`.

Validate proxy configuration with:

```bash
sudo nginx -t
```

## Configuration

Backend configuration loads in this order:

1. `config/default.yaml`
2. `config/prod.yaml`
3. `RUST_DAILY_*` environment overrides

Nested override names use double underscores:

```text
RUST_DAILY_SERVER__HOST
RUST_DAILY_SERVER__PORT
RUST_DAILY_SERVER__CORS_ORIGIN
RUST_DAILY_FRONTEND__DIST
RUST_DAILY_RUNNER__IMAGE
RUST_DAILY_RUNNER__WORKSPACE_ROOT
RUST_DAILY_RUNNER__QUEUE_CAPACITY
RUST_DAILY_RUNNER__WORKERS
RUST_DAILY_RUNNER__TIMEOUT_SECS
RUST_DAILY_RUNNER__MAX_OUTPUT_BYTES
RUST_DAILY_VALIDATION__MAX_FILES
RUST_DAILY_VALIDATION__MAX_FILE_BYTES
RUST_DAILY_VALIDATION__MAX_TOTAL_BYTES
RUST_DAILY_API__MAX_JSON_PAYLOAD_BYTES
```

Production frontend builds use `window.location.origin` for the API. For a
split-origin deployment, set `VITE_RUST_DAILY_BACKEND_URL` at build time and
configure `RUST_DAILY_SERVER__CORS_ORIGIN`.

## Verification

After deployment:

```bash
curl -fsS https://borrowquest.qzz.io/healthz
curl -fsSI https://borrowquest.qzz.io/
```

Expected health response:

```json
{"status":"ok"}
```

Then manually verify:

1. the home screen and lesson detail JSON load;
2. a `std` lesson compiles and passes;
3. an `advanced` lesson compiles and passes without downloading crates;
4. compiler errors render without Cargo `compiler-artifact` records;
5. progress survives a reload;
6. the service worker can reopen a visited lesson offline.

The repository's standard-library Python smoke client can exercise the live
runner path:

```bash
make smoke-runner SMOKE_URL=https://borrowquest.qzz.io
```

Use `SMOKE_CASE=multi-file-pass`, `fail`, `compile-error`, or `timeout` to
inspect the other runner outcomes.

## Security Boundary

Submitted Rust is untrusted. The runner uses no network, memory/CPU/process
limits, a read-only container filesystem, a small `noexec` temporary
filesystem, dropped capabilities, `no-new-privileges`, and inner and outer
timeouts.

The mounted lesson workspace is writable by design. Keep the backend bound to
loopback, keep Podman rootless, and review runner changes as security-sensitive.
The detailed trust model is in [../ARCHITECTURE.md](../ARCHITECTURE.md).
