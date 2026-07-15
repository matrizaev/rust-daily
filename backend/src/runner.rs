//! Restricted Podman runner for validated lesson snapshots.
//!
//! This module owns container lifecycle, runtime preflight checks, Cargo
//! execution, output limits, deadline handling, and cleanup for untrusted Rust.

use std::{
    ffi::{OsStr, OsString},
    io,
    path::{Path, PathBuf},
    process::{ExitStatus, Output, Stdio},
    sync::Arc,
    time::Instant,
};

use tempfile::TempDir;
use thiserror::Error;
use tokio::{
    io::{AsyncRead, AsyncReadExt},
    process::Command,
    sync::{Mutex, mpsc},
    task::JoinError,
    time,
};
use tokio_util::sync::CancellationToken;
use tracing::{info, warn};
use uuid::Uuid;

use crate::{
    cargo_output::{
        CargoOutputStatus, cap_output, diagnostic_text, output_status, result_from_output,
    },
    config::RunnerSettings,
    dependency_set::DependencySet,
    model::{
        LearnerOutcome, RunDeadline, RunMode, RunStatus, ServiceFailure, ValidatedCompileFailCase,
        ValidatedRunRequest,
    },
    workspace::{TestTargetName, WorkspaceError, prepare_workspace, write_compile_fail_case},
};

#[derive(Debug, Clone)]
struct ProcessCommandSpec {
    program: PathBuf,
    args: Vec<OsString>,
}

impl ProcessCommandSpec {
    fn new(program: &Path) -> Self {
        Self {
            program: program.to_path_buf(),
            args: Vec::new(),
        }
    }

    fn arg(&mut self, value: impl AsRef<OsStr>) -> &mut Self {
        self.args.push(value.as_ref().to_os_string());
        self
    }

    fn args<I, S>(&mut self, values: I) -> &mut Self
    where
        I: IntoIterator<Item = S>,
        S: AsRef<OsStr>,
    {
        self.args.extend(
            values
                .into_iter()
                .map(|value| value.as_ref().to_os_string()),
        );
        self
    }

    fn command(&self) -> Command {
        let mut command = Command::new(&self.program);
        command.kill_on_drop(true).args(&self.args);
        command
    }
}

trait ProcessExecutor: Send + Sync + 'static {
    fn command(&self, spec: &ProcessCommandSpec) -> Command;
}

#[derive(Clone, Copy)]
struct TokioProcessExecutor;

impl ProcessExecutor for TokioProcessExecutor {
    fn command(&self, spec: &ProcessCommandSpec) -> Command {
        spec.command()
    }
}

/// Queue-compatible runner implementation backed by rootless Podman.
#[derive(Clone)]
pub struct PodmanLessonRunner {
    config: Arc<RunnerSettings>,
    executor: Arc<dyn ProcessExecutor>,
}

impl PodmanLessonRunner {
    /// Creates a runner that shares validated runner settings.
    pub fn new(config: Arc<RunnerSettings>) -> Self {
        Self {
            config,
            executor: Arc::new(TokioProcessExecutor),
        }
    }

    #[cfg(test)]
    fn new_with_executor(config: Arc<RunnerSettings>, executor: Arc<dyn ProcessExecutor>) -> Self {
        Self { config, executor }
    }
}

impl crate::queue::LessonRunner for PodmanLessonRunner {
    async fn run(
        &self,
        job_id: Uuid,
        request: ValidatedRunRequest,
        deadline: RunDeadline,
        cancellation: CancellationToken,
    ) -> Result<LearnerOutcome, ServiceFailure> {
        let started_at = Instant::now();

        if deadline.is_elapsed() {
            warn!(%job_id, "job expired before runner started");
            return Err(ServiceFailure::new(job_id));
        }

        match run_inner(
            job_id,
            &request,
            &self.config,
            deadline,
            &cancellation,
            started_at,
            self.executor.as_ref(),
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(RunnerError::Podman(error)) if error.kind() == io::ErrorKind::TimedOut => {
                Ok(timeout_result(started_at, &self.config))
            }
            Err(error) => {
                warn!(%job_id, error = %error, "runner internal error");

                Err(ServiceFailure::new(job_id))
            }
        }
    }
}

/// Internal runner failures that should not be reported as learner mistakes.
#[derive(Debug, Error)]
pub enum RunnerError {
    /// Workspace preparation failed before Podman execution.
    #[error(transparent)]
    Workspace(#[from] WorkspaceError),
    /// Podman or process IO failed.
    #[error("failed to execute Podman runner: {0}")]
    Podman(#[from] io::Error),
    /// Podman or the container runtime exited with an infrastructure failure.
    #[error("Podman or container runtime failed with exit code {code:?}")]
    ContainerRuntime {
        /// Process exit code, when one was available.
        code: Option<i32>,
    },
    /// rustc reported an internal compiler error.
    #[error("rustc reported an internal compiler error")]
    InternalCompiler,
    /// Raw runner output exceeded configured capture limits.
    #[error("runner process output exceeded the configured limit")]
    OutputLimitExceeded,
    /// The caller cancelled the run.
    #[error("runner execution was cancelled")]
    Cancelled,
}

enum PodmanOutcome {
    Completed(Output),
    OuterTimeout,
    OutputLimitExceeded,
    Cancelled,
}

enum ChildWaitOutcome {
    Completed(io::Result<ExitStatus>),
    Timeout,
    OutputLimitExceeded,
    Cancelled,
}

struct StreamCapture {
    output: Vec<u8>,
    exceeded: bool,
}

struct PodmanContainer<'a> {
    name: String,
    config: &'a RunnerSettings,
    deadline: RunDeadline,
    cancellation: &'a CancellationToken,
    executor: &'a dyn ProcessExecutor,
}

impl<'a> PodmanContainer<'a> {
    async fn start(
        job_id: Uuid,
        input: &TempDir,
        dependency_set: DependencySet,
        config: &'a RunnerSettings,
        deadline: RunDeadline,
        cancellation: &'a CancellationToken,
        executor: &'a dyn ProcessExecutor,
    ) -> Result<Self, io::Error> {
        let name = format!("rust-daily-{}", job_id.simple());
        let input_mount = format!("{}:/input:ro,Z", input.path().display());
        let workspace_tmpfs = format!(
            "/workspace:rw,exec,nosuid,nodev,size={}",
            config.workspace_tmpfs_bytes.get()
        );
        let timeout_seconds = duration_seconds_ceil(deadline.remaining()).max(1);
        let container = Self {
            name,
            config,
            deadline,
            cancellation,
            executor,
        };
        let spec = start_container_command_spec(
            config,
            &container.name,
            job_id,
            &input_mount,
            &workspace_tmpfs,
            dependency_set,
            timeout_seconds,
        );
        let mut command = executor.command(&spec);

        let output = match execute_control_command(&mut command, deadline, cancellation).await {
            Ok(output) => output,
            Err(error) => {
                let _ = container.cleanup().await;
                return Err(error);
            }
        };
        if let Err(error) = ensure_control_success("start Podman container", &output) {
            let _ = container.cleanup().await;
            return Err(error);
        }
        if let Err(error) = container.prepare_workspace().await {
            let _ = container.cleanup().await;
            return Err(error);
        }

        Ok(container)
    }

