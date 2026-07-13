use std::borrow::Cow;

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

pub fn alert_priority(level: LogLevel) -> u8 {
    match level {
        LogLevel::Info => 0,
        LogLevel::Warn => 1,
        LogLevel::Error => 2,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogMessage<'a> {
    pub text: Cow<'a, str>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AlertEntry<'a> {
    pub level: LogLevel,
    pub message: LogMessage<'a>,
}

pub fn alert_messages<'a>(entries: &'a [AlertEntry<'a>]) -> Vec<&'a str> {
    entries
        .iter()
        .filter_map(|entry| match entry.level {
            LogLevel::Warn | LogLevel::Error => Some(entry.message.text.as_ref()),
            LogLevel::Info => None,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(level: LogLevel, message: &'static str) -> AlertEntry<'static> {
        AlertEntry {
            level,
            message: LogMessage {
                text: message.into(),
            },
        }
    }

    #[test]
    fn keeps_warning_and_error_messages() {
        // TODO: assert that warning and error messages are returned in order.
        todo!()
    }

    #[test]
    fn skips_info_messages() {
        // TODO: assert that info messages are not returned.
        todo!()
    }
}

// Continue from the previous lesson.
// TODO: fill in the two focused alert filter checks above.
