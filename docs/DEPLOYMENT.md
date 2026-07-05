# Deployment

Rust Daily is deployed as one Actix service on a VPS. The GitHub Actions
workflow builds the Vite frontend, builds the release backend binary, copies
both to the server, installs the systemd unit and Nginx vhost, and restarts the
service.

In production the backend serves:

- `POST /run` for Rust validation.
- `/` from `index.html` in `RUST_DAILY_FRONTEND_DIST`.
- Static frontend files from `RUST_DAILY_FRONTEND_DIST` through `actix-files`.

Because the frontend and API are served from the same origin, production builds
do not need `VITE_RUST_DAILY_BACKEND_URL` or CORS.

## GitHub Actions

The VPS deploy workflow is `.github/workflows/deploy_dev.yml`. It runs on pushes
to `main`.

Required repository secrets:

- `CICD_PRIVATE_KEY`: SSH private key for the deploy user.
- `CICD_KNOWN_HOSTS`: known-hosts entry for the VPS.
- `DEPLOY_HOST`: VPS hostname or IP address.

The workflow assumes:

- SSH user: `cicd`.
- Deploy directory: `/var/www12/html`.
- Systemd service: `rust-daily-backend.service`.

The deploy copies:

```text
/var/www12/html/rust-daily-backend
/var/www12/html/frontend/dist/
/etc/systemd/system/rust-daily-backend.service
/etc/nginx/sites-available/borrowquest.qzz.io.conf
/etc/nginx/sites-enabled/borrowquest.qzz.io.conf
```

## Systemd Service

The service file is `rust-daily-backend.service`.

Important production environment:

```text
RUST_DAILY_HOST=127.0.0.1
RUST_DAILY_PORT=8080
RUST_DAILY_FRONTEND_DIST=/var/www12/html/frontend/dist
RUST_DAILY_RUNNER_IMAGE=rust-runner:1.95
RUST_DAILY_CORS_ORIGIN=
```

`RUST_DAILY_HOST=127.0.0.1` expects a reverse proxy such as Nginx or Caddy to
terminate TLS and forward traffic to `127.0.0.1:8080`. If the service must bind
directly without a reverse proxy, set `RUST_DAILY_HOST=0.0.0.0` and restrict
access with the VPS firewall.

## Nginx

The Nginx vhost is `borrowquest.qzz.io.conf`. It redirects HTTP to HTTPS and
proxies HTTPS traffic to the backend at `127.0.0.1:8080`.

Nginx does not serve `/var/www12/html` directly. The Actix backend owns static
asset serving and `POST /run`.

## Runner Image

The backend expects the runner image to exist on the VPS:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.95 .
```

Rebuild that image deliberately whenever the Rust version or lesson dependency
set changes.

The backend service runs as `www-data12`, so rootless Podman image builds and
runtime checks must use that same user:

```bash
cd /var/www12/html
sudo -H -u www-data12 podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.95 .
sudo -H -u www-data12 podman run --rm rust-runner:1.95 rustc --version
```

Rootless Podman also needs subordinate UID/GID ranges for `www-data12`:

```bash
grep '^www-data12:' /etc/subuid /etc/subgid
```

Each file should contain a range such as:

```text
www-data12:100000:65536
```

The systemd unit sets `HOME`, `XDG_CONFIG_HOME`, and `XDG_DATA_HOME` under
`/var/www12` so rootless Podman uses the same storage and configuration paths in
the service that it uses during manual `www-data12` image builds. The
submitted-code container still runs with `no-new-privileges`, dropped
capabilities, no network, and the other sandbox flags from `backend/src/runner.rs`.

## Frontend Backend URL

Local Vite development defaults to:

```text
http://127.0.0.1:8080
```

Production defaults to `window.location.origin`, so the app served by the
backend posts to the same backend at `/run`.

Overrides remain available:

- `VITE_RUST_DAILY_BACKEND_URL` at build or dev-server start.
- `window.__RUST_DAILY_BACKEND_URL__` before the app bundle loads.

Set `RUST_DAILY_CORS_ORIGIN` only when the frontend is intentionally served from
a different origin than the backend API.
