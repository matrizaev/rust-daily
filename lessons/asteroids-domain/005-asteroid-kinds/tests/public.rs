use std::time::Duration;

use rust_daily_lesson::domain::{Asteroid, AsteroidDestruction, AsteroidKind};
use rust_daily_lesson::{Random, Screen, Vec2};

const SCREEN: Screen = Screen::new(800.0, 600.0);

/// Deterministic randomness: always the minimum value, never a chance hit.
struct TestRandom;

impl Random for TestRandom {
    fn range(&mut self, min: f32, _max: f32) -> f32 {
        min
    }

    fn chance(&mut self, _p: f64) -> bool {
        false
    }
}

#[test]
fn radius_and_score_follow_the_kind() {
    let pos = Vec2::new(100.0, 100.0);
    let large = Asteroid::new(AsteroidKind::Large, pos, Vec2::ZERO);
    let medium = Asteroid::new(AsteroidKind::Medium, pos, Vec2::ZERO);
    let small = Asteroid::new(AsteroidKind::Small, pos, Vec2::ZERO);

    assert_eq!(large.radius(), 40.0);
    assert_eq!(medium.radius(), 22.0);
    assert_eq!(small.radius(), 12.0);

    assert_eq!(large.score().value(), 20);
    assert_eq!(medium.score().value(), 50);
    assert_eq!(small.score().value(), 100);
}

#[test]
fn asteroids_integrate_and_wrap() {
    let mut asteroid = Asteroid::new(
        AsteroidKind::Large,
        Vec2::new(790.0, 50.0),
        Vec2::new(40.0, 0.0),
    );
    asteroid.update(Duration::from_secs(1), SCREEN);
    assert_eq!(asteroid.position(), Vec2::new(30.0, 50.0));
}

#[test]
fn large_asteroids_split_into_two_mediums() {
    let asteroid = Asteroid::new(AsteroidKind::Large, Vec2::new(200.0, 200.0), Vec2::ZERO);

    match asteroid.destroy(&mut TestRandom) {
        AsteroidDestruction::Fragments(parts) => {
            assert_eq!(parts.len(), 2);
            assert!(parts.iter().all(|a| matches!(a, Asteroid::Medium(_))));
            assert_eq!(parts[0].position(), Vec2::new(200.0, 200.0));
            // TestRandom returns the minimum: angle 0, speed 40 -> (40, 0).
            assert_eq!(parts[0].velocity(), Vec2::new(40.0, 0.0));
        }
        AsteroidDestruction::Destroyed => panic!("large asteroids split"),
    }
}

#[test]
fn small_asteroids_are_destroyed_outright() {
    let asteroid = Asteroid::new(AsteroidKind::Small, Vec2::ZERO, Vec2::ZERO);
    assert!(matches!(
        asteroid.destroy(&mut TestRandom),
        AsteroidDestruction::Destroyed
    ));
}
