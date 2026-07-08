use std::{
    num::NonZeroUsize,
    path::{Component, Path},
};

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::sync::oneshot;
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub struct RunRequest {
    files: Vec<SubmittedFile>,
    #[serde(default, rename = "dependencySet")]
    dependency_set: DependencySet,
}

impl RunRequest {
    pub fn new(files: Vec<SubmittedFile>) -> Self {
        Self {
            files,
            dependency_set: DependencySet::default(),
        }
    }

    pub fn with_dependency_set(files: Vec<SubmittedFile>, dependency_set: DependencySet) -> Self {
        Self {
            files,
            dependency_set,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum DependencySet {
    #[default]
    Std,
    Advanced,
}

impl DependencySet {
    pub fn dependencies(self) -> &'static [(&'static str, &'static str)] {
        match self {
            Self::Std => &[],
            Self::Advanced => &[
                ("serde", r#"{ version = "1", features = ["derive"] }"#),
                ("serde_json", r#""1""#),
                ("thiserror", r#""2""#),
                ("anyhow", r#""1""#),
                (
                    "tokio",
                    r#"{ version = "1", features = ["macros", "rt", "sync", "time"] }"#,
                ),
                ("tracing", r#""0.1""#),
                (
                    "tracing-subscriber",
                    r#"{ version = "0.3", features = ["fmt"] }"#,
                ),
                (
                    "actix-web",
                    r#"{ version = "4", default-features = false }"#,
                ),
                ("actix-rt", r#""2""#),
                ("http", r#""1""#),
                (
                    "proptest",
                    r#"{ version = "1", default-features = false, features = ["std"] }"#,
                ),
            ],
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub struct SubmittedFile {
    path: String,
    content: String,
}

impl SubmittedFile {
    pub fn new(path: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            path: path.into(),
            content: content.into(),
        }
    }

    fn into_parts(self) -> (String, String) {
        (self.path, self.content)
    }
}

#[derive(Debug, Clone, Copy, Eq, Hash, PartialEq)]
pub enum SubmittedPath {
    LibRs,
    LessonTest,
}

impl SubmittedPath {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::LibRs => "src/lib.rs",
            Self::LessonTest => "tests/lesson.rs",
        }
    }
}

impl std::fmt::Display for SubmittedPath {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl TryFrom<String> for SubmittedPath {
    type Error = ValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        Self::try_from(value.as_str()).map_err(|error| error.with_owned_path(value))
    }
}

impl TryFrom<&str> for SubmittedPath {
    type Error = ValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_safe_path(value)?;

        match value {
            "src/lib.rs" => Ok(Self::LibRs),
            "tests/lesson.rs" => Ok(Self::LessonTest),
            _ => Err(ValidationError::UnsupportedPath {
                path: value.to_string(),
            }),
        }
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct SubmittedContent(String);

impl SubmittedContent {
    pub fn as_bytes(&self) -> &[u8] {
        self.0.as_bytes()
    }
}

struct SubmittedContentInput {
    path: SubmittedPath,
    content: String,
    max_file_bytes: usize,
}

impl SubmittedContentInput {
    fn new(path: SubmittedPath, content: String, max_file_bytes: usize) -> Self {
        Self {
            path,
            content,
            max_file_bytes,
        }
    }
}

impl TryFrom<SubmittedContentInput> for SubmittedContent {
    type Error = ValidationError;

    fn try_from(input: SubmittedContentInput) -> Result<Self, Self::Error> {
        if input.content.len() > input.max_file_bytes {
            return Err(ValidationError::FileTooLarge {
                path: input.path,
                max_bytes: input.max_file_bytes,
            });
        }

        Ok(Self(input.content))
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct ValidatedRunRequest {
    lib_rs: SubmittedContent,
    lesson_test: SubmittedContent,
    dependency_set: DependencySet,
}

impl ValidatedRunRequest {
    pub fn files(&self) -> [(SubmittedPath, &SubmittedContent); 2] {
        [
            (SubmittedPath::LibRs, &self.lib_rs),
            (SubmittedPath::LessonTest, &self.lesson_test),
        ]
    }

    pub fn dependency_set(&self) -> DependencySet {
        self.dependency_set
    }
}

pub struct RunRequestValidation {
    request: RunRequest,
    limits: ValidationLimits,
}

impl RunRequestValidation {
    pub fn new(request: RunRequest, limits: ValidationLimits) -> Self {
        Self { request, limits }
    }
}

impl TryFrom<RunRequestValidation> for ValidatedRunRequest {
    type Error = ValidationError;

    fn try_from(input: RunRequestValidation) -> Result<Self, Self::Error> {
        let RunRequest {
            files,
            dependency_set,
        } = input.request;

        if files.is_empty() {
            return Err(ValidationError::EmptyFiles);
        }

        if files.len() > input.limits.max_files() {
            return Err(ValidationError::TooManyFiles {
                max: input.limits.max_files(),
            });
        }

        let mut total_bytes = 0usize;
        let mut lib_rs = None;
        let mut lesson_test = None;

        for file in files {
            let (path, content) = file.into_parts();
            let path = SubmittedPath::try_from(path)?;

            total_bytes = total_bytes.saturating_add(content.len());
            if total_bytes > input.limits.max_total_bytes() {
                return Err(ValidationError::TotalTooLarge {
                    max_bytes: input.limits.max_total_bytes(),
                });
            }

            let content = SubmittedContent::try_from(SubmittedContentInput::new(
                path,
                content,
                input.limits.max_file_bytes(),
            ))?;

            match path {
                SubmittedPath::LibRs => insert_file_once(&mut lib_rs, path, content)?,
                SubmittedPath::LessonTest => insert_file_once(&mut lesson_test, path, content)?,
            }
        }

        Ok(Self {
            lib_rs: lib_rs.ok_or(ValidationError::MissingRequiredFile {
                path: SubmittedPath::LibRs,
            })?,
            lesson_test: lesson_test.ok_or(ValidationError::MissingRequiredFile {
                path: SubmittedPath::LessonTest,
            })?,
            dependency_set,
        })
    }
}

#[derive(Debug, Clone, Copy)]
pub struct ValidationLimits {
    max_files: NonZeroUsize,
    max_file_bytes: NonZeroUsize,
    max_total_bytes: NonZeroUsize,
}

impl ValidationLimits {
    pub fn try_new(
        max_files: NonZeroUsize,
        max_file_bytes: NonZeroUsize,
        max_total_bytes: NonZeroUsize,
    ) -> Result<Self, ValidationLimitsError> {
        if max_total_bytes.get() < max_file_bytes.get() {
            return Err(ValidationLimitsError::TotalBytesBelowFileBytes {
                max_file_bytes: max_file_bytes.get(),
                max_total_bytes: max_total_bytes.get(),
            });
        }

        Ok(Self {
            max_files,
            max_file_bytes,
            max_total_bytes,
        })
    }

    pub fn max_files(self) -> usize {
        self.max_files.get()
    }

    pub fn max_file_bytes(self) -> usize {
        self.max_file_bytes.get()
    }

    pub fn max_total_bytes(self) -> usize {
        self.max_total_bytes.get()
    }
}

#[derive(Debug, Error)]
pub enum ValidationLimitsError {
    #[error(
        "max total bytes ({max_total_bytes}) must be at least max file bytes ({max_file_bytes})"
    )]
    TotalBytesBelowFileBytes {
        max_file_bytes: usize,
        max_total_bytes: usize,
    },
}

#[derive(Debug, Error)]
pub enum ValidationError {
    #[error("files must be non-empty")]
    EmptyFiles,
    #[error("too many files: maximum is {max}")]
    TooManyFiles { max: usize },
    #[error("file `{path}` is too large: maximum is {max_bytes} bytes")]
    FileTooLarge {
        path: SubmittedPath,
        max_bytes: usize,
    },
    #[error("submitted content is too large: maximum is {max_bytes} bytes")]
    TotalTooLarge { max_bytes: usize },
    #[error("file path must be relative and safe: `{path}`")]
    UnsafePath { path: String },
    #[error("unsupported file path: `{path}`")]
    UnsupportedPath { path: String },
    #[error("duplicate file path: `{path}`")]
    DuplicatePath { path: SubmittedPath },
    #[error("missing required file: `{path}`")]
    MissingRequiredFile { path: SubmittedPath },
}

impl ValidationError {
    pub fn is_payload_limit(&self) -> bool {
        matches!(
            self,
            Self::TooManyFiles { .. } | Self::FileTooLarge { .. } | Self::TotalTooLarge { .. }
        )
    }

    fn with_owned_path(self, path: String) -> Self {
        match self {
            Self::UnsafePath { .. } => Self::UnsafePath { path },
            Self::UnsupportedPath { .. } => Self::UnsupportedPath { path },
            other => other,
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RunStatus {
    Passed,
    Failed,
    CompileError,
    TimedOut,
    InternalError,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub struct RunResult {
    pub status: RunStatus,
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u64,
}

impl RunResult {
    pub fn new(status: RunStatus, stdout: String, stderr: String, duration_ms: u64) -> Self {
        Self {
            status,
            stdout,
            stderr,
            duration_ms,
        }
    }

    pub fn internal_error(message: impl Into<String>, duration_ms: u64) -> Self {
        Self {
            status: RunStatus::InternalError,
            stdout: String::new(),
            stderr: message.into(),
            duration_ms,
        }
    }
}

pub struct RunJob {
    pub id: Uuid,
    pub request: ValidatedRunRequest,
    pub response_tx: oneshot::Sender<RunResult>,
}

fn insert_file_once(
    slot: &mut Option<SubmittedContent>,
    path: SubmittedPath,
    content: SubmittedContent,
) -> Result<(), ValidationError> {
    if slot.is_some() {
        return Err(ValidationError::DuplicatePath { path });
    }

    *slot = Some(content);
    Ok(())
}

fn validate_safe_path(path: &str) -> Result<(), ValidationError> {
    let parsed = Path::new(path);
    if path.is_empty() || parsed.is_absolute() {
        return Err(ValidationError::UnsafePath {
            path: path.to_string(),
        });
    }

    for component in parsed.components() {
        match component {
            Component::Normal(_) => {}
            Component::CurDir
            | Component::ParentDir
            | Component::RootDir
            | Component::Prefix(_) => {
                return Err(ValidationError::UnsafePath {
                    path: path.to_string(),
                });
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::num::NonZeroUsize;

    use super::{
        DependencySet, RunRequest, RunRequestValidation, RunStatus, SubmittedFile,
        ValidatedRunRequest, ValidationError, ValidationLimits,
    };

    fn nonzero(value: usize) -> NonZeroUsize {
        NonZeroUsize::new(value).expect("test value should be non-zero")
    }

    fn limits() -> ValidationLimits {
        ValidationLimits::try_new(nonzero(8), nonzero(64), nonzero(128))
            .expect("test limits should be valid")
    }

    fn valid_request() -> RunRequest {
        RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ])
    }

    fn validate(request: RunRequest) -> Result<ValidatedRunRequest, ValidationError> {
        RunRequestValidation::new(request, limits()).try_into()
    }

    #[test]
    fn run_status_serializes_as_snake_case() {
        let value =
            serde_json::to_string(&RunStatus::CompileError).expect("status should serialize");

        assert_eq!(value, "\"compile_error\"");
    }

    #[test]
    fn dependency_set_defaults_to_std() {
        let request = serde_json::from_str::<RunRequest>(
            r#"{"files":[{"path":"src/lib.rs","content":""},{"path":"tests/lesson.rs","content":""}]}"#,
        )
        .expect("request should deserialize");
        let validated = validate(request).expect("request should validate");

        assert_eq!(validated.dependency_set(), DependencySet::Std);
    }

    #[test]
    fn dependency_set_deserializes_from_frontend_payload() {
        let request = serde_json::from_str::<RunRequest>(
            r#"{"dependencySet":"advanced","files":[{"path":"src/lib.rs","content":""},{"path":"tests/lesson.rs","content":""}]}"#,
        )
        .expect("request should deserialize");
        let validated = validate(request).expect("request should validate");

        assert_eq!(validated.dependency_set(), DependencySet::Advanced);
    }

    #[test]
    fn validation_accepts_required_paths() {
        assert!(validate(valid_request()).is_ok());
    }

    #[test]
    fn validation_rejects_parent_directory_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("../src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsafePath { .. })
        ));
    }

    #[test]
    fn validation_rejects_unsupported_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
            SubmittedFile::new("Cargo.toml", ""),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsupportedPath { .. })
        ));
    }

    #[test]
    fn validation_rejects_missing_tests() {
        let request = RunRequest::new(vec![SubmittedFile::new(
            "src/lib.rs",
            "pub fn answer() -> u64 { 42 }\n",
        )]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::MissingRequiredFile {
                path: super::SubmittedPath::LessonTest
            })
        ));
    }
}
