use super::Ship;
use crate::{Screen, Vec2};

// TODO: Model the weapon cooldown and the bullet lifetime.
//
// Define:
//   - pub enum WeaponState { Ready, CoolingDown { remaining: Duration } }
//   - pub struct FiringPose { origin: Vec2, direction: Vec2 }
//       - impl From<&Ship> for FiringPose (this borrows the ship)
//   - pub struct WeaponConfig { cooldown, muzzle_offset, bullet_speed, bullet_lifetime }
//   - pub struct Weapon { config: WeaponConfig, state: WeaponState }
//       - pub fn new(config: WeaponConfig) -> Self (starts Ready)
//       - pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet>
//         create a bullet from the pose and return None while cooling down
//       - pub fn update(&mut self, dt: Duration) (tick; Ready when it ends)
//   - pub struct Bullet { position: Vec2, velocity: Vec2, remaining: Duration }
//       - pub fn new(position: Vec2, velocity: Vec2, remaining: Duration) -> Self
//       - pub fn position(&self) -> Vec2
//       - pub fn update(&mut self, dt: Duration, screen: Screen) -> bool
//         advance motion; return false when the bullet should be removed
//         (lifetime expired or off-screen)
