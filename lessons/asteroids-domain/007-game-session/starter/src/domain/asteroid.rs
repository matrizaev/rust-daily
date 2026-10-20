use super::Score;
use crate::{Random, Screen, Vec2};

pub(super) const SPEED_MIN: f32 = 40.0;
pub(super) const SPEED_MAX: f32 = 110.0;

/// The size class of an asteroid; decides radius, score, and splitting.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AsteroidKind {
    Large,
    Medium,
    Small,
}

impl AsteroidKind {
    fn radius(self) -> f32 {
        match self {
            Self::Large => 40.0,
            Self::Medium => 22.0,
            Self::Small => 12.0,
        }
    }

    fn score(self) -> Score {
        match self {
            Self::Large => Score::new(20),
            Self::Medium => Score::new(50),
            Self::Small => Score::new(100),
        }
    }

    fn next_smaller(self) -> Option<Self> {
        match self {
            Self::Large => Some(Self::Medium),
            Self::Medium => Some(Self::Small),
            Self::Small => None,
        }
    }
}

/// Kinematic state shared by every asteroid, regardless of size.
#[derive(Debug, Clone, Copy)]
struct AsteroidBody {
    position: Vec2,
    velocity: Vec2,
}

/// An asteroid with a size kind and shared kinematic state.
#[derive(Debug, Clone, Copy)]
pub struct Asteroid {
    kind: AsteroidKind,
    body: AsteroidBody,
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
        Self {
            kind,
            body: AsteroidBody { position, velocity },
        }
    }

    pub fn kind(&self) -> AsteroidKind {
        self.kind
    }

    pub fn position(&self) -> Vec2 {
        self.body.position
    }

    pub fn velocity(&self) -> Vec2 {
        self.body.velocity
    }

    pub fn radius(&self) -> f32 {
        self.kind.radius()
    }

    pub fn score(&self) -> Score {
        self.kind.score()
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.body.position += self.body.velocity * dt.as_secs_f32();
        self.body.position = screen.wrap(self.body.position);
    }

    /// Destroy the asteroid. Large and Medium split into two fragments of the
    /// next-smaller size at the parent's position, each with a random velocity
    /// drawn from the injected randomness; Small is destroyed outright.
    pub fn destroy(self, rng: &mut impl Random) -> AsteroidDestruction {
        let Self { kind, body } = self;
        let Some(fragment_kind) = kind.next_smaller() else {
            return AsteroidDestruction::Destroyed;
        };

        let mut fragment = || {
            let angle = rng.range(0.0, std::f32::consts::TAU);
            let speed = rng.range(SPEED_MIN, SPEED_MAX);
            Self::new(
                fragment_kind,
                body.position,
                Vec2::new(angle.cos() * speed, angle.sin() * speed),
            )
        };

        AsteroidDestruction::Fragments([fragment(), fragment()])
    }
}
