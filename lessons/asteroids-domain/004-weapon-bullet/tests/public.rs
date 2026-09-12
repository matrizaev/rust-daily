use std::time::Duration;

use rust_daily_lesson::domain::{Bullet, FiringPose, Ship, Weapon, WeaponConfig};
use rust_daily_lesson::{Screen, Vec2};

const SCREEN: Screen = Screen::new(800.0, 600.0);

#[test]
fn weapon_fires_when_ready_and_respects_cooldown() {
    let ship = Ship::spawn(SCREEN);
    let pose = FiringPose::from(&ship);
    let mut weapon = Weapon::new(WeaponConfig::new(
        Duration::from_millis(250),
        20.0,
        520.0,
        Duration::from_millis(1_100),
    ));

    assert!(weapon.fire(pose).is_some());
    assert!(weapon.fire(pose).is_none());

    weapon.update(Duration::from_millis(249));
    assert!(weapon.fire(pose).is_none());

    weapon.update(Duration::from_millis(1));
    assert!(weapon.fire(pose).is_some());
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
