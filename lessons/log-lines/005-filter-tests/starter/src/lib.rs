use std::borrow::Cow;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogMessage<'a> {
    pub text: Cow<'a, str>,
}

// Continue from the previous lesson.
// TODO: assert that alert messages include warning and error text.
// TODO: assert that info text is not returned.
