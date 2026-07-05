use rust_daily_backend::{config::load_settings, observability, run};

#[actix_web::main]
async fn main() {
    observability::init_tracing();

    let settings = match load_settings() {
        Ok(settings) => settings,
        Err(error) => {
            tracing::error!(error = %error, "settings load failed");
            std::process::exit(1);
        }
    };

    if let Err(error) = run(settings).await {
        tracing::error!(error = %error, "server start failed");
        std::process::exit(1);
    }
}
