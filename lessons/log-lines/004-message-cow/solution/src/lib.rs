use std::borrow::Cow;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogMessage<'a> {
    pub text: Cow<'a, str>,
}