    async fn prepare_workspace(&self) -> Result<(), io::Error> {
        let spec = prepare_workspace_command_spec(self.config, &self.name);
        let mut command = self.executor.command(&spec);

        let output =
            execute_control_command(&mut command, self.deadline, self.cancellation).await?;
        ensure_control_success("prepare container workspace", &output)
    }

    async fn execute(
        &self,
        cargo_command: crate::dependency_set::CargoTestCommand,
    ) -> Result<PodmanOutcome, io::Error> {
        execute_podman_command(
            &self.name,
            cargo_command,
            self.config,
            self.deadline,
            self.cancellation,
            self.executor,
        )
        .await
    }

    async fn cleanup(&self) -> Result<(), io::Error> {
        let spec = cleanup_container_command_spec(self.config, &self.name);
        let mut command = self.executor.command(&spec);

        let output = time::timeout(self.config.cleanup_timeout, command.output())
            .await
            .map_err(|_| {
                io::Error::new(
                    io::ErrorKind::TimedOut,
                    "Podman container cleanup timed out",
                )
            })??;
        ensure_control_success("remove Podman container", &output)
    }
}

fn start_container_command_spec(
    config: &RunnerSettings,
    container_name: &str,
    job_id: Uuid,
    input_mount: &str,
    workspace_tmpfs: &str,
    dependency_set: DependencySet,
    timeout_seconds: u64,
) -> ProcessCommandSpec {
    let mut spec = ProcessCommandSpec::new(config.podman_path.as_ref());
    spec.args(["--cgroup-manager", "cgroupfs", "run", "--detach", "--name"])
        .arg(container_name)
        .args(["--label", "io.rust-daily.managed=true", "--label"])
        .arg(format!("io.rust-daily.job-id={job_id}"))
        .args(["--rm", "--pull", "never", "--timeout"])
        .arg(timeout_seconds.to_string())
        .args(["--network", "none", "--memory"])
        .arg(config.container_memory_bytes.get().to_string())
        .args(["--memory-swap"])
        .arg(config.container_memory_bytes.get().to_string())
        .args(["--cpus"])
        .arg(config.container_cpus.to_string())
        .args(["--pids-limit"])
        .arg(config.container_pids_limit.get().to_string())
        .args(["--ulimit"])
        .arg(config.core_ulimit.to_string())
        .args([
            "--read-only",
            "--http-proxy=false",
            "--log-driver",
            "none",
            "--tmpfs",
        ])
        .arg(format!(
            "/tmp:rw,noexec,nosuid,nodev,size={}",
            config.tmp_tmpfs_bytes.get()
        ))
        .args(["--tmpfs"])
        .arg(workspace_tmpfs);
    if dependency_set == DependencySet::Advanced {
        // An anonymous volume is seeded from the image's precompiled target
        // directory. Cleanup removes it with the container, keeping learner
        // writes isolated without charging the dependency cache to the
        // container's `/workspace` tmpfs.
        spec.args(["--mount", "type=volume,destination=/opt/rust-daily-target"]);
    }
    spec.args([
        "--user",
        "0:0",
        "--security-opt",
        "no-new-privileges",
        "--cap-drop",
        "all",
        "-v",
    ])
    .arg(input_mount)
    .args(["-w", "/workspace"])
    .arg(config.image.as_ref())
    .args(["sh", "-c", "chmod 1777 /workspace && exec sleep infinity"]);
    spec
}

fn prepare_workspace_command_spec(
    config: &RunnerSettings,
    container_name: &str,
) -> ProcessCommandSpec {
    let mut spec = ProcessCommandSpec::new(config.podman_path.as_ref());
    spec.args(["exec"]).arg(container_name).args([
        "sh",
        "-c",
        "cp -a /input/. /workspace/ && chmod 1777 /workspace",
    ]);
    spec
}

fn cleanup_container_command_spec(
    config: &RunnerSettings,
    container_name: &str,
) -> ProcessCommandSpec {
    let mut spec = ProcessCommandSpec::new(config.podman_path.as_ref());
    spec.args(["rm", "--force", "--ignore", "--volumes", "--time", "0"])
        .arg(container_name);
    spec
}

fn cargo_command_spec(
    container_name: &str,
    cargo_command: &crate::dependency_set::CargoTestCommand,
    config: &RunnerSettings,
    outer_timeout: std::time::Duration,
) -> ProcessCommandSpec {
    let mut spec = ProcessCommandSpec::new(config.podman_path.as_ref());
    spec.args([
        "--cgroup-manager",
        "cgroupfs",
        "exec",
        "--user",
        "10001:10001",
    ])
    .arg(container_name)
    .args(["timeout", "--kill-after=1s"])
    .arg(format!("{}s", duration_seconds_ceil(outer_timeout).max(1)))
    .arg(cargo_command.program)
    .args(&cargo_command.args)
    .args(["--offline", "--message-format=json"]);
    spec
}

async fn execute_control_command(
    command: &mut Command,
    deadline: RunDeadline,
    cancellation: &CancellationToken,
) -> Result<Output, io::Error> {
    let remaining = deadline.remaining();
    if remaining.is_zero() {
        return Err(io::Error::new(
            io::ErrorKind::TimedOut,
            "run deadline elapsed",
        ));
    }

    tokio::select! {
        result = time::timeout(remaining, command.output()) => {
            result.map_err(|_| io::Error::new(
                io::ErrorKind::TimedOut,
                "run deadline elapsed",
            ))?
        }
        () = cancellation.cancelled() => Err(io::Error::new(
            io::ErrorKind::Interrupted,
            "run cancelled",
        )),
    }
}

fn ensure_control_success(action: &str, output: &Output) -> Result<(), io::Error> {
    if output.status.success() {
        return Ok(());
    }

    let details = String::from_utf8_lossy(&output.stderr);
    Err(io::Error::other(format!(
        "{action} failed with status {:?}: {}",
        output.status.code(),
        details.trim()
    )))
}

fn duration_seconds_ceil(duration: std::time::Duration) -> u64 {
    duration
        .as_secs()
        .saturating_add(u64::from(duration.subsec_nanos() > 0))
}

/// Verifies local Podman prerequisites and removes stale managed containers.
pub async fn initialize_runtime(config: &RunnerSettings) -> Result<(), io::Error> {
    if ["CONTAINER_HOST", "CONTAINER_CONNECTION"]
        .iter()
        .any(|name| std::env::var_os(name).is_some())
    {
        return Err(io::Error::other(
            "remote Podman configuration is not allowed for the lesson runner",
        ));
    }

    let mut info = Command::new(config.podman_path.as_ref());
    info.arg("info").arg("--format").arg("json");
    let output = time::timeout(config.cleanup_timeout, info.output())
        .await
        .map_err(|_| {
            io::Error::new(
                io::ErrorKind::TimedOut,
                "Podman runtime preflight timed out",
            )
        })??;
    ensure_control_success("inspect Podman runtime", &output)?;
    let info: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|error| io::Error::other(format!("invalid Podman info JSON: {error}")))?;
    if find_boolean_field(&info, "rootless") != Some(true) {
        return Err(io::Error::other("lesson runner requires rootless Podman"));
    }

