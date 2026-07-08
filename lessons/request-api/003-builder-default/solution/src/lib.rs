#[derive(Default)]
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
}
