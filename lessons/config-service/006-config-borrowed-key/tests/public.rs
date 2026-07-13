use rust_daily_lesson::{first_valid_config, Config, ConfigError};

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
fn selects_first_valid_config_without_consuming_candidates() {
    let configs = vec![
        Config {
            service_url: String::new(),
            max_connections: 8,
            use_tls: true,
            timeout_seconds: Some(30),
        },
        Config {
            service_url: "https://admin.example.com".to_owned(),
            max_connections: 4,
            use_tls: true,
            timeout_seconds: Some(15),
        },
    ];

    let found = first_valid_config(&configs).expect("valid config should be found");

    assert!(std::ptr::eq(found, &configs[1]));
    assert_eq!(found.max_connections, 4);
    assert_eq!(found.timeout_seconds, Some(15));
    assert_eq!(configs.len(), 2);
}

#[test]
fn returns_none_when_no_candidate_is_valid() {
    let configs = vec![
        Config {
            service_url: String::new(),
            max_connections: 8,
            use_tls: true,
            timeout_seconds: Some(30),
        },
        Config {
            service_url: "https://admin.example.com".to_owned(),
            max_connections: 0,
            use_tls: true,
            timeout_seconds: Some(15),
        },
    ];

    assert_eq!(first_valid_config(&configs), None);
}
