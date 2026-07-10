use std::{
    io,
    process::{Output, Stdio},
    time::Instant,
};

use tempfile::TempDir;
use thiserror::Error;
use tokio::{
    io::{AsyncRead, AsyncReadExt},
    process::Command,
    task::JoinError,
    time,
};
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
            warn!(%job_id, error = %error, "runner internal error");

            RunResult::internal_error(client_internal_error_message(), elapsed_ms(started_at))
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

    let mut command = Command::new(config.podman_path.as_path());
    command
        .kill_on_drop(true)
        .arg("--cgroup-manager")
        .arg("cgroupfs")
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

    command.stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = command.spawn()?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| io::Error::other("failed to capture Podman stdout"))?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| io::Error::other("failed to capture Podman stderr"))?;
    let retained_bytes = config.max_output_bytes.get().saturating_add(1);
    let stdout_task = tokio::spawn(collect_limited_stream(stdout, retained_bytes));
    let stderr_task = tokio::spawn(collect_limited_stream(stderr, retained_bytes));

    let status = match time::timeout(outer_timeout, child.wait()).await {
        Ok(status) => status?,
        Err(_) => {
            let _ = child.kill().await;
            let _ = join_output_task(stdout_task).await;
            let _ = join_output_task(stderr_task).await;
            return Ok(PodmanOutcome::OuterTimeout);
        }
    };

    let stdout = join_output_task(stdout_task).await?;
    let stderr = join_output_task(stderr_task).await?;

    Ok(PodmanOutcome::Completed(Output {
        status,
        stdout,
        stderr,
    }))
}

async fn collect_limited_stream<R>(mut stream: R, max_bytes: usize) -> io::Result<Vec<u8>>
where
    R: AsyncRead + Unpin,
{
    let mut output = Vec::with_capacity(max_bytes.min(8192));
    let mut buffer = [0u8; 8192];

    loop {
        let read = stream.read(&mut buffer).await?;
        if read == 0 {
            return Ok(output);
        }

        let remaining = max_bytes.saturating_sub(output.len());
        if remaining > 0 {
            output.extend_from_slice(&buffer[..read.min(remaining)]);
        }
    }
}

async fn join_output_task(
    task: tokio::task::JoinHandle<io::Result<Vec<u8>>>,
) -> io::Result<Vec<u8>> {
    match task.await {
        Ok(result) => result,
        Err(error) => Err(join_error(error)),
    }
}

fn join_error(error: JoinError) -> io::Error {
    io::Error::other(format!("Podman output reader task failed: {error}"))
}

fn elapsed_ms(started_at: Instant) -> u64 {
    let millis = started_at.elapsed().as_millis();
    millis.min(u128::from(u64::MAX)) as u64
}

fn client_internal_error_message() -> &'static str {
    "runner internal error"
}

#[cfg(test)]
mod tests {
    use tokio::io::AsyncWriteExt;

    use super::{client_internal_error_message, collect_limited_stream};

    #[tokio::test]
    async fn collect_limited_stream_retains_only_configured_bytes() {
        let (mut writer, reader) = tokio::io::duplex(8);
        let writer_task = tokio::spawn(async move {
            writer
                .write_all("x".repeat(100).as_bytes())
                .await
                .expect("test stream should be writable");
        });

        let output = collect_limited_stream(reader, 13)
            .await
            .expect("stream should be collected");
        writer_task.await.expect("writer task should finish");

        assert_eq!(output.len(), 13);
    }

    #[test]
    fn client_internal_error_message_is_generic() {
        let message = client_internal_error_message();

        assert_eq!(message, "runner internal error");
        assert!(!message.contains('/'));
        assert!(!message.contains("podman"));
        assert!(!message.contains("workspace"));
    }
}
