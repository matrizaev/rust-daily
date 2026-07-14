//! Temporary Cargo workspace preparation for validated submissions.
//!
//! The backend materializes only validated paths and always writes its own
//! manifest before the runner mounts the workspace read-only.

use std::{
    io,
    path::{Path, PathBuf},
};

use tempfile::{Builder, TempDir};
use thiserror::Error;
use tokio::fs;
use uuid::Uuid;

use crate::model::{ValidatedCompileFailCase, ValidatedRunRequest};

/// Filesystem errors while preparing a runner workspace.
#[derive(Debug, Error)]
pub enum WorkspaceError {
    /// The configured workspace root could not be created.
    #[error("failed to create workspace root {path:?}: {source}")]
    CreateRoot {
        /// Workspace root path.
        path: PathBuf,
        /// Underlying filesystem error.
        #[source]
        source: io::Error,
    },
    /// A per-job temporary workspace could not be created.
    #[error("failed to create temporary workspace under {path:?}: {source}")]
    CreateTempDir {
        /// Configured workspace root path.
        path: PathBuf,
        /// Underlying filesystem error.
        #[source]
        source: io::Error,
    },
    /// A parent directory for a workspace file could not be created.
    #[error("failed to create directory {path:?}: {source}")]
    CreateDirectory {
        /// Directory path.
        path: PathBuf,
        /// Underlying filesystem error.
        #[source]
        source: io::Error,
    },
    /// A workspace file could not be written.
    #[error("failed to write file {path:?}: {source}")]
    WriteFile {
        /// File path.
        path: PathBuf,
        /// Underlying filesystem error.
        #[source]
        source: io::Error,
    },
}

/// Creates a temporary Cargo workspace for one validated run request.
pub async fn prepare_workspace(
    job_id: Uuid,
    request: &ValidatedRunRequest,
    workspace_root: &Path,
) -> Result<TempDir, WorkspaceError> {
    fs::create_dir_all(workspace_root)
        .await
        .map_err(|source| WorkspaceError::CreateRoot {
            path: workspace_root.to_path_buf(),
            source,
        })?;

    let prefix = format!("job-{job_id}-");
    let temp_dir = Builder::new()
        .prefix(&prefix)
        .tempdir_in(workspace_root)
        .map_err(|source| WorkspaceError::CreateTempDir {
            path: workspace_root.to_path_buf(),
            source,
        })?;

    let manifest = request.dependency_set().cargo_toml();
    write_file(temp_dir.path().join("Cargo.toml"), manifest.as_bytes()).await?;

    for (path, content) in request.files() {
        write_file(temp_dir.path().join(path.as_str()), content.as_bytes()).await?;
    }

    Ok(temp_dir)
}

/// Cargo integration-test target name generated for a compile-fail case.
#[derive(Debug, Clone, Eq, PartialEq)]
pub struct TestTargetName(String);

impl TestTargetName {
    /// Derives the generated target name from a validated compile-fail case.
    pub fn from_case(case: &ValidatedCompileFailCase) -> Self {
        Self(format!(
            "compile_fail_{}",
            case.name().as_str().replace('-', "_")
        ))
    }

    /// Returns the target name passed to `cargo check --test`.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Writes a compile-fail source file as a generated integration-test target.
pub async fn write_compile_fail_case(
    workspace: &Path,
    case: &ValidatedCompileFailCase,
) -> Result<TestTargetName, WorkspaceError> {
    let target_name = TestTargetName::from_case(case);
    let path = workspace
        .join("tests")
        .join(format!("{}.rs", target_name.as_str()));

    write_file(path, case.content().as_bytes()).await?;

    Ok(target_name)
}

async fn write_file(path: PathBuf, contents: &[u8]) -> Result<(), WorkspaceError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|source| WorkspaceError::CreateDirectory {
                path: parent.to_path_buf(),
                source,
            })?;
    }

    fs::write(&path, contents)
        .await
        .map_err(|source| WorkspaceError::WriteFile { path, source })
}

#[cfg(test)]
mod tests {
    use std::num::NonZeroUsize;

    use tempfile::tempdir;

    use super::{prepare_workspace, write_compile_fail_case};
    use crate::{
        dependency_set::DependencySet,
        model::{
            RunRequest, RunRequestValidation, SubmittedCompileFailCase, SubmittedFile,
            ValidatedRunRequest, ValidationLimits,
        },
    };

    fn nonzero(value: usize) -> NonZeroUsize {
        NonZeroUsize::new(value).expect("test value should be non-zero")
    }

    fn limits() -> ValidationLimits {
        ValidationLimits::try_new(
            nonzero(8),
            nonzero(64),
            nonzero(128),
            nonzero(240),
            nonzero(120),
            nonzero(16),
            nonzero(64),
            nonzero(128),
        )
        .expect("test limits should be valid")
    }

    fn roomy_limits() -> ValidationLimits {
        ValidationLimits::try_new(
            nonzero(16),
            nonzero(512),
            nonzero(2048),
            nonzero(240),
            nonzero(120),
            nonzero(16),
            nonzero(512),
            nonzero(1024),
        )
        .expect("test limits should be valid")
    }

