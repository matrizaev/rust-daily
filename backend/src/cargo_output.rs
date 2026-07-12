use std::{io::Cursor, process::Output};

use cargo_metadata::{Message, diagnostic::DiagnosticLevel};

use crate::model::{RunResult, RunStatus};

const TRUNCATION_MARKER: &str = "\n[output truncated]\n";

pub fn result_from_output(output: Output, duration_ms: u64, max_output_bytes: usize) -> RunResult {
    let status = match output_status(&output) {
        CargoOutputStatus::Success => RunStatus::Passed,
        CargoOutputStatus::TimedOut => RunStatus::TimedOut,
        CargoOutputStatus::CompilerError => RunStatus::CompileError,
        CargoOutputStatus::Failure => RunStatus::Failed,
        CargoOutputStatus::CargoError
        | CargoOutputStatus::InfrastructureError
        | CargoOutputStatus::InternalCompilerError => {
            return RunResult::internal_error("runner internal error", duration_ms);
        }
    };
    let (stdout, stderr) = filtered_output_streams(&output, max_output_bytes);

    RunResult::new(status, stdout, stderr, duration_ms)
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum CargoOutputStatus {
    Success,
    TimedOut,
    CompilerError,
    Failure,
    CargoError,
    InfrastructureError,
    InternalCompilerError,
}

pub fn output_status(output: &Output) -> CargoOutputStatus {
    if output.status.success() {
        return CargoOutputStatus::Success;
    }

    if output.status.code() == Some(124) {
        return CargoOutputStatus::TimedOut;
    }

    if matches!(output.status.code(), Some(125..=127)) {
        return CargoOutputStatus::InfrastructureError;
    }

    if cargo_reported_level(&output.stdout, DiagnosticLevel::Ice)
        || cargo_reported_level(&output.stderr, DiagnosticLevel::Ice)
    {
        return CargoOutputStatus::InternalCompilerError;
    }

    if cargo_reported_level(&output.stdout, DiagnosticLevel::Error)
        || cargo_reported_level(&output.stderr, DiagnosticLevel::Error)
    {
        CargoOutputStatus::CompilerError
    } else if cargo_build_succeeded(&output.stdout) || cargo_build_succeeded(&output.stderr) {
        CargoOutputStatus::Failure
    } else {
        CargoOutputStatus::CargoError
    }
}

pub fn filtered_output_streams(output: &Output, max_output_bytes: usize) -> (String, String) {
    let command_succeeded = output.status.success();
    let stdout = output_stream_for_response(&output.stdout, command_succeeded);
    let stderr = output_stream_for_response(&output.stderr, command_succeeded);

    cap_output(stdout.as_bytes(), stderr.as_bytes(), max_output_bytes)
}

pub fn cap_streams(stdout: &str, stderr: &str, max_output_bytes: usize) -> (String, String) {
    cap_output(stdout.as_bytes(), stderr.as_bytes(), max_output_bytes)
}

pub fn diagnostic_text(output: &Output) -> String {
    let compiler_diagnostics = compiler_diagnostic_text(&output.stdout)
        .into_iter()
        .chain(compiler_diagnostic_text(&output.stderr))
        .collect::<Vec<_>>();

    if !compiler_diagnostics.is_empty() {
        return compiler_diagnostics.join("\n\n");
    }

    let command_succeeded = output.status.success();

    [
        output_stream_for_response(&output.stdout, command_succeeded),
        output_stream_for_response(&output.stderr, command_succeeded),
    ]
    .into_iter()
    .filter(|stream| !stream.trim().is_empty())
    .collect::<Vec<_>>()
    .join("\n\n")
}

#[cfg(test)]
fn classify_status(output: &Output) -> RunStatus {
    match output_status(output) {
        CargoOutputStatus::Success => RunStatus::Passed,
        CargoOutputStatus::TimedOut => RunStatus::TimedOut,
        CargoOutputStatus::CompilerError => RunStatus::CompileError,
        CargoOutputStatus::Failure => RunStatus::Failed,
        CargoOutputStatus::CargoError
        | CargoOutputStatus::InfrastructureError
        | CargoOutputStatus::InternalCompilerError => RunStatus::InternalError,
    }
}

fn cargo_reported_level(output: &[u8], expected: DiagnosticLevel) -> bool {
    cargo_messages(output).any(|message| match message {
        Message::CompilerMessage(message) => message.message.level == expected,
        _ => false,
    })
}

fn cargo_build_succeeded(output: &[u8]) -> bool {
    cargo_messages(output)
        .any(|message| matches!(message, Message::BuildFinished(finished) if finished.success))
}

fn compiler_diagnostic_text(output: &[u8]) -> Vec<String> {
    cargo_messages(output)
        .filter_map(|message| match message {
            Message::CompilerMessage(message)
                if message.message.level == DiagnosticLevel::Error =>
            {
                Some(message.message)
            }
            _ => None,
        })
        .map(|diagnostic| diagnostic.rendered.unwrap_or(diagnostic.message))
        .map(|message| message.trim().to_string())
        .filter(|message| !message.is_empty())
        .collect()
}

fn output_stream_for_response(output: &[u8], command_succeeded: bool) -> String {
    String::from_utf8_lossy(output)
        .lines()
        .filter(|line| should_include_response_line(line, command_succeeded))
        .collect::<Vec<_>>()
        .join("\n")
}

fn should_include_response_line(line: &str, command_succeeded: bool) -> bool {
    if command_succeeded && is_podman_log_line(line) {
        return false;
    }

    match cargo_message(line) {
        Some(Message::CompilerMessage(_)) | Some(Message::TextLine(_)) | None => true,
        Some(
            Message::CompilerArtifact(_)
            | Message::BuildScriptExecuted(_)
            | Message::BuildFinished(_),
        ) => false,
        _ => false,
    }
}

fn is_podman_log_line(line: &str) -> bool {
    line.starts_with("time=\"") && line.contains("\" level=") && line.contains(" msg=\"")
}

fn cargo_messages(output: &[u8]) -> impl Iterator<Item = Message> + '_ {
    Message::parse_stream(Cursor::new(output)).filter_map(Result::ok)
}

