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
}

// Continue from the previous lesson.
// TODO: complete this lesson's next change.