    fn valid_request() -> ValidatedRunRequest {
        RunRequestValidation::new(
            RunRequest::new(vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
            ]),
            limits(),
        )
        .try_into()
        .expect("test request should be valid")
    }

    fn advanced_request() -> ValidatedRunRequest {
        RunRequestValidation::new(
            RunRequest::with_dependency_set(
                vec![
                    SubmittedFile::new("src/lib.rs", "pub fn answer() -> u64 { 42 }\n"),
                    SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer_is_42() {}\n"),
                ],
                DependencySet::Advanced,
            ),
            limits(),
        )
        .try_into()
        .expect("test request should be valid")
    }

    fn multi_file_request() -> ValidatedRunRequest {
        RunRequestValidation::new(
            RunRequest::new(vec![
                SubmittedFile::new("src/lib.rs", "pub mod domain;\npub mod application;\n"),
                SubmittedFile::new("src/domain.rs", "pub fn answer() -> u64 { 42 }\n"),
                SubmittedFile::new("src/application/mod.rs", "pub fn call() -> u64 { 42 }\n"),
                SubmittedFile::new(
                    "tests/domain_contract.rs",
                    "#[test]\nfn answer_is_42() {}\n",
                ),
                SubmittedFile::new(
                    "tests/application_contract.rs",
                    "#[test]\nfn call_is_42() {}\n",
                ),
                SubmittedFile::new("fixtures/users.json", "[]\n"),
                SubmittedFile::new("testdata/request.json", "{}\n"),
            ]),
            roomy_limits(),
        )
        .try_into()
        .expect("test request should be valid")
    }

    fn compile_fail_request() -> ValidatedRunRequest {
        RunRequestValidation::new(
            RunRequest::compile_fail(
                vec![
                    SubmittedFile::new("src/lib.rs", "pub struct UserId(u64);\n"),
                    SubmittedFile::new("tests/lesson.rs", "#[test]\nfn code_compiles() {}\n"),
                ],
                vec![SubmittedCompileFailCase::new(
                    "private-field-construction",
                    "compile_fail/private_field_construction.rs",
                    "use rust_daily_lesson::UserId;\n",
                    vec!["private".to_string()],
                )],
                DependencySet::Std,
            ),
            roomy_limits(),
        )
        .try_into()
        .expect("test request should be valid")
    }

    #[tokio::test]
    async fn prepare_workspace_writes_template_and_submitted_files() {
        let root = tempdir().expect("temp root should be created");
        let workspace = prepare_workspace(uuid::Uuid::new_v4(), &valid_request(), root.path())
            .await
            .expect("workspace should be prepared");

        assert!(workspace.path().join("Cargo.toml").exists());
        assert!(workspace.path().join("src/lib.rs").exists());
        assert!(workspace.path().join("tests/lesson.rs").exists());
    }

    #[tokio::test]
    async fn prepare_workspace_writes_nested_snapshot_files() {
        let root = tempdir().expect("temp root should be created");
        let workspace = prepare_workspace(uuid::Uuid::new_v4(), &multi_file_request(), root.path())
            .await
            .expect("workspace should be prepared");

        assert!(workspace.path().join("src/lib.rs").exists());
        assert!(workspace.path().join("src/domain.rs").exists());
        assert!(workspace.path().join("src/application/mod.rs").exists());
        assert!(workspace.path().join("tests/domain_contract.rs").exists());
        assert!(
            workspace
                .path()
                .join("tests/application_contract.rs")
                .exists()
        );
        assert!(workspace.path().join("fixtures/users.json").exists());
        assert!(workspace.path().join("testdata/request.json").exists());
    }

    #[tokio::test]
    async fn write_compile_fail_case_writes_generated_integration_target() {
        let root = tempdir().expect("temp root should be created");
        let request = compile_fail_request();
        let workspace = prepare_workspace(uuid::Uuid::new_v4(), &request, root.path())
            .await
            .expect("workspace should be prepared");
        let case = &request.compile_fail_cases()[0];
        let target_name = write_compile_fail_case(workspace.path(), case)
            .await
            .expect("case should be written");

        assert_eq!(
            target_name.as_str(),
            "compile_fail_private_field_construction"
        );
        assert!(
            workspace
                .path()
                .join("tests/compile_fail_private_field_construction.rs")
                .exists()
        );
    }

    #[test]
    fn cargo_toml_keeps_std_dependency_free() {
        let manifest = DependencySet::Std.cargo_toml();

        assert!(!manifest.contains("serde ="));
        assert!(!manifest.contains("actix-web ="));
    }

    #[tokio::test]
    async fn prepare_workspace_writes_advanced_cache_manifest() {
        let root = tempdir().expect("temp root should be created");
        let workspace = prepare_workspace(uuid::Uuid::new_v4(), &advanced_request(), root.path())
            .await
            .expect("workspace should be prepared");
        let manifest = std::fs::read_to_string(workspace.path().join("Cargo.toml"))
            .expect("manifest should be readable");

        assert_eq!(manifest, DependencySet::Advanced.cargo_toml());
        assert!(manifest.contains(r#"serde = { version = "1", features = ["derive"] }"#));
        assert!(manifest.contains(r#"actix-web = { version = "4", default-features = false }"#));
        assert!(manifest.contains(
            r#"proptest = { version = "1", default-features = false, features = ["std"] }"#
        ));
        assert!(manifest.contains("[profile.test]"));
    }
}
