A **Rust equivalent of Duolingo**, but for professional language features rather than syntax.

---

# Rust Daily – Product Prompt

Build a frontend-only Progressive Web App (PWA) for practicing idiomatic Rust in 5–10 minute daily sessions.

The target audience is intermediate software engineers who already know programming and basic Rust syntax but want to become proficient in writing idiomatic Rust without relying on AI, autocomplete, or IDE hints.

The application should work well on Android tablets and desktop browsers, run from static files, and keep progress locally without requiring a backend.

## Core Philosophy

This is **not** LeetCode.

This is **not** Rustlings.

This is **not** a tutorial.

Each lesson focuses on **one Rust concept**.

The user should complete a lesson in under 10 minutes.

Every lesson produces a small piece of production-quality Rust.

---

## Learning Goals

Teach:

* ownership
* borrowing
* lifetimes
* structs
* enums
* pattern matching
* methods
* trait implementations
* generic types
* associated types
* iterators
* closures
* From
* Into
* TryFrom
* Display
* Error
* Default
* Clone
* Copy
* Debug
* PartialEq
* Ord
* Iterator
* IntoIterator
* parsing
* API design
* module organization
* documentation
* tests
* idiomatic standard library usage

Avoid algorithmic puzzles unless they illustrate a Rust concept.

---

## Lesson Structure

Every lesson teaches exactly ONE concept.

Example progression:

Day 1

Implement:

```rust
enum ParseUserError {
}
```

---

Day 2

Add variants.

---

Day 3

Implement Display.

---

Day 4

Implement Error.

---

Day 5

Implement

```rust
From<ParseIntError>
```

---

Day 6

Implement

```rust
TryFrom<&str>
```

---

Day 7

Write tests.

---

Every lesson builds on previous lessons.

---

## Exercise Types

### Fill missing code

```rust
impl Display for ParseUserError {
    // TODO
}
```

---

### Design a struct

Given:

```
A user has:

id

name

email
```

Design the struct.

---

### Implement a trait

```
Implement Default.

Implement Iterator.

Implement From.

Implement TryFrom.
```

---

### Refactor

Transform beginner Rust into idiomatic Rust.

---

### Find the bug

Provide compiling code with an ownership mistake.

---

### API design

Design an API.

Example:

```
How should Config::load() return errors?
```

---

### Lifetimes

Tiny isolated exercises.

Example:

```
Add exactly one lifetime.
```

---

### Iterator exercises

Convert loops into iterator chains.

Or vice versa.

---

### Error design

Design custom error hierarchies.

---

### Ownership

Choose between:

```
String

&str

Cow<'a, str>

Rc<String>

Arc<String>
```

Explain through code.

---

## Validation

Validation happens in the browser.

No AI grading.

A browser-side Rust validation engine is the source of truth for MVP lessons.

Use a frontend-only Rust compiler/checker/test runner where possible.

Do not require a hosted backend, cloud sandbox, remote judge, or account.

Because all validation code is shipped to the browser, tests can be concealed in the UI but must not be treated as secret.

Lessons must be designed for the frontend validation subset:

* tiny single-crate or single-file exercises
* standard library first
* no network
* no external dependency resolution
* no build scripts
* no proc macros
* no full Cargo workflow in the MVP

---

## Progression

Concept graph instead of linear chapters.

Unlock topics after mastery.

Example:

```
Structs

↓

Methods

↓

Traits

↓

Parsing

↓

Error handling
```

---

## Difficulty

Three levels.

Easy

Medium

Advanced

Each still under 10 minutes.

---

## Daily Session

Goal:

5–10 minutes.

Exactly one lesson.

Show streak.

Show completed concepts.

Never overwhelm the learner.

---

## UI

Minimal.

Dark mode.

Monospace editor.

Large touch targets.

Works perfectly on tablets.

Offline support via PWA.

Frontend-only: lesson content, drafts, progress, streaks, and validation assets should be cached locally.

---

## Editor

No autocomplete.

No AI.

No code generation.

Only:

* syntax highlighting
* browser-side compile/check where supported
* browser-side test execution where supported
* reset
* reveal hints

---

## Hints

Three levels.

Hint 1

Small nudge.

Hint 2

Reference to standard library.

Hint 3

Explain the Rust concept.

Never reveal the full solution immediately.

---

## Content Principles

Every lesson must:

* teach one concept
* use realistic code
* encourage idiomatic Rust
* avoid unnecessary dependencies
* prefer the standard library
* explain *why* something is idiomatic

---

## Long-term Goal

After approximately 300–500 micro-lessons, the learner should be comfortable designing and implementing idiomatic Rust code for real-world applications, not just solving algorithmic problems.
