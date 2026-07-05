# Docker

Runner images and related Docker/Podman assets live here.

Build the MVP Rust runner image with:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.95 .
```

The backend runs submitted lesson workspaces with `cargo test --offline` inside
that image.

The runner image intentionally does not install `clippy` or `rustfmt`. Current
backend validation only needs `cargo test`, and installing extra Rust components
requires access to `static.rust-lang.org` during image builds.
