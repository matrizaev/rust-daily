#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self {
            method: None,
            path: None,
        }
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }
}

// Continue from the previous lesson.
// TODO: derive Default for RequestBuilder.
