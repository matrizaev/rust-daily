#!/bin/sh
set -eu

# Use the image-seeded target cache without permitting dependency downloads.
exec env CARGO_NET_OFFLINE=true CARGO_TARGET_DIR=/opt/rust-daily-target cargo test "$@"
