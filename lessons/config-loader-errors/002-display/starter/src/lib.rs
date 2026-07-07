#[derive(Debug)]
pub enum ConfigLoadError {
    MissingEnvironment,
    InvalidPort,
    FileRead,
}

// Continue from the previous lesson.
// TODO: implement Display for ConfigLoadError.
