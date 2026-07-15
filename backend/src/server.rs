//! Actix server construction and startup.

use std::{io, sync::Arc};

use actix_files::Files;
use actix_web::{
    App, HttpServer,
    dev::Server,
    middleware::{self, Condition},
    web,
};
use tracing::info;

use crate::{
    api::{configure, cors, json_config},
    config::Settings,
    observability,
    queue::spawn_workers,
    runner::initialize_runtime,
    service::AppService,
};

/// Initializes runner prerequisites and serves the configured Actix server.
pub async fn run(settings: Settings) -> io::Result<()> {
    tokio::fs::create_dir_all(settings.runner.workspace_root.as_ref()).await?;
    initialize_runtime(&settings.runner).await?;
    build_server(settings)?.await
}

/// Builds the Actix server without awaiting it.
pub fn build_server(settings: Settings) -> io::Result<Server> {
    let bind_address = settings.server.bind_address.to_string();
    let runner_settings = Arc::new(settings.runner.clone());
    let queue = spawn_workers(Arc::clone(&runner_settings));
    let service = AppService::new(queue.clone(), settings.validation.limits);
    let server_settings = settings.server.clone();
    let frontend_settings = settings.frontend.clone();
    let api_settings = settings.api.clone();
    let observability_settings = settings.observability.clone();

    info!(
        bind_address = %settings.server.bind_address,
        frontend_dist = ?settings.frontend.dist.as_ref(),
        workers = settings.runner.workers.get(),
        queue_capacity = settings.runner.queue_capacity.get(),
        runner_image = %settings.runner.image,
        "starting Rust Daily backend"
    );

    Ok(HttpServer::new(move || {
        let cors_origin = server_settings.cors_origin.clone();
        let cors_enabled = cors_origin.is_some();
        let cors_origin = cors_origin
            .as_ref()
            .map_or("http://localhost", |origin| origin.as_ref());

        App::new()
            .wrap(middleware::from_fn(observability::record_http_metrics))
            .wrap(Condition::new(cors_enabled, cors(cors_origin)))
            .app_data(web::Data::new(service.clone()))
            .app_data(web::Data::new(queue.clone()))
            .app_data(web::Data::new(observability_settings.clone()))
            .app_data(json_config(api_settings.max_json_payload_bytes.get()))
            .configure(configure)
            .service(
                Files::new("/", frontend_settings.dist.as_ref())
                    .index_file("index.html")
                    .prefer_utf8(true)
                    .use_etag(true)
                    .use_last_modified(true),
            )
    })
    .bind(bind_address)?
    .run())
}
