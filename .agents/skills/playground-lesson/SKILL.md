---
name: playground-lesson
description: "Use when asked to design, author, encode, or share an ad-hoc Rust Daily Playground lesson link."
---

# Playground Lesson Authoring

Create a complete public Rust Daily lesson payload from the user's request and
turn it into a link that opens the lesson in Playground. This workflow does not
add the lesson to any curriculum. This skill is self-contained: it must work
without access to a Rust Daily source checkout or its documentation.

## Payload Contract

Create one JSON object with the complete public lesson fields:

- `schemaVersion`: number selecting the lesson data format; use `2`.
- `id`: non-empty, stable lesson identifier. It is not a curriculum or draft
   identity in Playground; use a descriptive slug such as `parse-user-email`.
- `arcId`: non-empty identifier grouping related curriculum lessons. An
   ad-hoc lesson has no curriculum group, so use `playground`.
- `arcTitle`: non-empty display title for that group. Use `Playground` for an
   ad-hoc lesson.
- `order`: finite number giving the lesson's position in its group. Use `1`
   for a standalone lesson.
- `day`: positive integer curriculum day. Use `1` for a standalone lesson.
- `arcLength`: positive integer count of lessons in the group. Use `1` for a
   standalone lesson.
- `title`: non-empty, learner-facing lesson title.
- `conceptId`: non-empty Rust concept label. Playground may display this value
   directly, so make it readable (for example, `error-handling`), not opaque.
- `difficulty`: expected level: `easy`, `medium`, or `advanced`.
- `estimatedMinutes`: number from 5 through 10 for expected learner effort.
- `scenario`: non-empty context explaining why the task exists.
- `instructions`: non-empty, concrete change the learner must make.
- `starterCode`: string containing the initial editable source. It must match
   the editable file's `content` exactly.
- `files`: non-empty array of `{ "path", "role", "content" }`; roles are
  `editable`, `readonly`, or `test`.
- `hints`: array of one to three progressive hints. Each has a numeric,
   sequential `level` starting at 1, a non-empty learner-visible `body`, and
   optional string `solutionCode` shown with that hint.
- `completionExplanation`: non-empty learner-facing explanation shown after
   checks pass.
- `validation`: the check configuration described below; required for a valid
   shared lesson.

Each file's `path`, `role`, and `content` must be strings. Include exactly one
`editable` file: learner's source file. A `readonly` file supplies context that
learners can read but not edit. A `test` file supplies Rust tests to backend
validation. Roles control workspace treatment, not secrecy: all file content
is part of public, inspectable lesson payload. Paths must be relative, unique, and
traversal-free. Supported project paths are Rust files under `src/` or `tests/`,
plus files under `fixtures/` or `testdata/`. Never include manifests, runner
commands, or custom runner configuration in the payload. Do not include
author-only metadata, notes, solution paths, or fields outside the public lesson
shape above.

## Validation Modes

Validation modes specify what Playground checks when learner runs validation.
Only backend modes compile or execute Rust. Browser structural checks are quick
source checks; self-check is not an automated correctness check. Validation
configuration and tests are included in public payload and can be inspected or
changed by recipients.

- Both explicit backend modes require `src/lib.rs` and at least one Rust test
  target under `tests/`. A test target can come from a `test` lesson file,
  `testFiles`, or `testCode`. If there is no explicit backend mode, Playground
  adds a default compile-smoke test: it checks that the library compiles but
  asserts no lesson behavior. This default also applies to structural-only and
  self-check-only lessons.
- `structural`: finite positive `timeoutMs` and one or more checks. Checks run
  against the single editable file only, not readonly or test files. They are
  small text/regex source-matching functions, not a Rust parser, compiler, or
  behavior test. They can accept invalid Rust and can reject semantically
  equivalent syntax. Specify the source form being required; do not expect a
  check to infer omitted generic arguments or equivalent spellings. Line and
  block comments are ignored by most checks; `source_includes.requiredSnippets`
  searches raw source, so a required snippet can match inside a comment.

  Available checks:
  - `enum_unit_variants` (`enumName`, `requiredVariants`): find named enum and
    check for each required variant name. Unit, tuple, and struct variants all
    count; payload shape is not checked.
  - `struct_fields` (`structName`, `requiredFields`): find named-field struct;
    each field entry has `name` and `typeIncludes`. Every listed type string must
    occur in that field's type text. This is substring matching, not exact type
    equality.
  - `tuple_struct_fields` (`structName`, `requiredTypes`): find tuple struct;
    array length requires exact field count, and each entry checks corresponding
    field type by substring, in order.
  - `impl_trait_for_type` (`traitName`, `typeName`): find explicit `impl Trait for
    Type` and compare trait reference. Whitespace and path qualification are
    normalized; generic arguments remain significant and must be included when
    required. Does not check implementation behavior.
  - `derived_trait_for_type` (`traitName`, `typeName`): check that named struct
    or enum has a `derive` attribute listing the trait. Does not count a manual
    trait implementation as a derive.
  - `impl_method` (`implFor`, `methodName`, `requiredSignatureIncludes`): find
    method with that name inside an inherent `impl` for the named type; every
    required string must occur in its signature. Does not inspect method body.
  - `function_signature` (`functionName`, `requiredSignatureIncludes`): find
    function by name and check that every required string occurs in its
    whitespace-normalized signature. Does not inspect function body.
  - `source_includes` (`requiredSnippets`, optional `forbiddenSnippets`): each
    required string must occur literally in editable source. Forbidden strings
    must not occur; comments are ignored for forbidden checks. Identifier-only
    forbidden values use identifier boundaries, while other values use literal
    substring matching.

  Use backend tests for requirements about Rust type checking, runtime results,
  errors, or implementation behavior.
