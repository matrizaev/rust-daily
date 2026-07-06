use rust_daily_lesson::Config;

#[test]
fn default_config_is_local_and_safe() {
    let config = Config::default();

    assert_eq!(config.service_url, "http://localhost:8080");
    assert_eq!(config.max_connections, 32);
    assert!(!config.use_tls);
}
