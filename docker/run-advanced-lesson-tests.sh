#!/bin/sh
set -eu

target_dir=/workspace/target

if [ ! -d "$target_dir" ]; then
    cp -a /opt/rust-daily-target "$target_dir"
fi

exec env CARGO_TARGET_DIR="$target_dir" cargo test "$@"
