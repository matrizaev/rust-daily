use super::asteroid::{SPEED_MAX, SPEED_MIN};
use super::{
    Asteroid, AsteroidDestruction, AsteroidKind, Bullet, NonZeroLives, Player, Score, Wave,
};
use crate::{circle_collide, Input, Random, Screen, Vec2};

// TODO: Compose the session update loop.
//
// Define:
//   - `pub enum PlayOutcome { Continued, PlayerKilled(Score) }`
//   - `pub struct PlayingGame { screen, player, asteroids, bullets, score, wave }`
//   - `pub fn new(screen: Screen, rng: &mut impl Random) -> Self`
//     player with 3 lives; spawn the first wave (4 large asteroids on random
//     playfield edges with random velocities)
//   - getters `asteroids()`, `bullets()`, `score()`, `wave()`
//   - `pub fn update(&mut self, input: &Input, dt: Duration, rng: &mut impl Random) -> PlayOutcome`
//     1. steering: rotate / accelerate / fire (fire pushes a bullet)
//     2. player.update(dt, screen)
//     3. bullets: keep those whose update(dt, screen) returns true
//     4. asteroids: update each
//     5. bullet x asteroid collisions: destroy the asteroid, add its score,
//        keep any fragments (use circle_collide with bullet radius 2.0)
//     6. ship collision (circle_collide with radius 12.0): when
//        player.hit() is true return PlayOutcome::PlayerKilled(score)
//     7. when no asteroids remain, advance the wave and spawn the next one
//        (starting_asteroids + wave - 1 large asteroids)
//
// Use constants STARTING_ASTEROIDS = 4, SHIP_COLLISION_RADIUS = 12.0,
// BULLET_RADIUS = 2.0.
