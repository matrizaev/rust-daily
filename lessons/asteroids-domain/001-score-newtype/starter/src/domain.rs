// TODO: Model the score as a domain value.
//
// In src/domain.rs define:
//   - `pub struct Score(u32)` with a PRIVATE field
//   - `pub const ZERO: Self`
//   - `pub const fn new(value: u32) -> Self` and `pub const fn value(self) -> u32`
//   - `impl std::ops::AddAssign<Score>` that SATURATES at u32::MAX
//
// Derive at least Debug, Clone, Copy, PartialEq, Eq.
