# Docker

Runner images and related Docker/Podman assets live here.

Build the MVP Rust runner image with:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.95 .
```

The backend runs submitted lesson workspaces with `cargo test --offline` inside
that image.
