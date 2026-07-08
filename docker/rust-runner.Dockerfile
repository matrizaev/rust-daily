FROM docker.io/library/rust:1.95-slim

WORKDIR /workspace

RUN mkdir -p /tmp/dependency-cache/src /opt/rust-daily-target \
    && printf 'pub fn cache_marker() {}\n' > /tmp/dependency-cache/src/lib.rs \
    && printf '%s\n' \
        '[package]' \
        'name = "dependency_cache"' \
        'version = "0.1.0"' \
        'edition = "2024"' \
        '' \
        '[lib]' \
        'path = "src/lib.rs"' \
        '' \
        '[dependencies]' \
        'serde = { version = "1", features = ["derive"] }' \
        'serde_json = "1"' \
        'thiserror = "2"' \
        'anyhow = "1"' \
        'tokio = { version = "1", features = ["macros", "rt", "sync", "time"] }' \
        'tracing = "0.1"' \
        'tracing-subscriber = { version = "0.3", features = ["fmt"] }' \
        'actix-web = { version = "4", default-features = false }' \
        'actix-rt = "2"' \
        'http = "1"' \
        'proptest = { version = "1", default-features = false, features = ["std"] }' \
        '' \
        '[profile.test]' \
        'debug = 0' \
        'incremental = false' \
        > /tmp/dependency-cache/Cargo.toml \
    && CARGO_TARGET_DIR=/opt/rust-daily-target \
        cargo test --manifest-path /tmp/dependency-cache/Cargo.toml --no-run \
    && rm -rf /opt/rust-daily-target/debug/incremental \
    && rm -rf /tmp/dependency-cache

COPY docker/run-advanced-lesson-tests.sh /usr/local/bin/run-advanced-lesson-tests

RUN chmod 0755 /usr/local/bin/run-advanced-lesson-tests