    let mut image = Command::new(config.podman_path.as_ref());
    image.arg("image").arg("exists").arg(config.image.as_ref());
    let output = time::timeout(config.cleanup_timeout, image.output())
        .await
        .map_err(|_| {
            io::Error::new(io::ErrorKind::TimedOut, "Podman image preflight timed out")
        })??;
    ensure_control_success("find configured runner image", &output)?;

    reap_stale_containers(config).await
}

async fn reap_stale_containers(config: &RunnerSettings) -> Result<(), io::Error> {
    let mut list = Command::new(config.podman_path.as_ref());
    list.arg("ps")
        .arg("--all")
        .arg("--quiet")
        .arg("--filter")
        .arg("label=io.rust-daily.managed=true");
    let output = time::timeout(config.cleanup_timeout, list.output())
        .await
        .map_err(|_| {
            io::Error::new(
                io::ErrorKind::TimedOut,
                "listing managed containers timed out",
            )
        })??;
    ensure_control_success("list managed containers", &output)?;

    for id in String::from_utf8_lossy(&output.stdout)
        .lines()
        .map(str::trim)
        .filter(|id| !id.is_empty())
    {
        let mut remove = Command::new(config.podman_path.as_ref());
        remove
            .arg("rm")
            .arg("--force")
            .arg("--ignore")
            .arg("--volumes")
            .arg("--time")
            .arg("0")
            .arg(id);
        let output = time::timeout(config.cleanup_timeout, remove.output())
            .await
            .map_err(|_| {
                io::Error::new(io::ErrorKind::TimedOut, "stale container cleanup timed out")
            })??;
        ensure_control_success("remove stale managed container", &output)?;
        warn!(container_id = id, "removed stale managed runner container");
    }

    Ok(())
}

fn find_boolean_field(value: &serde_json::Value, field: &str) -> Option<bool> {
    match value {
        serde_json::Value::Object(entries) => {
            for (name, value) in entries {
                if name.eq_ignore_ascii_case(field)
                    && let Some(value) = value.as_bool()
                {
                    return Some(value);
                }

                if let Some(value) = find_boolean_field(value, field) {
                    return Some(value);
                }
            }
            None
        }
        serde_json::Value::Array(values) => values
            .iter()
            .find_map(|value| find_boolean_field(value, field)),
        _ => None,
    }
}

async fn run_inner(
    job_id: Uuid,
    request: &ValidatedRunRequest,
    config: &RunnerSettings,
    deadline: RunDeadline,
    cancellation: &CancellationToken,
    started_at: Instant,
    executor: &dyn ProcessExecutor,
) -> Result<LearnerOutcome, RunnerError> {
    let workspace = prepare_workspace(job_id, request, config.workspace_root.as_ref()).await?;
    let workspace_path = workspace.path().to_path_buf();

    if request.mode() == RunMode::CompileFail {
        for case in request.compile_fail_cases() {
            write_compile_fail_case(workspace.path(), case).await?;
        }
    }

    let container = PodmanContainer::start(
        job_id,
        &workspace,
        request.dependency_set(),
        config,
        deadline,
        cancellation,
        executor,
    )
    .await?;

    let result = match request.mode() {
        RunMode::CargoTest => {
            run_cargo_test(&container, request.dependency_set(), config, started_at).await
        }
        RunMode::CompileFail => run_compile_fail(&container, request, config, started_at).await,
    };

    if let Err(error) = container.cleanup().await {
        warn!(%job_id, error = %error, container = %container.name, "container cleanup failed");
    }

    match tokio::task::spawn_blocking(move || workspace.close()).await {
        Ok(Ok(())) => {}
        Ok(Err(error)) => {
            warn!(%job_id, error = %error, path = ?workspace_path, "workspace cleanup failed");
        }
        Err(error) => {
            warn!(%job_id, error = %error, path = ?workspace_path, "workspace cleanup task failed");
        }
    }

    result
}

async fn run_cargo_test(
    container: &PodmanContainer<'_>,
    dependency_set: DependencySet,
    config: &RunnerSettings,
    started_at: Instant,
) -> Result<LearnerOutcome, RunnerError> {
    let outcome = container.execute(dependency_set.test_command()).await;
    let duration_ms = elapsed_ms(started_at);

    match outcome? {
        PodmanOutcome::Completed(output) => {
            let status = output_status(&output);
            if matches!(
                status,
                CargoOutputStatus::CargoError
                    | CargoOutputStatus::InfrastructureError
                    | CargoOutputStatus::InternalCompilerError
            ) {
                warn!(
                    container = %container.name,
                    ?status,
                    exit_code = ?output.status.code(),
                    stdout = %log_output(&output.stdout),
                    stderr = %log_output(&output.stderr),
                    "runner command failed internally"
                );
            }

            result_from_output(output, duration_ms, config.max_output_bytes.get())
                .ok_or(RunnerError::ContainerRuntime { code: None })
        }
        PodmanOutcome::OuterTimeout => Ok(timeout_result(started_at, config)),
        PodmanOutcome::OutputLimitExceeded => Ok(output_limit_result(started_at, config)),
        PodmanOutcome::Cancelled => Err(RunnerError::Cancelled),
    }
}

