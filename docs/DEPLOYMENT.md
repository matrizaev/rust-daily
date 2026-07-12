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
request to Actix. Production uses one public browser origin,
`https://borrowquest.qzz.io`, and does not require a separate frontend API URL.
Actix CORS middleware only emits CORS headers for that origin and rejects
requests that present any other browser `Origin`.

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

The deployment workflow rebuilds the Podman runner image before backend restart
when the installed `rust-runner:1.95` image lacks the expected source-hash label
or has a different one. Rebuilds are therefore automatic when Rust, lesson
dependencies, the Dockerfile, `run-advanced-lesson-cargo.sh`, or
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
XDG_RUNTIME_DIR=/run/rust-daily-backend
```

The XDG and home paths are important: rootless Podman must use the same storage
when invoked manually and by systemd. The systemd unit creates
`/run/rust-daily-backend` as a private runtime directory for Podman runtime
state.

Production runner workspaces use `/var/www12/rust-daily-runs`. The systemd unit
mounts this path as a private tmpfs with `size=2G` and `nr_inodes=200000`, which
bounds disk and inode abuse from writable `/workspace` container mounts. The
tmpfs path is intentionally not listed in `ReadWritePaths`, because a bind mount
there would cover the tmpfs with the host directory. If the advanced dependency
cache grows enough to hit this cap, tune `TemporaryFileSystem` and
`config/prod.yaml` together.

The backend mounts each prepared workspace read-only at `/input`. The managed
container copies it into a size-bounded `/workspace` tmpfs before executing
Cargo, so untrusted writes do not reach the host workspace.

The service also enables `PrivateTmp`, `ProtectSystem=strict`, `ProtectHome`,
narrow `ReadWritePaths`, `LimitCORE=0`, `MemoryMax=1G`, `MemorySwapMax=0`,
`CPUQuota=200%`, and `TasksMax=512`. It intentionally does not set systemd
`NoNewPrivileges`, because rootless Podman needs setuid `newuidmap`/`newgidmap`
to set up subordinate user namespaces. It also avoids a service-level
`CapabilityBoundingSet`, because clipping capabilities from setuid helpers can
prevent those helpers from opening and writing uid/gid maps; the runner
container still gets `--cap-drop all` and `--security-opt no-new-privileges`.
Production sets `runner.podman_path` to `/usr/bin/podman`, so runner execution
does not depend on service `PATH`. Runner invocations pass
`--cgroup-manager cgroupfs` because the service does not have a systemd user
session.

Useful service commands:

```bash
sudo systemctl status rust-daily-backend.service
sudo journalctl -u rust-daily-backend.service -n 200 --no-pager
sudo systemctl restart rust-daily-backend.service
```

The backend writes structured JSON logs through `tracing` to journald.

Before binding the HTTP server, startup verifies that Podman is rootless, the
configured image exists locally, remote Podman environment variables are not
set, and stale containers bearing `io.rust-daily.managed=true` can be removed.
A failed preflight prevents the service from accepting validation requests.

## Runner Image

For manual recovery, build the image from the deployed repository as the runtime
user:

```bash
cd /var/www12/html
RUNNER_SOURCE_HASH="$(
  sha256sum docker/rust-runner.Dockerfile \
    docker/run-advanced-lesson-cargo.sh \
    docker/run-advanced-lesson-tests.sh \
    docker/dependency-cache/Cargo.toml \
    docker/dependency-cache/src/lib.rs \
    | sha256sum \
    | cut -d' ' -f1
)"
sudo -H -u www-data12 podman build \
  --build-arg VCS_REF=manual \
  --build-arg RUNNER_SOURCE_HASH="$RUNNER_SOURCE_HASH" \
  -f docker/rust-runner.Dockerfile \
  -t rust-runner:1.95 .
sudo -H -u www-data12 podman run --rm \
  rust-runner:1.95 rustc --version
sudo -H -u www-data12 podman image inspect \
  rust-runner:1.95 \
  --format '{{ index .Labels "org.opencontainers.image.source-hash" }}'
```

The image caches all `advanced` lesson crates and their compiled test
artifacts. The runtime copies that cache into each writable lesson workspace
and runs Cargo offline. Its `org.opencontainers.image.source-hash` label must
match the hash of the runner Dockerfile, test script, and dependency-cache
manifest/source files; deployment rebuilds the image on mismatch before
restarting the backend.

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
- restores real client addresses from Cloudflare `CF-Connecting-IP` through
  `/etc/nginx/cloudflare-real-ip.conf`;
- limits request bodies to 1 MB;
- rate-limits `POST /run` to 6 requests per minute per client with a burst of 4;
- forwards the original host, client address, and scheme;
- proxies to `http://127.0.0.1:8080`.

Actix, not Nginx, serves static assets and owns `/run`.
Deployment generates `/etc/nginx/cloudflare-real-ip.conf` from Cloudflare's
published IPv4 and IPv6 ranges before `nginx -t`, so stale or unavailable
Cloudflare range data fails deployment instead of silently weakening `/run`
throttling.

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
RUST_DAILY_RUNNER__PODMAN_PATH
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
inspect the other runner outcomes. Use `SMOKE_CASE=compile-fail-pass`,
`compile-fail-unexpected-pass`, or `compile-fail-wrong-diagnostic` to exercise
the compile-fail runner path.

## Security Boundary

Submitted Rust is untrusted. The runner uses no network, memory/CPU/process
limits, a read-only container filesystem, a non-root user, bounded tmpfs
filesystems, disabled proxy/log integration, dropped capabilities,
`no-new-privileges`, structured Cargo/rustc classification, bounded raw process
output, and inner, outer, and native container timeouts.

Keep the backend bound to loopback, keep Podman rootless, and review runner
changes as security-sensitive. Each request container has a unique name and is
force-removed on completion, cancellation, timeout, or output overflow.
The detailed trust model is in [../ARCHITECTURE.md](../ARCHITECTURE.md).
