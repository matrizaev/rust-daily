#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

pub fn severity(level: LogLevel) -> u8 {
    match level {
        LogLevel::Info => 1,
        LogLevel::Warn => 2,
        LogLevel::Error => 3,
    }
}

// Continue from the previous lesson.
// TODO: import Cow and define LogMessage with text that can be borrowed or owned.
