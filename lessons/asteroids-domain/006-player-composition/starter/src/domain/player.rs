use super::{Bullet, FiringPose, LifeLoss, NonZeroLives, ShipState, Weapon, WeaponConfig};
use crate::{Screen, Turn};

// TODO: Compose the player facade.
//
// Define `pub struct Player { lives: NonZeroLives, ship: ShipState, weapon: Weapon }`
// with:
//   - `pub fn new(lives: NonZeroLives, screen: Screen) -> Self`
//     the ship spawns INVULNERABLE (spawn protection)
//   - `pub fn lives(&self) -> NonZeroLives` and `pub fn ship(&self) -> &ShipState`
//   - `pub fn update(&mut self, dt: Duration, screen: Screen)`
//   - `pub fn hit(&mut self) -> bool`
//     only an Active ship can be hit; losing the last life returns true
//     (session over), otherwise the ship starts respawning
//   - `pub fn rotate(&mut self, turn: Turn, dt: Duration)`
//   - `pub fn accelerate(&mut self, dt: Duration)`
//   - `pub fn fire(&mut self) -> Option<Bullet>` (delegates to Weapon::fire while a ship exists)
