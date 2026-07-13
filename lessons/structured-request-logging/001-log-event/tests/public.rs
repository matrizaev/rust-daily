use std::sync::{Arc, Mutex};

use rust_daily_lesson::log_request_received;
use tracing::{
    field::{Field, Visit},
    Event, Subscriber,
};
use tracing_subscriber::{
    layer::{Context, Layer},
    prelude::*,
    Registry,
};

#[derive(Debug, Default, PartialEq, Eq)]
struct CapturedFields {
    event_name: Option<String>,
    request_id: Option<String>,
}

#[derive(Default)]
struct FieldVisitor {
    captured: CapturedFields,
}

impl FieldVisitor {
    fn record(&mut self, name: &str, value: String) {
        match name {
            "event_name" => self.captured.event_name = Some(value),
            "request_id" => self.captured.request_id = Some(value),
            _ => {}
        }
    }
}

impl Visit for FieldVisitor {
    fn record_str(&mut self, field: &Field, value: &str) {
        self.record(field.name(), value.to_owned());
    }

    fn record_debug(&mut self, field: &Field, value: &dyn std::fmt::Debug) {
        self.record(field.name(), format!("{value:?}").trim_matches('"').to_owned());
    }
}

#[derive(Clone)]
struct CaptureLayer {
    captured: Arc<Mutex<Vec<CapturedFields>>>,
}

impl<S> Layer<S> for CaptureLayer
where
    S: Subscriber,
{
    fn on_event(&self, event: &Event<'_>, _context: Context<'_, S>) {
        let mut visitor = FieldVisitor::default();
        event.record(&mut visitor);
        self.captured.lock().unwrap().push(visitor.captured);
    }
}

#[test]
fn emits_structured_request_fields() {
    let captured = Arc::new(Mutex::new(Vec::new()));
    let subscriber = Registry::default().with(CaptureLayer {
        captured: Arc::clone(&captured),
    });

    tracing::subscriber::with_default(subscriber, || {
        log_request_received("req-1");
    });

    let events = captured.lock().unwrap();
    assert_eq!(events.len(), 1);
    assert_eq!(events[0].event_name.as_deref(), Some("request.received"));
    assert_eq!(events[0].request_id.as_deref(), Some("req-1"));
}
