use std::{
    collections::{BTreeMap, BTreeSet},
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
const COMPILE_FAIL_PREFIX: &str = "compile_fail/";
const MAX_COMPILE_FAIL_CASES: usize = 4;
const MAX_COMPILE_FAIL_CASE_NAME_BYTES: usize = 80;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub struct RunRequest {
    #[serde(default)]
    mode: RunMode,
    files: Vec<SubmittedFile>,
    #[serde(default, rename = "dependencySet")]
    dependency_set: DependencySet,
    #[serde(default, rename = "compileFailCases")]
    compile_fail_cases: Vec<SubmittedCompileFailCase>,
}

impl RunRequest {
    pub fn new(files: Vec<SubmittedFile>) -> Self {
        Self {
            mode: RunMode::default(),
            files,
            dependency_set: DependencySet::default(),
            compile_fail_cases: Vec::new(),
        }
    }

    pub fn with_dependency_set(files: Vec<SubmittedFile>, dependency_set: DependencySet) -> Self {
        Self {
            mode: RunMode::default(),
            files,
            dependency_set,
            compile_fail_cases: Vec::new(),
        }
    }

    pub fn compile_fail(
        files: Vec<SubmittedFile>,
        compile_fail_cases: Vec<SubmittedCompileFailCase>,
        dependency_set: DependencySet,
    ) -> Self {
        Self {
            mode: RunMode::CompileFail,
            files,
            dependency_set,
            compile_fail_cases,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum RunMode {
    #[default]
    CargoTest,
    CompileFail,
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

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub struct SubmittedCompileFailCase {
    name: String,
    path: String,
    content: String,
    #[serde(rename = "expectedDiagnostics")]
    expected_diagnostics: Vec<String>,
    #[serde(default, rename = "forbiddenDiagnostics")]
    forbidden_diagnostics: Vec<String>,
}

impl SubmittedCompileFailCase {
    pub fn new(
        name: impl Into<String>,
        path: impl Into<String>,
        content: impl Into<String>,
        expected_diagnostics: Vec<String>,
    ) -> Self {
        Self {
            name: name.into(),
            path: path.into(),
            content: content.into(),
            expected_diagnostics,
            forbidden_diagnostics: Vec::new(),
        }
    }

    pub fn with_forbidden_diagnostics(mut self, forbidden_diagnostics: Vec<String>) -> Self {
        self.forbidden_diagnostics = forbidden_diagnostics;
        self
    }

    fn into_parts(self) -> (String, String, String, Vec<String>, Vec<String>) {
        (
            self.name,
            self.path,
            self.content,
            self.expected_diagnostics,
            self.forbidden_diagnostics,
        )
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
    path: String,
    content: String,
    max_file_bytes: usize,
}

impl SubmittedContentInput {
    fn new(path: impl Into<String>, content: String, max_file_bytes: usize) -> Self {
        Self {
            path: path.into(),
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
pub struct ValidatedCompileFailCase {
    name: CompileFailCaseName,
    path: CompileFailPath,
    content: SubmittedContent,
    expected_diagnostics: Vec<DiagnosticSnippet>,
    forbidden_diagnostics: Vec<DiagnosticSnippet>,
}

impl ValidatedCompileFailCase {
    pub fn name(&self) -> &CompileFailCaseName {
        &self.name
    }

    pub fn path(&self) -> &CompileFailPath {
        &self.path
    }

    pub fn content(&self) -> &SubmittedContent {
        &self.content
    }

    pub fn expected_diagnostics(&self) -> &[DiagnosticSnippet] {
        &self.expected_diagnostics
    }

    pub fn forbidden_diagnostics(&self) -> &[DiagnosticSnippet] {
        &self.forbidden_diagnostics
    }
}

#[derive(Debug, Clone, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct CompileFailCaseName(String);

impl CompileFailCaseName {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for CompileFailCaseName {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl TryFrom<String> for CompileFailCaseName {
    type Error = ValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let trimmed = value.trim();

        if trimmed.is_empty()
            || value != trimmed
            || trimmed.len() > MAX_COMPILE_FAIL_CASE_NAME_BYTES
            || !trimmed
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-'))
        {
            return Err(ValidationError::InvalidCompileFailCaseName { name: value });
        }

        Ok(Self(trimmed.to_string()))
    }
}

#[derive(Debug, Clone, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct CompileFailPath(String);

impl CompileFailPath {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for CompileFailPath {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl TryFrom<String> for CompileFailPath {
    type Error = ValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_safe_path(&value).map_err(|error| error.with_owned_path(value.clone()))?;

        if !value.starts_with(COMPILE_FAIL_PREFIX) || !value.ends_with(".rs") {
            return Err(ValidationError::UnsupportedPath { path: value });
        }

        Ok(Self(value))
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct DiagnosticSnippet(String);

impl DiagnosticSnippet {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<(String, &str)> for DiagnosticSnippet {
    type Error = ValidationError;

    fn try_from((value, case_name): (String, &str)) -> Result<Self, Self::Error> {
        let trimmed = value.trim();

        if trimmed.is_empty() {
            return Err(ValidationError::EmptyDiagnosticSnippet {
                name: case_name.to_string(),
            });
        }

        Ok(Self(trimmed.to_string()))
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct ValidatedRunRequest {
    mode: RunMode,
    files: BTreeMap<SubmittedPath, SubmittedContent>,
    dependency_set: DependencySet,
    compile_fail_cases: Vec<ValidatedCompileFailCase>,
}

impl ValidatedRunRequest {
    pub fn mode(&self) -> RunMode {
        self.mode
    }

    pub fn files(&self) -> impl Iterator<Item = (&SubmittedPath, &SubmittedContent)> {
        self.files.iter()
    }

    pub fn dependency_set(&self) -> DependencySet {
        self.dependency_set
    }

    pub fn compile_fail_cases(&self) -> &[ValidatedCompileFailCase] {
        &self.compile_fail_cases
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
            mode,
            files,
            dependency_set,
            compile_fail_cases,
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
                path.as_str(),
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

        let validated_compile_fail_cases = validate_compile_fail_cases(
            mode,
            compile_fail_cases,
            input.limits.max_file_bytes(),
            input.limits.max_total_bytes(),
            &mut total_bytes,
        )?;

        Ok(Self {
            mode,
            files: validated_files,
            dependency_set,
            compile_fail_cases: validated_compile_fail_cases,
        })
    }
}

fn validate_compile_fail_cases(
    mode: RunMode,
    cases: Vec<SubmittedCompileFailCase>,
    max_file_bytes: usize,
    max_total_bytes: usize,
    total_bytes: &mut usize,
) -> Result<Vec<ValidatedCompileFailCase>, ValidationError> {
    match mode {
        RunMode::CargoTest if !cases.is_empty() => {
            return Err(ValidationError::CompileFailCasesNotAllowed);
        }
        RunMode::CargoTest => return Ok(Vec::new()),
        RunMode::CompileFail if cases.is_empty() => {
            return Err(ValidationError::MissingCompileFailCases);
        }
        RunMode::CompileFail => {}
    }

    if cases.len() > MAX_COMPILE_FAIL_CASES {
        return Err(ValidationError::TooManyCompileFailCases {
            max: MAX_COMPILE_FAIL_CASES,
        });
    }

    let mut names = BTreeSet::new();
    let mut paths = BTreeSet::new();
    let mut target_names = BTreeSet::new();
    let mut validated = Vec::with_capacity(cases.len());

    for case in cases {
        let (name, path, content, expected_diagnostics, forbidden_diagnostics) = case.into_parts();
        let name = CompileFailCaseName::try_from(name)?;

        if !names.insert(name.clone()) {
            return Err(ValidationError::DuplicateCompileFailCaseName {
                name: name.as_str().to_string(),
            });
        }

        let target_name = name.as_str().replace('-', "_");
        if !target_names.insert(target_name) {
            return Err(ValidationError::DuplicateCompileFailCaseName {
                name: name.as_str().to_string(),
            });
        }

        let path = CompileFailPath::try_from(path)?;

        if !paths.insert(path.clone()) {
            return Err(ValidationError::DuplicateCompileFailCasePath {
                path: path.as_str().to_string(),
            });
        }

        *total_bytes = total_bytes.saturating_add(content.len());
        if *total_bytes > max_total_bytes {
            return Err(ValidationError::TotalTooLarge {
                max_bytes: max_total_bytes,
            });
        }

        let content = SubmittedContent::try_from(SubmittedContentInput::new(
            path.as_str(),
            content,
            max_file_bytes,
        ))?;
        let expected_diagnostics =
            validate_diagnostic_snippets(name.as_str(), expected_diagnostics)?;

        if expected_diagnostics.is_empty() {
            return Err(ValidationError::MissingExpectedDiagnostics {
                name: name.as_str().to_string(),
            });
        }

        let forbidden_diagnostics =
            validate_diagnostic_snippets(name.as_str(), forbidden_diagnostics)?;

        validated.push(ValidatedCompileFailCase {
            name,
            path,
            content,
            expected_diagnostics,
            forbidden_diagnostics,
        });
    }

    Ok(validated)
}

fn validate_diagnostic_snippets(
    case_name: &str,
    snippets: Vec<String>,
) -> Result<Vec<DiagnosticSnippet>, ValidationError> {
    snippets
        .into_iter()
        .map(|snippet| DiagnosticSnippet::try_from((snippet, case_name)))
        .collect()
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
    FileTooLarge { path: String, max_bytes: usize },
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
    #[error("compile-fail cases are only allowed for compile-fail requests")]
    CompileFailCasesNotAllowed,
    #[error("compile-fail requests must include at least one case")]
    MissingCompileFailCases,
    #[error("too many compile-fail cases: maximum is {max}")]
    TooManyCompileFailCases { max: usize },
    #[error("invalid compile-fail case name: `{name}`")]
    InvalidCompileFailCaseName { name: String },
    #[error("duplicate compile-fail case name: `{name}`")]
    DuplicateCompileFailCaseName { name: String },
    #[error("duplicate compile-fail case path: `{path}`")]
    DuplicateCompileFailCasePath { path: String },
    #[error("compile-fail case `{name}` must include expected diagnostics")]
    MissingExpectedDiagnostics { name: String },
    #[error("compile-fail case `{name}` has an empty diagnostic snippet")]
    EmptyDiagnosticSnippet { name: String },
}

impl ValidationError {
    pub fn is_payload_limit(&self) -> bool {
        matches!(
            self,
            Self::TooManyFiles { .. }
                | Self::FileTooLarge { .. }
                | Self::TotalTooLarge { .. }
                | Self::TooManyCompileFailCases { .. }
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
        RunMode, RunRequest, RunRequestValidation, RunStatus, SubmittedCompileFailCase,
        SubmittedFile, ValidatedRunRequest, ValidationError, ValidationLimits,
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

    fn compile_fail_case() -> SubmittedCompileFailCase {
        SubmittedCompileFailCase::new(
            "private-field-construction",
            "compile_fail/private_field_construction.rs",
            "use rust_daily_lesson::UserId;\n",
            vec!["private".to_string()],
        )
    }

    fn compile_fail_request() -> RunRequest {
        RunRequest::compile_fail(
            vec![
                SubmittedFile::new("src/lib.rs", "pub struct UserId(u64);\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn code_compiles() {}\n"),
            ],
            vec![compile_fail_case()],
            DependencySet::Std,
        )
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
    fn validation_accepts_compile_fail_request() {
        let validated = validate(compile_fail_request()).expect("request should validate");

        assert_eq!(validated.mode(), RunMode::CompileFail);
        assert_eq!(validated.compile_fail_cases().len(), 1);
        assert_eq!(
            validated.compile_fail_cases()[0].name().as_str(),
            "private-field-construction"
        );
    }

    #[test]
    fn validation_rejects_compile_fail_cases_for_cargo_test() {
        let request = RunRequest {
            compile_fail_cases: vec![compile_fail_case()],
            ..valid_request()
        };

        assert!(matches!(
            validate(request),
            Err(ValidationError::CompileFailCasesNotAllowed)
        ));
    }

    #[test]
    fn validation_rejects_compile_fail_without_cases() {
        let request = RunRequest::compile_fail(
            vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn code_compiles() {}\n"),
            ],
            Vec::new(),
            DependencySet::Std,
        );

        assert!(matches!(
            validate(request),
            Err(ValidationError::MissingCompileFailCases)
        ));
    }

    #[test]
    fn validation_rejects_invalid_compile_fail_case_name() {
        let request = RunRequest::compile_fail(
            vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn code_compiles() {}\n"),
            ],
            vec![SubmittedCompileFailCase::new(
                "bad name",
                "compile_fail/bad_name.rs",
                "",
                vec!["error".to_string()],
            )],
            DependencySet::Std,
        );

        assert!(matches!(
            validate(request),
            Err(ValidationError::InvalidCompileFailCaseName { .. })
        ));
    }

    #[test]
    fn validation_rejects_unsupported_compile_fail_case_path() {
        let request = RunRequest::compile_fail(
            vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn code_compiles() {}\n"),
            ],
            vec![SubmittedCompileFailCase::new(
                "bad-path",
                "tests/bad_path.rs",
                "",
                vec!["error".to_string()],
            )],
            DependencySet::Std,
        );

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsupportedPath { .. })
        ));
    }

    #[test]
    fn validation_rejects_missing_expected_diagnostics() {
        let request = RunRequest::compile_fail(
            vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn code_compiles() {}\n"),
            ],
            vec![SubmittedCompileFailCase::new(
                "missing-diagnostics",
                "compile_fail/missing_diagnostics.rs",
                "",
                Vec::new(),
            )],
            DependencySet::Std,
        );

        assert!(matches!(
            validate(request),
            Err(ValidationError::MissingExpectedDiagnostics { .. })
        ));
    }

    #[test]
    fn validation_rejects_normal_compile_fail_file_path() {
        let request = RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn code_compiles() {}\n"),
            SubmittedFile::new("compile_fail/case.rs", ""),
        ]);

        assert!(matches!(
            validate(request),
            Err(ValidationError::UnsupportedPath { .. })
        ));
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
