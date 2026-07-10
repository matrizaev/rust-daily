use std::{io, process::Output, time::Instant};

use tempfile::TempDir;
use thiserror::Error;
use tokio::{process::Command, time};
use tracing::{info, warn};
use uuid::Uuid;

use crate::{
    cargo_output::result_from_output,
    config::RunnerSettings,
    dependency_set::DependencySet,
    model::{RunResult, RunStatus, ValidatedRunRequest},
    workspace::{WorkspaceError, prepare_workspace},
};

#[derive(Debug, Error)]
pub enum RunnerError {
    #[error(transparent)]
    Workspace(#[from] WorkspaceError),
    #[error("failed to execute Podman runner: {0}")]
    Podman(#[from] io::Error),
}

enum PodmanOutcome {
    Completed(Output),
    OuterTimeout,
}

pub async fn run(job_id: Uuid, request: ValidatedRunRequest, config: &RunnerSettings) -> RunResult {
    let started_at = Instant::now();

    match run_inner(job_id, &request, config, started_at).await {
        Ok(result) => result,
        Err(error) => {
            if matches!(error, RunnerError::Podman(_)) {
                warn!(%job_id, error = %error, "Podman spawn or wait failed");
            }

            RunResult::internal_error(error.to_string(), elapsed_ms(started_at))
        }
    }
}

async fn run_inner(
    job_id: Uuid,
    request: &ValidatedRunRequest,
    config: &RunnerSettings,
    started_at: Instant,
) -> Result<RunResult, RunnerError> {
    let workspace = prepare_workspace(job_id, request, config.workspace_root.as_path()).await?;
    let workspace_path = workspace.path().to_path_buf();

    let outcome = execute_podman(&workspace, request.dependency_set(), config).await;

    if let Err(error) = workspace.close() {
        warn!(%job_id, error = %error, path = ?workspace_path, "workspace cleanup failed");
    }

    let duration_ms = elapsed_ms(started_at);
    match outcome? {
        PodmanOutcome::Completed(output) => Ok(result_from_output(
            output,
            duration_ms,
            config.max_output_bytes.get(),
        )),
        PodmanOutcome::OuterTimeout => {
            info!(%job_id, "outer runner timeout elapsed");
            Ok(RunResult::new(
                RunStatus::TimedOut,
                String::new(),
                format!(
                    "runner timed out after {} seconds",
                    config.timeout.as_secs()
                ),
                duration_ms,
            ))
        }
    }
}

async fn execute_podman(
    workspace: &TempDir,
    dependency_set: DependencySet,
    config: &RunnerSettings,
) -> Result<PodmanOutcome, io::Error> {
    let workspace_mount = format!("{}:/workspace:Z", workspace.path().display());
    let inner_timeout = format!("{}s", config.timeout.as_secs());
    let outer_timeout = config
        .timeout
        .checked_add(std::time::Duration::from_secs(2))
        .unwrap_or(config.timeout);

    let mut command = Command::new("podman");
    command
        .kill_on_drop(true)
        .arg("run")
        .arg("--rm")
        .arg("--network")
        .arg("none")
        .arg("--memory")
        .arg("256m")
        .arg("--cpus")
        .arg("0.5")
        .arg("--pids-limit")
        .arg("128")
        .arg("--read-only")
        .arg("--tmpfs")
        .arg("/tmp:rw,noexec,nosuid,size=64m")
        .arg("--security-opt")
        .arg("no-new-privileges")
        .arg("--cap-drop")
        .arg("all")
        .arg("-v")
        .arg(workspace_mount)
        .arg("-w")
        .arg("/workspace")
        .arg(config.image.as_str())
        .arg("timeout")
        .arg(inner_timeout);

    let cargo_command = dependency_set.test_command();
    command
        .arg(cargo_command.program())
        .args(cargo_command.args());

    command.arg("--offline").arg("--message-format=json");

    match time::timeout(outer_timeout, command.output()).await {
        Ok(output) => output.map(PodmanOutcome::Completed),
        Err(_) => Ok(PodmanOutcome::OuterTimeout),
    }
}

fn elapsed_ms(started_at: Instant) -> u64 {
    let millis = started_at.elapsed().as_millis();
    millis.min(u128::from(u64::MAX)) as u64
}
