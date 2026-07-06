#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel { Info, Warn, Error }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogFields {
    pub request_id: String,
    pub user_id: Option<String>,
    pub attempt: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogEvent {
    pub event_name: String,
    pub level: LogLevel,
    pub fields: LogFields,
}
