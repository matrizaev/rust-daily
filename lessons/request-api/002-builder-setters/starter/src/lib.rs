pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self { method: None, path: None }
    }

    // TODO: add a consuming method setter.
}
