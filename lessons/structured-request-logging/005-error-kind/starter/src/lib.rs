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

// TODO: add ErrorKind and log_request_error.
