use std::{
    collections::BTreeMap,
    num::NonZeroUsize,
    path::{Component, Path},
};

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::dependency_set::DependencySet;

const REQUIRED_LIB_PATH: &str = "src/lib.rs";
const SRC_PREFIX: &str = "src/";
const TESTS_PREFIX: &str = "tests/";
const FIXTURES_PREFIX: &str = "fixtures/";
const TESTDATA_PREFIX: &str = "testdata/";

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

#[derive(Debug, Clone, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct SubmittedPath(String);

impl SubmittedPath {
    pub fn as_str(&self) -> &str {
        &self.0
    }

    fn is_required_lib(&self) -> bool {
        self.0 == REQUIRED_LIB_PATH
    }

    fn is_test_file(&self) -> bool {
        self.0.starts_with(TESTS_PREFIX) && self.0.ends_with(".rs")
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
        validate_supported_path(value)?;

        Ok(Self(value.to_string()))
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
    files: BTreeMap<SubmittedPath, SubmittedContent>,
    dependency_set: DependencySet,
}

impl ValidatedRunRequest {
    pub fn files(&self) -> impl Iterator<Item = (&SubmittedPath, &SubmittedContent)> {
        self.files.iter()
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
        let mut validated_files = BTreeMap::new();
        let mut has_lib_rs = false;
        let mut has_test_file = false;

        for file in files {
            let (path, content) = file.into_parts();
            let path = SubmittedPath::try_from(path)?;

            total_bytes = total_bytes.saturating_add(content.len());
            if total_bytes > input.limits.max_total_bytes() {
                return Err(ValidationError::TotalTooLarge {
                    max_bytes: input.limits.max_total_bytes(),
                });
            }

            has_lib_rs |= path.is_required_lib();
            has_test_file |= path.is_test_file();

            let content = SubmittedContent::try_from(SubmittedContentInput::new(
                path.clone(),
                content,
                input.limits.max_file_bytes(),
            ))?;

            if validated_files.insert(path.clone(), content).is_some() {
                return Err(ValidationError::DuplicatePath { path });
            }
        }

        if !has_lib_rs {
            return Err(ValidationError::MissingRequiredFile {
                path: REQUIRED_LIB_PATH,
            });
        }

        if !has_test_file {
            return Err(ValidationError::MissingRequiredFile {
                path: "tests/**/*.rs",
            });
        }

        Ok(Self {
            files: validated_files,
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
    MissingRequiredFile { path: &'static str },
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

fn validate_safe_path(path: &str) -> Result<(), ValidationError> {
    let parsed = Path::new(path);
    if path.is_empty()
        || path.contains('\\')
        || path.contains('\0')
        || path.ends_with('/')
        || path.split('/').any(str::is_empty)
        || parsed.is_absolute()
    {
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

fn validate_supported_path(path: &str) -> Result<(), ValidationError> {
    let is_source = path.starts_with(SRC_PREFIX) && path.ends_with(".rs");
    let is_test = path.starts_with(TESTS_PREFIX) && path.ends_with(".rs");
    let is_fixture = path.starts_with(FIXTURES_PREFIX);
    let is_testdata = path.starts_with(TESTDATA_PREFIX);

    if is_source || is_test || is_fixture || is_testdata {
        Ok(())
    } else {
        Err(ValidationError::UnsupportedPath {
            path: path.to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use std::num::NonZeroUsize;

    use crate::dependency_set::DependencySet;

    use super::{
        RunRequest, RunRequestValidation, RunStatus, SubmittedFile, ValidatedRunRequest,
        ValidationError, ValidationLimits,
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
    fn validation_accepts_nested_source_and_test_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "pub mod domain;\npub mod application;\n"),
            SubmittedFile::new("src/domain.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("src/application/mod.rs", "pub fn call() -> u64 { 42 }\n"),
            SubmittedFile::new(
                "tests/domain_contract.rs",
                "#[test]\nfn answer_is_42() {}\n",
            ),
        ]);
        let validated = validate(request).expect("request should validate");
        let paths = validated
            .files()
            .map(|(path, _content)| path.as_str())
            .collect::<Vec<_>>();

        assert_eq!(
            paths,
            vec![
                "src/application/mod.rs",
                "src/domain.rs",
                "src/lib.rs",
                "tests/domain_contract.rs"
            ]
        );
    }

    #[test]
    fn validation_accepts_fixture_and_testdata_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
            SubmittedFile::new("fixtures/users.json", "[]\n"),
            SubmittedFile::new("testdata/request.json", "{}\n"),
        ]);

        assert!(validate(request).is_ok());
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
    fn validation_rejects_current_directory_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("./src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsafePath { .. })
        ));
    }

    #[test]
    fn validation_rejects_absolute_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("/workspace/src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsafePath { .. })
        ));
    }

    #[test]
    fn validation_rejects_backslash_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new(r"src\lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsafePath { .. })
        ));
    }

    #[test]
    fn validation_rejects_trailing_slash_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs/", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsafePath { .. })
        ));
    }

    #[test]
    fn validation_rejects_double_slash_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src//lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsafePath { .. })
        ));
    }

    #[test]
    fn validation_rejects_nul_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs\0", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsafePath { .. })
        ));
    }

    #[test]
    fn validation_rejects_control_file_paths() {
        for path in [
            "Cargo.toml",
            "Cargo.lock",
            "build.rs",
            ".cargo/config.toml",
            "target/debug/file",
            "benches/foo.rs",
            "examples/foo.rs",
            "migrations/001.sql",
        ] {
            let request = RunRequest::new(vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
                SubmittedFile::new(path, ""),
            ]);

            assert!(
                matches!(
                    validate(request),
                    Err(ValidationError::UnsupportedPath { .. })
                ),
                "{path} should be rejected",
            );
        }
    }

    #[test]
    fn validation_rejects_non_rs_source_and_test_paths() {
        for path in ["src/domain.txt", "tests/domain_contract.txt"] {
            let request = RunRequest::new(vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
                SubmittedFile::new(path, ""),
            ]);

            assert!(
                matches!(
                    validate(request),
                    Err(ValidationError::UnsupportedPath { .. })
                ),
                "{path} should be rejected",
            );
        }
    }

    #[test]
    fn validation_rejects_duplicate_paths() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 43 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::DuplicatePath { .. })
        ));
    }

    #[test]
    fn validation_rejects_missing_lib() {
        let request = RunRequest::new(vec![SubmittedFile::new(
            "tests/lesson.rs",
            "#[test]\nfn answer_is_42() {}\n",
        )]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::MissingRequiredFile { path: "src/lib.rs" })
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
                path: "tests/**/*.rs"
            })
        ));
    }

    #[test]
    fn validation_rejects_too_many_files() {
        let files = (0..9)
            .map(|index| {
                SubmittedFile::new(
                    if index == 0 {
                        "src/lib.rs".to_string()
                    } else if index == 1 {
                        "tests/lesson.rs".to_string()
                    } else {
                        format!("src/module_{index}.rs")
                    },
                    "",
                )
            })
            .collect();

        assert!(matches!(
            validate(RunRequest::new(files)),
            Err(ValidationError::TooManyFiles { max: 8 })
        ));
    }

    #[test]
    fn validation_rejects_file_over_file_limit() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "x".repeat(65)),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::FileTooLarge { .. })
        ));
    }

    #[test]
    fn validation_rejects_total_over_total_limit() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "x".repeat(64)),
            SubmittedFile::new("tests/lesson.rs", "x".repeat(64)),
            SubmittedFile::new("src/domain.rs", "x"),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::TotalTooLarge { max_bytes: 128 })
        ));
    }
}
