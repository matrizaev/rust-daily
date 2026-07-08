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

pub fn severity(level: LogLevel) -> u8 {
    match level {
        LogLevel::Info => 1,
        LogLevel::Warn => 2,
        LogLevel::Error => 3,
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
        let entries = [
            entry(LogLevel::Warn, "slow response"),
            entry(LogLevel::Error, "write failed"),
        ];

        assert_eq!(
            alert_messages(&entries),
            vec!["slow response", "write failed"]
        );
    }

    #[test]
    fn skips_info_messages() {
        let entries = [
            entry(LogLevel::Info, "started"),
            entry(LogLevel::Warn, "slow response"),
        ];

        assert_eq!(alert_messages(&entries), vec!["slow response"]);
    }
}
