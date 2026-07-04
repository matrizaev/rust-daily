# Deployment

Rust Daily is a static Vite app and does not require a backend.

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

## Custom Domain

For a custom domain served from the site root, build with:

```bash
cd frontend
VITE_BASE_PATH=/ npm run build
```

Set the custom domain in GitHub repository settings under Pages. If the domain
is served at the root, update the workflow `VITE_BASE_PATH` value to `/`.
