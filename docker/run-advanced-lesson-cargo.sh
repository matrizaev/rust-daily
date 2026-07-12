#!/bin/sh
set -eu

# `/opt/rust-daily-target` is mounted as a fresh Podman volume for each run.
# Podman seeds an empty volume from the image, so Cargo can update its target
# directory without copying the dependency cache into the memory-accounted
# learner workspace tmpfs.
exec env CARGO_TARGET_DIR=/opt/rust-daily-target cargo "$@"
