# Deployment

Rust Daily is a static Vite app paired with a Rust runner backend for lessons
that use backend validation. Browser-backed checks still run locally.

## Backend URL

The frontend resolves the Rust runner URL at build or dev-server start from:

```bash
VITE_RUST_DAILY_BACKEND_URL=https://borrowquest.site
```

At runtime, a host can also inject `window.__RUST_DAILY_BACKEND_URL__` before
the app bundle loads. That runtime value takes precedence over the Vite
environment variable.

If the variable is omitted, local development defaults to
`http://127.0.0.1:8080` and production builds default to
`https://borrowquest.site`.

## GitHub Pages

1. In GitHub, open the repository settings.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Push to `main` or run the `Deploy GitHub Pages` workflow manually.

The default workflow builds for project Pages at:

```text
https://USER.github.io/rust-daily/
```

That path requires:

```bash
cd frontend
VITE_BASE_PATH=/rust-daily/ npm run build
```

The workflow already sets that environment variable.
It also sets `VITE_RUST_DAILY_BACKEND_URL` to `https://borrowquest.site`.

The backend must allow the deployed frontend origin through
`RUST_DAILY_CORS_ORIGIN`.

## Custom Domain

For a custom domain served from the site root, build with:

```bash
cd frontend
VITE_BASE_PATH=/ npm run build
```

Set the custom domain in GitHub repository settings under Pages. If the domain
is served at the root, update the workflow `VITE_BASE_PATH` value to `/`.