async fn run_compile_fail(
    container: &PodmanContainer<'_>,
    request: &ValidatedRunRequest,
    config: &RunnerSettings,
    started_at: Instant,
) -> Result<LearnerOutcome, RunnerError> {
    let dependency_set = request.dependency_set();
    let lib_outcome = container
        .execute(dependency_set.check_lib_command())
        .await?;

    match lib_outcome {
        PodmanOutcome::OuterTimeout => {
            return Ok(timeout_result(started_at, config));
        }
        PodmanOutcome::OutputLimitExceeded => {
            return Ok(output_limit_result(started_at, config));
        }
        PodmanOutcome::Cancelled => return Err(RunnerError::Cancelled),
        PodmanOutcome::Completed(output) => match output_status(&output) {
            CargoOutputStatus::Success => {}
            CargoOutputStatus::TimedOut => return Ok(timeout_result(started_at, config)),
            CargoOutputStatus::CompilerError => {
                return result_from_output(
                    output,
                    elapsed_ms(started_at),
                    config.max_output_bytes.get(),
                )
                .ok_or(RunnerError::ContainerRuntime { code: None });
            }
            CargoOutputStatus::Failure => {
                return result_from_output(
                    output,
                    elapsed_ms(started_at),
                    config.max_output_bytes.get(),
                )
                .ok_or(RunnerError::ContainerRuntime { code: None });
            }
            CargoOutputStatus::CargoError => {
                return Err(RunnerError::ContainerRuntime {
                    code: output.status.code(),
                });
            }
            CargoOutputStatus::InfrastructureError => {
                return Err(RunnerError::ContainerRuntime {
                    code: output.status.code(),
                });
            }
            CargoOutputStatus::InternalCompilerError => {
                return Err(RunnerError::InternalCompiler);
            }
        },
    }

    let mut summaries = Vec::new();
    let mut failures = Vec::new();
    let mut diagnostics = Vec::new();

    for case in request.compile_fail_cases() {
        let case_result = run_compile_fail_case(container, dependency_set, case).await?;

        match case_result {
            CompileFailCaseResult::FailedAsExpected {
                name,
                diagnostics: case_diagnostics,
            } => {
                summaries.push(format!("Compile-fail case `{name}` failed as expected."));
                diagnostics.push(format!("case `{name}` diagnostics:\n{case_diagnostics}"));
            }
            CompileFailCaseResult::CompiledUnexpectedly { name } => {
                let message = format!(
                    "Compile-fail case `{name}` compiled successfully, but it was expected to fail."
                );
                summaries.push(message.clone());
                failures.push(message);
            }
            CompileFailCaseResult::WrongDiagnostics {
                name,
                missing,
                forbidden,
                diagnostics: case_diagnostics,
            } => {
                let mut messages = Vec::new();
                messages.extend(
                    missing
                        .into_iter()
                        .map(|snippet| format!("missing expected diagnostic `{snippet}`")),
                );
                messages.extend(
                    forbidden
                        .into_iter()
                        .map(|snippet| format!("included forbidden diagnostic `{snippet}`")),
                );
                let message = format!(
                    "Compile-fail case `{name}` failed for the wrong reason: {}.",
                    messages.join(", ")
                );
                summaries.push(message.clone());
                failures.push(message);
                diagnostics.push(format!("case `{name}` diagnostics:\n{case_diagnostics}"));
            }
            CompileFailCaseResult::TimedOut => return Ok(timeout_result(started_at, config)),
            CompileFailCaseResult::OutputLimitExceeded => {
                return Ok(output_limit_result(started_at, config));
            }
        }
    }

    let status = if failures.is_empty() {
        RunStatus::Passed
    } else {
        RunStatus::Failed
    };
    let stdout = summaries.join("\n");
    let stderr = if failures.is_empty() {
        String::new()
    } else {
        diagnostics.join("\n\n")
    };
    let (stdout, stderr) = cap_output(
        stdout.as_bytes(),
        stderr.as_bytes(),
        config.max_output_bytes.get(),
    );

    Ok(LearnerOutcome::new(
        status,
        stdout,
        stderr,
        elapsed_ms(started_at),
    ))
}

enum CompileFailCaseResult {
    FailedAsExpected {
        name: String,
        diagnostics: String,
    },
    CompiledUnexpectedly {
        name: String,
    },
    WrongDiagnostics {
        name: String,
        missing: Vec<String>,
        forbidden: Vec<String>,
        diagnostics: String,
    },
    TimedOut,
    OutputLimitExceeded,
}

async fn run_compile_fail_case(
    container: &PodmanContainer<'_>,
    dependency_set: DependencySet,
    case: &ValidatedCompileFailCase,
) -> Result<CompileFailCaseResult, RunnerError> {
    let target_name = TestTargetName::from(case);
    let outcome = container
        .execute(dependency_set.check_test_command(target_name.as_str()))
        .await?;
    let name = case.name().as_str().to_string();

    let output = match outcome {
        PodmanOutcome::OuterTimeout => return Ok(CompileFailCaseResult::TimedOut),
        PodmanOutcome::OutputLimitExceeded => {
            return Ok(CompileFailCaseResult::OutputLimitExceeded);
        }
        PodmanOutcome::Cancelled => return Err(RunnerError::Cancelled),
        PodmanOutcome::Completed(output) => output,
    };

    match output_status(&output) {
        CargoOutputStatus::Success => Ok(CompileFailCaseResult::CompiledUnexpectedly { name }),
        CargoOutputStatus::TimedOut => Ok(CompileFailCaseResult::TimedOut),
        CargoOutputStatus::CompilerError => {
            let diagnostics = diagnostic_text(&output);
            let missing = case
                .expected_diagnostics()
                .iter()
                .filter(|snippet| !diagnostics.contains(snippet.as_str()))
                .map(|snippet| snippet.as_str().to_string())
                .collect::<Vec<_>>();
            let forbidden = case
                .forbidden_diagnostics()
                .iter()
                .filter(|snippet| diagnostics.contains(snippet.as_str()))
                .map(|snippet| snippet.as_str().to_string())
                .collect::<Vec<_>>();

            if missing.is_empty() && forbidden.is_empty() {
                Ok(CompileFailCaseResult::FailedAsExpected { name, diagnostics })
            } else {
                Ok(CompileFailCaseResult::WrongDiagnostics {
                    name,
                    missing,
                    forbidden,
                    diagnostics,
                })
            }
        }
        CargoOutputStatus::Failure
        | CargoOutputStatus::CargoError
        | CargoOutputStatus::InfrastructureError => Err(RunnerError::ContainerRuntime {
            code: output.status.code(),
        }),
        CargoOutputStatus::InternalCompilerError => Err(RunnerError::InternalCompiler),
    }
}

