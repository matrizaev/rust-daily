#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

// Continue from the previous lesson.
// TODO: define LogView that borrows a slice of entries.
