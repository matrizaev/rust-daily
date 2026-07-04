.PHONY: format lint test

format:
	cargo fmt --manifest-path backend/Cargo.toml --all

lint:
	cargo clippy --manifest-path backend/Cargo.toml --all-targets --all-features -- -D warnings

test:
	cargo test --manifest-path backend/Cargo.toml

