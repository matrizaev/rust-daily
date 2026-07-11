SHELL := /bin/bash

RUNNER_IMAGE ?= rust-runner:1.95
RUNNER_IMAGE_REVISION ?= $(shell git rev-parse HEAD 2>/dev/null || echo unknown)
RUNNER_SOURCE_HASH ?= $(shell { sha256sum docker/rust-runner.Dockerfile docker/run-advanced-lesson-cargo.sh docker/run-advanced-lesson-tests.sh docker/dependency-cache/Cargo.toml docker/dependency-cache/src/lib.rs | sha256sum | cut -d' ' -f1; } 2>/dev/null || echo unknown)
FRONTEND_ORIGIN ?= http://localhost:5173
FRONTEND_BACKEND_URL ?= http://127.0.0.1:8080
SMOKE_URL ?= http://127.0.0.1:8080
SMOKE_CASE ?= pass
BACKEND_COVERAGE_THRESHOLD ?= 80
BACKEND_COVERAGE_EXCLUDE_FILES := src/main.rs src/server.rs src/static_files.rs src/observability.rs src/runner.rs

.PHONY: format lint test coverage coverage-backend coverage-frontend runner-image smoke-runner dev-full

format:
	cargo fmt --manifest-path backend/Cargo.toml --all

lint:
	cargo clippy --manifest-path backend/Cargo.toml --all-targets --all-features -- -D warnings

test:
	cargo test --manifest-path backend/Cargo.toml

coverage: coverage-backend coverage-frontend

coverage-backend:
	cargo tarpaulin --engine Llvm --manifest-path backend/Cargo.toml --exclude-files $(BACKEND_COVERAGE_EXCLUDE_FILES) --fail-under $(BACKEND_COVERAGE_THRESHOLD) --timeout 120 --out Xml

coverage-frontend:
	cd frontend && npm run coverage

runner-image:
	podman build --build-arg VCS_REF=$(RUNNER_IMAGE_REVISION) --build-arg RUNNER_SOURCE_HASH=$(RUNNER_SOURCE_HASH) -f docker/rust-runner.Dockerfile -t $(RUNNER_IMAGE) .

smoke-runner:
	python3 scripts/play_run.py --url $(SMOKE_URL) --case $(SMOKE_CASE)

dev-full: runner-image
	@set -euo pipefail; \
	echo "Starting backend with CORS origin $(FRONTEND_ORIGIN)"; \
	RUST_DAILY_ENV=local \
	RUST_DAILY_SERVER__CORS_ORIGIN=$(FRONTEND_ORIGIN) \
	RUST_DAILY_RUNNER__IMAGE=$(RUNNER_IMAGE) \
	cargo run --manifest-path backend/Cargo.toml & \
	backend_pid=$$!; \
	echo "Starting frontend at $(FRONTEND_ORIGIN)"; \
	( \
		cd frontend && \
		VITE_RUST_DAILY_BACKEND_URL=$(FRONTEND_BACKEND_URL) \
		npm run dev -- --strictPort \
	) & \
	frontend_pid=$$!; \
	cleanup() { kill "$$backend_pid" "$$frontend_pid" 2>/dev/null || true; }; \
	trap cleanup INT TERM EXIT; \
	wait -n "$$backend_pid" "$$frontend_pid"; \
	status=$$?; \
	cleanup; \
	wait "$$backend_pid" "$$frontend_pid" 2>/dev/null || true; \
	exit "$$status"
