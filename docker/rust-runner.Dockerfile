FROM rust:1.95-slim

WORKDIR /workspace
RUN rustup component add clippy rustfmt

