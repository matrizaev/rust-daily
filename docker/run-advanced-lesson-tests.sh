#!/bin/sh
set -eu

# See run-advanced-lesson-cargo: this is a disposable image-seeded volume,
# not a copy in `/workspace` tmpfs.
exec env CARGO_TARGET_DIR=/opt/rust-daily-target cargo test "$@"
