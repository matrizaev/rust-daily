FROM docker.io/library/rust:1.95-slim

ARG VCS_REF=unknown
ARG RUNNER_SOURCE_HASH=unknown
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.source-hash=$RUNNER_SOURCE_HASH

WORKDIR /workspace

RUN mkdir -p /tmp/dependency-cache/src /opt/rust-daily-target

COPY docker/dependency-cache/Cargo.toml /tmp/dependency-cache/Cargo.toml
COPY docker/dependency-cache/src/lib.rs /tmp/dependency-cache/src/lib.rs

RUN CARGO_TARGET_DIR=/opt/rust-daily-target \
        cargo test --manifest-path /tmp/dependency-cache/Cargo.toml --no-run \
    && rm -rf /opt/rust-daily-target/debug/incremental \
    && rm -rf /tmp/dependency-cache

COPY docker/run-advanced-lesson-cargo.sh /usr/local/bin/run-advanced-lesson-cargo
COPY docker/run-advanced-lesson-tests.sh /usr/local/bin/run-advanced-lesson-tests

RUN chmod 0755 /usr/local/bin/run-advanced-lesson-cargo \
    && chmod 0755 /usr/local/bin/run-advanced-lesson-tests

RUN groupadd --gid 10001 rustdaily \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin rustdaily \
    && chown -R 10001:10001 /opt/rust-daily-target

USER 10001:10001
