use std::num::NonZeroU16;
use rust_daily_lesson::Port;

fn main() {
    let _ = Port(NonZeroU16::new(8080).unwrap());
}
