use rust_daily_lesson::domain::{LifeLoss, NonZeroLives, Wave};

#[test]
fn lives_are_non_zero() {
    assert!(NonZeroLives::new(0).is_none());
    assert_eq!(NonZeroLives::new(3).unwrap().value(), 3);
}

#[test]
fn losing_a_life_keeps_lives_non_zero() {
    match NonZeroLives::new(3).unwrap().lose_one() {
        LifeLoss::Remaining(lives) => assert_eq!(lives.value(), 2),
        LifeLoss::GameOver => panic!("three lives should not end the session"),
    }
}

#[test]
fn losing_the_last_life_is_game_over() {
    assert!(matches!(
        NonZeroLives::new(1).unwrap().lose_one(),
        LifeLoss::GameOver
    ));
}

#[test]
fn waves_start_at_one_and_advance() {
    assert_eq!(Wave::FIRST.value(), 1);
    assert_eq!(Wave::FIRST.next().unwrap().value(), 2);
}

#[test]
fn wave_never_overflows() {
    let max = Wave::new(u32::MAX).unwrap();
    assert_eq!(max.value(), u32::MAX);
    assert!(max.next().is_none());
}
