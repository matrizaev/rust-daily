# Lesson cumulative and quality audit

Updated on July 7, 2026.

Scope: all 90 source lessons in `lessons/`, across all 15 arcs in
`lessons/arcs.json`.

## Current rule

Lessons must build on the active previous solution inside each arc. Historical
copies such as `previous_lesson_solution` modules, nested archived solutions, and
`#[allow(dead_code)]` wrappers are not allowed in source lesson starter or
solution files.

The source validator now enforces this by:

- rejecting `previous_lesson_solution` in editable starters and authored
  solutions;
- rejecting `#[allow(dead_code)]` in editable starters and authored solutions;
- requiring each non-first starter to include the previous active solution as the
  base the learner edits next;
- requiring later active solutions to preserve earlier public API shapes from
  structural checks, including trait implementations, inherent methods, and
  public functions introduced earlier in the arc.

The validator no longer treats verbatim inclusion in the solution as proof of
continuity. Later solutions are expected to evolve active code directly.

## Checks run

- `cd frontend && npm run content:validate-source`: passed for 90 source lessons.
- `cd frontend && npm run content:check`: passed for 90 generated lessons and 90
  concepts.
- `cd frontend && npm run build`: passed.
- `cd frontend && yes | npx fallow dupes`: passed.
- `cd frontend && yes | npx fallow dead-code`: passed.
- `cd frontend && yes | npx fallow health`: passed with health score 86 A.
- Custom authored-solution Cargo check: 90 solutions checked, 90 passed, 0
  failed.
- Source and generated content grep found no remaining `previous_lesson_solution`
  or `#[allow(dead_code)]` markers.
- Source and generated content grep found no remaining generated placeholder
  copy: "Focus on the one public API shape requested by the lesson", "Prefer
  standard traits, typed errors, borrowed views, and explicit boundary
  conversions", "A canonical idiomatic solution is shown below", or the old
  "keeps ... explicit in the type system" completion pattern.

## Findings fixed

- Removed nested historical `previous_lesson_solution` modules from lesson source
  starters and solutions.
- Rebuilt non-first starters so they begin from the previous active solution,
  rather than from an archived wrapper.
- Regenerated frontend content so shipped lessons no longer contain historical
  modules.
- Replaced generated placeholder hints and completion explanations in 42 source
  lessons with lesson-specific active-continuity guidance.
- Strengthened the final `config-loader-errors` lesson so the active
  `ConfigLoadError` preserves `Display`, `Error::source`, `From<io::Error>`,
  `From<ParseIntError>`, `parse_port`, and `load_port` together.
- Strengthened the final `boundary-error-mapping` lesson so domain, repository,
  and use-case errors keep `Display`, `Error`, `source`, `From`, retryability,
  and HTTP status translation active together.
- Restored clean architecture in the final `register-user-use-case` lesson with
  active `domain`, `application`, `adapters`, and `infrastructure` modules plus
  root re-exports for the lesson-facing API.
- Restored structured logging continuity in the final
  `structured-request-logging` lesson so log levels, fields, redaction, request
  spans, error kinds, and boundary events remain active.

## Notes

Some early lessons still use public fields intentionally where the lesson is
about raw DTOs, basic struct syntax, or simple collection records. Invariant-heavy
arcs such as email address, money, host/port, percentage, and clean architecture
continue to use stronger domain types, private fields, standard conversions, and
boundary-specific DTOs.

The structured logging arc remains a standard-library event-modeling foundation.
A later `tracing` crate track is still the right place to teach real spans,
`instrument`, subscriber setup, and production log emission.
