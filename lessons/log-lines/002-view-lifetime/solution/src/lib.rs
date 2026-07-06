pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}
