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

// TODO: implement From<UserRegistered> for UserRegisteredDto.
