use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}
