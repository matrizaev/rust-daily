use std::convert::TryFrom;

pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
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

        Ok(Self { method, path, body: None })
    }
}


impl RequestBuilder {
    pub fn method(mut self, method: impl Into<String>) -> Self {
            self.method = Some(method.into());
            self
        }
}


impl Default for RequestBuilder {
    fn default() -> Self {
        Self {
            method: None,
            path: None,
        }
    }
}


impl RequestBuilder {
    pub fn build(self) -> Result<Request, BuildError> {
            let method = self.method.ok_or(BuildError::MissingMethod)?;
            let path = self.path.ok_or(BuildError::MissingPath)?;

            Ok(Request { method, path, body: None })
        }
}

// Continue from the previous lesson.
// TODO: add a doc comment example above RequestBuilder.
