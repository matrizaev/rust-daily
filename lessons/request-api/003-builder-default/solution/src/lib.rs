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
