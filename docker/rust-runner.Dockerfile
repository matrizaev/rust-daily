FROM rust:1.96-slim

WORKDIR /workspace
RUN rustup component add clippy rustfmt

