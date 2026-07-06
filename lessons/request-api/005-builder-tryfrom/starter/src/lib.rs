use std::convert::TryFrom;

pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
}

pub struct Request {
    pub method: String,
    pub path: String,
}

pub enum BuildError {
    MissingMethod,
    MissingPath,
}

// TODO: implement TryFrom<RawRequest> for Request.
