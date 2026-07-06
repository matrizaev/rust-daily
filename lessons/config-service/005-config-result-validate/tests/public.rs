use rust_daily_lesson::{Config, ConfigError};

#[test]
fn validate_reports_specific_failures() {
    assert_eq!(
        Config {
            service_url: String::new(),
            max_connections: 8,
        }
        .validate(),
        Err(ConfigError::EmptyServiceUrl)
    );
    assert_eq!(
        Config {
            service_url: "https://api.example.com".to_owned(),
            max_connections: 0,
        }
        .validate(),
        Err(ConfigError::ZeroConnections)
    );
}

#[test]
fn validate_accepts_valid_config() {
    assert_eq!(
        Config {
            service_url: "https://api.example.com".to_owned(),
            max_connections: 8,
        }
        .validate(),
        Ok(())
    );
}