- `backend-cargo-test`: finite positive `timeoutMs`, optional dependency set
  (`std`, `advanced`, or `advanced-db`), and optional `testCode` or `testFiles`.
  This compiles the submitted library and runs public tests with `cargo test`.
  Include a test target as a `test` lesson file, a `testFiles` entry with `path`
  and `content` string fields, or `testCode` (placed in `tests/lesson.rs` only
  when no test target already exists; otherwise `testCode` is ignored). The
  generated Cargo package is named `rust_daily_lesson`; integration tests import
  the submitted library by that name.
  `std` provides standard library only; `advanced` and `advanced-db` provide
  curated cached dependency sets, with database dependencies in `advanced-db`.
  Use `10_000` ms unless tests need longer.
- `backend-compile-fail`: finite positive `timeoutMs`, optional dependency set,
  and one to four cases with `name`, `path`, `content`, and non-empty
  `expectedDiagnostics`; `forbiddenDiagnostics` is optional. Submitted library
  must compile first. Each case is then compiled as an integration-test target
  against `rust_daily_lesson`; each must fail to compile, include every expected
  diagnostic substring, and include none of the forbidden substrings. Case
  names must be unique, 1-80 ASCII letters, digits, `_` or `-`. Case paths must
  be unique safe relative `.rs` paths under `compile_fail/`.
- `self-check`: no fields beyond `mode` required. Running it records that learner
  self-checked; it does not compile or verify the answer. Default compile-smoke
  behavior above still applies if lesson has no explicit backend mode.
- `all`: non-empty `validations` array of supported modes above; nested `all` is
  forbidden. Playground runs browser checks first, then backend checks; backend
  checks run only if browser checks pass or return `self-check`.

Do not use `browser-rust`: unsupported by Playground. Do not invent validation
modes or fields. Public tests are inspectable and editable by link recipients;
they are practice checks, not tamper-resistant grading.

## Procedure

1. Use the self-contained payload contract above. Do not require or assume
   repository files are available.
2. Ask only for lesson-defining details that are missing, such as the Rust
   concept or expected learner level. Choose a focused production-shaped task
   that can be completed in 5-10 minutes.
3. Author one complete public lesson object that satisfies the contract.
   Include exactly one editable file, only necessary read-only context or test
   files, and one to three progressive hints. Use a meaningful `conceptId`;
   the app may display it directly when no concept metadata is available.
4. Serialize the complete object as compact UTF-8 JSON. Confirm the decoded
   JSON is no larger than 32 KiB. If it is too large, reduce unnecessary lesson
   context or tests and validate the lesson again; never truncate or silently
   omit required content.
5. Encode the UTF-8 JSON bytes as unpadded base64url. In Node.js,
   `Buffer.from(json, "utf8").toString("base64url")` performs this encoding;
   equivalently, use standard Base64, replace `+` with `-` and `/` with `_`,
   and remove trailing `=` characters. Construct the link as:

   ```text
   https://borrowquest.site/#playground?lesson=<base64url-payload>
   ```

   Use another origin only when the user explicitly supplies one. The payload
   alphabet is URL-safe and is placed in the hash fragment without additional
   URL encoding.
6. Return the share link and a concise lesson summary. Include the raw JSON
   only when requested. Remind the user that lesson source and tests are
   embedded in the link and must not contain secrets or private material.

## Constraints

- Produce the payload and link only; do not create or modify curriculum
   content.
- When revising an existing lesson payload, preserve its `id` unless the user
   requests a change. Playground draft isolation is based on the complete
   payload, not the lesson ID.
- Remind users that link recipients can inspect and alter the payload and
   tests; do not describe them as private or tamper-resistant.
- If a valid link cannot fit the payload limit or required lesson details are
  unavailable, explain the blocker instead of returning a broken link.