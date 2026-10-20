use super::Ship;
use crate::{Screen, Vec2};

/// The ship pose needed to create a bullet, without coupling Weapon to Ship.
#[derive(Debug, Clone, Copy)]
pub struct FiringPose {
    origin: Vec2,
    direction: Vec2,
}

impl From<&Ship> for FiringPose {
    fn from(ship: &Ship) -> Self {
        Self {
            origin: ship.position(),
            direction: Vec2::new(ship.heading().sin(), -ship.heading().cos()),
        }
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown { remaining: std::time::Duration },
}

#[derive(Debug, Clone, Copy)]
pub struct WeaponConfig {
    cooldown: std::time::Duration,
    muzzle_offset: f32,
    bullet_speed: f32,
    bullet_lifetime: std::time::Duration,
}

impl WeaponConfig {
    pub const fn new(
        cooldown: std::time::Duration,
        muzzle_offset: f32,
        bullet_speed: f32,
        bullet_lifetime: std::time::Duration,
    ) -> Self {
        Self {
            cooldown,
            muzzle_offset,
            bullet_speed,
            bullet_lifetime,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    config: WeaponConfig,
    state: WeaponState,
}

impl Weapon {
    pub fn new(config: WeaponConfig) -> Self {
        Self {
            config,
            state: WeaponState::Ready,
        }
    }

    /// Try to fire: creates a bullet and consumes the cooldown when ready.
    pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet> {
        if !matches!(self.state, WeaponState::Ready) {
            return None;
        }

        self.state = WeaponState::CoolingDown {
            remaining: self.config.cooldown,
        };
        Some(Bullet::new(
            pose.origin + pose.direction * self.config.muzzle_offset,
            pose.direction * self.config.bullet_speed,
            self.config.bullet_lifetime,
        ))
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