fn timeout_result(started_at: Instant, config: &RunnerSettings) -> LearnerOutcome {
    info!("outer runner timeout elapsed");
    LearnerOutcome::new(
        RunStatus::TimedOut,
        String::new(),
        format!(
            "runner timed out after {} seconds",
            config.timeout.as_secs()
        ),
        elapsed_ms(started_at),
    )
}

fn output_limit_result(started_at: Instant, config: &RunnerSettings) -> LearnerOutcome {
    LearnerOutcome::new(
        RunStatus::Failed,
        String::new(),
        format!(
            "runner output exceeded {} bytes",
            config.max_process_output_bytes.get()
        ),
        elapsed_ms(started_at),
    )
}

async fn execute_podman_command(
    container_name: &str,
    cargo_command: crate::dependency_set::CargoTestCommand,
    config: &RunnerSettings,
    deadline: RunDeadline,
    cancellation: &CancellationToken,
    executor: &dyn ProcessExecutor,
) -> Result<PodmanOutcome, io::Error> {
    let outer_timeout = deadline.remaining();
    if outer_timeout.is_zero() {
        return Ok(PodmanOutcome::OuterTimeout);
    }

    let spec = cargo_command_spec(container_name, &cargo_command, config, outer_timeout);
    let mut command = executor.command(&spec);
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
    let retained_bytes = config.max_process_output_bytes.get();
    let output_budget = Arc::new(Mutex::new(retained_bytes));
    let (limit_tx, mut limit_rx) = mpsc::channel(1);
    let mut stdout_task = tokio::spawn(collect_limited_stream(
        stdout,
        retained_bytes,
        Arc::clone(&output_budget),
        limit_tx.clone(),
    ));
    let mut stderr_task = tokio::spawn(collect_limited_stream(
        stderr,
        retained_bytes,
        output_budget,
        limit_tx,
    ));
    let wait_outcome = {
        let wait = time::timeout(outer_timeout, child.wait());
        tokio::pin!(wait);

        tokio::select! {
            result = &mut wait => match result {
                Ok(status) => ChildWaitOutcome::Completed(status),
                Err(_) => ChildWaitOutcome::Timeout,
            },
            Some(()) = limit_rx.recv() => ChildWaitOutcome::OutputLimitExceeded,
            () = cancellation.cancelled() => ChildWaitOutcome::Cancelled,
        }
    };

    let status = match wait_outcome {
        ChildWaitOutcome::Completed(status) => status?,
        ChildWaitOutcome::Timeout => {
            let _ = child.kill().await;
            abort_output_tasks(&mut stdout_task, &mut stderr_task).await;
            return Ok(PodmanOutcome::OuterTimeout);
        }
        ChildWaitOutcome::OutputLimitExceeded => {
            let _ = child.kill().await;
            abort_output_tasks(&mut stdout_task, &mut stderr_task).await;
            return Ok(PodmanOutcome::OutputLimitExceeded);
        }
        ChildWaitOutcome::Cancelled => {
            let _ = child.kill().await;
            abort_output_tasks(&mut stdout_task, &mut stderr_task).await;
            return Ok(PodmanOutcome::Cancelled);
        }
    };

    let remaining = deadline.remaining();
    if remaining.is_zero() {
        abort_output_tasks(&mut stdout_task, &mut stderr_task).await;
        return Ok(PodmanOutcome::OuterTimeout);
    }
    let captures = time::timeout(remaining, async {
        let stdout = join_output_task(&mut stdout_task).await?;
        let stderr = join_output_task(&mut stderr_task).await?;
        Ok::<_, io::Error>((stdout, stderr))
    })
    .await;
    let (stdout, stderr) = match captures {
        Ok(captures) => captures?,
        Err(_) => {
            abort_output_tasks(&mut stdout_task, &mut stderr_task).await;
            return Ok(PodmanOutcome::OuterTimeout);
        }
    };
    if stdout.exceeded || stderr.exceeded {
        return Ok(PodmanOutcome::OutputLimitExceeded);
    }

    Ok(PodmanOutcome::Completed(Output {
        status,
        stdout: stdout.output,
        stderr: stderr.output,
    }))
}

async fn collect_limited_stream<R>(
    mut stream: R,
    max_bytes: usize,
    remaining_budget: Arc<Mutex<usize>>,
    limit_tx: mpsc::Sender<()>,
) -> io::Result<StreamCapture>
where
    R: AsyncRead + Unpin,
{
    let mut output = Vec::with_capacity(max_bytes.min(8192));
    let mut buffer = [0u8; 8192];

    loop {
        let read = stream.read(&mut buffer).await?;
        if read == 0 {
            return Ok(StreamCapture {
                output,
                exceeded: false,
            });
        }

        let retained = {
            let mut remaining = remaining_budget.lock().await;
            let retained = read.min(*remaining);
            *remaining -= retained;
            retained
        };
        output.extend_from_slice(&buffer[..retained]);

        if read > retained {
            let _ = limit_tx.try_send(());
            return Ok(StreamCapture {
                output,
                exceeded: true,
            });
        }
    }
}

async fn join_output_task(
    task: &mut tokio::task::JoinHandle<io::Result<StreamCapture>>,
) -> io::Result<StreamCapture> {
    match task.await {
        Ok(result) => result,
        Err(error) => Err(join_error(error)),
    }
}

async fn abort_output_tasks(
    stdout_task: &mut tokio::task::JoinHandle<io::Result<StreamCapture>>,
    stderr_task: &mut tokio::task::JoinHandle<io::Result<StreamCapture>>,
) {
    stdout_task.abort();
    stderr_task.abort();
    let _ = stdout_task.await;
    let _ = stderr_task.await;
}

fn join_error(error: JoinError) -> io::Error {
    io::Error::other(format!("Podman output reader task failed: {error}"))
}

fn elapsed_ms(started_at: Instant) -> u64 {
    let millis = started_at.elapsed().as_millis();
    millis.min(u128::from(u64::MAX)) as u64
}

fn log_output(output: &[u8]) -> String {
    const MAX_LOG_CHARS: usize = 4096;

    String::from_utf8_lossy(output)
        .chars()
        .take(MAX_LOG_CHARS)
        .collect()
}

#[cfg(test)]
mod tests {
    use std::{
        num::{NonZeroU64, NonZeroUsize},
        os::unix::process::ExitStatusExt,
        path::PathBuf,
        process::{ExitStatus, Output},
        sync::{Arc, Mutex as StdMutex},
        time::Duration,
    };

    use tokio::sync::Mutex;
    use tokio::{io::AsyncWriteExt, process::Command, sync::mpsc};
    use tokio_util::sync::CancellationToken;
    use uuid::Uuid;

