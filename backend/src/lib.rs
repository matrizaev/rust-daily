//! Backend library for Rust Daily.
//!
//! The crate owns the HTTP API, configuration loading, request validation,
//! queueing, workspace construction, and restricted Podman runner used to
//! validate learner submissions.

#![warn(missing_docs)]

/// Actix route handlers and HTTP middleware configuration.
pub mod api;
mod cargo_output;
/// Typed backend configuration loaded from YAML and environment variables.
pub mod config;
/// Supported Cargo dependency surfaces for lesson validation.
pub mod dependency_set;
/// API error mapping and JSON error response bodies.
pub mod error;
/// Request, validation, and runner result domain types.
pub mod model;
/// Tracing subscriber initialization.
pub mod observability;
/// Bounded in-process queue for runner jobs.
pub mod queue;
/// Podman-backed lesson runner.
pub mod runner;
/// Actix server construction and startup.
pub mod server;
/// Application service layer between HTTP handlers and the queue.
pub mod service;
/// Static frontend file serving.
pub mod static_files;
/// Temporary Cargo workspace preparation.
pub mod workspace;

pub use server::{build_server, run};
