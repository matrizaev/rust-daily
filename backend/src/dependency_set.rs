use serde::{Deserialize, Serialize};

pub type CargoDependency = (&'static str, &'static str);

const STD_DEPENDENCIES: &[CargoDependency] = &[];
const ADVANCED_DEPENDENCIES: &[CargoDependency] = &[
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
];

#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum DependencySet {
    #[default]
    Std,
    Advanced,
}

impl DependencySet {
    pub fn dependencies(self) -> &'static [CargoDependency] {
        match self {
            Self::Std => STD_DEPENDENCIES,
            Self::Advanced => ADVANCED_DEPENDENCIES,
        }
    }

    pub fn test_command(self) -> CargoTestCommand {
        match self {
            Self::Std => CargoTestCommand {
                program: "cargo",
                args: vec!["test".to_string()],
            },
            Self::Advanced => CargoTestCommand {
                program: "run-advanced-lesson-cargo",
                args: vec!["test".to_string()],
            },
        }
    }

    pub fn check_lib_command(self) -> CargoTestCommand {
        match self {
            Self::Std => CargoTestCommand {
                program: "cargo",
                args: vec!["check".to_string(), "--lib".to_string()],
            },
            Self::Advanced => CargoTestCommand {
                program: "run-advanced-lesson-cargo",
                args: vec!["check".to_string(), "--lib".to_string()],
            },
        }
    }

    pub fn check_test_command(self, test_name: &str) -> CargoTestCommand {
        match self {
            Self::Std => CargoTestCommand {
                program: "cargo",
                args: vec![
                    "check".to_string(),
                    "--test".to_string(),
                    test_name.to_string(),
                ],
            },
            Self::Advanced => CargoTestCommand {
                program: "run-advanced-lesson-cargo",
                args: vec![
                    "check".to_string(),
                    "--test".to_string(),
                    test_name.to_string(),
                ],
            },
        }
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct CargoTestCommand {
    program: &'static str,
    args: Vec<String>,
}

impl CargoTestCommand {
    pub fn program(&self) -> &'static str {
        self.program
    }

    pub fn args(&self) -> &[String] {
        &self.args
    }
}

#[cfg(test)]
mod tests {
    use super::DependencySet;

    const DOCKER_DEPENDENCY_CACHE_MANIFEST: &str =
        include_str!("../../docker/dependency-cache/Cargo.toml");

    #[test]
    fn advanced_dependencies_match_runner_cache_manifest() {
        let expected = DependencySet::Advanced
            .dependencies()
            .iter()
            .map(|(name, spec)| format!("{name} = {spec}"))
            .collect::<Vec<_>>();

        assert_eq!(
            manifest_section_lines(DOCKER_DEPENDENCY_CACHE_MANIFEST, "[dependencies]"),
            expected
        );
    }

    fn manifest_section_lines(manifest: &str, section: &str) -> Vec<String> {
        manifest
            .lines()
            .skip_while(|line| line.trim() != section)
            .skip(1)
            .take_while(|line| !line.starts_with('['))
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .map(str::to_string)
            .collect()
    }
}
