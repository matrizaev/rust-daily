//! Read-only project context for the Asteroids domain arc.
//!
//! Geometry, the injected-randomness seam, and input plumbing are provided;
//! the game rules live in the `domain` module and are built lesson by lesson.

pub mod domain;

/// Minimal 2D vector (a stand-in for a math crate in this std-only arc).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Vec2 {
    pub x: f32,
    pub y: f32,
}

impl Vec2 {
    pub const ZERO: Self = Self::new(0.0, 0.0);

    pub const fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }

    pub fn length(self) -> f32 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
}

impl std::ops::Add for Vec2 {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Self::new(self.x + other.x, self.y + other.y)
    }
}

impl std::ops::AddAssign for Vec2 {
    fn add_assign(&mut self, other: Self) {
        *self = *self + other;
    }
}

impl std::ops::Sub for Vec2 {
    type Output = Self;

    fn sub(self, other: Self) -> Self {
        Self::new(self.x - other.x, self.y - other.y)
    }
}

impl std::ops::Mul<f32> for Vec2 {
    type Output = Self;

    fn mul(self, scalar: f32) -> Self {
        Self::new(self.x * scalar, self.y * scalar)
    }
}

impl std::ops::MulAssign<f32> for Vec2 {
    fn mul_assign(&mut self, scalar: f32) {
        *self = *self * scalar;
    }
}

/// The playfield in world units.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Screen {
    width: f32,
    height: f32,
}

impl Screen {
    pub const fn new(width: f32, height: f32) -> Self {
        Self { width, height }
    }

    pub const fn width(self) -> f32 {
        self.width
    }

    pub const fn height(self) -> f32 {
        self.height
    }

    /// Center of the playfield.
    pub const fn center(self) -> Vec2 {
        Vec2::new(self.width / 2.0, self.height / 2.0)
    }

    /// Re-enter a position from the opposite edge.
    pub fn wrap(self, mut pos: Vec2) -> Vec2 {
        if !(0.0..=self.width).contains(&pos.x) {
            pos.x = pos.x.rem_euclid(self.width);
        }
        if !(0.0..=self.height).contains(&pos.y) {
            pos.y = pos.y.rem_euclid(self.height);
        }
        pos
    }

    /// Whether a point is on screen, edges included.
    pub fn contains(self, pos: Vec2) -> bool {
        pos.x >= 0.0 && pos.x <= self.width && pos.y >= 0.0 && pos.y <= self.height
    }
}

/// Injected randomness. The simulation never touches a global RNG, so tests
/// can drive it deterministically (a stand-in for `rand::RngExt`).
pub trait Random {
    /// Uniform value in `min..max`.
    fn range(&mut self, min: f32, max: f32) -> f32;

    /// `true` with probability `p`.
    fn chance(&mut self, p: f64) -> bool;
}

/// Per-frame player intent, translated from whatever input devices exist.
#[derive(Debug, Clone, Copy, Default)]
pub struct Input {
    pub turn: Option<Turn>,
    pub thrust: bool,
    pub fire: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Turn {
    Left,
    Right,
}

impl Turn {
    /// Rotation direction on screen: +1 for right, -1 for left.
    pub fn direction(self) -> f32 {
        match self {
            Turn::Left => -1.0,
            Turn::Right => 1.0,
        }
    }
}

/// Circle-vs-circle overlap test.
pub fn circle_collide(a: Vec2, radius_a: f32, b: Vec2, radius_b: f32) -> bool {
    (a - b).length() < radius_a + radius_b
}
