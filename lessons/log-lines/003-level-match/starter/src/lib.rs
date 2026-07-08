#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}

// Continue from the previous lesson.
// TODO: add the supported log levels.
// TODO: map Info to 1, Warn to 2, and Error to 3.