    use super::{
        PodmanLessonRunner, ProcessCommandSpec, ProcessExecutor, collect_limited_stream,
        ensure_control_success, find_boolean_field, log_output,
    };
    use crate::{
        config::{
            ContainerCpus, CoreUlimit, PodmanPath, RunnerImage, RunnerSettings, WorkspaceRoot,
        },
        dependency_set::DependencySet,
        model::{
            RunDeadline, RunRequest, RunRequestValidation, RunStatus, SubmittedCompileFailCase,
            SubmittedFile, ValidatedRunRequest, ValidationLimits,
        },
        queue::LessonRunner,
    };

    #[derive(Clone, Copy, Default)]
    enum FakeCargoBehavior {
        #[default]
        Success,
        CompileError,
        OutputFlood,
        CompileFailCaseOutputFlood,
        TimedOut,
        InfrastructureError,
        Slow,
    }

    #[derive(Clone, Default)]
    struct FakeProcessExecutor {
        specs: Arc<StdMutex<Vec<ProcessCommandSpec>>>,
        cargo_behavior: FakeCargoBehavior,
    }

    impl ProcessExecutor for FakeProcessExecutor {
        fn command(&self, spec: &ProcessCommandSpec) -> Command {
            self.specs
                .lock()
                .expect("fake executor lock should be available")
                .push(spec.clone());

            let args = args(spec);
            if !args.contains(&"--message-format=json".to_string()) {
                return Command::new("/usr/bin/true");
            }

            match self.cargo_behavior {
                FakeCargoBehavior::Success => Command::new("/usr/bin/true"),
                FakeCargoBehavior::CompileError if args.contains(&"--lib".to_string()) => {
                    Command::new("/usr/bin/true")
                }
                FakeCargoBehavior::CompileError => shell_command(&format!(
                    "printf '%s\\n' '{}'; exit 101",
                    compiler_error_message()
                )),
                FakeCargoBehavior::OutputFlood => shell_command("head -c 10000 /dev/zero; exit 0"),
                FakeCargoBehavior::CompileFailCaseOutputFlood
                    if args.contains(&"--lib".to_string()) =>
                {
                    Command::new("/usr/bin/true")
                }
                FakeCargoBehavior::CompileFailCaseOutputFlood => {
                    shell_command("head -c 10000 /dev/zero; exit 0")
                }
                FakeCargoBehavior::TimedOut => shell_command("exit 124"),
                FakeCargoBehavior::InfrastructureError => shell_command("exit 125"),
                FakeCargoBehavior::Slow => shell_command("sleep 5"),
            }
        }
    }

    fn shell_command(script: &str) -> Command {
        let mut command = Command::new("/bin/sh");
        command.arg("-c").arg(script);
        command
    }

