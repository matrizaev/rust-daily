use std::time::Duration;

use rust_daily_lesson::domain::{Bullet, Weapon};
use rust_daily_lesson::{Screen, Vec2};

const SCREEN: Screen = Screen::new(800.0, 600.0);

#[test]
fn weapon_fires_when_ready_and_respects_cooldown() {
    let mut weapon = Weapon::new(Duration::from_millis(250));

    assert!(weapon.fire());
    assert!(!weapon.fire());

    weapon.update(Duration::from_millis(249));
    assert!(!weapon.fire());

    weapon.update(Duration::from_millis(1));
    assert!(weapon.fire());
}

#[test]
fn bullet_moves_and_expires() {
    let mut bullet = Bullet::new(Vec2::ZERO, Vec2::new(10.0, 0.0), Duration::from_secs(2));

    assert!(bullet.update(Duration::from_secs(1), SCREEN));
    assert_eq!(bullet.position(), Vec2::new(10.0, 0.0));

    assert!(!bullet.update(Duration::from_secs(1), SCREEN)); // lifetime exhausted
}

#[test]
fn bullet_is_culled_when_offscreen() {
    let mut bullet = Bullet::new(Vec2::new(95.0, 50.0), Vec2::new(10.0, 0.0), Duration::from_secs(1));
    assert!(!bullet.update(Duration::from_secs(1), SCREEN));
}
