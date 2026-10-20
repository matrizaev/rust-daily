use super::asteroid::{SPEED_MAX, SPEED_MIN};
use super::{
    Asteroid, AsteroidDestruction, AsteroidKind, Bullet, NonZeroLives, Player, Score, Wave,
};
use crate::{circle_collide, Input, Random, Screen, Vec2};

/// How a frame of play ended.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlayOutcome {
    /// The session continues.
    Continued,
    /// The player lost their last ship; `score` is the final score.
    PlayerKilled(Score),
}

/// A live session: the player, every asteroid and bullet in flight, and the
/// session counters.
#[derive(Debug)]
pub struct PlayingGame {
    screen: Screen,
    player: Player,
    asteroids: Vec<Asteroid>,
    bullets: Vec<Bullet>,
    score: Score,
    wave: Wave,
}

impl PlayingGame {
    const STARTING_ASTEROIDS: usize = 4;
    const SHIP_COLLISION_RADIUS: f32 = 12.0;
    const BULLET_RADIUS: f32 = 2.0;

    /// A fresh session: the player spawns invulnerable and the first wave is
    /// spawned from the injected randomness.
    pub fn new(screen: Screen, rng: &mut impl Random) -> Self {
        let mut game = Self {
            screen,
            player: Player::new(
                NonZeroLives::new(3).expect("three lives is non-zero"),
                screen,
            ),
            asteroids: Vec::new(),
            bullets: Vec::new(),
            score: Score::ZERO,
            wave: Wave::FIRST,
        };
        game.spawn_wave(rng);
        game
    }

    pub fn asteroids(&self) -> &[Asteroid] {
        &self.asteroids
    }

    pub fn bullets(&self) -> &[Bullet] {
        &self.bullets
    }

    pub fn score(&self) -> Score {
        self.score
    }

    pub fn wave(&self) -> Wave {
        self.wave
    }

    /// Advance one frame: input, physics, collisions, wave progression.
    pub fn update(
        &mut self,
        input: &Input,
        dt: std::time::Duration,
        rng: &mut impl Random,
    ) -> PlayOutcome {
        let screen = self.screen;

        if let Some(turn) = input.turn {
            self.player.rotate(turn, dt);
        }
        if input.thrust {
            self.player.accelerate(dt);
        }
        if input.fire {
            if let Some(bullet) = self.player.fire() {
                self.bullets.push(bullet);
            }
        }

        self.player.update(dt, screen);

        self.bullets.retain_mut(|bullet| bullet.update(dt, screen));
        for asteroid in &mut self.asteroids {
            asteroid.update(dt, screen);
        }

        // Bullet x asteroid collisions: destroy the first asteroid each bullet
        // touches, add its score, and keep any fragments.
        let mut bullet_index = 0;
        while bullet_index < self.bullets.len() {
            let bullet_position = self.bullets[bullet_index].position();
            let hit = self.asteroids.iter().position(|asteroid| {
                circle_collide(
                    bullet_position,
                    Self::BULLET_RADIUS,
                    asteroid.position(),
                    asteroid.radius(),
                )
            });
            if let Some(asteroid_index) = hit {
                let asteroid = self.asteroids.swap_remove(asteroid_index);
                self.score += asteroid.score();
                match asteroid.destroy(rng) {
                    AsteroidDestruction::Fragments(parts) => self.asteroids.extend(parts),
                    AsteroidDestruction::Destroyed => {}
                }
                self.bullets.swap_remove(bullet_index);
            } else {
                bullet_index += 1;
            }
        }

        // Ship x asteroid collision: the player can only be hit while active.
        let ship_hit = self.player.ship().ship().is_some_and(|ship| {
            self.asteroids.iter().any(|asteroid| {
                circle_collide(
                    ship.position(),
                    Self::SHIP_COLLISION_RADIUS,
                    asteroid.position(),
                    asteroid.radius(),
                )
            })
        });
        if ship_hit && self.player.hit() {
            return PlayOutcome::PlayerKilled(self.score);
        }

        // The field was cleared: advance the wave and spawn the next one.
        if self.asteroids.is_empty() {
            if let Some(next) = self.wave.next() {
                self.wave = next;
            }
            self.spawn_wave(rng);
        }

        PlayOutcome::Continued
    }

    /// Spawn `starting + wave - 1` large asteroids on random playfield edges
    /// with random velocities from the injected randomness.
    fn spawn_wave(&mut self, rng: &mut impl Random) {
        let count = Self::STARTING_ASTEROIDS + (self.wave.value() as usize - 1);
        for _ in 0..count {
            let position = if rng.chance(0.5) {
                let x = if rng.chance(0.5) {
                    0.0
                } else {
                    self.screen.width()
                };
                Vec2::new(x, rng.range(0.0, self.screen.height()))
            } else {
                let y = if rng.chance(0.5) {
                    0.0
                } else {
                    self.screen.height()
                };
                Vec2::new(rng.range(0.0, self.screen.width()), y)
            };
            let angle = rng.range(0.0, std::f32::consts::TAU);
            let speed = rng.range(SPEED_MIN, SPEED_MAX);
            let velocity = Vec2::new(angle.cos() * speed, angle.sin() * speed);
            self.asteroids
                .push(Asteroid::new(AsteroidKind::Large, position, velocity));
        }
    }
}
