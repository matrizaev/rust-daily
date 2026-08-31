use std::time::Duration;

use rust_daily_lesson::domain::{Ship, ShipState};
use rust_daily_lesson::Screen;

const SCREEN: Screen = Screen::new(800.0, 600.0);

#[test]
fn active_ship_is_available_and_keeps_moving() {
    let mut state = ShipState::Active(Ship::spawn(SCREEN));
    assert!(state.ship().is_some());
    state.update(Duration::from_secs(1), SCREEN);
    assert!(matches!(state, ShipState::Active(_)));
}

#[test]
fn respawning_has_no_ship_until_respawn_time_elapses() {
    let mut state = ShipState::Respawning {
        remaining: Duration::from_millis(500),
    };
    state.update(Duration::from_millis(400), SCREEN);
    assert!(state.ship().is_none());
    assert!(matches!(state, ShipState::Respawning { .. }));

    state.update(Duration::from_millis(100), SCREEN);
    assert!(state.ship().is_some());
    assert!(matches!(state, ShipState::Invulnerable { .. }));
}

#[test]
fn invulnerability_expires_into_active() {
    let mut state = ShipState::Invulnerable {
        ship: Ship::spawn(SCREEN),
        remaining: Duration::from_millis(500),
    };
    state.update(Duration::from_millis(500), SCREEN);
    assert!(matches!(state, ShipState::Active(_)));
}

#[test]
fn the_countdown_constants_match_the_game() {
    assert_eq!(ShipState::RESPAWN_TIME, Duration::from_millis(1_500));
    assert_eq!(ShipState::INVULNERABILITY_TIME, Duration::from_secs(2));
}
