# Production Deployment

## Live Service

Rust Daily is deployed at
[https://borrowquest.site/](https://borrowquest.site/).

Production uses one public origin:

```text
Browser -> Nginx -> Actix -> Vite files
                    |
                    +-> bounded validation queue -> rootless Podman
```

Actix listens on `127.0.0.1:8080`, serves the frontend, exposes
`GET /healthz`, `GET /readyz`, `GET /metrics`, and handles `POST /run`.
Nginx terminates TLS and proxies browser traffic to Actix. The production vhost
keeps `/metrics` private by only allowing loopback clients through that route.
Production uses one public browser origin,
`https://borrowquest.site`, and does not require a separate frontend API URL.
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
8. Starts Actix, validates Nginx configuration, reloads Nginx, waits for local
   `GET /healthz`, verifies local `GET /`, and runs the default deployed
   runner smoke case.

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
Nginx vhost:     borrowquest.site.conf
Runtime user:    www-data12
Runtime group:   www-data
```

The deploy user also needs this sudoers allowlist at `/etc/sudoers.d/cicd`;
validate edits with `visudo -cf /etc/sudoers.d/cicd` before rerunning deploys:

```sudoers
Cmnd_Alias RUST_DAILY_DEPLOY_ROOT = \
  /usr/bin/install -m 0644 /tmp/borrowquest.site.conf /etc/nginx/sites-available/borrowquest.site.conf, \
  /usr/bin/ln -sfn /etc/nginx/sites-available/borrowquest.site.conf /etc/nginx/sites-enabled/borrowquest.site.conf, \
  /usr/bin/install -m 0644 /tmp/rust-daily-backend.service /etc/systemd/system/rust-daily-backend.service, \
  /usr/bin/install -d -o www-data12 -g www-data -m 0700 /var/www12/.cache /var/www12/.config /var/www12/.local/share, \
  /usr/bin/install -d -m 0755 /var/www12/acme-challenge/.well-known/acme-challenge, \
  /usr/bin/install -d -m 0755 /var/www12/rust-daily-runs, \
  /usr/bin/systemctl daemon-reload, \
  /usr/bin/systemctl stop rust-daily-backend.service, \
  /usr/bin/systemctl start rust-daily-backend.service, \
  /usr/bin/systemctl is-active --quiet rust-daily-backend.service, \
  /usr/bin/journalctl -u rust-daily-backend.service -n 200 --no-pager, \
  /usr/sbin/nginx -t, \
  /usr/bin/systemctl reload nginx

Cmnd_Alias RUST_DAILY_DEPLOY_PODMAN = \
  /usr/bin/env HOME=/var/www12 XDG_CONFIG_HOME=/var/www12/.config XDG_DATA_HOME=/var/www12/.local/share podman image inspect rust-runner\:1.95 --format *, \
  /usr/bin/env HOME=/var/www12 XDG_CONFIG_HOME=/var/www12/.config XDG_DATA_HOME=/var/www12/.local/share podman build --build-arg VCS_REF=* --build-arg RUNNER_SOURCE_HASH=* -f /var/www12/html/docker/rust-runner.Dockerfile -t rust-runner\:1.95 /var/www12/html

cicd ALL=(root) NOPASSWD: RUST_DAILY_DEPLOY_ROOT
cicd ALL=(www-data12) NOPASSWD: RUST_DAILY_DEPLOY_PODMAN
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
/etc/nginx/sites-available/borrowquest.site.conf
/etc/nginx/sites-enabled/borrowquest.site.conf
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

Production sets `runner.workspace_root` to `/var/www12/rust-daily-runs`. That
directory stores per-request host-side Cargo workspaces before they are mounted
read-only into runner containers. The systemd unit mounts this path as a private
tmpfs with `size=2G` and `nr_inodes=200000`, which bounds disk and inode abuse
from prepared runner inputs. The tmpfs path is intentionally not listed in
`ReadWritePaths`, because a bind mount there would cover the tmpfs with the host
directory.

The backend mounts each prepared workspace read-only at `/input`. The managed
container copies it into a size-bounded `/workspace` tmpfs before executing
Cargo, so untrusted writes do not reach the host workspace. Advanced runs mount
an anonymous volume at `/opt/rust-daily-target`; Podman seeds it from the image's
precompiled cache. Backend cleanup passes `podman rm --volumes`, so the volume is
removed with the container. Standard runs do not create this volume. The cache
is therefore not copied into the memory-accounted workspace tmpfs and cannot
accumulate as orphaned runner volumes.

Advanced target volumes should be backed by a bounded filesystem instead of the
host root filesystem. On the production VPS this is a loop-backed ext4 image
mounted over the rootless Podman volume directory:

```text
/var/www12/podman-volumes.img on /var/www12/.local/share/containers/storage/volumes type ext4 (rw,nosuid,nodev,noatime)
```

Use an `/etc/fstab` entry like:

```fstab
/var/www12/podman-volumes.img  /var/www12/.local/share/containers/storage/volumes  ext4  loop,nosuid,nodev,noatime,nofail,x-systemd.device-timeout=10s  0  0
```

Do not add `noexec`: Cargo test binaries under `/opt/rust-daily-target` must be
executable inside the runner container. The backend unit includes:

```ini
RequiresMountsFor=/var/www12/.local/share/containers/storage/volumes
```

That makes systemd order the backend behind the Podman volume-store mount, so the
service does not start with volumes falling back to the host root filesystem.
Each advanced submission gets its own anonymous Podman volume; submissions do
not share target files with each other. They do share the capacity and I/O of
the loop-backed volume filesystem. With `runner.workers: 2`, at most two runner
containers should actively use advanced target volumes at the same time under
normal operation. If the loop image fills, advanced validations fail with
`ENOSPC` or a runner service failure, but the host root filesystem remains
protected.

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
Resource limits are static configuration, not live host probes: the service unit
sets `MemoryMax=1G`, `CPUQuota=200%`, and `TasksMax=512`; `config/default.yaml`
sets per-runner memory, CPU, pids, `/tmp` tmpfs, `/workspace` tmpfs, process
headroom, and core ulimit values. The backend does not perform exact live cgroup
or filesystem-capacity matching at startup.

Useful service commands:

```bash
sudo systemctl status rust-daily-backend.service
sudo journalctl -u rust-daily-backend.service -n 200 --no-pager
sudo systemctl restart rust-daily-backend.service
```

The backend writes structured JSON logs through `tracing` to journald.

## Operational Metrics

The backend installs a Prometheus recorder at startup and serves metrics from
`GET /metrics` when `observability.metrics_enabled=true`. The endpoint includes:

- `rust_daily_http_requests_total` and
  `rust_daily_http_request_duration_seconds`, labeled by method, coarse route
  path, HTTP status code, and status class.
- `rust_daily_runner_queue_depth`,
  `rust_daily_runner_queue_available_slots`,
  `rust_daily_runner_running_jobs`, and worker/capacity gauges.
- Runner job counters for enqueued, rejected, canceled, completed, and failed
  jobs.

Scrape the Actix loopback listener from the same host or a local Prometheus
agent:

```yaml
scrape_configs:
  - job_name: rust-daily-backend
    metrics_path: /metrics
    static_configs:
      - targets: ["127.0.0.1:8080"]
```

If a scraper can reach the endpoint from outside the service host, set a bearer
token outside the repository in a root-owned environment file:

```bash
sudo install -d -m 0700 /etc/rust-daily-backend
sudo install -m 0600 /dev/null /etc/rust-daily-backend/metrics.env
sudoedit /etc/rust-daily-backend/metrics.env
```

```env
RUST_DAILY_OBSERVABILITY__METRICS_BEARER_TOKEN=replace-with-long-random-token
```

Reference that file from a systemd drop-in:

```ini
# sudo systemctl edit rust-daily-backend.service
[Service]
EnvironmentFile=/etc/rust-daily-backend/metrics.env
```

Then configure Prometheus:

```yaml
authorization:
  type: Bearer
  credentials: replace-with-long-random-token
```

The production Nginx vhost blocks public `/metrics` access by default. Prefer
same-host scraping, a private network, VPN, SSH tunnel, or a Prometheus agent.
If `/metrics` must be proxied publicly, keep TLS, require the bearer token, and
add an IP allowlist in Nginx.

Useful queries:

```promql
sum by (status_code) (rate(rust_daily_http_requests_total[5m]))
histogram_quantile(0.95, rate(rust_daily_http_request_duration_seconds_bucket[5m]))
rust_daily_runner_queue_depth
rust_daily_runner_running_jobs
increase(rust_daily_runner_jobs_rejected_total[10m])
```

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
artifacts under `/opt/rust-daily-target`. Each advanced run mounts a disposable
anonymous volume at that path, which Podman seeds from the image before Cargo
runs offline. Its `org.opencontainers.image.source-hash` label must match the
hash of the runner Dockerfile, test script, and dependency-cache
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

`borrowquest.site.conf`:

- redirects HTTP to HTTPS;
- serves `/.well-known/acme-challenge/` from `/var/www12/acme-challenge`
  before redirecting other HTTP requests;
- uses the certificate at `/etc/ssl/certs/borrowquest.site.pem`;
- uses the key at `/etc/ssl/private/borrowquest.site.key`;
- limits request bodies to 2 MB, above `api.max_json_payload_bytes`;
- rate-limits `POST /run` to 6 requests per minute per client with a burst of 4;
- only allows loopback clients to reach `/metrics` through Nginx;
- marks `/sw.js` and dynamic app-shell entry points as revalidated or
  non-cacheable while allowing immutable caching for hashed build artifacts and
  generated lesson JSON;
- forwards the original host, client address, and scheme;
- proxies to `http://127.0.0.1:8080`.

Actix, not Nginx, serves static assets and owns `/run`.
The `borrowquest.site` DNS record points directly at the VPS. Because Nginx
terminates public browser TLS directly, the host must have a publicly trusted
certificate installed at the configured certificate and key paths before
deployment installs the vhost:

```bash
sudo install -d -m 0755 /var/www12/acme-challenge/.well-known/acme-challenge
sudo certbot certonly --webroot -w /var/www12/acme-challenge -d borrowquest.site
sudo install -m 0644 /etc/letsencrypt/live/borrowquest.site/fullchain.pem /etc/ssl/certs/borrowquest.site.pem
sudo install -m 0600 /etc/letsencrypt/live/borrowquest.site/privkey.pem /etc/ssl/private/borrowquest.site.key
sudo nginx -t
sudo systemctl reload nginx
```

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
RUST_DAILY_OBSERVABILITY__METRICS_ENABLED
RUST_DAILY_OBSERVABILITY__METRICS_BEARER_TOKEN
```

Production frontend builds use `window.location.origin` for the API. For a
split-origin deployment, set `VITE_RUST_DAILY_BACKEND_URL` at build time and
configure `RUST_DAILY_SERVER__CORS_ORIGIN`.

## Verification

After deployment:

```bash
curl -fsS https://borrowquest.site/healthz
curl -fsS http://127.0.0.1:8080/readyz
curl -fsS http://127.0.0.1:8080/metrics | grep rust_daily_runner_queue_depth
curl -fsSI https://borrowquest.site/
curl -fsSI https://borrowquest.site/sw.js
```

Expected health response:

```json
{"status":"ok"}
```

The `/sw.js` header response should include:

```text
cache-control: no-cache, no-store, must-revalidate
```

Then manually verify:

1. the home screen and lesson detail JSON load;
2. a `std` lesson compiles and passes;
3. an `advanced` lesson compiles and passes without downloading crates;
4. compiler errors render without Cargo `compiler-artifact` records;
5. progress survives a reload;
6. the service worker can reopen a visited lesson offline.

The repository's standard-library Python smoke client can exercise the live
runner path. Deployment runs this default `pass` case automatically after the
VPS update succeeds:

```bash
make smoke-runner SMOKE_URL=https://borrowquest.site
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
