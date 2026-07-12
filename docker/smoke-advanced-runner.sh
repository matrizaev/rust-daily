#!/usr/bin/env bash
set -euo pipefail

image="${1:-rust-runner:1.95}"
port="${RUST_DAILY_SMOKE_PORT:-18080}"
url="http://127.0.0.1:${port}"
backend_log="$(mktemp /tmp/rust-daily-advanced-smoke.XXXXXX.log)"
backend_pid=""
smoke_passed=false

cleanup() {
  status=$?
  if [ -n "$backend_pid" ]; then
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi
  if [ "$status" -ne 0 ] || [ "$smoke_passed" != true ]; then
    printf '%s\n' 'Advanced runner backend log:' >&2
    sed -n '1,240p' "$backend_log" >&2
  fi
  rm -f "$backend_log"
}
trap cleanup EXIT INT TERM

volumes_before="$(podman volume ls --filter dangling=true --format '{{.Name}}' | sort)"

RUST_DAILY_SERVER__PORT="$port" \
RUST_DAILY_RUNNER__IMAGE="$image" \
  cargo run --manifest-path backend/Cargo.toml >"$backend_log" 2>&1 &
backend_pid=$!

for _ in $(seq 1 100); do
  if curl --fail --silent "$url/healthz" >/dev/null; then
    break
  fi
  if ! kill -0 "$backend_pid" 2>/dev/null; then
    printf '%s\n' 'Backend exited before health check passed.' >&2
    exit 1
  fi
  sleep 0.1
done

curl --fail --silent --show-error "$url/healthz" >/dev/null
python3 scripts/play_run.py --url "$url" --case advanced-pass --http-timeout 20

managed_containers="$(podman ps --all --quiet --filter label=io.rust-daily.managed=true)"
if [ -n "$managed_containers" ]; then
  printf '%s\n' "Managed containers remain after smoke: $managed_containers" >&2
  exit 1
fi

volumes_after="$(podman volume ls --filter dangling=true --format '{{.Name}}' | sort)"
if [ "$volumes_before" != "$volumes_after" ]; then
  printf '%s\n' 'Anonymous Podman volume set changed after smoke.' >&2
  printf 'Before:\n%s\nAfter:\n%s\n' "$volumes_before" "$volumes_after" >&2
  exit 1
fi

smoke_passed=true
