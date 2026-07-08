#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }

    pub fn path(mut self, path: impl Into<String>) -> Self {
        self.path = Some(path.into());
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

impl RequestBuilder {
    pub fn build(self) -> Result<Request, BuildError> {
        let method = self.method.ok_or(BuildError::MissingMethod)?;
        let path = self.path.ok_or(BuildError::MissingPath)?;

        Ok(Request {
            method,
            path,
            body: None,
        })
    }
}

pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
    pub body: Option<String>,
}

impl std::convert::TryFrom<RawRequest> for Request {
    type Error = BuildError;

    fn try_from(value: RawRequest) -> Result<Self, Self::Error> {
        let method = value.method.ok_or(BuildError::MissingMethod)?;
        let path = value.path.ok_or(BuildError::MissingPath)?;
        let body = value.body;

        Ok(Self { method, path, body })
    }
}

// Continue from the previous lesson.
// TODO: add a doc comment example above RequestBuilder.
