use crate::{Vec2, Screen, Random, Input, Turn, circle_collide};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default)]
pub struct Score(u32);

impl Score {
    pub const ZERO: Self = Self(0);

    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

impl std::ops::AddAssign for Score {
    fn add_assign(&mut self, rhs: Self) {
        self.0 = self.0.saturating_add(rhs.0);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct NonZeroLives(std::num::NonZeroU8);

impl NonZeroLives {
    pub fn new(value: u8) -> Option<Self> {
        std::num::NonZeroU8::new(value).map(Self)
    }

    pub const fn value(self) -> u8 {
        self.0.get()
    }

    /// Lose one life. The terminal case is `GameOver`, never a zero counter.
    pub fn lose_one(self) -> LifeLoss {
        std::num::NonZeroU8::new(self.0.get() - 1)
            .map(Self)
            .map_or(LifeLoss::GameOver, LifeLoss::Remaining)
    }
}

/// The result of losing a life: either lives remain, or the session is over.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LifeLoss {
    Remaining(NonZeroLives),
    GameOver,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Wave(std::num::NonZeroU32);

impl Wave {
    pub const FIRST: Self = Self(std::num::NonZeroU32::MIN);

    pub fn new(value: u32) -> Option<Self> {
        std::num::NonZeroU32::new(value).map(Self)
    }

    pub const fn value(self) -> u32 {
        self.0.get()
    }

    /// Advance to the next wave; `None` if it would overflow.
    pub fn next(self) -> Option<Self> {
        self.0.checked_add(1).map(Self)
    }
}

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}

impl Ship {
    const SHIP_SIZE: f32 = 20.0;
    const BULLET_SPEED: f32 = 520.0;
    const BULLET_LIFETIME: std::time::Duration = std::time::Duration::from_millis(1_100);

    /// Spawn a bullet at the ship's nose. Provided for you.
    pub fn fire(&self) -> Bullet {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        Bullet::new(
            self.position + facing * Self::SHIP_SIZE,
            facing * Self::BULLET_SPEED,
            Self::BULLET_LIFETIME,
        )
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown {
        remaining: std::time::Duration,
    },
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    cooldown: std::time::Duration,
    state: WeaponState,
}

impl Weapon {
    pub fn new(cooldown: std::time::Duration) -> Self {
        Self {
            cooldown,
            state: WeaponState::Ready,
        }
    }

    /// Fire if ready; starts the cooldown. Returns whether a shot was fired.
    pub fn fire(&mut self) -> bool {
        if !matches!(self.state, WeaponState::Ready) {
            return false;
        }
        self.state = WeaponState::CoolingDown {
            remaining: self.cooldown,
        };
        true
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        if let WeaponState::CoolingDown { remaining } = &mut self.state {
            *remaining = remaining.saturating_sub(dt);
            if remaining.is_zero() {
                self.state = WeaponState::Ready;
            }
        }
    }
}

/// A bullet in flight. Dies when its lifetime expires or it leaves the screen
/// (bullets do not wrap).
#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    position: Vec2,
    velocity: Vec2,
    remaining: std::time::Duration,
}

impl Bullet {
    pub fn new(position: Vec2, velocity: Vec2, remaining: std::time::Duration) -> Self {
        Self {
            position,
            velocity,
            remaining,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    /// Advance one frame; returns false when the bullet should be removed
    /// (lifetime expired or off-screen).
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) -> bool {
        self.position += self.velocity * dt.as_secs_f32();
        self.remaining = self.remaining.saturating_sub(dt);
        !self.remaining.is_zero() && screen.contains(self.position)
    }
}

const SPEED_MIN: f32 = 40.0;
const SPEED_MAX: f32 = 110.0;

/// The size class of an asteroid; decides radius, score, and splitting.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AsteroidKind {
    Large,
    Medium,
    Small,
}

/// Kinematic state shared by every asteroid, regardless of size.
#[derive(Debug, Clone, Copy)]
pub struct AsteroidBody {
    position: Vec2,
    velocity: Vec2,
}

/// An asteroid of any size.
#[derive(Debug, Clone, Copy)]
pub enum Asteroid {
    Large(AsteroidBody),
    Medium(AsteroidBody),
    Small(AsteroidBody),
}

/// The result of destroying an asteroid.
#[derive(Debug, Clone, Copy)]
pub enum AsteroidDestruction {
    /// The asteroid split into two fragments of the next-smaller size.
    Fragments([Asteroid; 2]),
    /// Small asteroids are destroyed outright.
    Destroyed,
}

impl Asteroid {
    pub fn new(kind: AsteroidKind, position: Vec2, velocity: Vec2) -> Self {
        let body = AsteroidBody { position, velocity };
        match kind {
            AsteroidKind::Large => Self::Large(body),
            AsteroidKind::Medium => Self::Medium(body),
            AsteroidKind::Small => Self::Small(body),
        }
    }

