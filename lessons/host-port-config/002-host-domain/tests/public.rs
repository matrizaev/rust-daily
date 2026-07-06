use rust_daily_lesson::Host;

#[test]
fn host_representation() {
    let h = Host::new_unchecked("localhost".to_owned());
    assert_eq!(h.as_str(), "localhost");
}
