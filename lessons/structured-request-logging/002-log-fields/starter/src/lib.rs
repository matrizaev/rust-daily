#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogEvent {
    pub event_name: String,
    pub level: LogLevel,
}

// Continue from the previous lesson.
// TODO: define LogFields and LogEvent with structured fields.
