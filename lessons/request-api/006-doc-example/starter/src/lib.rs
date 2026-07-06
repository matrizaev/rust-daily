#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

// TODO: add a doc comment example above RequestBuilder.
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
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
    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }

    pub fn path(mut self, path: impl Into<String>) -> Self {
        self.path = Some(path.into());
        self
    }

    pub fn build(self) -> Result<Request, BuildError> {
        let method = self.method.ok_or(BuildError::MissingMethod)?;
        let path = self.path.ok_or(BuildError::MissingPath)?;

        Ok(Request { method, path })
    }
}
