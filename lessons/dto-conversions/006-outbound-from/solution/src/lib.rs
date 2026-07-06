#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserRegistered {
    pub user_id: u64,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserRegisteredDto {
    pub id: String,
    pub email: String,
}

impl From<UserRegistered> for UserRegisteredDto {
    fn from(value: UserRegistered) -> Self {
        Self {
            id: value.user_id.to_string(),
            email: value.email,
        }
    }
}
