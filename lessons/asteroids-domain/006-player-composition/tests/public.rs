use std::time::Duration;

use rust_daily_lesson::domain::{NonZeroLives, Player, ShipState};
use rust_daily_lesson::Screen;

const SCREEN: Screen = Screen::new(800.0, 600.0);

#[test]
fn new_player_spawns_invulnerable() {
    let player = Player::new(NonZeroLives::new(3).unwrap(), SCREEN);
    assert!(matches!(player.ship(), ShipState::Invulnerable { .. }));
    assert_eq!(player.lives().value(), 3);
}

#[test]
fn invulnerable_player_ignores_hits() {
    let mut player = Player::new(NonZeroLives::new(3).unwrap(), SCREEN);
    assert!(!player.hit());
    assert_eq!(player.lives().value(), 3);
}

#[test]
fn active_player_hit_drains_a_life_and_respawns() {
    let mut player = Player::new(NonZeroLives::new(3).unwrap(), SCREEN);
    player.update(Duration::from_secs(3), SCREEN); // spawn protection expires

    assert!(!player.hit());
    assert_eq!(player.lives().value(), 2);
    assert!(matches!(player.ship(), ShipState::Respawning { .. }));
}

#[test]
fn losing_the_last_life_reports_game_over() {
    let mut player = Player::new(NonZeroLives::new(1).unwrap(), SCREEN);
    player.update(Duration::from_secs(3), SCREEN);

    assert!(player.hit());
}

#[test]
fn firing_requires_a_ship_and_respects_cooldown() {
    let mut player = Player::new(NonZeroLives::new(3).unwrap(), SCREEN);
    player.update(Duration::from_secs(3), SCREEN);

    assert!(player.fire().is_some());
    assert!(player.fire().is_none()); // weapon cooling down
}
