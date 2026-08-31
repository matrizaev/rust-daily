#!/usr/bin/env bash
set -euo pipefail

# Temporary local equivalent of .github/workflows/deploy_dev.yml.
# Remove this file when it is no longer needed.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DEPLOY_HOST="borrowquest.qzz.io"
DEPLOY_KEY="/home/matrizaev/.ssh/rust-daily-cicd"
DEPLOY_USER="cicd"
DEPLOY_DIR="/var/www12/html"
DEPLOY_RUNNER_WORKSPACE_ROOT="/var/www12/rust-daily-runs"
DEPLOY_NGINX_CONF="borrowquest.site.conf"
DEPLOY_CLOUDFLARE_REAL_IP_CONF="cloudflare-real-ip.conf"
DEPLOY_SERVICE="rust-daily-backend.service"
RUNNER_IMAGE="rust-runner:1.95"
SMOKE_URL="https://borrowquest.site"
SMOKE_CASE="pass"

[[ -r "$DEPLOY_KEY" ]] || { echo "SSH key is not readable: $DEPLOY_KEY" >&2; exit 1; }
chmod 600 "$DEPLOY_KEY" 2>/dev/null || true
SSH=(ssh -i "$DEPLOY_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
SCP=(scp -i "$DEPLOY_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
REMOTE="$DEPLOY_USER@$DEPLOY_HOST"

echo "Building frontend"
(cd frontend && npm ci && npm run content:check && npm run content:check-refs && VITE_BASE_PATH=/ npm run build)

echo "Building Rust backend"
cargo build --manifest-path backend/Cargo.toml --release --all-features

cloudflare_real_ip_conf="$(mktemp)"
trap 'rm -f "$cloudflare_real_ip_conf"' EXIT
{
  echo 'real_ip_header CF-Connecting-IP;'
  echo 'real_ip_recursive on;'
  for url in https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6; do
    curl -fsS "$url" | tr ' ' '\n' | awk 'NF { printf "set_real_ip_from %s;\n", $1 }'
  done
} > "$cloudflare_real_ip_conf"
grep -q '^set_real_ip_from ' "$cloudflare_real_ip_conf"

runner_source_hash="$(sha256sum docker/rust-runner.Dockerfile docker/run-advanced-lesson-cargo.sh docker/run-advanced-lesson-tests.sh docker/dependency-cache/Cargo.toml docker/dependency-cache/src/lib.rs | sha256sum | cut -d' ' -f1)"
git_sha="$(git rev-parse HEAD)"

echo "Uploading artifacts to $REMOTE"
"${SSH[@]}" "$REMOTE" "mkdir -p '$DEPLOY_DIR/frontend' && rm -rf '$DEPLOY_DIR/config.tmp' '$DEPLOY_DIR/docker.tmp' '$DEPLOY_DIR/frontend/dist.tmp'"
"${SCP[@]}" ./backend/target/release/rust-daily-backend "$REMOTE:$DEPLOY_DIR/rust-daily-backend.new"
"${SCP[@]}" -r ./config "$REMOTE:$DEPLOY_DIR/config.tmp"
"${SCP[@]}" -r ./docker "$REMOTE:$DEPLOY_DIR/docker.tmp"
"${SCP[@]}" -r ./frontend/dist "$REMOTE:$DEPLOY_DIR/frontend/dist.tmp"
"${SCP[@]}" "./$DEPLOY_NGINX_CONF" "$REMOTE:/tmp/$DEPLOY_NGINX_CONF"
"${SCP[@]}" "$cloudflare_real_ip_conf" "$REMOTE:/tmp/$DEPLOY_CLOUDFLARE_REAL_IP_CONF"
"${SCP[@]}" "./rust-daily-backend.service" "$REMOTE:/tmp/$DEPLOY_SERVICE"

echo "Activating deployment and running remote checks"
"${SSH[@]}" "$REMOTE" bash -s -- \
  "$DEPLOY_DIR" \
  "$DEPLOY_RUNNER_WORKSPACE_ROOT" \
  "$DEPLOY_CLOUDFLARE_REAL_IP_CONF" \
  "$DEPLOY_NGINX_CONF" \
  "$DEPLOY_SERVICE" \
  "$RUNNER_IMAGE" \
  "$runner_source_hash" \
  "$git_sha" <<'REMOTE_SCRIPT'
set -euo pipefail

deploy_dir="$1"
deploy_runner_workspace_root="$2"
deploy_cloudflare_real_ip_conf="$3"
deploy_nginx_conf="$4"
deploy_service="$5"
runner_image="$6"
runner_source_hash="$7"
git_sha="$8"

sudo install -m 0644 "/tmp/$deploy_cloudflare_real_ip_conf" "/etc/nginx/$deploy_cloudflare_real_ip_conf"
sudo install -m 0644 "/tmp/$deploy_nginx_conf" "/etc/nginx/sites-available/$deploy_nginx_conf"
sudo ln -sfn "/etc/nginx/sites-available/$deploy_nginx_conf" "/etc/nginx/sites-enabled/$deploy_nginx_conf"
sudo install -m 0644 "/tmp/$deploy_service" "/etc/systemd/system/$deploy_service"
sudo install -d -o www-data12 -g www-data -m 0700 /var/www12/.cache /var/www12/.config /var/www12/.local/share
sudo install -d -m 0755 "$deploy_runner_workspace_root"
rm -rf "$deploy_dir/docker"
mv "$deploy_dir/docker.tmp" "$deploy_dir/docker"

actual_runner_hash="$(sudo -H -u www-data12 /usr/bin/env HOME=/var/www12 XDG_CONFIG_HOME=/var/www12/.config XDG_DATA_HOME=/var/www12/.local/share podman image inspect "$runner_image" --format '{{ index .Labels "org.opencontainers.image.source-hash" }}' 2>/dev/null || true)"
if [[ "$actual_runner_hash" != "$runner_source_hash" ]]; then
  sudo -H -u www-data12 /usr/bin/env HOME=/var/www12 XDG_CONFIG_HOME=/var/www12/.config XDG_DATA_HOME=/var/www12/.local/share podman build --build-arg "VCS_REF=$git_sha" --build-arg "RUNNER_SOURCE_HASH=$runner_source_hash" -f "$deploy_dir/docker/rust-runner.Dockerfile" -t "$runner_image" "$deploy_dir"
  actual_runner_hash="$(sudo -H -u www-data12 /usr/bin/env HOME=/var/www12 XDG_CONFIG_HOME=/var/www12/.config XDG_DATA_HOME=/var/www12/.local/share podman image inspect "$runner_image" --format '{{ index .Labels "org.opencontainers.image.source-hash" }}')"
fi
[[ "$actual_runner_hash" == "$runner_source_hash" ]]

sudo systemctl daemon-reload
sudo systemctl stop "$deploy_service" || true
install -m 0755 "$deploy_dir/rust-daily-backend.new" "$deploy_dir/rust-daily-backend"
rm -rf "$deploy_dir/config"
mv "$deploy_dir/config.tmp" "$deploy_dir/config"
rm -rf "$deploy_dir/frontend/dist"
mv "$deploy_dir/frontend/dist.tmp" "$deploy_dir/frontend/dist"
sudo systemctl start "$deploy_service"
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl is-active --quiet "$deploy_service"

healthz_ready=0
for attempt in {1..30}; do
  if curl -fsS -o /dev/null http://127.0.0.1:8080/healthz; then
    healthz_ready=1
    break
  fi
  sleep 2
done
[[ "$healthz_ready" == 1 ]]
curl -fsS -o /dev/null http://127.0.0.1:8080/
REMOTE_SCRIPT

echo "Running deployed-runner smoke test"
make smoke-runner SMOKE_URL="$SMOKE_URL" SMOKE_CASE="$SMOKE_CASE"
echo "Deployment completed successfully."
