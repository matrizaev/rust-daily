use tracing_subscriber::EnvFilter;

pub fn init_tracing() {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("rust_daily_backend=info,actix_web=info"));

    let _ = tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .json()
        .try_init();
}
