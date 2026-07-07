#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

// Continue from the previous lesson.
// TODO: define RegisterUserCommand with private fields and accessors.
