#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

/// Builds a request from chainable setters.
///
/// ```
/// use rust_daily_lesson::{Request, RequestBuilder};
///
/// let request = RequestBuilder::default()
///     .method("GET")
///     .path("/health")
///     .build();
///
/// assert_eq!(
///     request,
///     Ok(Request {
///         method: "GET".to_owned(),
///         path: "/health".to_owned(),
///         body: None,
///     })
/// );
/// ```
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

        Ok(Request { method, path, body: None })
    }
}


pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
}


impl TryFrom<RawRequest> for Request {
    type Error = BuildError;

    fn try_from(value: RawRequest) -> Result<Self, Self::Error> {
        let method = value.method.ok_or(BuildError::MissingMethod)?;
        let path = value.path.ok_or(BuildError::MissingPath)?;

        Ok(Self { method, path, body: None })
    }
}
