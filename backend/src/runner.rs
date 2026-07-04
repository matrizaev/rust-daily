use std::{io, process::Output, time::Instant};

use serde::Deserialize;
use tempfile::TempDir;
use thiserror::Error;
use tokio::{process::Command, time};
use tracing::{info, warn};
use uuid::Uuid;

use crate::{
    config::AppConfig,
    model::{RunResult, RunStatus, ValidatedRunRequest},
    workspace::{WorkspaceError, prepare_workspace},
};

const TRUNCATION_MARKER: &str = "\n[output truncated]\n";

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

#[derive(Debug, Deserialize)]
struct CargoMessage {
    reason: CargoMessageReason,
    message: Option<CargoDiagnostic>,
}

#[derive(Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
enum CargoMessageReason {
    CompilerMessage,
    #[serde(other)]
    Other,
}

#[derive(Debug, Deserialize)]
struct CargoDiagnostic {
    level: CargoDiagnosticLevel,
}

#[derive(Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "lowercase")]
enum CargoDiagnosticLevel {
    Error,
    #[serde(other)]
    Other,
}

pub async fn run(job_id: Uuid, request: ValidatedRunRequest, config: &AppConfig) -> RunResult {
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
    config: &AppConfig,
    started_at: Instant,
) -> Result<RunResult, RunnerError> {
    let workspace = prepare_workspace(job_id, request, config.workspace_root.as_path()).await?;
    let workspace_path = workspace.path().to_path_buf();

    let outcome = execute_podman(&workspace, config).await;

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
    config: &AppConfig,
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
        .arg(config.runner_image.as_str())
        .arg("timeout")
        .arg(inner_timeout)
        .arg("cargo")
        .arg("test")
        .arg("--offline")
        .arg("--message-format=json");

    match time::timeout(outer_timeout, command.output()).await {
        Ok(output) => output.map(PodmanOutcome::Completed),
        Err(_) => Ok(PodmanOutcome::OuterTimeout),
    }
}

fn result_from_output(output: Output, duration_ms: u64, max_output_bytes: usize) -> RunResult {
    let status = classify_status(&output);
    let (stdout, stderr) = cap_output(&output.stdout, &output.stderr, max_output_bytes);

    RunResult::new(status, stdout, stderr, duration_ms)
}

fn classify_status(output: &Output) -> RunStatus {
    if output.status.success() {
        return RunStatus::Passed;
    }

    if output.status.code() == Some(124) {
        return RunStatus::TimedOut;
    }

    if cargo_reported_compiler_error(&output.stdout)
        || cargo_reported_compiler_error(&output.stderr)
    {
        RunStatus::CompileError
    } else {
        RunStatus::Failed
    }
}

fn cargo_reported_compiler_error(output: &[u8]) -> bool {
    String::from_utf8_lossy(output)
        .lines()
        .filter_map(|line| serde_json::from_str::<CargoMessage>(line).ok())
        .any(|message| {
            message.reason == CargoMessageReason::CompilerMessage
                && matches!(
                    message.message,
                    Some(CargoDiagnostic {
                        level: CargoDiagnosticLevel::Error,
                    })
                )
        })
}

fn cap_output(stdout: &[u8], stderr: &[u8], max_output_bytes: usize) -> (String, String) {
    let stdout = String::from_utf8_lossy(stdout).into_owned();
    let stderr = String::from_utf8_lossy(stderr).into_owned();

    if stdout.len().saturating_add(stderr.len()) <= max_output_bytes {
        return (stdout, stderr);
    }

    if max_output_bytes == 0 {
        return (String::new(), String::new());
    }

    let mut stdout_budget = if stdout.is_empty() {
        0
    } else {
        max_output_bytes / non_empty_streams(&stdout, &stderr)
    };
    let mut stderr_budget = max_output_bytes.saturating_sub(stdout_budget);

    if stdout.len() < stdout_budget {
        stdout_budget = stdout.len();
        stderr_budget = max_output_bytes.saturating_sub(stdout_budget);
    }

    if stderr.len() < stderr_budget {
        stderr_budget = stderr.len();
        stdout_budget = max_output_bytes.saturating_sub(stderr_budget);
    }

    (
        truncate_string(&stdout, stdout_budget),
        truncate_string(&stderr, stderr_budget),
    )
}

fn non_empty_streams(stdout: &str, stderr: &str) -> usize {
    let count = usize::from(!stdout.is_empty()) + usize::from(!stderr.is_empty());
    count.max(1)
}

fn truncate_string(value: &str, max_bytes: usize) -> String {
    if value.len() <= max_bytes {
        return value.to_string();
    }

    if max_bytes <= TRUNCATION_MARKER.len() {
        return value
            .chars()
            .scan(0usize, |used, ch| {
                let next = used.saturating_add(ch.len_utf8());
                if next > max_bytes {
                    None
                } else {
                    *used = next;
                    Some(ch)
                }
            })
            .collect();
    }

    let content_budget = max_bytes - TRUNCATION_MARKER.len();
    let mut truncated = String::with_capacity(max_bytes);
    for ch in value.chars() {
        if truncated.len().saturating_add(ch.len_utf8()) > content_budget {
            break;
        }
        truncated.push(ch);
    }
    truncated.push_str(TRUNCATION_MARKER);
    truncated
}

fn elapsed_ms(started_at: Instant) -> u64 {
    let millis = started_at.elapsed().as_millis();
    millis.min(u128::from(u64::MAX)) as u64
}

#[cfg(test)]
mod tests {
    use std::{os::unix::process::ExitStatusExt, process::ExitStatus};

    use super::{cap_output, classify_status};
    use crate::model::RunStatus;

    fn output(status: i32, stdout: &str, stderr: &str) -> std::process::Output {
        std::process::Output {
            status: ExitStatus::from_raw(status << 8),
            stdout: stdout.as_bytes().to_vec(),
            stderr: stderr.as_bytes().to_vec(),
        }
    }

    #[test]
    fn classifies_successful_output_as_passed() {
        assert_eq!(
            classify_status(&output(0, "running 1 test", "")),
            RunStatus::Passed
        );
    }

    #[test]
    fn classifies_compile_errors_distinctly() {
        assert_eq!(
            classify_status(&output(
                101,
                r#"{"reason":"compiler-message","message":{"level":"error"}}"#,
                "",
            )),
            RunStatus::CompileError
        );
    }

    #[test]
    fn classifies_test_failures_as_failed() {
        assert_eq!(
            classify_status(&output(
                101,
                "test answer_is_42 ... FAILED",
                "error: test failed, to rerun pass `--test lesson`",
            )),
            RunStatus::Failed
        );
    }

    #[test]
    fn classifies_inner_timeout_exit_code() {
        assert_eq!(classify_status(&output(124, "", "")), RunStatus::TimedOut);
    }

    #[test]
    fn caps_combined_output() {
        let (stdout, stderr) =
            cap_output("a".repeat(100).as_bytes(), "b".repeat(100).as_bytes(), 80);

        assert!(stdout.len() + stderr.len() <= 80);
        assert!(stdout.contains("[output truncated]"));
        assert!(stderr.contains("[output truncated]"));
    }
}
