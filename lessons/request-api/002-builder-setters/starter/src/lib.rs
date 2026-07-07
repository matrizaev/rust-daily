#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

// Continue from the previous lesson.
// TODO: add a consuming method setter.
