pub mod domain {
    #[derive(Debug, Clone, PartialEq, Eq, Hash)]
    pub struct EmailAddress(String);

    impl EmailAddress {
        pub fn new(value: impl Into<String>) -> Self {
            Self(value.into())
        }

        pub fn as_str(&self) -> &str {
            &self.0
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserCommand {
        email: EmailAddress,
        display_name: String,
    }

    impl RegisterUserCommand {
        pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
            Self {
                email,
                display_name: display_name.into(),
            }
        }

        pub fn email(&self) -> &EmailAddress {
            &self.email
        }

        pub fn display_name(&self) -> &str {
            &self.display_name
        }
    }
}

// TODO: add async UserRepository operations in the application module.
