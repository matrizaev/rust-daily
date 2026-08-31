use rust_daily_lesson::domain::Score;

#[test]
fn score_holds_its_value() {
    assert_eq!(Score::ZERO.value(), 0);
    assert_eq!(Score::new(100).value(), 100);
}

#[test]
fn score_accumulates() {
    let mut score = Score::new(20);
    score += Score::new(50);
    score += Score::new(30);
    assert_eq!(score.value(), 100);
}

#[test]
fn score_saturates_instead_of_overflowing() {
    let mut score = Score::new(u32::MAX - 1);
    score += Score::new(5);
    assert_eq!(score.value(), u32::MAX);
}

#[test]
fn score_is_a_copyable_comparable_value() {
    let a = Score::new(10);
    let b = a; // Score is Copy
    assert_eq!(a, b);
    assert!(a < Score::new(20));
}
