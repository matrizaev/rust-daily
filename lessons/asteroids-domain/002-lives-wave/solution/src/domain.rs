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
