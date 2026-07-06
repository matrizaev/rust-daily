use std::convert::TryFrom;

pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

impl TryFrom<RawRequest> for Request {
    type Error = BuildError;

    fn try_from(value: RawRequest) -> Result<Self, Self::Error> {
        let method = value.method.ok_or(BuildError::MissingMethod)?;
        let path = value.path.ok_or(BuildError::MissingPath)?;

        Ok(Self { method, path })
    }
}
