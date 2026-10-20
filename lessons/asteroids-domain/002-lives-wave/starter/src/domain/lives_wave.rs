// TODO: Model lives and waves as non-zero counters.
//
// Define:
//   - `pub struct NonZeroLives(std::num::NonZeroU8)` (private field)
//       - `pub fn new(value: u8) -> Option<Self>`
//       - `pub const fn value(self) -> u8`
//       - `pub fn lose_one(self) -> LifeLoss`
//   - `pub enum LifeLoss { Remaining(NonZeroLives), GameOver }`
//     losing the last life is the terminal `GameOver`, never a zero counter
//   - `pub struct Wave(std::num::NonZeroU32)` (private field)
//       - `pub const FIRST: Self`
//       - `pub fn new(value: u32) -> Option<Self>`
//       - `pub const fn value(self) -> u32`
//       - `pub fn next(self) -> Option<Self>` (None when it would overflow)
