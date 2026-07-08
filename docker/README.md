# Docker

Runner images and related Docker/Podman assets live here.

Build the MVP Rust runner image with:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.95 .
```

The backend runs submitted lesson workspaces with `cargo test --offline` inside
that image.

The image compiles the `advanced` dependency set during the image build. At
runtime, `run-advanced-lesson-tests` copies that compiled target cache into the
temporary writable lesson workspace before invoking Cargo. Standard-library
lessons continue to call Cargo directly and do not pay that copy cost.

The runner image intentionally does not install `clippy` or `rustfmt`. Current
backend validation only needs `cargo test`, and installing extra Rust components
requires access to `static.rust-lang.org` during image builds.
