use std::time::Duration;

use rust_daily_lesson::domain::{PlayOutcome, PlayingGame, Score};
use rust_daily_lesson::{Input, Random, Screen, Vec2};

const SCREEN: Screen = Screen::new(800.0, 600.0);

/// Scripted randomness: `range` scales a scripted value into `min..max`;
/// `chance` compares a scripted value against the probability. The script
/// cycles if the simulation asks for more values than were provided.
struct ScriptedRandom {
    values: Vec<f32>,
    index: usize,
}

impl ScriptedRandom {
    fn new(values: Vec<f32>) -> Self {
        Self { values, index: 0 }
    }
}

impl Random for ScriptedRandom {
    fn range(&mut self, min: f32, max: f32) -> f32 {
        if self.values.is_empty() {
            return min;
        }
        let unit = self.values[self.index % self.values.len()];
        self.index += 1;
        min + (max - min) * unit
    }

    fn chance(&mut self, p: f64) -> bool {
        self.range(0.0, 1.0) < p as f32
    }
}

/// Spawn script: `chance(0.5)` is true when the scripted unit is < 0.5, so a
/// leading 1.0 picks the top/bottom edge and a 0.0 picks the top (y = 0).
/// The first asteroid appears at the top edge (x = 400) heading straight
/// down; the other three appear at the origin heading right.
const SPAWN: [f32; 20] = [
    1.0, 0.0, 0.5, 0.25, 0.0, // asteroid 1: (400, 0), velocity (0, 40)
    1.0, 0.0, 0.0, 0.0, 0.0, // asteroid 2: (0, 0), velocity (40, 0)
    1.0, 0.0, 0.0, 0.0, 0.0, // asteroid 3: (0, 0), velocity (40, 0)
    1.0, 0.0, 0.0, 0.0, 0.0, // asteroid 4: (0, 0), velocity (40, 0)
];

#[test]
fn new_game_spawns_the_first_wave() {
    let game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));

    assert_eq!(game.wave().value(), 1);
    assert_eq!(game.asteroids().len(), 4);
}

#[test]
fn asteroids_move_with_the_scripted_velocity() {
    let mut game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));

    game.update(&Input::default(), Duration::from_secs(1), &mut ScriptedRandom::new(SPAWN.to_vec()));

    // Asteroids 2-4 spawned at the origin with velocity (40, 0).
    assert_eq!(game.asteroids()[1].position(), Vec2::new(40.0, 0.0));
}

#[test]
fn holding_fire_is_rate_limited_by_the_cooldown() {
    let mut game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));
    let fire = Input {
        fire: true,
        ..Input::default()
    };

    game.update(&fire, Duration::ZERO, &mut ScriptedRandom::new(SPAWN.to_vec()));
    assert_eq!(game.bullets().len(), 1);

    game.update(&fire, Duration::from_millis(100), &mut ScriptedRandom::new(SPAWN.to_vec()));
    assert_eq!(game.bullets().len(), 1);

    game.update(&fire, Duration::from_millis(200), &mut ScriptedRandom::new(SPAWN.to_vec()));
    assert_eq!(game.bullets().len(), 1);

    game.update(&fire, Duration::ZERO, &mut ScriptedRandom::new(SPAWN.to_vec()));
    assert_eq!(game.bullets().len(), 2);
}

#[test]
fn shooting_destroys_an_asteroid_and_scores() {
    let mut game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));
    let fire = Input {
        fire: true,
        ..Input::default()
    };

    let outcome = game.update(
        &fire,
        Duration::from_millis(500),
        &mut ScriptedRandom::new(SPAWN.to_vec()),
    );

    assert_eq!(outcome, PlayOutcome::Continued);
    assert_eq!(game.score().value(), 20);
    assert!(game.bullets().is_empty());
    assert_eq!(game.asteroids().len(), 5); // 3 originals + 2 medium fragments
}

#[test]
fn ship_collisions_ultimately_end_the_session() {
    let mut game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));
    let mut rng = ScriptedRandom::new(SPAWN.to_vec());
    let step = Duration::from_secs_f32(7.5);

    // The scripted asteroid crosses the ship every 15 s (one wrap cycle);
    // three crossings drain all three lives.
    assert_eq!(game.update(&Input::default(), step, &mut rng), PlayOutcome::Continued);
    assert_eq!(game.update(&Input::default(), step, &mut rng), PlayOutcome::Continued);
    assert_eq!(game.update(&Input::default(), step, &mut rng), PlayOutcome::Continued);
    assert_eq!(game.update(&Input::default(), step, &mut rng), PlayOutcome::Continued);
    assert_eq!(
        game.update(&Input::default(), step, &mut rng),
        PlayOutcome::PlayerKilled(Score::ZERO)
    );
}
