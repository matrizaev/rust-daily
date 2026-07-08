pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

#[derive(Debug, Clone, Copy)]
pub struct Secret<'a>(&'a str);

impl<'a> Secret<'a> {
    pub fn new(value: &'a str) -> Self {
        Self(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Display for Secret<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("[redacted]")
    }
}

pub fn log_authentication_attempt(request_id: &str, secret: Secret<'_>) {
    tracing::info!(
        event_name = "authentication.attempt",
        request_id = %request_id,
        secret = %secret,
        "authentication attempted"
    );
}

pub fn request_span(request_id: &str, path: &str) -> tracing::Span {
    tracing::info_span!(
        "http.request",
        request_id = %request_id,
        path = %path
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    Validation,
    Repository,
    Timeout,
}

impl ErrorKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Validation => "validation",
            Self::Repository => "repository",
            Self::Timeout => "timeout",
        }
    }
}

pub fn log_request_error(request_id: &str, error_kind: ErrorKind) {
    tracing::error!(
        event_name = "request.failed",
        request_id = %request_id,
        error.kind = error_kind.as_str(),
        "request failed"
    );
}

pub fn register_attempt_event(
    request_id: &str,
    user_id: Option<&str>,
    success: bool,
) {
    tracing::info!(
        event_name = "register.attempt",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        success,
        "register attempt completed"
    );
}
