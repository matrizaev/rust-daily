use actix_files::Files;

use crate::config::FrontendDist;

pub fn frontend_files(root: &FrontendDist) -> Files {
    Files::new("/", root.as_path())
        .index_file("index.html")
        .prefer_utf8(true)
        .use_etag(true)
        .use_last_modified(true)
}
