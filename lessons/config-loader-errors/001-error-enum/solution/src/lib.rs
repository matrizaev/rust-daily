#[derive(Debug)]
pub enum ConfigLoadError {
    MissingEnvironment,
    InvalidPort,
    FileRead,
}
