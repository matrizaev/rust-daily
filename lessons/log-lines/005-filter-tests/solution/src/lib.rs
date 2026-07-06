pub enum LogLevel {
    Info,
    Warn,
    Error,
}

pub struct LogEntry<'a> {
    pub level: LogLevel,
    pub message: &'a str,
}

pub fn alert_messages<'a>(entries: &'a [LogEntry<'a>]) -> Vec<&'a str> {
    entries
        .iter()
        .filter_map(|entry| match entry.level {
            LogLevel::Warn | LogLevel::Error => Some(entry.message),
            LogLevel::Info => None,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_warning_and_error_messages() {
        let entries = [
            LogEntry { level: LogLevel::Warn, message: "slow response" },
            LogEntry { level: LogLevel::Error, message: "write failed" },
        ];

        assert_eq!(
            alert_messages(&entries),
            vec!["slow response", "write failed"]
        );
    }

    #[test]
    fn skips_info_messages() {
        let entries = [
            LogEntry { level: LogLevel::Info, message: "started" },
            LogEntry { level: LogLevel::Warn, message: "slow response" },
        ];

        assert_eq!(alert_messages(&entries), vec!["slow response"]);
    }
}
