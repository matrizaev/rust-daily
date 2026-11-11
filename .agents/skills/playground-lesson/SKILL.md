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
`editable` file. Paths must be relative, unique, and traversal-free. Supported
project paths are Rust files under `src/` or `tests/`, plus files under
`fixtures/` or `testdata/`. Never include manifests, runner commands, or custom
runner configuration in the payload. Do not include author-only metadata,
notes, solution paths, or fields outside the public lesson shape above.

Supported validation modes:

- Both explicit backend modes require `src/lib.rs` and at least one Rust test
   target under `tests/`. The app adds a default compile-smoke test when a lesson
   has no explicit backend mode; this does not assert behavior.
- `structural`: finite positive `timeoutMs` and one or more checks. Check types are
  `enum_unit_variants` (`enumName`, `requiredVariants`), `struct_fields`
  (`structName`, `requiredFields` with `name` and `typeIncludes`),
  `tuple_struct_fields` (`structName`, `requiredTypes`),
  `impl_trait_for_type` or `derived_trait_for_type` (`traitName`, `typeName`),
  `impl_method` (`implFor`, `methodName`, `requiredSignatureIncludes`),
  `function_signature` (`functionName`, `requiredSignatureIncludes`), and
  `source_includes` (`requiredSnippets`, optional `forbiddenSnippets`).
- `backend-cargo-test`: finite positive `timeoutMs`, optional dependency set (`std`,
   `advanced`, or `advanced-db`), and optional `testCode` or `testFiles`.
   Include a test target as a `test` lesson file, a `testFiles` entry with
   `path` and `content` string fields, or `testCode`. The generated Cargo
   package is named `rust_daily_lesson`; integration tests import the submitted
   library by that name. Use `10_000` ms unless the task needs a longer timeout.
- `backend-compile-fail`: finite positive `timeoutMs`, optional dependency set,
   and one to four cases with `name`, `path`, `content`, and a non-empty array
   of non-empty `expectedDiagnostics`; `forbiddenDiagnostics` is an optional
   array of non-empty strings. Case names must
   be unique, 1-80 ASCII letters, digits, `_` or `-`. Case paths must be unique
   safe relative `.rs` paths under `compile_fail/`.
- `self-check`: no additional fields are required.
- `all`: a non-empty `validations` array containing supported modes above,
   excluding nested `all`.

Do not use `browser-rust`: the Playground currently reports it as unsupported.
Do not invent validation modes or fields. Public tests are inspectable and
editable by link recipients; they are practice checks, not tamper-resistant
grading.

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