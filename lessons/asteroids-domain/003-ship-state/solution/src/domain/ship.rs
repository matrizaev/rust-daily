use crate::{Screen, Turn, Vec2};

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