    pub fn position(&self) -> Vec2 {
        self.body().position
    }

    pub fn velocity(&self) -> Vec2 {
        self.body().velocity
    }

    pub fn radius(&self) -> f32 {
        match self {
            Self::Large(_) => 40.0,
            Self::Medium(_) => 22.0,
            Self::Small(_) => 12.0,
        }
    }

    pub fn score(&self) -> Score {
        match self {
            Self::Large(_) => Score::new(20),
            Self::Medium(_) => Score::new(50),
            Self::Small(_) => Score::new(100),
        }
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        let body = self.body_mut();
        body.position += body.velocity * dt.as_secs_f32();
        body.position = screen.wrap(body.position);
    }

    /// Destroy the asteroid. Large and Medium split into two fragments of the
    /// next-smaller size at the parent's position, each with a random velocity
    /// drawn from the injected randomness; Small is destroyed outright.
    pub fn destroy(self, rng: &mut impl Random) -> AsteroidDestruction {
        let mut fragment = |body: AsteroidBody| {
            let angle = rng.range(0.0, std::f32::consts::TAU);
            let speed = rng.range(SPEED_MIN, SPEED_MAX);
            AsteroidBody {
                position: body.position,
                velocity: Vec2::new(angle.cos() * speed, angle.sin() * speed),
            }
        };

        match self {
            Self::Large(body) => AsteroidDestruction::Fragments([
                Asteroid::Medium(fragment(body)),
                Asteroid::Medium(fragment(body)),
            ]),
            Self::Medium(body) => AsteroidDestruction::Fragments([
                Asteroid::Small(fragment(body)),
                Asteroid::Small(fragment(body)),
            ]),
            Self::Small(_) => AsteroidDestruction::Destroyed,
        }
    }

    fn body(&self) -> &AsteroidBody {
        match self {
            Self::Large(body) | Self::Medium(body) | Self::Small(body) => body,
        }
    }

    fn body_mut(&mut self) -> &mut AsteroidBody {
        match self {
            Self::Large(body) | Self::Medium(body) | Self::Small(body) => body,
        }
    }
}

/// The player: remaining lives, the ship (in whatever state it is in), and the
/// ship's weapon, behind one facade the session drives.
#[derive(Debug)]
pub struct Player {
    lives: NonZeroLives,
    ship: ShipState,
    weapon: Weapon,
}

impl Player {
    /// A fresh player whose ship spawns invulnerable (spawn protection).
    pub fn new(lives: NonZeroLives, screen: Screen) -> Self {
        Self {
            lives,
            ship: ShipState::Invulnerable {
                ship: Ship::spawn(screen),
                remaining: ShipState::INVULNERABILITY_TIME,
            },
            weapon: Weapon::new(std::time::Duration::from_millis(250)),
        }
    }

    pub fn lives(&self) -> NonZeroLives {
        self.lives
    }

    pub fn ship(&self) -> &ShipState {
        &self.ship
    }

    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.ship.update(dt, screen);
        self.weapon.update(dt);
    }

    /// The ship was hit. Only an active ship can be hit; invulnerable and
    /// respawning ships are unaffected. Returns `true` when the player has no
    /// lives left — the session is over.
    pub fn hit(&mut self) -> bool {
        if !matches!(self.ship, ShipState::Active(_)) {
            return false;
        }

        match self.lives.lose_one() {
            LifeLoss::Remaining(lives) => {
                self.lives = lives;
                self.ship = ShipState::Respawning {
                    remaining: ShipState::RESPAWN_TIME,
                };
                false
            }
            LifeLoss::GameOver => true,
        }
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        if let Some(ship) = self.ship.ship_mut() {
            ship.rotate(turn, dt);
        }
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        if let Some(ship) = self.ship.ship_mut() {
            ship.accelerate(dt);
        }
    }

    /// Fire a bullet, if a ship exists and the weapon is ready.
    pub fn fire(&mut self) -> Option<Bullet> {
        let ship = self.ship.ship()?;
        if !self.weapon.fire() {
            return None;
        }
        Some(ship.fire())
    }
}

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
                let x = if rng.chance(0.5) { 0.0 } else { self.screen.width };
                Vec2::new(x, rng.range(0.0, self.screen.height))
            } else {
                let y = if rng.chance(0.5) { 0.0 } else { self.screen.height };
                Vec2::new(rng.range(0.0, self.screen.width), y)
            };
            let angle = rng.range(0.0, std::f32::consts::TAU);
            let speed = rng.range(SPEED_MIN, SPEED_MAX);
            let velocity = Vec2::new(angle.cos() * speed, angle.sin() * speed);
            self.asteroids
                .push(Asteroid::new(AsteroidKind::Large, position, velocity));
        }
    }
}
