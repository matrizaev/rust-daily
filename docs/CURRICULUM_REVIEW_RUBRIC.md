# Curriculum Review Rubric

Status: maintained authoring checklist for lessons 91-500.

## Purpose

Use this rubric before accepting a new arc or expanding an existing one. It
keeps curriculum growth aligned with the product contract: focused lessons,
realistic Rust, one editable artifact, deterministic validation, and cumulative
arc continuity.

This rubric is a review tool. It is not learner-facing content.

## Review Outcomes

Each arc review should end in one of three states:

- `approve`: ready to merge after normal validation passes.
- `revise`: concept, task, validation, or continuity issues need author edits.
- `reject`: arc duplicates existing coverage, violates product constraints, or
  cannot fit focused daily lessons.

## Arc-Level Checklist

Before reviewing individual lessons, confirm the arc:

- has a clear final API, module, service, or behavior slice;
- extends existing curriculum instead of repackaging lessons 1-90;
- has 5-8 focused lessons unless there is a specific reason to differ;
- keeps one active codebase that evolves lesson by lesson;
- preserves earlier public behavior unless the lesson explicitly teaches a
  migration;
- uses authored previous solutions as readonly context when prior behavior
  should remain active;
- avoids hidden archived modules such as `previous_solution` or dead-code
  wrappers;
- states what remains intentionally out of scope;
- does not teach a framework convention as if it were a Rust language rule.

## Lesson-Level Checklist

Every lesson in the arc must pass these checks.

### Concept Focus

- The lesson has one primary concept.
- Scenario, instructions, hints, tests, and explanation all point to that same
  concept.
- Supporting syntax or libraries do not become a second hidden lesson.
- The concept ID and concept description match the task.

### Starter And Task Alignment

- Instructions name the editable file when it is not `src/lib.rs`.
- Every API, type, function, or module named in the task exists in starter code
  or is clearly something the learner must create.
- The starter has enough context to make the edit without guessing unseen
  architecture.
- The task fits a 5-10 minute focused edit.
- Exactly one artifact is editable.

### Validation Alignment

- Public tests validate the behavior described in the task.
- Structural checks target the editable file and avoid overfitting incidental
  formatting.
- Compile-fail cases, when present, prove a real public API contract.
- Expected diagnostics are stable enough to review and maintain.
- Tests check public outcomes instead of private implementation details unless
  syntax or API shape is the concept.

### Hints And Explanation

- Hint 1 points to the relevant code or idea.
- Hint 2 names the trait, API, pattern, or design move.
- Hint 3 includes solution code that matches the authored solution exactly.
- Completion explanation says why this solution is idiomatic here.
- No hint or explanation claims the lesson teaches universally perfect Rust.

### Reference Solution Quality

- The authored solution compiles and passes public tests.
- Code is clear, direct, and reviewable.
- Ownership, borrowing, allocation, errors, and trait choices are deliberate.
- No unnecessary abstraction, macro cleverness, cloning, panics, or broad
  generic bounds.
- Derives are used when deriving is the normal idiomatic choice.
- Manual implementations are used only when their behavior is the lesson.

### Continuity

- Later starters include earlier authored solutions when behavior should carry
  forward.
- Readonly support files match the previous authored solution, not learner
  submissions.
- Arc step, arc length, global order, and concept references are consistent.
- Later lessons do not silently remove behavior taught earlier.

### Tone And Scope

- The task describes a concrete engineering situation.
- Claims are scoped: "for this API" or "in this boundary" instead of "always".
- The lesson avoids folklore and preference claims that tests cannot support.
- Author notes record tradeoffs, validation risks, and likely wrong solutions.

## Required Validation

For lesson or arc changes, run the standard content pipeline:

```text
cd frontend && npm run content:validate-source
cd frontend && npm run content:generate
cd frontend && npm run content:check-refs && npm run content:check
```

For affected lessons, run solution tests from the repository root:

```text
scripts/test-lesson-solutions.sh lessons/<arc>
```

If scaffolder or source-validation behavior changed, also run:

```text
cd frontend && npm run content:scaffold-lesson:test
cd frontend && npm run content:validate-source:test
```

## Review Template

Use this short summary in PRs or review notes:

```text
Arc:
Outcome: approve | revise | reject

Concept focus:
- [ ] one primary concept per lesson
- [ ] concepts extend existing coverage

Task and starter:
- [ ] instructions match starter exactly
- [ ] exactly one editable artifact per lesson
- [ ] edit scope fits 5-10 minutes

Validation:
- [ ] tests match task
- [ ] structural checks are focused
- [ ] compile-fail cases prove public contracts, if used

Solution:
- [ ] reference code is idiomatic for this context
- [ ] no unnecessary cleverness or overclaiming

Continuity:
- [ ] previous authored solutions appear as readonly context when needed
- [ ] earlier behavior remains active

Validation commands:
- [ ] content validation/generation/checks pass
- [ ] affected lesson solutions pass
```
