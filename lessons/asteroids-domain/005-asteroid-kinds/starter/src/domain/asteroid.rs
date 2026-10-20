use super::Score;
use crate::{Random, Screen, Vec2};

// TODO: Model asteroid kinds and their destruction.
//
// Define:
//   - pub enum AsteroidKind { Large, Medium, Small }
//   - struct AsteroidBody { position: Vec2, velocity: Vec2 }
//   - pub struct Asteroid {
//       kind: AsteroidKind,
//       body: AsteroidBody,
//     }
//     with private fields so the kind and body stay coupled.
//   - pub enum AsteroidDestruction { Fragments([Asteroid; 2]), Destroyed }
//   - on Asteroid:
//       - pub fn new(kind: AsteroidKind, position: Vec2, velocity: Vec2) -> Self
//       - pub fn kind(&self) -> AsteroidKind
//       - pub fn position(&self) -> Vec2 / pub fn velocity(&self) -> Vec2
//       - pub fn radius(&self) -> f32  (40.0 / 22.0 / 12.0)
//       - pub fn score(&self) -> Score (20 / 50 / 100)
//       - pub fn update(&mut self, dt: Duration, screen: Screen)
//         integrate motion and wrap around the playfield
//       - pub fn destroy(self, rng: &mut impl Random) -> AsteroidDestruction
//         Large splits into two Mediums, Medium into two Smalls (both keep the
//         parent's position and draw a random velocity from the injected rng:
//         angle in 0..TAU, speed in 40..110); Small is destroyed outright.
//   - module constants SPEED_MIN (40.0) and SPEED_MAX (110.0)
