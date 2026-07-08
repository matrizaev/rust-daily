#!/bin/sh
set -eu

target_dir=/workspace/target

cp -a /opt/rust-daily-target "$target_dir"

exec env CARGO_TARGET_DIR="$target_dir" cargo test "$@"
