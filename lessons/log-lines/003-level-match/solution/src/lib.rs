#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}

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
