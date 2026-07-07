use rust_daily_lesson::{get_setting, Config, ConfigError};

#[test]
fn config_keeps_previous_arc_fields_and_validation() {
    let config = Config {
        service_url: "https://api.example.com".to_owned(),
        max_connections: 8,
        use_tls: true,
        timeout_seconds: Some(30),
    };

    assert!(config.use_tls);
    assert_eq!(config.timeout_seconds, Some(30));
    assert_eq!(config.validate(), Ok(()));

    let invalid = Config {
        service_url: String::new(),
        max_connections: 8,
        use_tls: true,
        timeout_seconds: Some(30),
    };

    assert_eq!(invalid.validate(), Err(ConfigError::EmptyServiceUrl));
}

#[test]
fn lookup_borrows_key_and_value() {
    let settings = vec![
        ("host".to_owned(), "localhost".to_owned()),
        ("port".to_owned(), "8080".to_owned()),
    ];

    assert_eq!(get_setting(&settings, "host"), Some("localhost"));
    assert_eq!(get_setting(&settings, "missing"), None);
}