fn cargo_message(line: &str) -> Option<Message> {
    cargo_messages(line.as_bytes()).next()
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

#[cfg(test)]
mod tests {
    use std::{os::unix::process::ExitStatusExt, process::ExitStatus};

    use serde_json::json;

    use super::{cap_output, classify_status, diagnostic_text, result_from_output};
    use crate::model::RunStatus;

    fn output(status: i32, stdout: &str, stderr: &str) -> std::process::Output {
        std::process::Output {
            status: ExitStatus::from_raw(status << 8),
            stdout: stdout.as_bytes().to_vec(),
            stderr: stderr.as_bytes().to_vec(),
        }
    }

    fn cargo_target() -> serde_json::Value {
        json!({
            "kind": ["lib"],
            "crate_types": ["lib"],
            "name": "rust_daily_lesson",
            "src_path": "/workspace/src/lib.rs",
            "edition": "2024",
            "doc": true,
            "doctest": true,
            "test": true
        })
    }

    fn compiler_message(level: &str, rendered: &str) -> String {
        json!({
            "reason": "compiler-message",
            "package_id": "path+file:///workspace#rust_daily_lesson@0.1.0",
            "manifest_path": "/workspace/Cargo.toml",
            "target": cargo_target(),
            "message": {
                "message": rendered,
                "code": null,
                "level": level,
                "spans": [],
                "children": [],
                "rendered": rendered
            }
        })
        .to_string()
    }

    fn compiler_artifact(index: usize) -> String {
        json!({
            "reason": "compiler-artifact",
            "package_id": format!("path+file:///workspace#dep{index}@0.1.0"),
            "manifest_path": "/workspace/Cargo.toml",
            "target": cargo_target(),
            "profile": {
                "opt_level": "0",
                "debuginfo": 0,
                "debug_assertions": true,
                "overflow_checks": true,
                "test": true
            },
            "features": [],
            "filenames": [],
            "executable": null,
            "fresh": false
        })
        .to_string()
    }

    fn build_finished(success: bool) -> String {
        json!({
            "reason": "build-finished",
            "success": success
        })
        .to_string()
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
                &compiler_message("error", "error: bad type"),
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
                &format!("{}\ntest answer_is_42 ... FAILED", build_finished(true)),
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

    #[test]
    fn filters_cargo_artifact_json_before_capping_response_output() {
        let cargo_noise = (0..200)
            .map(compiler_artifact)
            .collect::<Vec<_>>()
            .join("\n");
        let raw_stdout = format!("{cargo_noise}\nreal test output\n");

        let result = result_from_output(output(0, &raw_stdout, ""), 42, 80);

        assert_eq!(result.status, RunStatus::Passed);
        assert_eq!(result.stdout, "real test output");
        assert!(!result.stdout.contains("compiler-artifact"));
        assert!(!result.stdout.contains("[output truncated]"));
    }

    #[test]
    fn filters_podman_logs_from_successful_response_output() {
        let raw_stderr = concat!(
            r#"time="2026-07-10T10:36:30Z" level=warning msg="Falling back to --cgroup-manager=cgroupfs""#,
            "\n",
            "   Compiling rust_daily_lesson v0.1.0 (/workspace)\n",
        );

        let result = result_from_output(output(0, "running 1 test", raw_stderr), 42, 400);

        assert_eq!(result.status, RunStatus::Passed);
        assert_eq!(
            result.stderr,
            "   Compiling rust_daily_lesson v0.1.0 (/workspace)"
        );
    }

    #[test]
    fn hides_podman_logs_from_infrastructure_failure_response() {
        let raw_stderr = r#"time="2026-07-10T10:36:30Z" level=error msg="cannot set up namespace""#;

        let result = result_from_output(output(125, "", raw_stderr), 42, 400);

        assert_eq!(result.status, RunStatus::InternalError);
        assert_eq!(result.stderr, "runner internal error");
    }

    #[test]
    fn keeps_compiler_message_json_for_frontend_diagnostics() {
        let raw_stdout = format!(
            "{}\n{}",
            compiler_artifact(1),
            compiler_message("error", "error: bad type")
        );

        let result = result_from_output(output(101, &raw_stdout, ""), 42, 400);

        assert_eq!(result.status, RunStatus::CompileError);
        assert!(!result.stdout.contains("compiler-artifact"));
        assert!(result.stdout.contains("compiler-message"));
        assert!(result.stdout.contains("error: bad type"));
    }

    #[test]
    fn compile_fail_matching_text_contains_only_error_diagnostics() {
        let raw_stdout = format!(
            "{}\n{}",
            compiler_message("warning", "expected text in warning"),
            compiler_message("error", "actual rustc error")
        );
        let output = output(101, &raw_stdout, "");

        let diagnostics = diagnostic_text(&output);

        assert!(!diagnostics.contains("expected text in warning"));
        assert!(diagnostics.contains("actual rustc error"));
    }
}
