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

// TODO: Model the ship as a state machine.
//
// The `Ship` kinematics above are provided. Define:
//   - `pub enum ShipState`
//       - `Active(Ship)`
//       - `Invulnerable { ship: Ship, remaining: Duration }` (spawn protection)
//       - `Respawning { remaining: Duration }` (no ship at all)
//   - `pub const INVULNERABILITY_TIME: Duration` (2 seconds) and
//     `pub const RESPAWN_TIME: Duration` (1.5 seconds)
//   - `pub fn update(&mut self, dt: Duration, screen: Screen)`
//     decrement countdowns; when Respawning finishes, spawn a ship into
//     Invulnerable; when Invulnerable finishes, go Active. The ship in
//     Active/Invulnerable keeps moving via `Ship::update`.
//   - `pub fn ship(&self) -> Option<&Ship>` and
//     `pub fn ship_mut(&mut self) -> Option<&mut Ship>` (None while Respawning)
