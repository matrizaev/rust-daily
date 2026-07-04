use std::{io, sync::Arc};

use actix_web::{App, HttpServer, middleware::Condition, web};
use rust_daily_backend::{
    api::{AppState, cors, json_config, run},
    config::AppConfig,
    queue::spawn_workers,
};
use tracing::info;
use tracing_subscriber::EnvFilter;

#[actix_web::main]
async fn main() -> io::Result<()> {
    init_tracing();

    let config = Arc::new(AppConfig::from_env().map_err(to_io_error)?);
    tokio::fs::create_dir_all(config.workspace_root.as_path()).await?;

    let queue = spawn_workers(Arc::clone(&config));
    let bind_address = config.bind_address().to_string();

    info!(
        bind_address = %config.bind_address(),
        workers = config.workers.get(),
        queue_capacity = config.queue_capacity.get(),
        runner_image = %config.runner_image,
        "starting Rust Daily backend"
    );

    HttpServer::new(move || {
        let cors_origin = config.cors_origin.clone();
        let cors_enabled = cors_origin.is_some();
        let cors_origin = cors_origin
            .as_ref()
            .map_or("http://localhost", |origin| origin.as_str());
        let state = AppState::new(queue.clone(), config.validation_limits);

        App::new()
            .wrap(Condition::new(cors_enabled, cors(cors_origin)))
            .app_data(web::Data::new(state))
            .app_data(json_config(config.max_json_payload_bytes.get()))
            .route("/run", web::post().to(run))
    })
    .bind(bind_address)?
    .run()
    .await
}

fn init_tracing() {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("rust_daily_backend=info,actix_web=info"));

    let _ = tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .json()
        .try_init();
}

fn to_io_error(error: impl std::error::Error + Send + Sync + 'static) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, error)
}
