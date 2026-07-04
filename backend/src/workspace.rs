use std::{
    io,
    path::{Path, PathBuf},
};

use tempfile::{Builder, TempDir};
use thiserror::Error;
use tokio::fs;
use uuid::Uuid;

use crate::model::ValidatedRunRequest;

const CARGO_TOML: &str = r#"[package]
name = "rust_daily_lesson"
version = "0.1.0"
edition = "2024"

[lib]
path = "src/lib.rs"

[dependencies]
"#;

#[derive(Debug, Error)]
pub enum WorkspaceError {
    #[error("failed to create workspace root {path:?}: {source}")]
    CreateRoot {
        path: PathBuf,
        #[source]
        source: io::Error,
    },
    #[error("failed to create temporary workspace under {path:?}: {source}")]
    CreateTempDir {
        path: PathBuf,
        #[source]
        source: io::Error,
    },
    #[error("failed to create directory {path:?}: {source}")]
    CreateDirectory {
        path: PathBuf,
        #[source]
        source: io::Error,
    },
    #[error("failed to write file {path:?}: {source}")]
    WriteFile {
        path: PathBuf,
        #[source]
        source: io::Error,
    },
}

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

    write_file(temp_dir.path().join("Cargo.toml"), CARGO_TOML.as_bytes()).await?;

    for (path, content) in request.files() {
        write_file(temp_dir.path().join(path.as_str()), content.as_bytes()).await?;
    }

    Ok(temp_dir)
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

    use super::prepare_workspace;
    use crate::model::{
        RunRequest, RunRequestValidation, SubmittedFile, ValidatedRunRequest, ValidationLimits,
    };

    fn nonzero(value: usize) -> NonZeroUsize {
        NonZeroUsize::new(value).expect("test value should be non-zero")
    }

    fn limits() -> ValidationLimits {
        ValidationLimits::try_new(nonzero(8), nonzero(64), nonzero(128))
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
}
