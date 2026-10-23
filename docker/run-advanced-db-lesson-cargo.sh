#!/bin/sh
set -eu

# SQLx and the advanced crate set are baked into the image and never fetched
# during an untrusted lesson run.
exec env CARGO_NET_OFFLINE=true CARGO_TARGET_DIR=/opt/rust-daily-target cargo "$@"