    fn compiler_error_message() -> &'static str {
        r#"{"reason":"compiler-message","package_id":"path+file:///workspace#rust_daily_lesson@0.1.0","manifest_path":"/workspace/Cargo.toml","target":{"kind":["test"],"crate_types":["bin"],"name":"compile_fail_case","src_path":"/workspace/tests/case.rs","edition":"2024","doc":false,"doctest":false,"test":true},"message":{"message":"private field","code":null,"level":"error","spans":[],"children":[],"rendered":"error: private field\n"}}"#
    }

    fn nonzero(value: usize) -> NonZeroUsize {
        NonZeroUsize::new(value).expect("test limit should be nonzero")
    }

    fn validated_request() -> ValidatedRunRequest {
        validated_request_with_dependency_set(DependencySet::Std)
    }

    fn validated_request_with_dependency_set(dependency_set: DependencySet) -> ValidatedRunRequest {
        RunRequestValidation::new(
            RunRequest::with_dependency_set(
                vec![
                    SubmittedFile::new("src/lib.rs", "pub fn answer() -> u8 { 42 }\n"),
                    SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer() {}\n"),
                ],
                dependency_set,
            ),
            ValidationLimits::try_new(
                nonzero(8),
                nonzero(65_536),
                nonzero(262_144),
                nonzero(240),
                nonzero(120),
                nonzero(16),
                nonzero(512),
                nonzero(8192),
            )
            .expect("test limits should be valid"),
        )
        .try_into()
        .expect("test request should be valid")
    }

    fn validated_compile_fail_request(expected: &str) -> ValidatedRunRequest {
        RunRequestValidation::new(
            RunRequest::compile_fail(
                vec![
                    SubmittedFile::new("src/lib.rs", "pub struct UserId(u64);\n"),
                    SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer() {}\n"),
                ],
                vec![SubmittedCompileFailCase::new(
                    "private-field",
                    "compile_fail/private_field.rs",
                    "use rust_daily_lesson::UserId;\nfn main() { let _ = UserId(1); }\n",
                    vec![expected.to_string()],
                )],
                DependencySet::Std,
            ),
            ValidationLimits::try_new(
                nonzero(8),
                nonzero(65_536),
                nonzero(262_144),
                nonzero(240),
                nonzero(120),
                nonzero(16),
                nonzero(512),
                nonzero(8192),
            )
            .expect("test limits should be valid"),
        )
        .try_into()
        .expect("compile-fail request should be valid")
    }

    fn runner_settings(workspace_root: PathBuf) -> RunnerSettings {
        RunnerSettings {
            queue_capacity: nonzero(1),
            workers: nonzero(1),
            timeout: Duration::from_secs(1),
            cleanup_timeout: Duration::from_secs(1),
            max_output_bytes: nonzero(1024),
            max_process_output_bytes: nonzero(4096),
            workspace_tmpfs_bytes: NonZeroU64::new(1024 * 1024)
                .expect("tmpfs limit should be nonzero"),
            container_memory_bytes: NonZeroU64::new(256 * 1024 * 1024)
                .expect("container memory should be nonzero"),
            container_cpus: ContainerCpus::try_from(0.5)
                .expect("container CPU limit should be valid"),
            container_pids_limit: NonZeroU64::new(128)
                .expect("container pids limit should be nonzero"),
            tmp_tmpfs_bytes: NonZeroU64::new(64 * 1024 * 1024)
                .expect("tmp tmpfs limit should be nonzero"),
            process_headroom_bytes: NonZeroU64::new(64 * 1024 * 1024)
                .expect("process headroom should be nonzero"),
            core_ulimit: CoreUlimit::try_from("0:0".to_string())
                .expect("core ulimit should be valid"),
            image: RunnerImage::try_from("rust-runner:test".to_string())
                .expect("test image should be valid"),
            workspace_root: WorkspaceRoot::try_from(workspace_root)
                .expect("test workspace root should be valid"),
            podman_path: PodmanPath::try_from(PathBuf::from("podman"))
                .expect("test Podman path should be valid"),
        }
    }

    fn args(spec: &ProcessCommandSpec) -> Vec<String> {
        spec.args
            .iter()
            .map(|arg| arg.to_string_lossy().into_owned())
            .collect()
    }

    fn has_pair(args: &[String], first: &str, second: &str) -> bool {
        args.windows(2)
            .any(|pair| pair[0] == first && pair[1] == second)
    }

    #[tokio::test]
    async fn collect_limited_stream_retains_only_configured_bytes() {
        let (mut writer, reader) = tokio::io::duplex(8);
        let writer_task = tokio::spawn(async move {
            let _ = writer.write_all("x".repeat(100).as_bytes()).await;
        });
        let budget = Arc::new(Mutex::new(13));
        let (limit_tx, mut limit_rx) = mpsc::channel(1);

        let capture = collect_limited_stream(reader, 13, budget, limit_tx)
            .await
            .expect("stream should be collected");
        writer_task.await.expect("writer task should finish");

        assert_eq!(capture.output.len(), 13);
        assert!(capture.exceeded);
        assert_eq!(limit_rx.recv().await, Some(()));
    }

    #[tokio::test]
    async fn collect_limited_streams_share_one_aggregate_budget() {
        let budget = Arc::new(Mutex::new(13));
        let (limit_tx, mut limit_rx) = mpsc::channel(2);
        let stdout = collect_limited_stream(
            std::io::Cursor::new(vec![b'a'; 10]),
            13,
            Arc::clone(&budget),
            limit_tx.clone(),
        );
        let stderr =
            collect_limited_stream(std::io::Cursor::new(vec![b'b'; 10]), 13, budget, limit_tx);

        let (stdout, stderr) = tokio::join!(stdout, stderr);
        let stdout = stdout.expect("stdout should be collected");
        let stderr = stderr.expect("stderr should be collected");

        assert_eq!(stdout.output.len() + stderr.output.len(), 13);
        assert!(stdout.exceeded || stderr.exceeded);
        assert_eq!(limit_rx.recv().await, Some(()));
    }

    #[tokio::test]
    async fn fake_executor_covers_managed_container_command_lifecycle() {
        let root = tempfile::tempdir().expect("test root should be created");
        let config = Arc::new(runner_settings(root.path().join("runs")));
        let executor = FakeProcessExecutor::default();
        let runner =
            PodmanLessonRunner::new_with_executor(Arc::clone(&config), Arc::new(executor.clone()));

        let result = runner
            .run(
                Uuid::nil(),
                validated_request(),
                RunDeadline::after(config.timeout),
                CancellationToken::new(),
            )
            .await;
        let specs = executor
            .specs
            .lock()
            .expect("fake executor lock should be available")
            .clone();

        assert_eq!(
            result.expect("run should succeed").status,
            RunStatus::Passed
        );
        assert_eq!(specs.len(), 4);

        let start = args(&specs[0]);
        assert!(has_pair(&start, "--network", "none"));
        assert!(has_pair(&start, "--memory", "268435456"));
        assert!(has_pair(&start, "--memory-swap", "268435456"));
        assert!(has_pair(&start, "--cpus", "0.5"));
        assert!(has_pair(&start, "--pids-limit", "128"));
        assert!(has_pair(&start, "--ulimit", "core=0:0"));
        assert!(has_pair(&start, "--log-driver", "none"));
        assert!(has_pair(&start, "--user", "0:0"));
        assert!(has_pair(
            &start,
            "--tmpfs",
            "/tmp:rw,noexec,nosuid,nodev,size=67108864"
        ));
        assert!(has_pair(
            &start,
            "--tmpfs",
            "/workspace:rw,exec,nosuid,nodev,size=1048576"
        ));
        assert!(start.contains(&"--read-only".to_string()));
        assert!(start.contains(&"--http-proxy=false".to_string()));
        assert!(start.contains(&"no-new-privileges".to_string()));
        assert!(!has_pair(
            &start,
            "--mount",
            "type=volume,destination=/opt/rust-daily-target"
        ));

        let prepare = args(&specs[1]);
        assert_eq!(prepare.first().map(String::as_str), Some("exec"));
        assert!(prepare.iter().any(|arg| arg.contains("cp -a /input/.")));

        let cargo = args(&specs[2]);
        assert!(has_pair(&cargo, "--user", "10001:10001"));
        assert!(cargo.contains(&"--kill-after=1s".to_string()));
        assert!(cargo.contains(&"--offline".to_string()));
        assert!(cargo.contains(&"--message-format=json".to_string()));

        let cleanup = args(&specs[3]);
        assert_eq!(cleanup.first().map(String::as_str), Some("rm"));
        assert!(cleanup.contains(&"--force".to_string()));
        assert!(cleanup.contains(&"--ignore".to_string()));
        assert!(cleanup.contains(&"--volumes".to_string()));
    }

    #[tokio::test]
    async fn advanced_request_mounts_disposable_target_volume() {
        let root = tempfile::tempdir().expect("test root should be created");
        let config = Arc::new(runner_settings(root.path().join("runs")));
        let executor = FakeProcessExecutor::default();
        let runner =
            PodmanLessonRunner::new_with_executor(Arc::clone(&config), Arc::new(executor.clone()));

        let result = runner
            .run(
                Uuid::nil(),
                validated_request_with_dependency_set(DependencySet::Advanced),
                RunDeadline::after(config.timeout),
                CancellationToken::new(),
            )
            .await;
        let specs = executor
            .specs
            .lock()
            .expect("fake executor lock should be available");
        let start = args(&specs[0]);

        assert_eq!(
            result.expect("run should succeed").status,
            RunStatus::Passed
        );
        assert!(has_pair(
            &start,
            "--mount",
            "type=volume,destination=/opt/rust-daily-target"
        ));
    }

    #[tokio::test]
    async fn fake_executor_detects_output_overflow_after_process_exit() {
        let root = tempfile::tempdir().expect("test root should be created");
        let mut config = runner_settings(root.path().join("runs"));
        config.max_process_output_bytes = nonzero(64);
        let config = Arc::new(config);
        let executor = FakeProcessExecutor {
            cargo_behavior: FakeCargoBehavior::OutputFlood,
            ..FakeProcessExecutor::default()
        };
        let runner =
            PodmanLessonRunner::new_with_executor(Arc::clone(&config), Arc::new(executor.clone()));

        let result = runner
            .run(
                Uuid::nil(),
                validated_request(),
                RunDeadline::after(config.timeout),
                CancellationToken::new(),
            )
            .await;

        let result = result.expect("run should succeed");
        assert_eq!(result.status, RunStatus::Failed);
        assert!(result.stderr.contains("output exceeded 64 bytes"));
    }

    #[tokio::test]
    async fn fake_executor_covers_compile_fail_outcomes() {
        for (behavior, expected_diagnostic, expected_status) in [
            (
                FakeCargoBehavior::CompileError,
                "private field",
                RunStatus::Passed,
            ),
            (
                FakeCargoBehavior::CompileError,
                "different diagnostic",
                RunStatus::Failed,
            ),
            (
                FakeCargoBehavior::Success,
                "private field",
                RunStatus::Failed,
            ),
        ] {
            let root = tempfile::tempdir().expect("test root should be created");
            let config = Arc::new(runner_settings(root.path().join("runs")));
            let executor = FakeProcessExecutor {
                cargo_behavior: behavior,
                ..FakeProcessExecutor::default()
            };
            let runner =
                PodmanLessonRunner::new_with_executor(Arc::clone(&config), Arc::new(executor));

            let result = runner
                .run(
                    Uuid::nil(),
                    validated_compile_fail_request(expected_diagnostic),
                    RunDeadline::after(config.timeout),
                    CancellationToken::new(),
                )
                .await;

            assert_eq!(result.expect("run should succeed").status, expected_status);
        }
    }

    #[tokio::test]
    async fn fake_executor_covers_timeout_and_infrastructure_results() {
        for (behavior, expected_status) in [
            (
                FakeCargoBehavior::CompileError,
                Some(RunStatus::CompileError),
            ),
            (FakeCargoBehavior::TimedOut, Some(RunStatus::TimedOut)),
            (FakeCargoBehavior::InfrastructureError, None),
        ] {
            let root = tempfile::tempdir().expect("test root should be created");
            let config = Arc::new(runner_settings(root.path().join("runs")));
            let executor = FakeProcessExecutor {
                cargo_behavior: behavior,
                ..FakeProcessExecutor::default()
            };
            let runner =
                PodmanLessonRunner::new_with_executor(Arc::clone(&config), Arc::new(executor));

            let result = runner
                .run(
                    Uuid::nil(),
                    validated_request(),
                    RunDeadline::after(config.timeout),
                    CancellationToken::new(),
                )
                .await;

            assert_eq!(result.ok().map(|outcome| outcome.status), expected_status);
        }
    }

    #[tokio::test]
    async fn fake_executor_covers_compile_fail_early_termination() {
        for (behavior, expected_status) in [
            (FakeCargoBehavior::OutputFlood, Some(RunStatus::Failed)),
            (
                FakeCargoBehavior::CompileFailCaseOutputFlood,
                Some(RunStatus::Failed),
            ),
            (FakeCargoBehavior::TimedOut, Some(RunStatus::TimedOut)),
            (FakeCargoBehavior::InfrastructureError, None),
        ] {
            let root = tempfile::tempdir().expect("test root should be created");
            let mut config = runner_settings(root.path().join("runs"));
            config.max_process_output_bytes = nonzero(64);
            let config = Arc::new(config);
            let executor = FakeProcessExecutor {
                cargo_behavior: behavior,
                ..FakeProcessExecutor::default()
            };
            let runner =
                PodmanLessonRunner::new_with_executor(Arc::clone(&config), Arc::new(executor));

            let result = runner
                .run(
                    Uuid::nil(),
                    validated_compile_fail_request("private field"),
                    RunDeadline::after(config.timeout),
                    CancellationToken::new(),
                )
                .await;

            assert_eq!(result.ok().map(|outcome| outcome.status), expected_status);
        }
    }

    #[tokio::test]
    async fn fake_executor_covers_elapsed_deadline_and_cancellation() {
        let root = tempfile::tempdir().expect("test root should be created");
        let config = Arc::new(runner_settings(root.path().join("runs")));
        let executor = FakeProcessExecutor {
            cargo_behavior: FakeCargoBehavior::Slow,
            ..FakeProcessExecutor::default()
        };
        let runner = PodmanLessonRunner::new_with_executor(Arc::clone(&config), Arc::new(executor));

        let expired = runner
            .run(
                Uuid::nil(),
                validated_request(),
                RunDeadline::after(Duration::ZERO),
                CancellationToken::new(),
            )
            .await;
        assert!(expired.is_err());

        let cancellation = CancellationToken::new();
        let cancel = cancellation.clone();
        let run = runner.run(
            Uuid::nil(),
            validated_request(),
            RunDeadline::after(config.timeout),
            cancellation,
        );
        let cancel_soon = async move {
            tokio::time::sleep(Duration::from_millis(10)).await;
            cancel.cancel();
        };
        let (cancelled, ()) = tokio::join!(run, cancel_soon);

        assert!(cancelled.is_err());
    }

    #[tokio::test]
    async fn fake_executor_covers_outer_process_timeout() {
        let root = tempfile::tempdir().expect("test root should be created");
        let mut config = runner_settings(root.path().join("runs"));
        config.timeout = Duration::from_millis(10);
        let config = Arc::new(config);
        let executor = FakeProcessExecutor {
            cargo_behavior: FakeCargoBehavior::Slow,
            ..FakeProcessExecutor::default()
        };
        let runner = PodmanLessonRunner::new_with_executor(Arc::clone(&config), Arc::new(executor));

        let result = runner
            .run(
                Uuid::nil(),
                validated_request(),
                RunDeadline::after(config.timeout),
                CancellationToken::new(),
            )
            .await;

        assert_eq!(
            result.expect("run should succeed").status,
            RunStatus::TimedOut
        );
    }

    #[test]
    fn operational_log_output_is_bounded() {
        let output = log_output("ü".repeat(5000).as_bytes());

        assert_eq!(output.chars().count(), 4096);
        assert!(output.is_char_boundary(output.len()));
    }

    #[test]
    fn runtime_preflight_helpers_classify_typed_data_and_failures() {
        let info = serde_json::json!({"host": {"security": {"rootless": true}}});
        assert_eq!(find_boolean_field(&info, "ROOTLESS"), Some(true));
        assert_eq!(find_boolean_field(&info, "missing"), None);

        let success = Output {
            status: ExitStatus::from_raw(0),
            stdout: Vec::new(),
            stderr: Vec::new(),
        };
        assert!(ensure_control_success("test command", &success).is_ok());

        let failure = Output {
            status: ExitStatus::from_raw(125 << 8),
            stdout: Vec::new(),
            stderr: b"runtime failed".to_vec(),
        };
        let error = ensure_control_success("test command", &failure)
            .expect_err("failed command should return context");
        assert!(error.to_string().contains("runtime failed"));
    }
}
