use super::{Bullet, FiringPose, LifeLoss, NonZeroLives, Ship, ShipState, Weapon, WeaponConfig};
use crate::{Screen, Turn};

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
            weapon: Weapon::new(WeaponConfig::new(
                std::time::Duration::from_millis(250),
                20.0,
                520.0,
                std::time::Duration::from_millis(1_100),
            )),
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
        self.weapon.fire(FiringPose::from(ship))
    }
}
