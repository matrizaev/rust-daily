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
        // TODO: assert that alert messages include warning and error text.
    }

    #[test]
    fn skips_info_messages() {
        // TODO: assert that info text is not returned.
    }
}
