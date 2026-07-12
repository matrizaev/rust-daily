use serde::{Deserialize, Serialize};

const ADVANCED_CARGO_TOML: &str = include_str!("../../docker/dependency-cache/Cargo.toml");

const STD_CARGO_TOML: &str = r#"[package]
name = "rust_daily_lesson"
version = "0.1.0"
edition = "2024"

[lib]
path = "src/lib.rs"

[dependencies]

[profile.test]
debug = 0
incremental = false
"#;

#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum DependencySet {
    #[default]
    Std,
    Advanced,
}

impl DependencySet {
    pub fn cargo_toml(self) -> &'static str {
        match self {
            Self::Std => STD_CARGO_TOML,
            Self::Advanced => ADVANCED_CARGO_TOML,
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
    fn advanced_dependency_set_uses_runner_cache_manifest() {
        assert_eq!(
            DependencySet::Advanced.cargo_toml(),
            DOCKER_DEPENDENCY_CACHE_MANIFEST
        );
        assert!(
            DependencySet::Advanced
                .cargo_toml()
                .contains(r#"name = "rust_daily_lesson""#)
        );
    }

    #[test]
    fn std_dependency_set_uses_plain_cargo_commands() {
        assert!(!DependencySet::Std.cargo_toml().contains("serde ="));
        assert!(!DependencySet::Std.cargo_toml().contains("actix-web ="));

        let test = DependencySet::Std.test_command();
        assert_eq!(test.program(), "cargo");
        assert_eq!(test.args(), ["test"]);

        let check_lib = DependencySet::Std.check_lib_command();
        assert_eq!(check_lib.program(), "cargo");
        assert_eq!(check_lib.args(), ["check", "--lib"]);

        let check_test = DependencySet::Std.check_test_command("case_name");
        assert_eq!(check_test.program(), "cargo");
        assert_eq!(check_test.args(), ["check", "--test", "case_name"]);
    }

    #[test]
    fn advanced_dependency_set_uses_cached_runner_commands() {
        let test = DependencySet::Advanced.test_command();
        assert_eq!(test.program(), "run-advanced-lesson-cargo");
        assert_eq!(test.args(), ["test"]);

        let check_lib = DependencySet::Advanced.check_lib_command();
        assert_eq!(check_lib.program(), "run-advanced-lesson-cargo");
        assert_eq!(check_lib.args(), ["check", "--lib"]);

        let check_test = DependencySet::Advanced.check_test_command("case_name");
        assert_eq!(check_test.program(), "run-advanced-lesson-cargo");
        assert_eq!(check_test.args(), ["check", "--test", "case_name"]);
    }
}
