use std::process::Output;

use serde::Deserialize;

use crate::model::{RunResult, RunStatus};

const TRUNCATION_MARKER: &str = "\n[output truncated]\n";

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

#[derive(Debug, Deserialize)]
struct CargoResponseMessage {
    reason: CargoMessageReason,
}

pub fn result_from_output(output: Output, duration_ms: u64, max_output_bytes: usize) -> RunResult {
    let status = classify_status(&output);
    let command_succeeded = output.status.success();
    let stdout = output_stream_for_response(&output.stdout, command_succeeded);
    let stderr = output_stream_for_response(&output.stderr, command_succeeded);
    let (stdout, stderr) = cap_output(stdout.as_bytes(), stderr.as_bytes(), max_output_bytes);

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

    match serde_json::from_str::<CargoResponseMessage>(line) {
        Ok(message) => message.reason == CargoMessageReason::CompilerMessage,
        Err(_) => true,
    }
}

fn is_podman_log_line(line: &str) -> bool {
    line.starts_with("time=\"") && line.contains("\" level=") && line.contains(" msg=\"")
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

    use super::{cap_output, classify_status, result_from_output};
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

    #[test]
    fn filters_cargo_artifact_json_before_capping_response_output() {
        let cargo_noise = (0..200)
            .map(|index| format!(r#"{{"reason":"compiler-artifact","package_id":"pkg{index}"}}"#))
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
    fn keeps_podman_logs_from_failed_response_output() {
        let raw_stderr = r#"time="2026-07-10T10:36:30Z" level=error msg="cannot set up namespace""#;

        let result = result_from_output(output(125, "", raw_stderr), 42, 400);

        assert_eq!(result.status, RunStatus::Failed);
        assert!(result.stderr.contains("cannot set up namespace"));
    }

    #[test]
    fn keeps_compiler_message_json_for_frontend_diagnostics() {
        let raw_stdout = concat!(
            r#"{"reason":"compiler-artifact","package_id":"noise"}"#,
            "\n",
            r#"{"reason":"compiler-message","message":{"level":"error","rendered":"error: bad type"}}"#,
        );

        let result = result_from_output(output(101, raw_stdout, ""), 42, 400);

        assert_eq!(result.status, RunStatus::CompileError);
        assert!(!result.stdout.contains("compiler-artifact"));
        assert!(result.stdout.contains("compiler-message"));
        assert!(result.stdout.contains("error: bad type"));
    }
}
