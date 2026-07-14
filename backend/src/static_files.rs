//! Static file service for the built frontend.

use actix_files::Files;

use crate::config::FrontendDist;

/// Serves the Vite production build with `index.html` as the route fallback.
pub fn frontend_files(root: &FrontendDist) -> Files {
    Files::new("/", root.as_path())
        .index_file("index.html")
        .prefer_utf8(true)
        .use_etag(true)
        .use_last_modified(true)
}
