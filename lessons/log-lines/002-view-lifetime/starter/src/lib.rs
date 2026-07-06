pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

// TODO: define LogView that borrows a slice of entries.
