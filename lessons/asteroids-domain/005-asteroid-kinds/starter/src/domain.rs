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


// TODO: Model asteroid kinds and their destruction.
//
// Define:
//   - `pub enum AsteroidKind { Large, Medium, Small }`
//   - `pub struct AsteroidBody { position: Vec2, velocity: Vec2 }`
//   - `pub enum Asteroid { Large(AsteroidBody), Medium(AsteroidBody), Small(AsteroidBody) }`
//   - `pub enum AsteroidDestruction { Fragments([Asteroid; 2]), Destroyed }`
//   - on `Asteroid`:
//       - `pub fn new(kind: AsteroidKind, position: Vec2, velocity: Vec2) -> Self`
//       - `pub fn position(&self) -> Vec2` / `pub fn velocity(&self) -> Vec2`
//       - `pub fn radius(&self) -> f32`  (40.0 / 22.0 / 12.0)
//       - `pub fn score(&self) -> Score` (20 / 50 / 100)
//       - `pub fn update(&mut self, dt: Duration, screen: Screen)`
//         integrate motion and wrap around the playfield
//       - `pub fn destroy(self, rng: &mut impl Random) -> AsteroidDestruction`
//         Large splits into two Mediums, Medium into two Smalls (both keep the
//         parent's position and draw a random velocity from the injected rng:
//         angle in 0..TAU, speed in 40..110); Small is destroyed outright.
//   - module constants `SPEED_MIN` (40.0) and `SPEED_MAX` (110.0)
