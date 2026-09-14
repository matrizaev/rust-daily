# Rust Daily Full Curriculum

> Generated from the canonical files under `lessons/`. Do not edit this document as the curriculum source of truth.

This document contains all 102 lessons across 17 arcs, ordered by global curriculum order. Each lesson includes its teaching context, complete starter project snapshot, hints, validation contract, compile-fail fixtures where applicable, authored solution, completion explanation, and author notes.

## Curriculum arcs

| Arc | Pillar | Lessons | Description |
| --- | --- | ---: | --- |
| Configure a small service (`config-service`) | domain | 6 | Model service configuration with owned fields, defaults, validation, and borrowed lookup APIs. |
| Parse a user from text (`parse-user`) | errors | 7 | Build a parser around typed errors, Display, Error, sources, From, TryFrom, and behavior checks. |
| Summarize inventory (`inventory-summary`) | collections | 6 | Use structs, borrowed collection outputs, folds, readable loops, IntoIterator, and borrowed sort comparisons. |
| Inspect log lines (`log-lines`) | ownership | 5 | Represent log entries and views with borrowing, lifetimes, pattern matching, Cow, and focused tests. |
| Build a request API (`request-api`) | traits | 6 | Design a small request builder with consuming setters, Default, Result, TryFrom, and doc examples. |
| Email address value object (`email-address-value-object`) | domain | 6 | Model, validate, format, and parse an email address with strong domain types and standard conversions. |
| Money and currency domain representation (`money-value-object`) | domain | 6 | Represent money and currency as a secure domain value object with invariants and checked operations. |
| Host and port configuration modeling (`host-port-config`) | domain | 6 | Configure hostnames and ports with strong typing, validation, defaults, and composition. |
| Converting DTOs into domain commands (`dto-conversions`) | conversion | 6 | Translate raw adapter data into validated domain commands and outbound DTOs with standard conversions. |
| Exposing iteration on collection wrappers (`collection-wrappers`) | conversion | 6 | Wrap collections while exposing idiomatic iteration and fallible construction APIs. |
| Hierarchical configuration loader errors (`config-loader-errors`) | errors | 6 | Design configuration loading errors with Display, Error, source preservation, From, and typed propagation. |
| Translating errors across boundaries (`boundary-error-mapping`) | errors | 6 | Map domain and repository failures into application and adapter-safe error responses. |
| Register user use case boundaries (`register-user-use-case`) | architecture | 6 | Keep domain, application ports, infrastructure implementations, DTO adapters, and handler boundaries separate. |
| Structured request logging (`structured-request-logging`) | logging | 6 | Represent logs as structured events with levels, request fields, spans, error kinds, and redaction. |
| Table-driven domain tests (`table-driven-domain-tests`) | testing | 6 | Use table-driven tests, executable docs, and properties to protect bounded domain values used by pricing and rollout policy. |
| Asteroids game domain (`asteroids-domain`) | domain | 7 | Model an Asteroids game domain with newtypes, state machines, typed entities, and a composed session update. |
| Validate, prepare, then commit (`validate-prepare-commit`) | architecture | 5 | Stage a state-changing operation so raw input is validated, all state-dependent failures are resolved before mutation, prepared work holds the authority it needs, and commit is consuming and infallible. |

## Lesson index

1. [Shape a service Config](#1-shape-a-service-config) — Configure a small service, step 1/6
2. [Design a parse error enum](#2-design-a-parse-error-enum) — Parse a user from text, step 1/7
3. [Define an inventory item](#3-define-an-inventory-item) — Summarize inventory, step 1/6
4. [Borrow fields in a log entry](#4-borrow-fields-in-a-log-entry) — Inspect log lines, step 1/5
5. [Define the Request surface](#5-define-the-request-surface) — Build a request API, step 1/6
6. [Give Config sensible defaults](#6-give-config-sensible-defaults) — Configure a small service, step 2/6
7. [Format parse errors for people](#7-format-parse-errors-for-people) — Parse a user from text, step 2/7
8. [Collect available item names](#8-collect-available-item-names) — Summarize inventory, step 2/6
9. [Create a lifetime-backed view](#9-create-a-lifetime-backed-view) — Inspect log lines, step 2/5
10. [Add consuming builder setters](#10-add-consuming-builder-setters) — Build a request API, step 2/6
11. [Add a small Config setter](#11-add-a-small-config-setter) — Configure a small service, step 3/6
12. [Mark the parse error as an Error](#12-mark-the-parse-error-as-an-error) — Parse a user from text, step 3/7
13. [Fold quantities into a total](#13-fold-quantities-into-a-total) — Summarize inventory, step 3/6
14. [Map log levels with match](#14-map-log-levels-with-match) — Inspect log lines, step 3/5
15. [Start the builder from Default](#15-start-the-builder-from-default) — Build a request API, step 3/6
16. [Model an optional timeout](#16-model-an-optional-timeout) — Configure a small service, step 4/6
17. [Make restock alerts scan-friendly](#17-make-restock-alerts-scan-friendly) — Summarize inventory, step 4/6
18. [Allow borrowed or owned messages](#18-allow-borrowed-or-owned-messages) — Inspect log lines, step 4/5
19. [Validate builder output](#19-validate-builder-output) — Build a request API, step 4/6
20. [Preserve the ID parse source](#20-preserve-the-id-parse-source) — Parse a user from text, step 4/7
21. [Return validation errors with Result](#21-return-validation-errors-with-result) — Configure a small service, step 5/6
22. [Convert ParseIntError with From](#22-convert-parseinterror-with-from) — Parse a user from text, step 5/7
23. [Make Inventory iterable](#23-make-inventory-iterable) — Summarize inventory, step 5/6
24. [Check log filtering behavior](#24-check-log-filtering-behavior) — Inspect log lines, step 5/5
25. [Convert RawRequest with TryFrom](#25-convert-rawrequest-with-tryfrom) — Build a request API, step 5/6
26. [Borrow config candidates](#26-borrow-config-candidates) — Configure a small service, step 6/6
27. [Sort items by borrowed comparison](#27-sort-items-by-borrowed-comparison) — Summarize inventory, step 6/6
28. [Document the request builder](#28-document-the-request-builder) — Build a request API, step 6/6
29. [Parse User with TryFrom](#29-parse-user-with-tryfrom) — Parse a user from text, step 6/7
30. [Write parser behavior checks](#30-write-parser-behavior-checks) — Parse a user from text, step 7/7
31. [Hide EmailAddress internals](#31-hide-emailaddress-internals) — Email address value object, step 1/6
32. [Validate EmailAddress with TryFrom](#32-validate-emailaddress-with-tryfrom) — Email address value object, step 2/6
33. [Name the missing domain case](#33-name-the-missing-domain-case) — Email address value object, step 3/6
34. [Format EmailAddress with Display](#34-format-emailaddress-with-display) — Email address value object, step 4/6
35. [Format validation errors](#35-format-validation-errors) — Email address value object, step 5/6
36. [Parse EmailAddress with FromStr](#36-parse-emailaddress-with-fromstr) — Email address value object, step 6/6
37. [Define a basic Money struct](#37-define-a-basic-money-struct) — Money and currency domain representation, step 1/6
38. [Add supported Currency variants](#38-add-supported-currency-variants) — Money and currency domain representation, step 2/6
39. [Add a Money constructor and accessors](#39-add-a-money-constructor-and-accessors) — Money and currency domain representation, step 3/6
40. [Add Money with a typed error](#40-add-money-with-a-typed-error) — Money and currency domain representation, step 4/6
41. [Convert a decimal string to Money](#41-convert-a-decimal-string-to-money) — Money and currency domain representation, step 5/6
42. [Implement Display for Money](#42-implement-display-for-money) — Money and currency domain representation, step 6/6
43. [Use NonZeroU16 for Port representation](#43-use-nonzerou16-for-port-representation) — Host and port configuration modeling, step 1/6
44. [Define and validate a Host value object](#44-define-and-validate-a-host-value-object) — Host and port configuration modeling, step 2/6
45. [Reuse Host validation for owned strings](#45-reuse-host-validation-for-owned-strings) — Host and port configuration modeling, step 3/6
46. [Compose Host and Port into Endpoint](#46-compose-host-and-port-into-endpoint) — Host and port configuration modeling, step 4/6
47. [Give Endpoint sensible local defaults](#47-give-endpoint-sensible-local-defaults) — Host and port configuration modeling, step 5/6
48. [Implement Display for Endpoint](#48-implement-display-for-endpoint) — Host and port configuration modeling, step 6/6
49. [Deserialize a raw register-user DTO](#49-deserialize-a-raw-register-user-dto) — Converting DTOs into domain commands, step 1/6
50. [Keep the validated command serde-free](#50-keep-the-validated-command-serde-free) — Converting DTOs into domain commands, step 2/6
51. [Convert JSON DTOs into commands with TryFrom](#51-convert-json-dtos-into-commands-with-tryfrom) — Converting DTOs into domain commands, step 3/6
52. [Trim DTO fields before command creation](#52-trim-dto-fields-before-command-creation) — Converting DTOs into domain commands, step 4/6
53. [Deserialize and validate a bulk DTO](#53-deserialize-and-validate-a-bulk-dto) — Converting DTOs into domain commands, step 5/6
54. [Serialize an outbound DTO from a domain event](#54-serialize-an-outbound-dto-from-a-domain-event) — Converting DTOs into domain commands, step 6/6
55. [Wrap order lines behind a slice API](#55-wrap-order-lines-behind-a-slice-api) — Exposing iteration on collection wrappers, step 1/6
56. [Expose borrowed iteration explicitly](#56-expose-borrowed-iteration-explicitly) — Exposing iteration on collection wrappers, step 2/6
57. [Consume a wrapper with owned IntoIterator](#57-consume-a-wrapper-with-owned-intoiterator) — Exposing iteration on collection wrappers, step 3/6
58. [Borrow a wrapper directly in for loops](#58-borrow-a-wrapper-directly-in-for-loops) — Exposing iteration on collection wrappers, step 4/6
59. [Mutate through wrapper iterators](#59-mutate-through-wrapper-iterators) — Exposing iteration on collection wrappers, step 5/6
60. [Validate and drain collection wrappers](#60-validate-and-drain-collection-wrappers) — Exposing iteration on collection wrappers, step 6/6
61. [Derive a typed config error with thiserror](#61-derive-a-typed-config-error-with-thiserror) — Hierarchical configuration loader errors, step 1/6
62. [Separate error kinds from error messages](#62-separate-error-kinds-from-error-messages) — Hierarchical configuration loader errors, step 2/6
63. [Preserve an I/O error as a source](#63-preserve-an-io-error-as-a-source) — Hierarchical configuration loader errors, step 3/6
64. [Derive mechanical I/O conversion](#64-derive-mechanical-io-conversion) — Hierarchical configuration loader errors, step 4/6
65. [Derive ParseIntError conversion](#65-derive-parseinterror-conversion) — Hierarchical configuration loader errors, step 5/6
66. [Add context at the application boundary](#66-add-context-at-the-application-boundary) — Hierarchical configuration loader errors, step 6/6
67. [Design a non-exhaustive domain error](#67-design-a-non-exhaustive-domain-error) — Translating errors across boundaries, step 1/6
68. [Keep repository failures at their boundary](#68-keep-repository-failures-at-their-boundary) — Translating errors across boundaries, step 2/6
69. [Compose boundary errors without flattening them](#69-compose-boundary-errors-without-flattening-them) — Translating errors across boundaries, step 3/6
70. [Derive mechanical boundary conversions](#70-derive-mechanical-boundary-conversions) — Translating errors across boundaries, step 4/6
71. [Classify retries without parsing messages](#71-classify-retries-without-parsing-messages) — Translating errors across boundaries, step 5/6
72. [Map typed application errors at the adapter edge](#72-map-typed-application-errors-at-the-adapter-edge) — Translating errors across boundaries, step 6/6
73. [Keep async service types out of the domain](#73-keep-async-service-types-out-of-the-domain) — Register user use case boundaries, step 1/6
74. [Define an async repository port with Send futures](#74-define-an-async-repository-port-with-send-futures) — Register user use case boundaries, step 2/6
75. [Implement an async use case over the port](#75-implement-an-async-use-case-over-the-port) — Register user use case boundaries, step 3/6
76. [Deserialize adapter input at the edge](#76-deserialize-adapter-input-at-the-edge) — Register user use case boundaries, step 4/6
77. [Share an in-memory repository safely](#77-share-an-in-memory-repository-safely) — Register user use case boundaries, step 5/6
78. [Add an Actix handler boundary](#78-add-an-actix-handler-boundary) — Register user use case boundaries, step 6/6
79. [Emit a structured tracing event](#79-emit-a-structured-tracing-event) — Structured request logging, step 1/6
80. [Record consistent request fields](#80-record-consistent-request-fields) — Structured request logging, step 2/6
81. [Redact secrets before they reach tracing](#81-redact-secrets-before-they-reach-tracing) — Structured request logging, step 3/6
82. [Create a request span for async work](#82-create-a-request-span-for-async-work) — Structured request logging, step 4/6
83. [Record typed error kinds as fields](#83-record-typed-error-kinds-as-fields) — Structured request logging, step 5/6
84. [Emit a boundary outcome event](#84-emit-a-boundary-outcome-event) — Structured request logging, step 6/6
85. [Define a property-friendly Percentage type](#85-define-a-property-friendly-percentage-type) — Table-driven domain tests, step 1/6
86. [Write table-driven valid examples](#86-write-table-driven-valid-examples) — Table-driven domain tests, step 2/6
87. [Write table-driven invalid examples](#87-write-table-driven-invalid-examples) — Table-driven domain tests, step 3/6
88. [Test display behavior with a table](#88-test-display-behavior-with-a-table) — Table-driven domain tests, step 4/6
89. [Add an executable Result-aware example](#89-add-an-executable-result-aware-example) — Table-driven domain tests, step 5/6
90. [Combine named cases with property tests](#90-combine-named-cases-with-property-tests) — Table-driven domain tests, step 6/6
91. [Score as a saturating newtype](#91-score-as-a-saturating-newtype) — Asteroids game domain, step 1/7
92. [Non-zero lives and wave counters](#92-non-zero-lives-and-wave-counters) — Asteroids game domain, step 2/7
93. [Ship as a state machine](#93-ship-as-a-state-machine) — Asteroids game domain, step 3/7
94. [Weapon cooldown and bullet lifetime](#94-weapon-cooldown-and-bullet-lifetime) — Asteroids game domain, step 4/7
95. [Asteroid kinds, radii, scores, and splitting](#95-asteroid-kinds-radii-scores-and-splitting) — Asteroids game domain, step 5/7
96. [Player composition facade](#96-player-composition-facade) — Asteroids game domain, step 6/7
97. [Compose the session update loop](#97-compose-the-session-update-loop) — Asteroids game domain, step 7/7
98. [Validate a request into a command](#98-validate-a-request-into-a-command) — Validate, prepare, then commit, step 1/5
99. [Prepare a transfer without mutating](#99-prepare-a-transfer-without-mutating) — Validate, prepare, then commit, step 2/5
100. [Bind prepared work to exclusive state](#100-bind-prepared-work-to-exclusive-state) — Validate, prepare, then commit, step 3/5
101. [Commit prepared work infallibly](#101-commit-prepared-work-infallibly) — Validate, prepare, then commit, step 4/5
102. [Compose the staged mutation pipeline](#102-compose-the-staged-mutation-pipeline) — Validate, prepare, then commit, step 5/5

---

## 1. Shape a service Config

Source: `lessons/config-service/001-config-struct-fields`

| Field | Value |
| --- | --- |
| Lesson ID | `config-struct-fields-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-struct-fields-001) |
| Arc | Configure a small service (step 1 of 6) |
| Concept | Struct field design (`struct-field-design`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

A tiny service needs configuration that can be owned by the service and moved between setup functions.

### Task

Define Config with owned fields: service_url: String, max_connections: usize, and use_tls: bool.

### Concept context

Choose owned field types for a small configuration object.

- Prerequisites: None
- Tags: `structs`, `configuration`, `ownership`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-service/001-config-struct-fields/starter/src/lib.rs`

```rust
// TODO: define Config with owned fields for the service settings.
```

#### `tests/public.rs` — test

Source: `lessons/config-service/001-config-struct-fields/tests/public.rs`

```rust
use rust_daily_lesson::Config;

#[test]
fn config_groups_owned_service_settings() {
    let config = Config {
        service_url: "http://localhost:8080".to_owned(),
        max_connections: 32,
        use_tls: false,
    };

    assert_eq!(config.service_url, "http://localhost:8080");
    assert_eq!(config.max_connections, 32);
    assert!(!config.use_tls);
}
```

### Progressive hints

1. Use a struct when a few named values travel together.
2. String is appropriate when Config owns its service URL.
3. Booleans are fine for small binary flags such as TLS on or off. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Config",
          "requiredFields": [
            {
              "name": "service_url",
              "typeIncludes": [
                "String"
              ]
            },
            {
              "name": "max_connections",
              "typeIncludes": [
                "usize"
              ]
            },
            {
              "name": "use_tls",
              "typeIncludes": [
                "bool"
              ]
            }
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-service/001-config-struct-fields/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}
```

### Completion explanation

The Config type gives the service one explicit setup object. Owned fields make the value easy to store without tying it to temporary input lifetimes.

### Author notes

Teaches struct-field-design through a focused, behavior-checked Rust micro-lesson.

---

## 2. Design a parse error enum

Source: `lessons/parse-user/001-error-enum`

| Field | Value |
| --- | --- |
| Lesson ID | `error-enum-parse-user-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/error-enum-parse-user-001) |
| Arc | Parse a user from text (step 1 of 7) |
| Concept | Error enum design (`error-enum-design`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

A small user parser needs a typed error instead of string errors. Today you are defining the public error type that the rest of the parser arc will build on.

### Task

Replace the TODO with ParseUserError variants for the parser cases below: MissingId, MissingName, MissingEmail, and InvalidId.

### Concept context

Model distinct parser failure modes with a typed Rust enum instead of stringly typed errors.

- Prerequisites: None
- Tags: `enums`, `errors`, `api-design`, `parsing`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/parse-user/001-error-enum/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    // TODO: add one variant for each parser failure case.
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(|_| ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}
```

#### `tests/public.rs` — test

Source: `lessons/parse-user/001-error-enum/tests/public.rs`

```rust
use rust_daily_lesson::{parse_user, ParseUserError, User};

#[test]
fn parses_valid_user() {
    assert_eq!(
        parse_user("42,Ada,ada@example.com"),
        Ok(User {
            id: 42,
            name: "Ada".to_owned(),
            email: "ada@example.com".to_owned(),
        })
    );
}

#[test]
fn returns_named_parse_errors() {
    assert_eq!(parse_user(""), Err(ParseUserError::MissingId));
    assert_eq!(parse_user("42,,ada@example.com"), Err(ParseUserError::MissingName));
    assert_eq!(parse_user("42,Ada"), Err(ParseUserError::MissingEmail));
    assert_eq!(parse_user("nope,Ada,ada@example.com"), Err(ParseUserError::InvalidId));
}
```

### Progressive hints

1. The parser already names every failure case it wants to return.
2. Each distinct failure mode should usually become its own enum variant.
3. Keep these as programmatic enum variants; human-facing text comes later with Display. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "ParseUserError",
          "requiredVariants": [
            "MissingId",
            "MissingName",
            "MissingEmail",
            "InvalidId"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/parse-user/001-error-enum/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId,
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(|_| ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}
```

### Completion explanation

Each parser failure now has a named enum variant. Empty fields and invalid IDs become typed results that callers can match on instead of parsing strings or comparing error messages.

### Author notes

Teaches error-enum-design through a focused, behavior-checked Rust micro-lesson.

---

## 3. Define an inventory item

Source: `lessons/inventory-summary/001-item-struct`

| Field | Value |
| --- | --- |
| Lesson ID | `inventory-item-struct-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/inventory-item-struct-001) |
| Arc | Summarize inventory (step 1 of 6) |
| Concept | Domain structs (`domain-structs`) |
| Difficulty | easy |
| Estimated time | 5 minutes |

### Scenario

Inventory summaries need a small domain type before helpers can work with names and quantities.

### Task

Define Item with sku: String, name: String, quantity: u32, and reserved: u32.

### Concept context

Use named fields to model inventory data clearly.

- Prerequisites: None
- Tags: `structs`, `domain-modeling`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/inventory-summary/001-item-struct/starter/src/lib.rs`

```rust
// TODO: define the Item struct used by inventory summaries.
```

#### `tests/public.rs` — test

Source: `lessons/inventory-summary/001-item-struct/tests/public.rs`

```rust
use rust_daily_lesson::Item;

#[test]
fn item_names_inventory_fields() {
    let item = Item {
        sku: "SKU-1".to_owned(),
        name: "Keyboard".to_owned(),
        quantity: 10,
        reserved: 3,
    };

    assert_eq!(item.sku, "SKU-1");
    assert_eq!(item.name, "Keyboard");
    assert_eq!(item.quantity, 10);
    assert_eq!(item.reserved, 3);
}
```

### Progressive hints

1. Use a struct when each value has a distinct role.
2. The user-facing name and SKU are owned strings.
3. Quantities are small non-negative counts, so u32 is enough here. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Item",
          "requiredFields": [
            {
              "name": "sku",
              "typeIncludes": [
                "String"
              ]
            },
            {
              "name": "name",
              "typeIncludes": [
                "String"
              ]
            },
            {
              "name": "quantity",
              "typeIncludes": [
                "u32"
              ]
            },
            {
              "name": "reserved",
              "typeIncludes": [
                "u32"
              ]
            }
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/inventory-summary/001-item-struct/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}
```

### Completion explanation

The Item struct gives later helpers a clear vocabulary. Named fields make summary code easier to read than tuple positions.

### Author notes

Teaches domain-structs through a focused, behavior-checked Rust micro-lesson.

---

## 4. Borrow fields in a log entry

Source: `lessons/log-lines/001-entry-borrowed`

| Field | Value |
| --- | --- |
| Lesson ID | `log-entry-borrowed-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-entry-borrowed-001) |
| Arc | Inspect log lines (step 1 of 5) |
| Concept | Borrowed fields (`borrowed-fields`) |
| Difficulty | medium |
| Estimated time | 7 minutes |

### Scenario

A log viewer often points into existing log text instead of allocating new strings for every parsed line.

### Task

Define LogEntry<'a> with borrowed level: &'a str and message: &'a str fields.

### Concept context

Use lifetimes to store borrowed string slices in a struct.

- Prerequisites: `borrowing-api`
- Tags: `lifetimes`, `borrowing`, `strings`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/log-lines/001-entry-borrowed/starter/src/lib.rs`

```rust
// TODO: define LogEntry with borrowed fields.
```

#### `tests/public.rs` — test

Source: `lessons/log-lines/001-entry-borrowed/tests/public.rs`

```rust
use rust_daily_lesson::LogEntry;

#[test]
fn log_entry_borrows_text() {
    let entry = LogEntry {
        level: "INFO",
        message: "started",
    };

    assert_eq!(entry.level, "INFO");
    assert_eq!(entry.message, "started");
}
```

### Progressive hints

1. Borrowed struct fields need a lifetime parameter on the struct.
2. Both fields can borrow string slices from the original log line.
3. Use &'a str for each borrowed text field. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "LogEntry",
          "requiredFields": [
            {
              "name": "level",
              "typeIncludes": [
                "&'a str"
              ]
            },
            {
              "name": "message",
              "typeIncludes": [
                "&'a str"
              ]
            }
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/log-lines/001-entry-borrowed/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}
```

### Completion explanation

Borrowed fields let the entry view point into existing text. The lifetime parameter states that the entry cannot outlive the data it references.

### Author notes

Teaches borrowed-fields through a focused, behavior-checked Rust micro-lesson.

---

## 5. Define the Request surface

Source: `lessons/request-api/001-request-struct`

| Field | Value |
| --- | --- |
| Lesson ID | `request-struct-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/request-struct-001) |
| Arc | Build a request API (step 1 of 6) |
| Concept | API surface structs (`api-structs`) |
| Difficulty | easy |
| Estimated time | 5 minutes |

### Scenario

A small client library needs a request type that can be passed around after setup.

### Task

Define Request with method: String, path: String, and body: Option<String>.

### Concept context

Define a small owned type that represents a completed API request.

- Prerequisites: `struct-field-design`
- Tags: `api-design`, `structs`, `ownership`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/request-api/001-request-struct/starter/src/lib.rs`

```rust
// TODO: define the Request type used by the client API.
```

#### `tests/public.rs` — test

Source: `lessons/request-api/001-request-struct/tests/public.rs`

```rust
use rust_daily_lesson::Request;

#[test]
fn request_surface_owns_completed_request_data() {
    let request = Request {
        method: "POST".to_owned(),
        path: "/users".to_owned(),
        body: Some("{}".to_owned()),
    };

    assert_eq!(request.method, "POST");
    assert_eq!(request.path, "/users");
    assert_eq!(request.body, Some("{}".to_owned()));
}
```

### Progressive hints

1. Keep the request data owned so it can outlive the builder.
2. The body may be absent, which makes Option a good fit.
3. Use clear field names that match the API vocabulary. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Request",
          "requiredFields": [
            {
              "name": "method",
              "typeIncludes": [
                "String"
              ]
            },
            {
              "name": "path",
              "typeIncludes": [
                "String"
              ]
            },
            {
              "name": "body",
              "typeIncludes": [
                "Option",
                "String"
              ]
            }
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/request-api/001-request-struct/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}
```

### Completion explanation

A focused Request struct gives the API a stable output type. Owned fields keep the request independent from temporary builder input.

### Author notes

Teaches api-structs through a focused, behavior-checked Rust micro-lesson.

---

## 6. Give Config sensible defaults

Source: `lessons/config-service/002-config-default-impl`

| Field | Value |
| --- | --- |
| Lesson ID | `config-default-impl-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-default-impl-002) |
| Arc | Configure a small service (step 2 of 6) |
| Concept | Default (`default-impl`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Most local service runs use the same setup. Default lets callers start from a reasonable Config and override only what changes.

### Task

Implement Default for Config. Use http://localhost:8080, 32 max connections, and false for use_tls.

### Concept context

Provide a sensible default state for a domain type.

- Prerequisites: `struct-field-design`
- Tags: `default`, `traits`, `configuration`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-service/002-config-default-impl/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}

// Continue from the previous lesson.
// TODO: implement Default for Config.
```

#### `tests/public.rs` — test

Source: `lessons/config-service/002-config-default-impl/tests/public.rs`

```rust
use rust_daily_lesson::Config;

#[test]
fn default_config_is_local_and_safe() {
    let config = Config::default();

    assert_eq!(config.service_url, "http://localhost:8080");
    assert_eq!(config.max_connections, 32);
    assert!(!config.use_tls);
}
```

### Progressive hints

1. Default returns Self from fn default() -> Self.
2. Use to_owned or String::from for the service URL.
3. Derive would use String::new and 0. Implement Default manually because this lesson needs local development values. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "Default",
          "typeName": "Config"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "fn default",
            "localhost"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-service/002-config-default-impl/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
        }
    }
}
```

### Completion explanation

Default gives callers a clear starting point while keeping each field explicit. It is useful when most configuration values are optional overrides.

### Author notes

Teaches default-impl through a focused, behavior-checked Rust micro-lesson.

---

## 7. Format parse errors for people

Source: `lessons/parse-user/002-display-error`

| Field | Value |
| --- | --- |
| Lesson ID | `display-parse-user-error-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/display-parse-user-error-002) |
| Arc | Parse a user from text (step 2 of 7) |
| Concept | Display for errors (`display-parse-error`) |
| Difficulty | easy |
| Estimated time | 8 minutes |

### Scenario

Callers can match on ParseUserError, but logs and command-line output still need clear human-readable messages.

### Task

Implement std::fmt::Display for ParseUserError. Use a match on self and write a short message for each variant.

### Concept context

Implement human-readable formatting while keeping the error type programmatic.

- Prerequisites: `error-enum-design`
- Tags: `display`, `errors`, `formatting`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/parse-user/002-display-error/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId,
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(|_| ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

// Continue from the previous lesson.
// TODO: implement std::fmt::Display for ParseUserError.
```

#### `tests/public.rs` — test

Source: `lessons/parse-user/002-display-error/tests/public.rs`

```rust
use rust_daily_lesson::ParseUserError;

#[test]
fn formats_parse_errors_for_people() {
    assert_eq!(ParseUserError::MissingId.to_string(), "missing id");
    assert_eq!(ParseUserError::MissingName.to_string(), "missing name");
    assert_eq!(ParseUserError::MissingEmail.to_string(), "missing email");
    assert_eq!(ParseUserError::InvalidId.to_string(), "invalid id");
}
```

### Progressive hints

1. Display is implemented with fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result.
2. A match on self keeps one message next to each error case.
3. Use write!(f, "...") inside each match arm. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::fmt::Display",
          "typeName": "ParseUserError"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "fn fmt",
            "match self"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/parse-user/002-display-error/solution/src/lib.rs`

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId,
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(|_| ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId => write!(f, "invalid id"),
        }
    }
}
```

### Completion explanation

Display separates the typed error representation from the text shown to users. The enum stays useful for programs, while fmt gives each case a stable message.

### Author notes

Teaches display-parse-error through a focused, behavior-checked Rust micro-lesson.

---

## 8. Collect available item names

Source: `lessons/inventory-summary/002-filter-map`

| Field | Value |
| --- | --- |
| Lesson ID | `inventory-filter-map-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/inventory-filter-map-002) |
| Arc | Summarize inventory (step 2 of 6) |
| Concept | filter_map (`filter-map`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A dashboard only needs names for items whose available count is above zero.

### Task

Implement available_names with filter_map. Include an item name only when quantity is greater than reserved.

### Concept context

Filter and transform collection items in one iterator step.

- Prerequisites: `domain-structs`, `borrowing-api`
- Tags: `iterators`, `borrowing`, `collections`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/inventory-summary/002-filter-map/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

// Continue from the previous lesson.
// TODO: use filter_map to collect names with available stock.
```

#### `tests/public.rs` — test

Source: `lessons/inventory-summary/002-filter-map/tests/public.rs`

```rust
use rust_daily_lesson::{available_names, Item};

#[test]
fn collects_only_available_item_names() {
    let items = vec![
        Item {
            name: "Keyboard".to_owned(),
            sku: "1".to_owned(),
            quantity: 10,
            reserved: 2,
        },
        Item {
            name: "Mouse".to_owned(),
            sku: "2".to_owned(),
            quantity: 4,
            reserved: 4,
        },
    ];

    assert_eq!(available_names(&items), vec!["Keyboard"]);
}
```

### Progressive hints

1. available stock is quantity minus reserved, but compare before subtracting.
2. filter_map can return Some(name) for included items and None for skipped items.
3. Borrow names with as_str instead of cloning them. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "available_names",
          "requiredSignatureIncludes": [
            "Vec<&str>"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "filter_map",
            "as_str"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/inventory-summary/002-filter-map/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}
```

### Completion explanation

filter_map fits this helper because filtering and mapping happen together. It keeps the output borrowed from the input slice instead of allocating new strings.

### Author notes

Teaches filter-map through a focused, behavior-checked Rust micro-lesson.

---

## 9. Create a lifetime-backed view

Source: `lessons/log-lines/002-view-lifetime`

| Field | Value |
| --- | --- |
| Lesson ID | `log-view-lifetime-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-view-lifetime-002) |
| Arc | Inspect log lines (step 2 of 5) |
| Concept | Lifetime-backed views (`lifetime-view`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A log view should borrow a slice of entries and expose helper methods without taking ownership.

### Task

Define LogView<'a> with entries: &'a [LogEntry<'a>].

### Concept context

Model a view type that borrows a slice of borrowed entries.

- Prerequisites: `borrowed-fields`
- Tags: `lifetimes`, `views`, `borrowing`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/log-lines/002-view-lifetime/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

// Continue from the previous lesson.
// TODO: define LogView that borrows a slice of entries.
```

#### `tests/public.rs` — test

Source: `lessons/log-lines/002-view-lifetime/tests/public.rs`

```rust
use rust_daily_lesson::{LogEntry, LogView};

#[test]
fn view_borrows_slice_of_entries() {
    let entries = [LogEntry {
        level: "WARN",
        message: "slow",
    }];
    let view = LogView { entries: &entries };

    assert_eq!(view.entries.len(), 1);
    assert_eq!(view.entries[0].message, "slow");
}
```

### Progressive hints

1. The view borrows the slice, so the field starts with &'a.
2. The entries inside the slice also carry the same lifetime.
3. This is a view type, not an owning collection. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "LogView",
          "requiredFields": [
            {
              "name": "entries",
              "typeIncludes": [
                "&'a",
                "[LogEntry"
              ]
            }
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/log-lines/002-view-lifetime/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}
```

### Completion explanation

The view type captures the relationship between the borrowed slice and the borrowed text inside each entry. The lifetime keeps those references tied together.

### Author notes

Teaches lifetime-view through a focused, behavior-checked Rust micro-lesson.

---

## 10. Add consuming builder setters

Source: `lessons/request-api/002-builder-setters`

| Field | Value |
| --- | --- |
| Lesson ID | `request-builder-owned-setters-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/request-builder-owned-setters-002) |
| Arc | Build a request API (step 2 of 6) |
| Concept | Builder setters (`builder-setters`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A request builder should support chained calls without exposing all its intermediate fields.

### Task

Keep the Request type, then add RequestBuilder with optional method and path fields. Implement RequestBuilder::new() -> Self and RequestBuilder::method(mut self, method: impl Into<String>) -> Self.

### Concept context

Use consuming setters to make small builder APIs chainable.

- Prerequisites: `api-structs`, `methods-basic`
- Tags: `builder`, `methods`, `ownership`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/request-api/002-builder-setters/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

// Continue from the previous lesson.
// TODO: add a consuming method setter.
```

#### `tests/public.rs` — test

Source: `lessons/request-api/002-builder-setters/tests/public.rs`

```rust
use rust_daily_lesson::RequestBuilder;

#[test]
fn method_setter_is_chainable() {
    let _builder = RequestBuilder::new().method("GET");
}
```

### Progressive hints

1. Taking mut self works well for chainable builder setters.
2. impl Into<String> accepts both borrowed and owned string inputs.
3. Return self after updating the field. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "RequestBuilder",
          "methodName": "method",
          "requiredSignatureIncludes": [
            "mut self",
            "impl Into<String>",
            "Self"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/request-api/002-builder-setters/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self {
            method: None,
            path: None,
        }
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }
}
```

### Completion explanation

Consuming setters make the builder ergonomic while preserving ownership. Each call returns the next builder state for the chain.

### Author notes

Teaches builder-setters through a focused, behavior-checked Rust micro-lesson.

---

## 11. Add a small Config setter

Source: `lessons/config-service/003-config-methods`

| Field | Value |
| --- | --- |
| Lesson ID | `config-methods-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-methods-003) |
| Arc | Configure a small service (step 3 of 6) |
| Concept | Methods (`methods-basic`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

Callers should be able to start from Config::default and customize one field without reaching into every detail.

### Task

Add Config::with_service_url(self, service_url: impl Into<String>) -> Self. Update the field and return self.

### Concept context

Add small inherent methods that improve a type's calling ergonomics.

- Prerequisites: `struct-field-design`
- Tags: `methods`, `api-design`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-service/003-config-methods/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
        }
    }
}

// Continue from the previous lesson.
// TODO: add with_service_url here.
```

#### `tests/public.rs` — test

Source: `lessons/config-service/003-config-methods/tests/public.rs`

```rust
use rust_daily_lesson::Config;

#[test]
fn with_service_url_updates_only_the_url() {
    let config = Config::default().with_service_url("https://api.example.com");

    assert_eq!(config.service_url, "https://api.example.com");
    assert_eq!(config.max_connections, 32);
    assert!(!config.use_tls);
}
```

### Progressive hints

1. A consuming setter can take mut self, change a field, and return self.
2. impl Into<String> lets callers pass either String or &str.
3. Returning Self keeps the method chain-friendly. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "Config",
          "methodName": "with_service_url",
          "requiredSignatureIncludes": [
            "self",
            "impl Into<String>",
            "Self"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-service/003-config-methods/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
        }
    }
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }
}
```

### Completion explanation

A small method can make configuration ergonomic without hiding the Config fields. Taking self by value is a common builder-style pattern.

### Author notes

Teaches methods-basic through a focused, behavior-checked Rust micro-lesson.

---

## 12. Mark the parse error as an Error

Source: `lessons/parse-user/003-error-trait`

| Field | Value |
| --- | --- |
| Lesson ID | `error-trait-parse-user-error-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/error-trait-parse-user-error-003) |
| Arc | Parse a user from text (step 3 of 7) |
| Concept | Error trait (`error-trait`) |
| Difficulty | easy |
| Estimated time | 5 minutes |

### Scenario

The parser error now has Display. Implementing the standard Error trait lets it fit into normal Rust error handling APIs.

### Task

Add an implementation of std::error::Error for ParseUserError. No custom methods are needed yet.

### Concept context

Mark a displayable error type as a standard Rust error.

- Prerequisites: `display-parse-error`
- Tags: `errors`, `traits`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/parse-user/003-error-trait/starter/src/lib.rs`

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId,
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(|_| ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId => write!(f, "invalid id"),
        }
    }
}

// Continue from the previous lesson.
// TODO: implement std::error::Error for ParseUserError.
```

#### `tests/public.rs` — test

Source: `lessons/parse-user/003-error-trait/tests/public.rs`

```rust
use rust_daily_lesson::ParseUserError;

fn assert_error<E: std::error::Error>() {}

#[test]
fn parse_user_error_is_standard_error() {
    assert_error::<ParseUserError>();
}
```

### Progressive hints

1. Error is the standard marker trait for error values.
2. Because Display and Debug already exist, this implementation can be empty.
3. The form is impl std::error::Error for ParseUserError {}. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::error::Error",
          "typeName": "ParseUserError"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/parse-user/003-error-trait/solution/src/lib.rs`

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId,
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(|_| ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId => write!(f, "invalid id"),
        }
    }
}

impl std::error::Error for ParseUserError {}
```

### Completion explanation

Implementing Error makes ParseUserError compatible with APIs that accept standard Rust errors. Empty implementations are common when there is no source error to expose.

### Author notes

Teaches error-trait through a focused, behavior-checked Rust micro-lesson.

---

## 13. Fold quantities into a total

Source: `lessons/inventory-summary/003-fold-total`

| Field | Value |
| --- | --- |
| Lesson ID | `inventory-fold-total-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/inventory-fold-total-003) |
| Arc | Summarize inventory (step 3 of 6) |
| Concept | fold (`fold-sum`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Inventory reporting often needs a single total count across many items.

### Task

Implement total_quantity with iter().fold. Add each item quantity into the accumulator.

### Concept context

Accumulate values across a collection with an explicit reducer.

- Prerequisites: `domain-structs`
- Tags: `iterators`, `accumulation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/inventory-summary/003-fold-total/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}

// Continue from the previous lesson.
// TODO: fold item quantities into one total.
```

#### `tests/public.rs` — test

Source: `lessons/inventory-summary/003-fold-total/tests/public.rs`

```rust
use rust_daily_lesson::{total_quantity, Item};

#[test]
fn folds_quantities_into_total() {
    let items = vec![
        Item {
            sku: "a".to_owned(),
            name: "A".to_owned(),
            quantity: 2,
            reserved: 0,
        },
        Item {
            sku: "b".to_owned(),
            name: "B".to_owned(),
            quantity: 5,
            reserved: 0,
        },
    ];

    assert_eq!(total_quantity(&items), 7);
    assert_eq!(total_quantity(&[]), 0);
}
```

### Progressive hints

1. fold starts with an initial accumulator value.
2. The accumulator and the item reference are the closure arguments.
3. The initial total should be 0. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "total_quantity",
          "requiredSignatureIncludes": [
            "u32"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "fold"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/inventory-summary/003-fold-total/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}
```

### Completion explanation

fold makes the accumulator mechanics explicit: start at zero, visit each item, and return the next total. That gives later reducer logic a clear place to grow.

### Author notes

Teaches fold-sum through a focused, behavior-checked Rust micro-lesson.

---

## 14. Map log levels with match

Source: `lessons/log-lines/003-level-match`

| Field | Value |
| --- | --- |
| Lesson ID | `log-level-match-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-level-match-003) |
| Arc | Inspect log lines (step 3 of 5) |
| Concept | Pattern matching (`pattern-matching`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

An operations view sorts alert rows by log level, keeping routine info below warnings and errors.

### Task

Keep the borrowed log entry and view code, then add LogLevel variants Info, Warn, and Error. Implement alert_priority with a match on level.

### Concept context

Map enum variants to behavior with a clear match expression.

- Prerequisites: `error-enum-design`
- Tags: `match`, `enums`, `control-flow`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/log-lines/003-level-match/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}

// Continue from the previous lesson.
// TODO: add the supported log levels.
// TODO: map Info, Warn, and Error to alert queue priority values.
```

#### `tests/public.rs` — test

Source: `lessons/log-lines/003-level-match/tests/public.rs`

```rust
use rust_daily_lesson::{alert_priority, LogLevel};

#[test]
fn maps_log_levels_to_alert_priority() {
    assert_eq!(alert_priority(LogLevel::Info), 0);
    assert_eq!(alert_priority(LogLevel::Warn), 1);
    assert_eq!(alert_priority(LogLevel::Error), 2);
}
```

### Progressive hints

1. Enums pair well with match because every known case can be handled directly.
2. The alert_priority function should return 0 for Info, 1 for Warn, and 2 for Error.
3. A match expression is clearer than string comparisons for typed log levels. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "LogLevel",
          "requiredVariants": [
            "Info",
            "Warn",
            "Error"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "pub fn alert_priority",
            "match level"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/log-lines/003-level-match/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

pub fn alert_priority(level: LogLevel) -> u8 {
    match level {
        LogLevel::Info => 0,
        LogLevel::Warn => 1,
        LogLevel::Error => 2,
    }
}
```

### Completion explanation

Pattern matching keeps the alert queue policy exhaustive and visible. Adding a new log level later will naturally point maintainers at this decision.

### Author notes

Teaches pattern-matching through a focused, behavior-checked Rust micro-lesson.

---

## 15. Start the builder from Default

Source: `lessons/request-api/003-builder-default`

| Field | Value |
| --- | --- |
| Lesson ID | `request-builder-default-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/request-builder-default-003) |
| Arc | Build a request API (step 3 of 6) |
| Concept | Builder default state (`builder-default`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Callers should be able to create an empty builder using the standard Default trait.

### Task

Derive Default for RequestBuilder. Option fields already default to None, so the empty builder does not need a manual impl.

### Concept context

Create an empty builder with the standard Default trait.

- Prerequisites: `builder-setters`, `default-impl`
- Tags: `builder`, `default`, `traits`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/request-api/003-builder-default/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self {
            method: None,
            path: None,
        }
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }
}

// Continue from the previous lesson.
// TODO: derive Default for RequestBuilder.
```

#### `tests/public.rs` — test

Source: `lessons/request-api/003-builder-default/tests/public.rs`

```rust
use rust_daily_lesson::RequestBuilder;

#[test]
fn builder_has_default_empty_state() {
    let _builder = RequestBuilder::default();
}
```

### Progressive hints

1. Default should produce the same empty state every time.
2. Option<T> implements Default by returning None.
3. Add Default to the derive list on RequestBuilder. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "derived_trait_for_type",
          "traitName": "Default",
          "typeName": "RequestBuilder"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/request-api/003-builder-default/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }
}
```

### Completion explanation

Deriving Default is idiomatic when every field already has the desired default. Option fields make the empty builder state explicit by starting as None.

### Author notes

Teaches builder-default through a focused, behavior-checked Rust micro-lesson.

---

## 16. Model an optional timeout

Source: `lessons/config-service/004-config-option-timeout`

| Field | Value |
| --- | --- |
| Lesson ID | `config-option-timeout-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-option-timeout-004) |
| Arc | Configure a small service (step 4 of 6) |
| Concept | Option modeling (`option-modeling`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Some deployments need a request timeout while others should inherit the platform default. The type should make that optionality explicit.

### Task

Add timeout_seconds: Option<u64> to Config. Use None in Default.

### Concept context

Represent optional configuration explicitly with Option.

- Prerequisites: `struct-field-design`
- Tags: `option`, `configuration`, `types`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-service/004-config-option-timeout/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
        }
    }
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }
}

// Continue from the previous lesson.
// TODO: add an optional timeout in seconds.
```

#### `tests/public.rs` — test

Source: `lessons/config-service/004-config-option-timeout/tests/public.rs`

```rust
use rust_daily_lesson::Config;

#[test]
fn timeout_is_explicitly_optional() {
    let default_config = Config::default();
    let configured = Config {
        timeout_seconds: Some(30),
        ..Config::default()
    };

    assert_eq!(default_config.timeout_seconds, None);
    assert_eq!(configured.timeout_seconds, Some(30));
}
```

### Progressive hints

1. Option<T> represents a value that may be present or absent.
2. A timeout expressed in seconds can be a u64.
3. None is clearer than a magic value such as 0 when no timeout is configured. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Config",
          "requiredFields": [
            {
              "name": "timeout_seconds",
              "typeIncludes": [
                "Option",
                "u64"
              ]
            }
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "timeout_seconds",
            "None"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-service/004-config-option-timeout/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
    pub timeout_seconds: Option<u64>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
            timeout_seconds: None,
        }
    }
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }
}
```

### Completion explanation

Option makes absence part of the type instead of encoding it with a sentinel value. Callers must handle both configured and not-configured cases.

### Author notes

Teaches option-modeling through a focused, behavior-checked Rust micro-lesson.

---

## 17. Make restock alerts scan-friendly

Source: `lessons/inventory-summary/004-clear-loop`

| Field | Value |
| --- | --- |
| Lesson ID | `inventory-clear-loop-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/inventory-clear-loop-004) |
| Arc | Summarize inventory (step 4 of 6) |
| Concept | Iterator judgment (`iterator-judgment`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Inventory operators need a short list of normalized restock alerts before a purchasing review. A dense iterator chain hides which notes are actionable.

### Task

Refactor the existing priority_restock_notes helper into a clearer shape. Use a small loop and named intermediate values so the restock alert rule is obvious.

### Concept context

Choose between loops and iterator chains based on readability.

- Prerequisites: `filter-map`, `fold-sum`
- Tags: `iterators`, `readability`, `refactoring`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/inventory-summary/004-clear-loop/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}

pub fn priority_restock_notes(notes: &[String]) -> Vec<String> {
    notes
        .iter()
        .map(|note| note.trim().to_lowercase())
        .filter(|note| !note.is_empty())
        .filter(|note| note.contains("urgent") || note.contains("stock"))
        .collect()
}

// Continue from the previous lesson.
// TODO: refactor priority_restock_notes so the restock alert rule is easy to scan.
```

#### `tests/public.rs` — test

Source: `lessons/inventory-summary/004-clear-loop/tests/public.rs`

```rust
use rust_daily_lesson::priority_restock_notes;

#[test]
fn keeps_restock_alert_notes_in_normalized_order() {
    let notes = vec![
        "  URGENT restock batteries ".to_owned(),
        "".to_owned(),
        "general reminder".to_owned(),
        "low STOCK on cables".to_owned(),
    ];

    assert_eq!(
        priority_restock_notes(&notes),
        vec![
            "urgent restock batteries".to_owned(),
            "low stock on cables".to_owned(),
        ]
    );
}
```

### Progressive hints

1. The goal is not always fewer lines.
2. Name booleans such as mentions_urgent, mentions_stock, and is_restock_alert if that makes the rule clearer.
3. A loop is idiomatic when each step deserves a name. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "priority_restock_notes",
          "requiredSignatureIncludes": [
            "Vec<String>"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "for note in notes",
            "mentions_urgent",
            "mentions_stock",
            "is_restock_alert"
          ],
          "forbiddenSnippets": [
            ".map(|note|",
            ".filter(|note|"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/inventory-summary/004-clear-loop/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}

pub fn priority_restock_notes(notes: &[String]) -> Vec<String> {
    let mut priority_notes = Vec::new();

    for note in notes {
        let normalized = note.trim().to_lowercase();
        if normalized.is_empty() {
            continue;
        }

        let mentions_urgent = normalized.contains("urgent");
        let mentions_stock = normalized.contains("stock");
        let is_restock_alert = mentions_urgent || mentions_stock;

        if is_restock_alert {
            priority_notes.push(normalized);
        }
    }

    priority_notes
}
```

### Completion explanation

Idiomatic Rust values clarity over using an iterator chain everywhere. The best shape is the one that makes the inventory rule easiest to verify during a review.

### Author notes

Teaches iterator-judgment through a focused, behavior-checked Rust micro-lesson.

---

## 18. Allow borrowed or owned messages

Source: `lessons/log-lines/004-message-cow`

| Field | Value |
| --- | --- |
| Lesson ID | `log-message-cow-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-message-cow-004) |
| Arc | Inspect log lines (step 4 of 5) |
| Concept | Cow strings (`cow-strings`) |
| Difficulty | advanced |
| Estimated time | 10 minutes |

### Scenario

Most log messages can be borrowed, but some normalized messages need owned text. Cow supports both without forcing allocation every time.

### Task

Keep the existing log view and level code, then define LogMessage<'a> with text: Cow<'a, str>. Import Cow from std::borrow.

### Concept context

Use Cow to support borrowed or owned string data.

- Prerequisites: `borrowed-fields`
- Tags: `cow`, `borrowing`, `ownership`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/log-lines/004-message-cow/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

pub fn alert_priority(level: LogLevel) -> u8 {
    match level {
        LogLevel::Info => 0,
        LogLevel::Warn => 1,
        LogLevel::Error => 2,
    }
}

// Continue from the previous lesson.
// TODO: import Cow and define LogMessage with text that can be borrowed or owned.
```

#### `tests/public.rs` — test

Source: `lessons/log-lines/004-message-cow/tests/public.rs`

```rust
use std::borrow::Cow;

use rust_daily_lesson::LogMessage;

#[test]
fn log_message_can_borrow_or_own_text() {
    let borrowed = LogMessage {
        text: Cow::Borrowed("started"),
    };
    let owned = LogMessage {
        text: Cow::Owned("normalized".to_owned()),
    };

    assert_eq!(borrowed.text, "started");
    assert_eq!(owned.text, "normalized");
}
```

### Progressive hints

1. Cow means clone-on-write and lives in std::borrow.
2. The borrowed form for text is str, so the field type is Cow<'a, str>.
3. This is useful when most data can be borrowed but a few cases need ownership. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "LogMessage",
          "requiredFields": [
            {
              "name": "text",
              "typeIncludes": [
                "Cow",
                "str"
              ]
            }
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "std::borrow::Cow",
            "Cow<'a, str>"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/log-lines/004-message-cow/solution/src/lib.rs`

```rust
use std::borrow::Cow;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

pub fn alert_priority(level: LogLevel) -> u8 {
    match level {
        LogLevel::Info => 0,
        LogLevel::Warn => 1,
        LogLevel::Error => 2,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogMessage<'a> {
    pub text: Cow<'a, str>,
}
```

### Completion explanation

Cow lets the API accept borrowed text by default while still supporting owned normalized messages. It avoids unnecessary allocation without giving up flexibility.

### Author notes

Teaches cow-strings through a focused, behavior-checked Rust micro-lesson.

---

## 19. Validate builder output

Source: `lessons/request-api/004-builder-result`

| Field | Value |
| --- | --- |
| Lesson ID | `request-builder-result-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/request-builder-result-004) |
| Arc | Build a request API (step 4 of 6) |
| Concept | Builder Result output (`builder-result`) |
| Difficulty | medium |
| Estimated time | 9 minutes |

### Scenario

A builder can be incomplete. build should report missing required fields instead of creating a bad Request.

### Task

Add a path setter, define BuildError with MissingMethod and MissingPath, and implement build so missing required fields return the matching error. A built Request should keep body as None for now.

### Concept context

Return Result from builders so incomplete state becomes a typed, recoverable error.

- Prerequisites: `builder-default`, `result-validation`
- Tags: `builder`, `result`, `validation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/request-api/004-builder-result/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }
}

// Continue from the previous lesson.
// TODO: add path, build, and specific BuildError variants.
```

#### `tests/public.rs` — test

Source: `lessons/request-api/004-builder-result/tests/public.rs`

```rust
use rust_daily_lesson::{BuildError, Request, RequestBuilder};

#[test]
fn builds_complete_request() {
    assert_eq!(
        RequestBuilder::new().method("GET").path("/health").build(),
        Ok(Request {
            method: "GET".to_owned(),
            path: "/health".to_owned(),
            body: None,
        })
    );
}

#[test]
fn reports_missing_fields() {
    assert_eq!(
        RequestBuilder::new().path("/health").build(),
        Err(BuildError::MissingMethod)
    );
    assert_eq!(
        RequestBuilder::new().method("GET").build(),
        Err(BuildError::MissingPath)
    );
}
```

### Progressive hints

1. The build method is where optional builder state becomes required request state.
2. ok_or can turn an Option into a Result with a specific missing-field error.
3. Bind method and path first, then return Ok(Request { method, path, body: None }). The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "BuildError",
          "requiredVariants": [
            "MissingMethod",
            "MissingPath"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "RequestBuilder",
          "methodName": "build",
          "requiredSignatureIncludes": [
            "Result<Request, BuildError>"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "ok_or(BuildError::MissingMethod)",
            "ok_or(BuildError::MissingPath)"
          ],
          "forbiddenSnippets": [
            "Incomplete",
            "unwrap",
            "expect",
            "panic!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/request-api/004-builder-result/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }

    pub fn path(mut self, path: impl Into<String>) -> Self {
        self.path = Some(path.into());
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

impl RequestBuilder {
    pub fn build(self) -> Result<Request, BuildError> {
        let method = self.method.ok_or(BuildError::MissingMethod)?;
        let path = self.path.ok_or(BuildError::MissingPath)?;

        Ok(Request {
            method,
            path,
            body: None,
        })
    }
}
```

### Completion explanation

Returning Result keeps invalid builder states from silently becoming invalid requests. Specific missing-field variants tell callers exactly what still needs to be set.

### Author notes

Teaches builder-result through a focused, behavior-checked Rust micro-lesson.

---

## 20. Preserve the ID parse source

Source: `lessons/parse-user/004-source-parse-int`

| Field | Value |
| --- | --- |
| Lesson ID | `source-parse-int-error-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/source-parse-int-error-004) |
| Arc | Parse a user from text (step 4 of 7) |
| Concept | Source errors (`error-source`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Invalid IDs come from ParseIntError. Keeping that source error helps diagnostics without giving up the typed ParseUserError API.

### Task

Change InvalidId so it stores ParseIntError. Update parse_user to pass the parse error through map_err instead of discarding it, and expose it from Error::source.

### Concept context

Preserve lower-level error values inside higher-level domain errors.

- Prerequisites: `error-trait`
- Tags: `errors`, `parsing`, `diagnostics`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/parse-user/004-source-parse-int/starter/src/lib.rs`

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId,
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(|_| ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId => write!(f, "invalid id"),
        }
    }
}

impl std::error::Error for ParseUserError {}

// Continue from the previous lesson.
// TODO: store ParseIntError in InvalidId and preserve it in parse_user.
```

#### `tests/public.rs` — test

Source: `lessons/parse-user/004-source-parse-int/tests/public.rs`

```rust
use std::error::Error;

use rust_daily_lesson::{parse_user, ParseUserError};

#[test]
fn preserves_parse_int_error_source_value() -> Result<(), String> {
    match parse_user("not-a-number,Ada,ada@example.com") {
        Err(ParseUserError::InvalidId(source)) => {
            assert!(source.to_string().contains("invalid digit"));
            Ok(())
        }
        other => Err(format!("unexpected parse result: {other:?}")),
    }
}

#[test]
fn exposes_parse_int_error_as_source() {
    let error = parse_user("not-a-number,Ada,ada@example.com").unwrap_err();

    assert!(error.source().is_some());
}
```

### Progressive hints

1. Tuple variants can carry the original error value.
2. map_err can pass a function or variant constructor when the types line up.
3. After the change, InvalidId should look like InvalidId(ParseIntError), and Error::source should return that inner error. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "InvalidId(ParseIntError)",
            "map_err(ParseUserError::InvalidId)",
            "fn source"
          ],
          "forbiddenSnippets": [
            "|_error| ParseUserError::InvalidId"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/parse-user/004-source-parse-int/solution/src/lib.rs`

```rust
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId(_) => write!(f, "invalid id"),
        }
    }
}

impl Error for ParseUserError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ParseUserError::InvalidId(error) => Some(error),
            ParseUserError::MissingId
            | ParseUserError::MissingName
            | ParseUserError::MissingEmail => None,
        }
    }
}
```

### Completion explanation

The parse error now keeps its original source and exposes it through Error::source. That keeps the high-level error useful while preserving details for logging and debugging.

### Author notes

Teaches error-source through a focused, behavior-checked Rust micro-lesson.

---

## 21. Return validation errors with Result

Source: `lessons/config-service/005-config-result-validate`

| Field | Value |
| --- | --- |
| Lesson ID | `config-result-validate-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-result-validate-005) |
| Arc | Configure a small service (step 5 of 6) |
| Concept | Result validation (`result-validation`) |
| Difficulty | medium |
| Estimated time | 9 minutes |

### Scenario

Configuration validation should explain what is wrong instead of returning a bare boolean.

### Task

Keep the Config fields from earlier lessons, including use_tls and timeout_seconds. Add ConfigError variants EmptyServiceUrl and ZeroConnections. Add Config::validate(&self) -> Result<(), ConfigError>.

### Concept context

Return typed validation failures instead of boolean success flags.

- Prerequisites: `option-modeling`, `error-enum-design`
- Tags: `result`, `errors`, `validation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-service/005-config-result-validate/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
    pub timeout_seconds: Option<u64>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
            timeout_seconds: None,
        }
    }
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }
}

// Continue from the previous lesson.
// TODO: add ConfigError and Config::validate.
```

#### `tests/public.rs` — test

Source: `lessons/config-service/005-config-result-validate/tests/public.rs`

```rust
use rust_daily_lesson::{Config, ConfigError};

#[test]
fn validate_reports_specific_failures() {
    assert_eq!(
        Config {
            service_url: String::new(),
            max_connections: 8,
            use_tls: true,
            timeout_seconds: Some(30),
        }
        .validate(),
        Err(ConfigError::EmptyServiceUrl)
    );
    assert_eq!(
        Config {
            service_url: "https://api.example.com".to_owned(),
            max_connections: 0,
            use_tls: true,
            timeout_seconds: Some(30),
        }
        .validate(),
        Err(ConfigError::ZeroConnections)
    );
}

#[test]
fn validate_accepts_valid_config_with_timeout() {
    assert_eq!(
        Config {
            service_url: "https://api.example.com".to_owned(),
            max_connections: 8,
            use_tls: true,
            timeout_seconds: Some(30),
        }
        .validate(),
        Ok(())
    );
}
```

### Progressive hints

1. Result<(), ConfigError> says success has no extra value, but failure is typed.
2. Use one variant for an empty URL and one for zero connections.
3. Return Ok(()) only after all validation checks pass. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Config",
          "requiredFields": [
            {
              "name": "service_url",
              "typeIncludes": [
                "String"
              ]
            },
            {
              "name": "max_connections",
              "typeIncludes": [
                "usize"
              ]
            },
            {
              "name": "use_tls",
              "typeIncludes": [
                "bool"
              ]
            },
            {
              "name": "timeout_seconds",
              "typeIncludes": [
                "Option",
                "u64"
              ]
            }
          ]
        },
        {
          "type": "enum_unit_variants",
          "enumName": "ConfigError",
          "requiredVariants": [
            "EmptyServiceUrl",
            "ZeroConnections"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Config",
          "methodName": "validate",
          "requiredSignatureIncludes": [
            "Result<(), ConfigError>"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-service/005-config-result-validate/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
    pub timeout_seconds: Option<u64>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
            timeout_seconds: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigError {
    EmptyServiceUrl,
    ZeroConnections,
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }

    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.service_url.is_empty() {
            return Err(ConfigError::EmptyServiceUrl);
        }

        if self.max_connections == 0 {
            return Err(ConfigError::ZeroConnections);
        }

        Ok(())
    }
}
```

### Completion explanation

Result gives callers a success or a specific reason for failure. That is more useful than a boolean once validation can fail in multiple ways.

### Author notes

Teaches result-validation through a focused, behavior-checked Rust micro-lesson.

---

## 22. Convert ParseIntError with From

Source: `lessons/parse-user/005-from-parse-int`

| Field | Value |
| --- | --- |
| Lesson ID | `from-parse-int-error-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/from-parse-int-error-005) |
| Arc | Parse a user from text (step 5 of 7) |
| Concept | From for errors (`from-error-conversion`) |
| Difficulty | medium |
| Estimated time | 7 minutes |

### Scenario

The parser has one low-level error that should become a ParseUserError. A From implementation makes that conversion reusable.

### Task

Implement From<ParseIntError> for ParseUserError by returning ParseUserError::InvalidId(error). Then use ? for the ID parse in parse_user.

### Concept context

Centralize conversion from a low-level error into a domain error.

- Prerequisites: `error-source`
- Tags: `from`, `errors`, `conversion`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/parse-user/005-from-parse-int/starter/src/lib.rs`

```rust
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(ParseUserError::InvalidId)?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId(_) => write!(f, "invalid id"),
        }
    }
}

impl Error for ParseUserError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ParseUserError::InvalidId(error) => Some(error),
            ParseUserError::MissingId
            | ParseUserError::MissingName
            | ParseUserError::MissingEmail => None,
        }
    }
}

// Continue from the previous lesson.
// TODO: implement From<ParseIntError> and use ? for ID parsing.
```

#### `tests/public.rs` — test

Source: `lessons/parse-user/005-from-parse-int/tests/public.rs`

```rust
use rust_daily_lesson::{parse_user, ParseUserError, User};

#[test]
fn parses_valid_user() {
    assert_eq!(
        parse_user("42,Ada,ada@example.com"),
        Ok(User {
            id: 42,
            name: "Ada".to_owned(),
            email: "ada@example.com".to_owned(),
        })
    );
}

#[test]
fn converts_parse_int_error() {
    assert!(matches!(
        parse_user("nope,Ada,ada@example.com"),
        Err(ParseUserError::InvalidId(_))
    ));
}
```

### Progressive hints

1. From<T> defines fn from(value: T) -> Self.
2. The body only needs to wrap the ParseIntError in the InvalidId variant.
3. This conversion lets parse_user use ? instead of spelling out map_err at the call site. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "From<ParseIntError>",
          "typeName": "ParseUserError"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "fn from",
            "ParseUserError::InvalidId",
            ".parse::<u64>()?"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/parse-user/005-from-parse-int/solution/src/lib.rs`

```rust
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

impl From<ParseIntError> for ParseUserError {
    fn from(error: ParseIntError) -> Self {
        ParseUserError::InvalidId(error)
    }
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text.parse::<u64>()?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId(_) => write!(f, "invalid id"),
        }
    }
}

impl Error for ParseUserError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ParseUserError::InvalidId(error) => Some(error),
            ParseUserError::MissingId
            | ParseUserError::MissingName
            | ParseUserError::MissingEmail => None,
        }
    }
}
```

### Completion explanation

From centralizes the low-level to high-level error conversion. Call sites can ask for ParseUserError without rewriting the wrapping logic each time.

### Author notes

Teaches from-error-conversion through a focused, behavior-checked Rust micro-lesson.

---

## 23. Make Inventory iterable

Source: `lessons/inventory-summary/005-intoiterator`

| Field | Value |
| --- | --- |
| Lesson ID | `inventory-intoiterator-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/inventory-intoiterator-005) |
| Arc | Summarize inventory (step 5 of 6) |
| Concept | IntoIterator (`intoiterator-wrapper`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A wrapper type can expose natural iteration while still owning its internal Vec.

### Task

The starter already defines Inventory with a private Vec<Item>. Implement IntoIterator for Inventory so consuming the wrapper yields Item values.

### Concept context

Expose natural iteration for an owning wrapper type.

- Prerequisites: `domain-structs`
- Tags: `intoiterator`, `collections`, `traits`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/inventory-summary/005-intoiterator/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}

pub fn priority_restock_notes(notes: &[String]) -> Vec<String> {
    let mut priority_notes = Vec::new();

    for note in notes {
        let normalized = note.trim().to_lowercase();
        if normalized.is_empty() {
            continue;
        }

        let mentions_urgent = normalized.contains("urgent");
        let mentions_stock = normalized.contains("stock");
        let is_restock_alert = mentions_urgent || mentions_stock;

        if is_restock_alert {
            priority_notes.push(normalized);
        }
    }

    priority_notes
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Inventory {
    items: Vec<Item>,
}

impl Inventory {
    pub fn new(items: Vec<Item>) -> Self {
        Self { items }
    }
}

// Continue from the previous lesson.
// TODO: implement IntoIterator for Inventory.
```

#### `tests/public.rs` — test

Source: `lessons/inventory-summary/005-intoiterator/tests/public.rs`

```rust
use rust_daily_lesson::{Inventory, Item};

#[test]
fn inventory_consumes_into_items() {
    let inventory = Inventory::new(vec![
        Item {
            sku: "keyboard".to_owned(),
            name: "Keyboard".to_owned(),
            quantity: 10,
            reserved: 0,
        },
        Item {
            sku: "mouse".to_owned(),
            name: "Mouse".to_owned(),
            quantity: 4,
            reserved: 0,
        },
    ]);
    let names: Vec<_> = inventory.into_iter().map(|item| item.name).collect();

    assert_eq!(names, vec!["Keyboard".to_owned(), "Mouse".to_owned()]);
}
```

### Progressive hints

1. Keep Inventory's items field private; the iterator can consume it from inside the impl.
2. Vec<Item> already has an into_iter method that consumes the vector.
3. The associated IntoIter type can reuse std::vec::IntoIter<Item>. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "IntoIterator",
          "typeName": "Inventory"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "type Item = Item",
            "std::vec::IntoIter<Item>"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/inventory-summary/005-intoiterator/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}

pub fn priority_restock_notes(notes: &[String]) -> Vec<String> {
    let mut priority_notes = Vec::new();

    for note in notes {
        let normalized = note.trim().to_lowercase();
        if normalized.is_empty() {
            continue;
        }

        let mentions_urgent = normalized.contains("urgent");
        let mentions_stock = normalized.contains("stock");
        let is_restock_alert = mentions_urgent || mentions_stock;

        if is_restock_alert {
            priority_notes.push(normalized);
        }
    }

    priority_notes
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Inventory {
    items: Vec<Item>,
}

impl Inventory {
    pub fn new(items: Vec<Item>) -> Self {
        Self { items }
    }
}

impl IntoIterator for Inventory {
    type Item = Item;
    type IntoIter = std::vec::IntoIter<Item>;

    fn into_iter(self) -> Self::IntoIter {
        self.items.into_iter()
    }
}
```

### Completion explanation

IntoIterator lets Inventory participate in for loops and iterator adapters without exposing its internal field as public API.

### Author notes

Teaches intoiterator-wrapper through a focused, behavior-checked Rust micro-lesson.

---

## 24. Check log filtering behavior

Source: `lessons/log-lines/005-filter-tests`

| Field | Value |
| --- | --- |
| Lesson ID | `log-filter-tests-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-filter-tests-005) |
| Arc | Inspect log lines (step 5 of 5) |
| Concept | Focused behavior checks (`focused-tests`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

The log viewer should keep high-priority entries and discard routine information when asked for alerts.

### Task

The starter already defines AlertEntry and alert_messages. Fill in the two test TODO blocks with checks for keeping Error and Warn entries while excluding Info entries.

### Concept context

Write compact examples for important inclusion and exclusion behavior.

- Prerequisites: `pattern-matching`, `filter-map`
- Tags: `tests`, `examples`, `quality`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/log-lines/005-filter-tests/starter/src/lib.rs`

```rust
use std::borrow::Cow;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

pub fn alert_priority(level: LogLevel) -> u8 {
    match level {
        LogLevel::Info => 0,
        LogLevel::Warn => 1,
        LogLevel::Error => 2,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogMessage<'a> {
    pub text: Cow<'a, str>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AlertEntry<'a> {
    pub level: LogLevel,
    pub message: LogMessage<'a>,
}

pub fn alert_messages<'a>(entries: &'a [AlertEntry<'a>]) -> Vec<&'a str> {
    entries
        .iter()
        .filter_map(|entry| match entry.level {
            LogLevel::Warn | LogLevel::Error => Some(entry.message.text.as_ref()),
            LogLevel::Info => None,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(level: LogLevel, message: &'static str) -> AlertEntry<'static> {
        AlertEntry {
            level,
            message: LogMessage {
                text: message.into(),
            },
        }
    }

    #[test]
    fn keeps_warning_and_error_messages() {
        // TODO: assert that warning and error messages are returned in order.
        todo!()
    }

    #[test]
    fn skips_info_messages() {
        // TODO: assert that info messages are not returned.
        todo!()
    }
}

// Continue from the previous lesson.
// TODO: fill in the two focused alert filter checks above.
```

#### `tests/public.rs` — test

Source: `lessons/log-lines/005-filter-tests/tests/public.rs`

```rust
use rust_daily_lesson::{alert_messages, AlertEntry, LogLevel, LogMessage};

fn entry(level: LogLevel, message: &'static str) -> AlertEntry<'static> {
    AlertEntry {
        level,
        message: LogMessage {
            text: message.into(),
        },
    }
}

#[test]
fn alert_filter_keeps_only_warnings_and_errors() {
    let entries = [
        entry(LogLevel::Info, "started"),
        entry(LogLevel::Warn, "slow response"),
        entry(LogLevel::Error, "write failed"),
    ];

    assert_eq!(
        alert_messages(&entries),
        vec!["slow response", "write failed"]
    );
}
```

### Progressive hints

1. Use the provided entry helper to build a small array of alert entries.
2. The first test should prove that warning and error messages are retained in order.
3. The second test should make the Info exclusion explicit. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "alert_messages",
          "requiredSignatureIncludes": [
            "Vec<&str>"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "assert_eq!",
            "LogLevel::Warn",
            "LogLevel::Error",
            "LogLevel::Info"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/log-lines/005-filter-tests/solution/src/lib.rs`

```rust
use std::borrow::Cow;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogEntry<'a> {
    pub level: &'a str,
    pub message: &'a str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogView<'a> {
    pub entries: &'a [LogEntry<'a>],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

pub fn alert_priority(level: LogLevel) -> u8 {
    match level {
        LogLevel::Info => 0,
        LogLevel::Warn => 1,
        LogLevel::Error => 2,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogMessage<'a> {
    pub text: Cow<'a, str>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AlertEntry<'a> {
    pub level: LogLevel,
    pub message: LogMessage<'a>,
}

pub fn alert_messages<'a>(entries: &'a [AlertEntry<'a>]) -> Vec<&'a str> {
    entries
        .iter()
        .filter_map(|entry| match entry.level {
            LogLevel::Warn | LogLevel::Error => Some(entry.message.text.as_ref()),
            LogLevel::Info => None,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(level: LogLevel, message: &'static str) -> AlertEntry<'static> {
        AlertEntry {
            level,
            message: LogMessage {
                text: message.into(),
            },
        }
    }

    #[test]
    fn keeps_warning_and_error_messages() {
        let entries = [
            entry(LogLevel::Warn, "slow response"),
            entry(LogLevel::Error, "write failed"),
        ];

        assert_eq!(
            alert_messages(&entries),
            vec!["slow response", "write failed"]
        );
    }

    #[test]
    fn skips_info_messages() {
        let entries = [
            entry(LogLevel::Info, "started"),
            entry(LogLevel::Warn, "slow response"),
        ];

        assert_eq!(alert_messages(&entries), vec!["slow response"]);
    }
}
```

### Completion explanation

Focused behavior checks document the alert filtering contract. They make the important inclusion and exclusion rules visible for the next reader.

### Author notes

Teaches focused-tests through a focused, behavior-checked Rust micro-lesson.

---

## 25. Convert RawRequest with TryFrom

Source: `lessons/request-api/005-builder-tryfrom`

| Field | Value |
| --- | --- |
| Lesson ID | `request-builder-tryfrom-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/request-builder-tryfrom-005) |
| Arc | Build a request API (step 5 of 6) |
| Concept | TryFrom for request data (`tryfrom-request`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A small input DTO can be converted into a validated Request using the same fallible conversion pattern as parser code.

### Task

The starter defines RawRequest with optional method, path, and body. Implement TryFrom<RawRequest> for Request, use BuildError as the associated error type, and preserve the optional body.

### Concept context

Convert a raw input type into a validated request with TryFrom.

- Prerequisites: `builder-result`, `tryfrom-user`
- Tags: `tryfrom`, `api-design`, `conversion`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/request-api/005-builder-tryfrom/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }

    pub fn path(mut self, path: impl Into<String>) -> Self {
        self.path = Some(path.into());
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

impl RequestBuilder {
    pub fn build(self) -> Result<Request, BuildError> {
        let method = self.method.ok_or(BuildError::MissingMethod)?;
        let path = self.path.ok_or(BuildError::MissingPath)?;

        Ok(Request {
            method,
            path,
            body: None,
        })
    }
}

pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
    pub body: Option<String>,
}

// Continue from the previous lesson.
// TODO: implement TryFrom<RawRequest> for Request.
```

#### `tests/public.rs` — test

Source: `lessons/request-api/005-builder-tryfrom/tests/public.rs`

```rust
use rust_daily_lesson::{BuildError, RawRequest, Request};

#[test]
fn converts_complete_raw_request() {
    assert_eq!(
        Request::try_from(RawRequest {
            method: Some("GET".to_owned()),
            path: Some("/health".to_owned()),
            body: Some("{}".to_owned()),
        }),
        Ok(Request {
            method: "GET".to_owned(),
            path: "/health".to_owned(),
            body: Some("{}".to_owned()),
        })
    );
}

#[test]
fn reports_missing_request_fields() {
    assert_eq!(
        Request::try_from(RawRequest {
            method: None,
            path: Some("/health".to_owned()),
            body: None,
        }),
        Err(BuildError::MissingMethod)
    );
    assert_eq!(
        Request::try_from(RawRequest {
            method: Some("GET".to_owned()),
            path: None,
            body: None,
        }),
        Err(BuildError::MissingPath)
    );
}
```

### Progressive hints

1. TryFrom is appropriate because RawRequest may be missing required data.
2. The associated Error type should be BuildError.
3. Use ok_or to extract required fields, then move value.body into the Request. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<RawRequest>",
          "typeName": "Request"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "type Error = BuildError",
            "fn try_from",
            "value.body"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/request-api/005-builder-tryfrom/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }

    pub fn path(mut self, path: impl Into<String>) -> Self {
        self.path = Some(path.into());
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

impl RequestBuilder {
    pub fn build(self) -> Result<Request, BuildError> {
        let method = self.method.ok_or(BuildError::MissingMethod)?;
        let path = self.path.ok_or(BuildError::MissingPath)?;

        Ok(Request {
            method,
            path,
            body: None,
        })
    }
}

pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
    pub body: Option<String>,
}

impl std::convert::TryFrom<RawRequest> for Request {
    type Error = BuildError;

    fn try_from(value: RawRequest) -> Result<Self, Self::Error> {
        let method = value.method.ok_or(BuildError::MissingMethod)?;
        let path = value.path.ok_or(BuildError::MissingPath)?;
        let body = value.body;

        Ok(Self { method, path, body })
    }
}
```

### Completion explanation

TryFrom turns a possibly incomplete input type into a validated domain type. The conversion API clearly communicates that failure is possible.

### Author notes

Teaches tryfrom-request through a focused, behavior-checked Rust micro-lesson.

---

## 26. Borrow config candidates

Source: `lessons/config-service/006-config-borrowed-key`

| Field | Value |
| --- | --- |
| Lesson ID | `config-borrowed-key-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-borrowed-key-006) |
| Arc | Configure a small service (step 6 of 6) |
| Concept | Borrowing in APIs (`borrowing-api`) |
| Difficulty | medium |
| Estimated time | 7 minutes |

### Scenario

Service startup has several candidate configs, such as environment, file, and defaults. The selector should find the first valid one without consuming the candidate list.

### Task

Keep the Config, ConfigError, and validate behavior from earlier lessons. Change first_valid_config so it takes configs: &[Config] and returns Option<&Config> borrowed from the candidate slice.

### Concept context

Avoid unnecessary ownership in read-only helper functions.

- Prerequisites: `methods-basic`
- Tags: `borrowing`, `api-design`, `strings`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-service/006-config-borrowed-key/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
    pub timeout_seconds: Option<u64>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
            timeout_seconds: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigError {
    EmptyServiceUrl,
    ZeroConnections,
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }

    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.service_url.is_empty() {
            return Err(ConfigError::EmptyServiceUrl);
        }

        if self.max_connections == 0 {
            return Err(ConfigError::ZeroConnections);
        }

        Ok(())
    }
}

pub fn first_valid_config(configs: Vec<Config>) -> Option<Config> {
    configs.into_iter().find(|config| config.validate().is_ok())
}

// Continue from the previous lesson.
// TODO: borrow the candidate slice and return a borrowed Config.
```

#### `tests/public.rs` — test

Source: `lessons/config-service/006-config-borrowed-key/tests/public.rs`

```rust
use rust_daily_lesson::{first_valid_config, Config, ConfigError};

#[test]
fn config_keeps_previous_arc_fields_and_validation() {
    let config = Config {
        service_url: "https://api.example.com".to_owned(),
        max_connections: 8,
        use_tls: true,
        timeout_seconds: Some(30),
    };

    assert!(config.use_tls);
    assert_eq!(config.timeout_seconds, Some(30));
    assert_eq!(config.validate(), Ok(()));

    let invalid = Config {
        service_url: String::new(),
        max_connections: 8,
        use_tls: true,
        timeout_seconds: Some(30),
    };

    assert_eq!(invalid.validate(), Err(ConfigError::EmptyServiceUrl));
}

#[test]
fn selects_first_valid_config_without_consuming_candidates() {
    let configs = vec![
        Config {
            service_url: String::new(),
            max_connections: 8,
            use_tls: true,
            timeout_seconds: Some(30),
        },
        Config {
            service_url: "https://admin.example.com".to_owned(),
            max_connections: 4,
            use_tls: true,
            timeout_seconds: Some(15),
        },
    ];

    let found = first_valid_config(&configs).expect("valid config should be found");

    assert!(std::ptr::eq(found, &configs[1]));
    assert_eq!(found.max_connections, 4);
    assert_eq!(found.timeout_seconds, Some(15));
    assert_eq!(configs.len(), 2);
}

#[test]
fn returns_none_when_no_candidate_is_valid() {
    let configs = vec![
        Config {
            service_url: String::new(),
            max_connections: 8,
            use_tls: true,
            timeout_seconds: Some(30),
        },
        Config {
            service_url: "https://admin.example.com".to_owned(),
            max_connections: 0,
            use_tls: true,
            timeout_seconds: Some(15),
        },
    ];

    assert_eq!(first_valid_config(&configs), None);
}
```

### Progressive hints

1. The function only needs to read candidate configs and call validate on each one.
2. Returning &Config lets startup keep ownership of all candidates while the caller inspects the selected one.
3. iter().find(...) can return the borrowed Config from the slice. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Config",
          "requiredFields": [
            {
              "name": "service_url",
              "typeIncludes": [
                "String"
              ]
            },
            {
              "name": "max_connections",
              "typeIncludes": [
                "usize"
              ]
            },
            {
              "name": "use_tls",
              "typeIncludes": [
                "bool"
              ]
            },
            {
              "name": "timeout_seconds",
              "typeIncludes": [
                "Option",
                "u64"
              ]
            }
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Config",
          "methodName": "validate",
          "requiredSignatureIncludes": [
            "Result<(), ConfigError>"
          ]
        },
        {
          "type": "enum_unit_variants",
          "enumName": "ConfigError",
          "requiredVariants": [
            "EmptyServiceUrl",
            "ZeroConnections"
          ]
        },
        {
          "type": "function_signature",
          "functionName": "first_valid_config",
          "requiredSignatureIncludes": [
            "configs: &[Config]",
            "Option<&Config>"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "validate().is_ok()"
          ],
          "forbiddenSnippets": [
            "configs: Vec<Config>",
            "Option<Config>",
            "configs.into_iter()"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-service/006-config-borrowed-key/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
    pub timeout_seconds: Option<u64>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
            timeout_seconds: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigError {
    EmptyServiceUrl,
    ZeroConnections,
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }

    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.service_url.is_empty() {
            return Err(ConfigError::EmptyServiceUrl);
        }

        if self.max_connections == 0 {
            return Err(ConfigError::ZeroConnections);
        }

        Ok(())
    }
}

pub fn first_valid_config(configs: &[Config]) -> Option<&Config> {
    configs.iter().find(|config| config.validate().is_ok())
}
```

### Completion explanation

Borrowing keeps startup selection lightweight. The caller keeps ownership of every Config candidate, and the selected Config is a reference into the existing slice.

### Author notes

Teaches borrowing-api by selecting the first valid Config from startup candidates.

The important design choice is that first_valid_config takes &[Config] and
returns Option<&Config>. Startup code often wants to inspect env/file/default
candidates without consuming or cloning the candidate list.

---

## 27. Sort items by borrowed comparison

Source: `lessons/inventory-summary/006-sort-by-name`

| Field | Value |
| --- | --- |
| Lesson ID | `inventory-sort-by-key-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/inventory-sort-by-key-006) |
| Arc | Summarize inventory (step 6 of 6) |
| Concept | Borrowed sort comparisons (`sort-by-key`) |
| Difficulty | easy |
| Estimated time | 5 minutes |

### Scenario

Before rendering an inventory table, the service wants stable alphabetical ordering by item name without allocating temporary sort keys.

### Task

Add sort_by_name without cloning item names. Sort the mutable slice by comparing each item's borrowed name.

### Concept context

Sort slices by comparing borrowed fields when cloning a key would be wasteful.

- Prerequisites: `domain-structs`
- Tags: `collections`, `sorting`, `borrowing`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/inventory-summary/006-sort-by-name/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}

pub fn priority_restock_notes(notes: &[String]) -> Vec<String> {
    let mut priority_notes = Vec::new();

    for note in notes {
        let normalized = note.trim().to_lowercase();
        if normalized.is_empty() {
            continue;
        }

        let mentions_urgent = normalized.contains("urgent");
        let mentions_stock = normalized.contains("stock");
        let is_restock_alert = mentions_urgent || mentions_stock;

        if is_restock_alert {
            priority_notes.push(normalized);
        }
    }

    priority_notes
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Inventory {
    items: Vec<Item>,
}

impl Inventory {
    pub fn new(items: Vec<Item>) -> Self {
        Self { items }
    }
}

impl IntoIterator for Inventory {
    type Item = Item;
    type IntoIter = std::vec::IntoIter<Item>;

    fn into_iter(self) -> Self::IntoIter {
        self.items.into_iter()
    }
}

// Continue from the previous lesson.
// TODO: sort by borrowed item names without cloning.
```

#### `tests/public.rs` — test

Source: `lessons/inventory-summary/006-sort-by-name/tests/public.rs`

```rust
use rust_daily_lesson::{sort_by_name, Item};

#[test]
fn sorts_items_by_name() {
    let mut items = vec![
        Item {
            sku: "mouse".to_owned(),
            name: "Mouse".to_owned(),
            quantity: 4,
            reserved: 0,
        },
        Item {
            sku: "keyboard".to_owned(),
            name: "Keyboard".to_owned(),
            quantity: 10,
            reserved: 0,
        },
    ];

    sort_by_name(&mut items);

    assert_eq!(items[0].name, "Keyboard");
    assert_eq!(items[1].name, "Mouse");
}
```

### Progressive hints

1. Slices expose in-place sorting methods.
2. For String fields, sort_by with name.cmp(&other.name) avoids allocating cloned keys.
3. The comparison closure receives two item references: left and right. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "sort_by_name",
          "requiredSignatureIncludes": [
            "&mut [Item]"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "sort_by",
            ".cmp(&"
          ],
          "forbiddenSnippets": [
            "clone",
            "to_owned",
            "to_string",
            "sort_by_key"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/inventory-summary/006-sort-by-name/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}

pub fn priority_restock_notes(notes: &[String]) -> Vec<String> {
    let mut priority_notes = Vec::new();

    for note in notes {
        let normalized = note.trim().to_lowercase();
        if normalized.is_empty() {
            continue;
        }

        let mentions_urgent = normalized.contains("urgent");
        let mentions_stock = normalized.contains("stock");
        let is_restock_alert = mentions_urgent || mentions_stock;

        if is_restock_alert {
            priority_notes.push(normalized);
        }
    }

    priority_notes
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Inventory {
    items: Vec<Item>,
}

impl Inventory {
    pub fn new(items: Vec<Item>) -> Self {
        Self { items }
    }
}

impl IntoIterator for Inventory {
    type Item = Item;
    type IntoIter = std::vec::IntoIter<Item>;

    fn into_iter(self) -> Self::IntoIter {
        self.items.into_iter()
    }
}

pub fn sort_by_name(items: &mut [Item]) {
    items.sort_by(|left, right| left.name.cmp(&right.name));
}
```

### Completion explanation

Sorting by borrowed comparison keeps the ordering rule close to the sort call without cloning every String. That is usually the better API choice when the key is already stored in each item.

### Author notes

Teaches sort-by-key through a focused, behavior-checked Rust micro-lesson.

---

## 28. Document the request builder

Source: `lessons/request-api/006-doc-example`

| Field | Value |
| --- | --- |
| Lesson ID | `request-doc-example-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/request-doc-example-006) |
| Arc | Build a request API (step 6 of 6) |
| Concept | Documentation examples (`doc-examples`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

The request API is small enough that one doc example can show its intended usage better than a long paragraph.

### Task

Add a short doc comment example above RequestBuilder. Show creating a builder, setting method and path, and checking the Result from build without unwrap or expect.

### Concept context

Write doc examples that show fallible APIs without unwrap or expect.

- Prerequisites: `tryfrom-request`
- Tags: `docs`, `examples`, `api-design`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/request-api/006-doc-example/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }

    pub fn path(mut self, path: impl Into<String>) -> Self {
        self.path = Some(path.into());
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

impl RequestBuilder {
    pub fn build(self) -> Result<Request, BuildError> {
        let method = self.method.ok_or(BuildError::MissingMethod)?;
        let path = self.path.ok_or(BuildError::MissingPath)?;

        Ok(Request {
            method,
            path,
            body: None,
        })
    }
}

pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
    pub body: Option<String>,
}

impl std::convert::TryFrom<RawRequest> for Request {
    type Error = BuildError;

    fn try_from(value: RawRequest) -> Result<Self, Self::Error> {
        let method = value.method.ok_or(BuildError::MissingMethod)?;
        let path = value.path.ok_or(BuildError::MissingPath)?;
        let body = value.body;

        Ok(Self { method, path, body })
    }
}

// Continue from the previous lesson.
// TODO: add a doc comment example above RequestBuilder.
```

#### `tests/public.rs` — test

Source: `lessons/request-api/006-doc-example/tests/public.rs`

```rust
use rust_daily_lesson::{Request, RequestBuilder};

#[test]
fn documented_builder_flow_works() {
    assert_eq!(
        RequestBuilder::default()
            .method("GET")
            .path("/health")
            .build(),
        Ok(Request {
            method: "GET".to_owned(),
            path: "/health".to_owned(),
            body: None,
        })
    );
}
```

### Progressive hints

1. Doc comments use /// before the item they describe.
2. A compact example should show the normal path and assert on the Result instead of unwrapping it.
3. Keep the example focused on how a caller should read the API. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "///",
            "RequestBuilder::default()",
            "assert_eq!"
          ],
          "forbiddenSnippets": [
            ".unwrap()",
            ".expect(",
            "panic!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/request-api/006-doc-example/solution/src/lib.rs`

````rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub body: Option<String>,
}

/// Builds a request from chainable setters.
///
/// ```
/// use rust_daily_lesson::{Request, RequestBuilder};
///
/// let request = RequestBuilder::default()
///     .method("GET")
///     .path("/health")
///     .build();
///
/// assert_eq!(
///     request,
///     Ok(Request {
///         method: "GET".to_owned(),
///         path: "/health".to_owned(),
///         body: None,
///     })
/// );
/// ```
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RequestBuilder {
    method: Option<String>,
    path: Option<String>,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn method(mut self, method: impl Into<String>) -> Self {
        self.method = Some(method.into());
        self
    }

    pub fn path(mut self, path: impl Into<String>) -> Self {
        self.path = Some(path.into());
        self
    }

    pub fn build(self) -> Result<Request, BuildError> {
        let method = self.method.ok_or(BuildError::MissingMethod)?;
        let path = self.path.ok_or(BuildError::MissingPath)?;

        Ok(Request {
            method,
            path,
            body: None,
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildError {
    MissingMethod,
    MissingPath,
}

pub struct RawRequest {
    pub method: Option<String>,
    pub path: Option<String>,
    pub body: Option<String>,
}

impl std::convert::TryFrom<RawRequest> for Request {
    type Error = BuildError;

    fn try_from(value: RawRequest) -> Result<Self, Self::Error> {
        let method = value.method.ok_or(BuildError::MissingMethod)?;
        let path = value.path.ok_or(BuildError::MissingPath)?;
        let body = value.body;

        Ok(Self { method, path, body })
    }
}
````

### Completion explanation

A doc example teaches the API at the point of use. Showing Result-aware usage keeps the documentation aligned with fallible, production-style builder APIs.

### Author notes

Teaches doc-examples through a focused, behavior-checked Rust micro-lesson.

---

## 29. Parse User with TryFrom

Source: `lessons/parse-user/006-tryfrom-user-str`

| Field | Value |
| --- | --- |
| Lesson ID | `tryfrom-user-str-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/tryfrom-user-str-006) |
| Arc | Parse a user from text (step 6 of 7) |
| Concept | TryFrom for parsing (`tryfrom-user`) |
| Difficulty | medium |
| Estimated time | 9 minutes |

### Scenario

Parsing a User from text is a fallible conversion. TryFrom<&str> gives callers a standard API for that operation.

### Task

Implement TryFrom<&str> for User. Set type Error to ParseUserError and delegate to parse_user.

### Concept context

Represent fallible text-to-domain conversion with TryFrom.

- Prerequisites: `from-error-conversion`
- Tags: `tryfrom`, `parsing`, `conversion`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/parse-user/006-tryfrom-user-str/starter/src/lib.rs`

```rust
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

impl From<ParseIntError> for ParseUserError {
    fn from(error: ParseIntError) -> Self {
        ParseUserError::InvalidId(error)
    }
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text.parse::<u64>()?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId(_) => write!(f, "invalid id"),
        }
    }
}

impl Error for ParseUserError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ParseUserError::InvalidId(error) => Some(error),
            ParseUserError::MissingId
            | ParseUserError::MissingName
            | ParseUserError::MissingEmail => None,
        }
    }
}

// Continue from the previous lesson.
// TODO: implement TryFrom<&str> for User.
```

#### `tests/public.rs` — test

Source: `lessons/parse-user/006-tryfrom-user-str/tests/public.rs`

```rust
use rust_daily_lesson::{ParseUserError, User};

#[test]
fn tryfrom_parses_valid_user() {
    assert_eq!(
        User::try_from("42,Ada,ada@example.com"),
        Ok(User {
            id: 42,
            name: "Ada".to_owned(),
            email: "ada@example.com".to_owned(),
        })
    );
}

#[test]
fn tryfrom_returns_parse_errors() {
    assert_eq!(User::try_from(""), Err(ParseUserError::MissingId));
    assert_eq!(User::try_from("42,Ada"), Err(ParseUserError::MissingEmail));
}
```

### Progressive hints

1. TryFrom uses an associated Error type.
2. The conversion method is try_from(value: &str) -> Result<Self, Self::Error>.
3. Delegate to the existing parser so this lesson adds a standard API without duplicating parser logic. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<&str>",
          "typeName": "User"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "type Error = ParseUserError",
            "fn try_from",
            "parse_user(value)"
          ],
          "forbiddenSnippets": [
            "panic!",
            ".unwrap()",
            ".expect("
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/parse-user/006-tryfrom-user-str/solution/src/lib.rs`

```rust
use std::convert::TryFrom;
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

impl From<ParseIntError> for ParseUserError {
    fn from(error: ParseIntError) -> Self {
        ParseUserError::InvalidId(error)
    }
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text.parse::<u64>()?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl TryFrom<&str> for User {
    type Error = ParseUserError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        parse_user(value)
    }
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId(_) => write!(f, "invalid id"),
        }
    }
}

impl Error for ParseUserError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ParseUserError::InvalidId(error) => Some(error),
            ParseUserError::MissingId
            | ParseUserError::MissingName
            | ParseUserError::MissingEmail => None,
        }
    }
}
```

### Completion explanation

TryFrom communicates that parsing can fail and gives callers a standard conversion shape. Delegating keeps one parsing implementation instead of two drifting copies.

### Author notes

Teaches tryfrom-user through a focused, behavior-checked Rust micro-lesson.

---

## 30. Write parser behavior checks

Source: `lessons/parse-user/007-public-tests`

| Field | Value |
| --- | --- |
| Lesson ID | `parse-user-public-tests-007` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/parse-user-public-tests-007) |
| Arc | Parse a user from text (step 7 of 7) |
| Concept | Basic behavior checks (`basic-tests`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

The parser arc ends with examples that document success and failure behavior for future maintainers.

### Task

Fill in the two TODO blocks with one success check and one failure check. Use assert_eq! and matches! or a match expression; do not use unwrap or expect.

### Concept context

Write focused examples that document success and failure behavior.

- Prerequisites: `tryfrom-user`
- Tags: `tests`, `examples`, `quality`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/parse-user/007-public-tests/starter/src/lib.rs`

```rust
use std::convert::TryFrom;
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

impl From<ParseIntError> for ParseUserError {
    fn from(error: ParseIntError) -> Self {
        ParseUserError::InvalidId(error)
    }
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text.parse::<u64>()?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl TryFrom<&str> for User {
    type Error = ParseUserError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        parse_user(value)
    }
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId(_) => write!(f, "invalid id"),
        }
    }
}

impl Error for ParseUserError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ParseUserError::InvalidId(error) => Some(error),
            ParseUserError::MissingId
            | ParseUserError::MissingName
            | ParseUserError::MissingEmail => None,
        }
    }
}

// Continue from the previous lesson.
// TODO: assert that a complete input returns the expected User.
// TODO: assert that an input without email returns MissingEmail.
```

#### `tests/public.rs` — test

Source: `lessons/parse-user/007-public-tests/tests/public.rs`

```rust
use rust_daily_lesson::{parse_user, ParseUserError, User};

#[test]
fn parser_still_behaves_as_documented() {
    assert_eq!(
        parse_user("7,Grace,grace@example.com"),
        Ok(User {
            id: 7,
            name: "Grace".to_owned(),
            email: "grace@example.com".to_owned(),
        })
    );
    assert_eq!(parse_user("7,Grace"), Err(ParseUserError::MissingEmail));
}
```

### Progressive hints

1. A useful success example compares the full Ok(User { ... }) value.
2. A useful failure example checks the exact error variant, not just that an error happened.
3. matches!(result, Err(ParseUserError::MissingEmail)) is a compact shape for the failure case. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "assert_eq!",
            "matches!",
            "ParseUserError::MissingEmail"
          ],
          "forbiddenSnippets": [
            ".unwrap()",
            ".expect(",
            "panic!",
            "unimplemented!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/parse-user/007-public-tests/solution/src/lib.rs`

```rust
use std::convert::TryFrom;
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

impl From<ParseIntError> for ParseUserError {
    fn from(error: ParseIntError) -> Self {
        ParseUserError::InvalidId(error)
    }
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text.parse::<u64>()?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl TryFrom<&str> for User {
    type Error = ParseUserError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        parse_user(value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_valid_user() {
        assert_eq!(
            parse_user("42,Ada,ada@example.com"),
            Ok(User {
                id: 42,
                name: "Ada".to_owned(),
                email: "ada@example.com".to_owned(),
            })
        );
    }

    #[test]
    fn rejects_missing_email() {
        assert!(matches!(
            parse_user("42,Ada"),
            Err(ParseUserError::MissingEmail)
        ));
    }
}

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId(_) => write!(f, "invalid id"),
        }
    }
}

impl Error for ParseUserError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ParseUserError::InvalidId(error) => Some(error),
            ParseUserError::MissingId
            | ParseUserError::MissingName
            | ParseUserError::MissingEmail => None,
        }
    }
}
```

### Completion explanation

Focused behavior checks turn the parser contract into executable examples for humans and future tooling. They show both the happy path and the important failure shape.

### Author notes

Teaches basic-tests through a focused, behavior-checked Rust micro-lesson.

---

## 31. Hide EmailAddress internals

Source: `lessons/email-address-value-object/001-private-field`

| Field | Value |
| --- | --- |
| Lesson ID | `email-address-private-field-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/email-address-private-field-001) |
| Arc | Email address value object (step 1 of 6) |
| Concept | Private domain fields (`email-address-private-field`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

An email address should eventually be validated before callers can create one. Start by making the domain type own its text without exposing the field.

### Task

Replace the TODO with a private value: String field on EmailAddress.

### Concept context

Hide representation details so construction can preserve domain invariants.

- Prerequisites: `domain-structs`
- Tags: `domain`, `types`, `architecture`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/email-address-value-object/001-private-field/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    // TODO: store the email text privately.
}
```

#### `tests/public.rs` — test

Source: `lessons/email-address-value-object/001-private-field/tests/public.rs`

```rust
use rust_daily_lesson::EmailAddress;

#[test]
fn email_address_is_a_public_domain_type() {
    let _ = core::mem::size_of::<EmailAddress>();
}
```

### Progressive hints

1. The field should live inside EmailAddress, but callers should not set it directly.
2. Use a named struct field with type String. Leave off pub so construction can be controlled later.
3. A canonical solution keeps the representation private. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "EmailAddress",
          "requiredFields": [
            {
              "name": "value",
              "typeIncludes": [
                "String"
              ]
            }
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "struct EmailAddress"
          ],
          "forbiddenSnippets": [
            "pub value"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "direct-field-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/direct_field_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### direct-field-construction

Source: `lessons/email-address-value-object/001-private-field/compile_fail/direct_field_construction.rs`

```rust
use rust_daily_lesson::EmailAddress;

fn main() {
    let _ = EmailAddress { value: String::from("ada@example.com") };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/email-address-value-object/001-private-field/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}
```

### Completion explanation

A private field lets EmailAddress own its text while reserving construction for validating APIs. That is the first step toward making invalid email values harder to represent.

### Author notes

The point is private representation, not validation yet. The public type can be named and moved around, but callers cannot construct arbitrary values through public fields.

---

## 32. Validate EmailAddress with TryFrom

Source: `lessons/email-address-value-object/002-tryfrom-str`

| Field | Value |
| --- | --- |
| Lesson ID | `email-address-tryfrom-str-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/email-address-tryfrom-str-002) |
| Arc | Email address value object (step 2 of 6) |
| Concept | TryFrom for domain validation (`tryfrom-email-address`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Raw text from forms and APIs should become an EmailAddress only after validation. This is a fallible conversion.

### Task

Add EmailAddress::as_str, then implement TryFrom<&str> for EmailAddress. Reject an empty string with Empty and text without @ with MissingAt.

### Concept context

Use TryFrom to convert raw text into a validated domain value.

- Prerequisites: `email-address-private-field`, `tryfrom-user`
- Tags: `domain`, `conversion`, `tryfrom`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/email-address-value-object/002-tryfrom-str/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

// Continue from the previous lesson.
// TODO: implement TryFrom<&str> for EmailAddress.
```

#### `tests/public.rs` — test

Source: `lessons/email-address-value-object/002-tryfrom-str/tests/public.rs`

```rust
use rust_daily_lesson::{EmailAddress, EmailValidationError};

#[test]
fn accepts_text_with_at_sign() -> Result<(), EmailValidationError> {
    let email = EmailAddress::try_from("ada@example.com")?;

    assert_eq!(email.as_str(), "ada@example.com");

    Ok(())
}

#[test]
fn rejects_empty_text() {
    assert_eq!(EmailAddress::try_from(""), Err(EmailValidationError::Empty));
}

#[test]
fn rejects_text_without_at_sign() {
    assert_eq!(
        EmailAddress::try_from("ada.example.com"),
        Err(EmailValidationError::MissingAt)
    );
}
```

### Progressive hints

1. The conversion can fail, so the return type should be Result<Self, Self::Error>.
2. TryFrom has an associated Error type. Set it to EmailValidationError and return Self with a private value on success.
3. A canonical solution validates before constructing EmailAddress. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<&str>",
          "typeName": "EmailAddress"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "type Error = EmailValidationError",
            "fn try_from"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "direct-field-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/direct_field_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### direct-field-construction

Source: `lessons/email-address-value-object/002-tryfrom-str/compile_fail/direct_field_construction.rs`

```rust
use rust_daily_lesson::EmailAddress;

fn main() {
    let _ = EmailAddress { value: String::from("ada@example.com") };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/email-address-value-object/002-tryfrom-str/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        if !value.contains('@') {
            return Err(EmailValidationError::MissingAt);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}
```

### Completion explanation

TryFrom makes validation part of the standard conversion API. Callers can use EmailAddress::try_from or try_into without learning a custom constructor name.

### Author notes

This lesson intentionally teaches `TryFrom<&str>` instead of a custom `new` function. The value object is constructed only after validation, and callers get the standard conversion API.

---

## 33. Name the missing domain case

Source: `lessons/email-address-value-object/003-domain-error`

| Field | Value |
| --- | --- |
| Lesson ID | `email-address-domain-error-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/email-address-domain-error-003) |
| Arc | Email address value object (step 3 of 6) |
| Concept | Typed validation errors (`email-validation-error`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

An address with @ but no domain should not be accepted. The error type should name that failure instead of reusing a vague variant.

### Task

Add MissingDomain to EmailValidationError and update TryFrom<&str> so text ending with @ returns that variant.

### Concept context

Name distinct validation failures with an enum instead of string errors.

- Prerequisites: `tryfrom-email-address`, `error-enum-design`
- Tags: `domain`, `errors`, `validation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/email-address-value-object/003-domain-error/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        if !value.contains('@') {
            return Err(EmailValidationError::MissingAt);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

// Continue from the previous lesson.
// TODO: add MissingDomain and reject email text that ends with @.
```

#### `tests/public.rs` — test

Source: `lessons/email-address-value-object/003-domain-error/tests/public.rs`

```rust
use rust_daily_lesson::{EmailAddress, EmailValidationError};

#[test]
fn rejects_missing_domain() {
    assert_eq!(
        EmailAddress::try_from("ada@"),
        Err(EmailValidationError::MissingDomain)
    );
}

#[test]
fn keeps_other_validation_cases_specific() {
    assert_eq!(EmailAddress::try_from(""), Err(EmailValidationError::Empty));
    assert_eq!(
        EmailAddress::try_from("ada.example.com"),
        Err(EmailValidationError::MissingAt)
    );
}
```

### Progressive hints

1. The enum should have one variant for each failure mode callers may handle differently.
2. Use split_once('@') or another clear check to see whether any text exists after @.
3. A canonical solution adds a variant and checks the domain part before constructing the value. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "EmailValidationError",
          "requiredVariants": [
            "Empty",
            "MissingAt",
            "MissingDomain"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "MissingDomain"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "direct-field-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/direct_field_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### direct-field-construction

Source: `lessons/email-address-value-object/003-domain-error/compile_fail/direct_field_construction.rs`

```rust
use rust_daily_lesson::EmailAddress;

fn main() {
    let _ = EmailAddress { value: String::from("ada@example.com") };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/email-address-value-object/003-domain-error/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        let (_local, domain) = value
            .split_once('@')
            .ok_or(EmailValidationError::MissingAt)?;

        if domain.is_empty() {
            return Err(EmailValidationError::MissingDomain);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}
```

### Completion explanation

A distinct MissingDomain variant keeps validation errors programmatic. Callers can match the exact case without parsing message text.

### Author notes

This lesson is about typed error granularity. The validation rule is intentionally simple; the important part is not collapsing distinct domain failures into one string or catch-all variant.

---

## 34. Format EmailAddress with Display

Source: `lessons/email-address-value-object/004-display-value`

| Field | Value |
| --- | --- |
| Lesson ID | `email-address-display-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/email-address-display-004) |
| Arc | Email address value object (step 4 of 6) |
| Concept | Display for value objects (`display-email-address`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Callers should be able to print an EmailAddress without reaching into its private field.

### Task

Implement std::fmt::Display for EmailAddress by writing the stored email text.

### Concept context

Format a domain value through its public representation.

- Prerequisites: `email-address-private-field`, `display-parse-error`
- Tags: `domain`, `display`, `traits`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/email-address-value-object/004-display-value/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        let (_local, domain) = value
            .split_once('@')
            .ok_or(EmailValidationError::MissingAt)?;

        if domain.is_empty() {
            return Err(EmailValidationError::MissingDomain);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

// Continue from the previous lesson.
// TODO: implement std::fmt::Display for EmailAddress.
```

#### `tests/public.rs` — test

Source: `lessons/email-address-value-object/004-display-value/tests/public.rs`

```rust
use rust_daily_lesson::{EmailAddress, EmailValidationError};

#[test]
fn display_uses_the_email_text() -> Result<(), EmailValidationError> {
    let email = EmailAddress::try_from("ada@example.com")?;

    assert_eq!(email.to_string(), "ada@example.com");

    Ok(())
}
```

### Progressive hints

1. Display receives &self and a formatter. It should not consume the domain value.
2. Use write!(f, "{}", self.value) inside fmt.
3. A canonical solution delegates formatting to the private string. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::fmt::Display",
          "typeName": "EmailAddress"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "fn fmt",
            "write!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "direct-field-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/direct_field_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### direct-field-construction

Source: `lessons/email-address-value-object/004-display-value/compile_fail/direct_field_construction.rs`

```rust
use rust_daily_lesson::EmailAddress;

fn main() {
    let _ = EmailAddress { value: String::from("ada@example.com") };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/email-address-value-object/004-display-value/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        let (_local, domain) = value
            .split_once('@')
            .ok_or(EmailValidationError::MissingAt)?;

        if domain.is_empty() {
            return Err(EmailValidationError::MissingDomain);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

impl std::fmt::Display for EmailAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}
```

### Completion explanation

Display exposes the public text representation without making the field public or adding unchecked construction paths. The type keeps its validation boundary while still fitting normal formatting APIs.

### Author notes

This lesson keeps the field private. The public formatting surface is the `Display` implementation, which is the standard trait callers expect for human-readable values.

---

## 35. Format validation errors

Source: `lessons/email-address-value-object/005-error-display`

| Field | Value |
| --- | --- |
| Lesson ID | `email-validation-error-display-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/email-validation-error-display-005) |
| Arc | Email address value object (step 5 of 6) |
| Concept | Display and Error for validation errors (`display-email-validation-error`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

EmailValidationError is useful to match on, but logs and UI messages need human-readable text.

### Task

Implement Display for EmailValidationError and then implement std::error::Error for it.

### Concept context

Make typed validation errors useful to humans and standard error APIs.

- Prerequisites: `email-validation-error`, `error-trait`
- Tags: `errors`, `display`, `traits`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/email-address-value-object/005-error-display/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        let (_local, domain) = value
            .split_once('@')
            .ok_or(EmailValidationError::MissingAt)?;

        if domain.is_empty() {
            return Err(EmailValidationError::MissingDomain);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

impl std::fmt::Display for EmailAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}

// Continue from the previous lesson.
// TODO: implement Display for EmailValidationError.
// TODO: implement std::error::Error for EmailValidationError.
```

#### `tests/public.rs` — test

Source: `lessons/email-address-value-object/005-error-display/tests/public.rs`

```rust
use rust_daily_lesson::EmailValidationError;

fn assert_error<E: std::error::Error>() {}

#[test]
fn validation_error_is_a_standard_error() {
    assert_error::<EmailValidationError>();
}

#[test]
fn display_messages_are_human_readable() {
    assert_eq!(
        EmailValidationError::Empty.to_string(),
        "email address is empty"
    );
    assert_eq!(
        EmailValidationError::MissingAt.to_string(),
        "email address is missing @"
    );
    assert_eq!(
        EmailValidationError::MissingDomain.to_string(),
        "email address is missing a domain"
    );
}
```

### Progressive hints

1. Keep the enum variants programmatic. Display is where human-facing text belongs.
2. Match on self inside fmt. The Error implementation can be empty once Debug and Display exist.
3. A canonical solution gives every variant its own message and marks the enum as a standard error. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::fmt::Display",
          "typeName": "EmailValidationError"
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "std::error::Error",
          "typeName": "EmailValidationError"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "direct-field-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/direct_field_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### direct-field-construction

Source: `lessons/email-address-value-object/005-error-display/compile_fail/direct_field_construction.rs`

```rust
use rust_daily_lesson::EmailAddress;

fn main() {
    let _ = EmailAddress { value: String::from("ada@example.com") };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/email-address-value-object/005-error-display/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        let (_local, domain) = value
            .split_once('@')
            .ok_or(EmailValidationError::MissingAt)?;

        if domain.is_empty() {
            return Err(EmailValidationError::MissingDomain);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

impl std::fmt::Display for EmailAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}

impl std::fmt::Display for EmailValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Empty => write!(f, "email address is empty"),
            Self::MissingAt => write!(f, "email address is missing @"),
            Self::MissingDomain => write!(f, "email address is missing a domain"),
        }
    }
}

impl std::error::Error for EmailValidationError {}
```

### Completion explanation

Display keeps user-facing text separate from programmatic error variants. Implementing Error lets the validation error fit standard Rust error APIs.

### Author notes

The messages are intentionally tested here because this lesson is about the `Display` contract. Later lessons can avoid exact message testing when text is not the concept.

---

## 36. Parse EmailAddress with FromStr

Source: `lessons/email-address-value-object/006-fromstr`

| Field | Value |
| --- | --- |
| Lesson ID | `email-address-fromstr-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/email-address-fromstr-006) |
| Arc | Email address value object (step 6 of 6) |
| Concept | FromStr for string parsing (`fromstr-email-address`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Once a domain type can validate &str input, callers also expect the standard string parsing API.

### Task

Implement std::str::FromStr for EmailAddress. Reuse EmailAddress::try_from instead of duplicating validation.

### Concept context

Expose string parsing through the standard FromStr trait while reusing TryFrom validation.

- Prerequisites: `tryfrom-email-address`
- Tags: `conversion`, `fromstr`, `domain`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/email-address-value-object/006-fromstr/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        let (_local, domain) = value
            .split_once('@')
            .ok_or(EmailValidationError::MissingAt)?;

        if domain.is_empty() {
            return Err(EmailValidationError::MissingDomain);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

impl std::fmt::Display for EmailAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}

impl std::fmt::Display for EmailValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Empty => write!(f, "email address is empty"),
            Self::MissingAt => write!(f, "email address is missing @"),
            Self::MissingDomain => write!(f, "email address is missing a domain"),
        }
    }
}

impl std::error::Error for EmailValidationError {}

// Continue from the previous lesson.
// TODO: implement std::str::FromStr for EmailAddress.
```

#### `tests/public.rs` — test

Source: `lessons/email-address-value-object/006-fromstr/tests/public.rs`

```rust
use rust_daily_lesson::{EmailAddress, EmailValidationError};

#[test]
fn parses_valid_email_with_standard_parse_api() -> Result<(), EmailValidationError> {
    let email = "ada@example.com".parse::<EmailAddress>()?;

    assert_eq!(email.as_str(), "ada@example.com");

    Ok(())
}

#[test]
fn parse_api_returns_the_domain_error() {
    assert_eq!(
        "ada@".parse::<EmailAddress>(),
        Err(EmailValidationError::MissingDomain)
    );
}
```

### Progressive hints

1. FromStr is another standard fallible conversion shape for string input.
2. Set type Err = EmailValidationError, then delegate parse to EmailAddress::try_from.
3. A canonical solution keeps TryFrom as the single validation implementation. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::str::FromStr",
          "typeName": "EmailAddress"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "type Err = EmailValidationError",
            "Self::try_from"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "direct-field-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/direct_field_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### direct-field-construction

Source: `lessons/email-address-value-object/006-fromstr/compile_fail/direct_field_construction.rs`

```rust
use rust_daily_lesson::EmailAddress;

fn main() {
    let _ = EmailAddress { value: String::from("ada@example.com") };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/email-address-value-object/006-fromstr/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        let (_local, domain) = value
            .split_once('@')
            .ok_or(EmailValidationError::MissingAt)?;

        if domain.is_empty() {
            return Err(EmailValidationError::MissingDomain);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

impl std::fmt::Display for EmailAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}

impl std::fmt::Display for EmailValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Empty => write!(f, "email address is empty"),
            Self::MissingAt => write!(f, "email address is missing @"),
            Self::MissingDomain => write!(f, "email address is missing a domain"),
        }
    }
}

impl std::error::Error for EmailValidationError {}

impl std::str::FromStr for EmailAddress {
    type Err = EmailValidationError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        Self::try_from(value)
    }
}
```

### Completion explanation

FromStr gives callers the familiar "text".parse::<EmailAddress>() API. Delegating to TryFrom avoids two validation implementations that can drift apart.

### Author notes

This lesson teaches API consistency. `TryFrom<&str>` owns the validation rule, and `FromStr` exposes a familiar parsing surface by delegating to it.

---

## 37. Define a basic Money struct

Source: `lessons/money-value-object/001-money-struct`

| Field | Value |
| --- | --- |
| Lesson ID | `money-struct-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/money-struct-001) |
| Arc | Money and currency domain representation (step 1 of 6) |
| Concept | Money struct definition (`money-struct`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

The system needs to represent monetary amounts in integer minor units. To prevent bugs, we must group the numeric amount and the currency type together into a single domain type instead of passing loose primitives around.

### Task

Define a public Money struct with private amount (u64 minor units) and currency (Currency) fields.

### Concept context

Represent monetary amounts securely by grouping amounts and currencies together.

- Prerequisites: `domain-structs`
- Tags: `domain`, `types`, `structs`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/money-value-object/001-money-struct/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
}

// TODO: Define a public Money struct with private amount (u64) and currency (Currency) fields.
```

#### `tests/public.rs` — test

Source: `lessons/money-value-object/001-money-struct/tests/public.rs`

```rust
use rust_daily_lesson::Money;

#[test]
fn money_is_public() {
    let _ = core::mem::size_of::<Money>();
}
```

### Progressive hints

1. Define pub struct Money.
2. The fields should be private: amount: u64 and currency: Currency. Do not add pub before them.
3. A canonical solution defines the Money struct with private fields. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Money",
          "requiredFields": [
            {
              "name": "amount",
              "typeIncludes": [
                "u64"
              ]
            },
            {
              "name": "currency",
              "typeIncludes": [
                "Currency"
              ]
            }
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "struct Money"
          ],
          "forbiddenSnippets": [
            "pub amount",
            "pub currency"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "money-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/money_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### money-direct-fields

Source: `lessons/money-value-object/001-money-struct/compile_fail/money_direct_fields.rs`

```rust
use rust_daily_lesson::{Currency, Money};

fn main() {
    let _ = Money { amount: 500, currency: Currency::Usd };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/money-value-object/001-money-struct/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}
```

### Completion explanation

The Money struct keeps the amount and currency together as one domain value. Private fields prevent callers from mutating the representation directly, which gives later constructors and methods a single place to preserve invariants.

### Author notes

Teaches the basic definition of a struct with private fields to model a domain concept.

---

## 38. Add supported Currency variants

Source: `lessons/money-value-object/002-currency-enum`

| Field | Value |
| --- | --- |
| Lesson ID | `currency-enum-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/currency-enum-002) |
| Arc | Money and currency domain representation (step 2 of 6) |
| Concept | Currency enum (`currency-enum`) |
| Difficulty | easy |
| Estimated time | 5 minutes |

### Scenario

The payment gateway is expanding to GBP, and adapter code needs a stable ISO currency code without matching on raw strings in every caller.

### Task

Add Gbp to the Currency enum and implement Currency::code(self) -> &'static str for USD, EUR, and GBP.

### Concept context

Represent supported currencies using enums to enforce type safety.

- Prerequisites: `money-struct`
- Tags: `domain`, `enums`, `types`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/money-value-object/002-currency-enum/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

// Continue from the previous lesson.
// TODO: Add British Pounds (Gbp) and expose stable ISO currency codes.
```

#### `tests/public.rs` — test

Source: `lessons/money-value-object/002-currency-enum/tests/public.rs`

```rust
use rust_daily_lesson::Currency;

#[test]
fn currency_variants() {
    assert_ne!(Currency::Usd, Currency::Eur);
    assert_ne!(Currency::Eur, Currency::Gbp);
}

#[test]
fn currency_codes_are_stable_iso_values() {
    assert_eq!(Currency::Usd.code(), "USD");
    assert_eq!(Currency::Eur.code(), "EUR");
    assert_eq!(Currency::Gbp.code(), "GBP");
}
```

### Progressive hints

1. Enums are updated by adding new variants separated by commas.
2. Add Gbp as a variant to the Currency enum, then match on self in code.
3. A canonical solution adds Gbp and centralizes the ISO text mapping. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "Currency",
          "requiredVariants": [
            "Usd",
            "Eur",
            "Gbp"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "pub fn code",
            "\"USD\"",
            "\"EUR\"",
            "\"GBP\""
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "money-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/money_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### money-direct-fields

Source: `lessons/money-value-object/002-currency-enum/compile_fail/money_direct_fields.rs`

```rust
use rust_daily_lesson::{Currency, Money};

fn main() {
    let _ = Money { amount: 500, currency: Currency::Usd };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/money-value-object/002-currency-enum/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}
```

### Completion explanation

Updating the enum and code method extends the supported domain concept while keeping external ISO text mapping centralized.

### Author notes

Teaches how to extend domain enum variants.

---

## 39. Add a Money constructor and accessors

Source: `lessons/money-value-object/003-money-invariants`

| Field | Value |
| --- | --- |
| Lesson ID | `money-invariants-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/money-invariants-003) |
| Arc | Money and currency domain representation (step 3 of 6) |
| Concept | Money constructor and accessors (`money-invariants`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Now that Money has private fields, callers need an intentional way to create values and read them back without mutating the representation directly.

### Task

Expose Money::new(amount: u64, currency: Currency) -> Self and accessor methods amount(&self) -> u64 and currency(&self) -> Currency.

### Concept context

Keep Money fields private while exposing a narrow constructor and read-only accessors as an invariant boundary.

- Prerequisites: `currency-enum`
- Tags: `domain`, `encapsulation`, `methods`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/money-value-object/003-money-invariants/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

// Continue from the previous lesson.
// TODO: Implement new, amount, and currency methods.
```

#### `tests/public.rs` — test

Source: `lessons/money-value-object/003-money-invariants/tests/public.rs`

```rust
use rust_daily_lesson::{Currency, Money};

#[test]
fn money_constructor_and_accessors() {
    let money = Money::new(100, Currency::Gbp);

    assert_eq!(money.amount(), 100);
    assert_eq!(money.currency(), Currency::Gbp);
}
```

### Progressive hints

1. Put the constructor and accessors inside an impl Money block.
2. new should return Self. The accessors should borrow self and return copyable values.
3. A canonical solution keeps the fields private and exposes a narrow public API. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "Money",
          "methodName": "new",
          "requiredSignatureIncludes": [
            "pub fn new",
            "amount: u64",
            "currency: Currency",
            "Self"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Money",
          "methodName": "amount",
          "requiredSignatureIncludes": [
            "pub fn amount",
            "&self",
            "u64"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Money",
          "methodName": "currency",
          "requiredSignatureIncludes": [
            "pub fn currency",
            "&self",
            "Currency"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "money-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/money_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### money-direct-fields

Source: `lessons/money-value-object/003-money-invariants/compile_fail/money_direct_fields.rs`

```rust
use rust_daily_lesson::{Currency, Money};

fn main() {
    let _ = Money { amount: 500, currency: Currency::Usd };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/money-value-object/003-money-invariants/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: u64, currency: Currency) -> Self {
        Self { amount, currency }
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}
```

### Completion explanation

A constructor and read-only accessors give callers the operations they need while keeping the representation under the type's control. That makes later validation and checked operations possible without changing every call site.

### Author notes

Teaches encapsulating a domain value behind a constructor and read-only accessors without exposing mutable representation details.

---

## 40. Add Money with a typed error

Source: `lessons/money-value-object/004-money-add`

| Field | Value |
| --- | --- |
| Lesson ID | `money-add-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/money-add-004) |
| Arc | Money and currency domain representation (step 4 of 6) |
| Concept | Checked money addition (`money-add-impl`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Callers need to add two money values, but currency mismatches and integer overflow are expected domain failures. Library code should return typed errors instead of panicking.

### Task

Implement Money::checked_add(self, rhs: Self) -> Result<Self, MoneyAddError>. Return CurrencyMismatch for different currencies and AmountOverflow for checked integer overflow.

### Concept context

Return typed errors for currency mismatches and arithmetic overflow instead of panicking.

- Prerequisites: `money-invariants`
- Tags: `domain`, `errors`, `checked-arithmetic`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/money-value-object/004-money-add/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: u64, currency: Currency) -> Self {
        Self { amount, currency }
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}

// Continue from the previous lesson.
// TODO: Implement checked_add without panicking.
```

#### `tests/public.rs` — test

Source: `lessons/money-value-object/004-money-add/tests/public.rs`

```rust
use rust_daily_lesson::{Currency, Money, MoneyAddError};

#[test]
fn adds_same_currency() {
    let first = Money::new(100, Currency::Usd);
    let second = Money::new(50, Currency::Usd);

    assert_eq!(
        first.checked_add(second),
        Ok(Money::new(150, Currency::Usd))
    );
}

#[test]
fn rejects_different_currencies() {
    let first = Money::new(100, Currency::Usd);
    let second = Money::new(50, Currency::Eur);

    assert_eq!(
        first.checked_add(second),
        Err(MoneyAddError::CurrencyMismatch {
            left: Currency::Usd,
            right: Currency::Eur,
        })
    );
}

#[test]
fn reports_amount_overflow() {
    let first = Money::new(u64::MAX, Currency::Gbp);
    let second = Money::new(1, Currency::Gbp);

    assert_eq!(
        first.checked_add(second),
        Err(MoneyAddError::AmountOverflow)
    );
}
```

### Progressive hints

1. Keep this as a method returning Result instead of implementing an operator that can panic.
2. Check currency equality first, then use u64::checked_add to combine the minor-unit amounts safely.
3. A canonical solution returns programmatic errors for both domain and arithmetic failures. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "Money",
          "methodName": "checked_add",
          "requiredSignatureIncludes": [
            "pub fn checked_add",
            "rhs: Self",
            "Result<Self, MoneyAddError>"
          ]
        },
        {
          "type": "enum_unit_variants",
          "enumName": "MoneyAddError",
          "requiredVariants": [
            "AmountOverflow"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "CurrencyMismatch",
            "checked_add"
          ],
          "forbiddenSnippets": [
            "panic!",
            ".unwrap()",
            ".expect(",
            "impl Add for Money"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "money-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/money_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### money-direct-fields

Source: `lessons/money-value-object/004-money-add/compile_fail/money_direct_fields.rs`

```rust
use rust_daily_lesson::{Currency, Money};

fn main() {
    let _ = Money { amount: 500, currency: Currency::Usd };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/money-value-object/004-money-add/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: u64, currency: Currency) -> Self {
        Self { amount, currency }
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyAddError {
    CurrencyMismatch { left: Currency, right: Currency },
    AmountOverflow,
}

impl Money {
    pub fn checked_add(self, rhs: Self) -> Result<Self, MoneyAddError> {
        if self.currency != rhs.currency {
            return Err(MoneyAddError::CurrencyMismatch {
                left: self.currency,
                right: rhs.currency,
            });
        }

        let amount = self
            .amount
            .checked_add(rhs.amount)
            .ok_or(MoneyAddError::AmountOverflow)?;

        Ok(Self {
            amount,
            currency: self.currency,
        })
    }
}
```

### Completion explanation

Fallible domain operations should make failure visible in the type signature. A Result keeps currency mismatches and overflow recoverable and testable, while avoiding panics in library code.

### Author notes

Teaches that fallible domain operations should return typed errors instead of overloading operators with panics.

---

## 41. Convert a decimal string to Money

Source: `lessons/money-value-object/005-money-tryfrom-decimal`

| Field | Value |
| --- | --- |
| Lesson ID | `money-tryfrom-decimal-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/money-tryfrom-decimal-005) |
| Arc | Money and currency domain representation (step 5 of 6) |
| Concept | Parsing decimal money strings (`money-try-from-decimal`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Forms pass prices as decimal strings such as "19.99". To avoid float rounding bugs, parse those strings into integer minor units with explicit errors and checked arithmetic.

### Task

Implement TryFrom<&str> for Money. Assume the parsed amount is USD. Return specific MoneyParseError variants for empty input, invalid digits, too many decimal places, and overflow.

### Concept context

Convert decimal price strings into safe integer minor units with specific typed errors.

- Prerequisites: `money-invariants`
- Tags: `conversion`, `tryfrom`, `parsing`, `checked-arithmetic`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/money-value-object/005-money-tryfrom-decimal/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: u64, currency: Currency) -> Self {
        Self { amount, currency }
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyAddError {
    CurrencyMismatch { left: Currency, right: Currency },
    AmountOverflow,
}

impl Money {
    pub fn checked_add(self, rhs: Self) -> Result<Self, MoneyAddError> {
        if self.currency != rhs.currency {
            return Err(MoneyAddError::CurrencyMismatch {
                left: self.currency,
                right: rhs.currency,
            });
        }

        let amount = self
            .amount
            .checked_add(rhs.amount)
            .ok_or(MoneyAddError::AmountOverflow)?;

        Ok(Self {
            amount,
            currency: self.currency,
        })
    }
}

// Continue from the previous lesson.
// TODO: Implement TryFrom<&str> for Money with USD currency.
```

#### `tests/public.rs` — test

Source: `lessons/money-value-object/005-money-tryfrom-decimal/tests/public.rs`

```rust
use rust_daily_lesson::{Currency, Money, MoneyParseError};

#[test]
fn parses_valid_decimals() {
    assert_eq!(
        Money::try_from("19.99"),
        Ok(Money::new(1999, Currency::Usd))
    );
    assert_eq!(Money::try_from("5"), Ok(Money::new(500, Currency::Usd)));
    assert_eq!(Money::try_from("5.2"), Ok(Money::new(520, Currency::Usd)));
}

#[test]
fn rejects_invalid_decimals() {
    assert_eq!(Money::try_from(""), Err(MoneyParseError::Empty));
    assert_eq!(Money::try_from("abc"), Err(MoneyParseError::InvalidDigits));
    assert_eq!(Money::try_from("12."), Err(MoneyParseError::InvalidDigits));
    assert_eq!(
        Money::try_from("12.3.4"),
        Err(MoneyParseError::TooManyDecimalPlaces)
    );
    assert_eq!(
        Money::try_from("12.345"),
        Err(MoneyParseError::TooManyDecimalPlaces)
    );
}

#[test]
fn rejects_amount_overflow() {
    assert_eq!(
        Money::try_from("18446744073709551615.00"),
        Err(MoneyParseError::AmountOverflow)
    );
}
```

### Progressive hints

1. Split once on the decimal point so the major and minor parts can be validated separately.
2. Parse digits into u64, use checked_mul and checked_add, and map each expected failure to a MoneyParseError variant.
3. A canonical solution parses text without floats and preserves every expected failure as a typed error. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<&str>",
          "typeName": "Money"
        },
        {
          "type": "enum_unit_variants",
          "enumName": "MoneyParseError",
          "requiredVariants": [
            "Empty",
            "InvalidDigits",
            "TooManyDecimalPlaces",
            "AmountOverflow"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "checked_mul",
            "checked_add"
          ],
          "forbiddenSnippets": [
            "panic!",
            ".unwrap()",
            ".expect("
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "money-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/money_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### money-direct-fields

Source: `lessons/money-value-object/005-money-tryfrom-decimal/compile_fail/money_direct_fields.rs`

```rust
use rust_daily_lesson::{Currency, Money};

fn main() {
    let _ = Money { amount: 500, currency: Currency::Usd };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/money-value-object/005-money-tryfrom-decimal/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: u64, currency: Currency) -> Self {
        Self { amount, currency }
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyAddError {
    CurrencyMismatch { left: Currency, right: Currency },
    AmountOverflow,
}

impl Money {
    pub fn checked_add(self, rhs: Self) -> Result<Self, MoneyAddError> {
        if self.currency != rhs.currency {
            return Err(MoneyAddError::CurrencyMismatch {
                left: self.currency,
                right: rhs.currency,
            });
        }

        let amount = self
            .amount
            .checked_add(rhs.amount)
            .ok_or(MoneyAddError::AmountOverflow)?;

        Ok(Self {
            amount,
            currency: self.currency,
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyParseError {
    Empty,
    InvalidDigits,
    TooManyDecimalPlaces,
    AmountOverflow,
}

impl TryFrom<&str> for Money {
    type Error = MoneyParseError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(MoneyParseError::Empty);
        }

        let (major_text, minor_text) = match value.split_once('.') {
            Some((major_text, minor_text)) => (major_text, Some(minor_text)),
            None => (value, None),
        };

        if major_text.is_empty() {
            return Err(MoneyParseError::InvalidDigits);
        }

        let major = major_text
            .parse::<u64>()
            .map_err(|_| MoneyParseError::InvalidDigits)?;
        let minor = match minor_text {
            None => 0,
            Some(text) if text.is_empty() => return Err(MoneyParseError::InvalidDigits),
            Some(text) if text.len() > 2 => {
                return Err(MoneyParseError::TooManyDecimalPlaces);
            }
            Some(text) => {
                let parsed = text
                    .parse::<u64>()
                    .map_err(|_| MoneyParseError::InvalidDigits)?;

                if text.len() == 1 {
                    parsed
                        .checked_mul(10)
                        .ok_or(MoneyParseError::AmountOverflow)?
                } else {
                    parsed
                }
            }
        };
        let amount = major
            .checked_mul(100)
            .and_then(|major_minor_units| major_minor_units.checked_add(minor))
            .ok_or(MoneyParseError::AmountOverflow)?;

        Ok(Self::new(amount, Currency::Usd))
    }
}
```

### Completion explanation

Parsing money through TryFrom gives callers a standard fallible conversion API. Using integer minor units and checked arithmetic avoids floating-point rounding, overflow surprises, and panics.

### Author notes

Teaches parsing decimal text into integer minor units with specific errors and checked arithmetic instead of floats, panics, or lossy conversions.

---

## 42. Implement Display for Money

Source: `lessons/money-value-object/006-money-display`

| Field | Value |
| --- | --- |
| Lesson ID | `money-display-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/money-display-006) |
| Arc | Money and currency domain representation (step 6 of 6) |
| Concept | Displaying money values (`money-display-format`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

The UI needs to render formatted prices like $19.99, €5.00, or £7.25 without exposing Money's private fields.

### Task

Implement std::fmt::Display for Money. Use '$' for USD, '€' for EUR, '£' for GBP, and output cents formatted to two decimal places.

### Concept context

Implement Display for all supported currency symbols and cents formatting.

- Prerequisites: `money-invariants`
- Tags: `traits`, `display`, `formatting`, `domain`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/money-value-object/006-money-display/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: u64, currency: Currency) -> Self {
        Self { amount, currency }
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyAddError {
    CurrencyMismatch { left: Currency, right: Currency },
    AmountOverflow,
}

impl Money {
    pub fn checked_add(self, rhs: Self) -> Result<Self, MoneyAddError> {
        if self.currency != rhs.currency {
            return Err(MoneyAddError::CurrencyMismatch {
                left: self.currency,
                right: rhs.currency,
            });
        }

        let amount = self
            .amount
            .checked_add(rhs.amount)
            .ok_or(MoneyAddError::AmountOverflow)?;

        Ok(Self {
            amount,
            currency: self.currency,
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyParseError {
    Empty,
    InvalidDigits,
    TooManyDecimalPlaces,
    AmountOverflow,
}

impl TryFrom<&str> for Money {
    type Error = MoneyParseError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(MoneyParseError::Empty);
        }

        let (major_text, minor_text) = match value.split_once('.') {
            Some((major_text, minor_text)) => (major_text, Some(minor_text)),
            None => (value, None),
        };

        if major_text.is_empty() {
            return Err(MoneyParseError::InvalidDigits);
        }

        let major = major_text
            .parse::<u64>()
            .map_err(|_| MoneyParseError::InvalidDigits)?;
        let minor = match minor_text {
            None => 0,
            Some(text) if text.is_empty() => return Err(MoneyParseError::InvalidDigits),
            Some(text) if text.len() > 2 => {
                return Err(MoneyParseError::TooManyDecimalPlaces);
            }
            Some(text) => {
                let parsed = text
                    .parse::<u64>()
                    .map_err(|_| MoneyParseError::InvalidDigits)?;

                if text.len() == 1 {
                    parsed
                        .checked_mul(10)
                        .ok_or(MoneyParseError::AmountOverflow)?
                } else {
                    parsed
                }
            }
        };
        let amount = major
            .checked_mul(100)
            .and_then(|major_minor_units| major_minor_units.checked_add(minor))
            .ok_or(MoneyParseError::AmountOverflow)?;

        Ok(Self::new(amount, Currency::Usd))
    }
}

// Continue from the previous lesson.
// TODO: Implement std::fmt::Display for Money.
```

#### `tests/public.rs` — test

Source: `lessons/money-value-object/006-money-display/tests/public.rs`

```rust
use rust_daily_lesson::{Currency, Money};

#[test]
fn formats_correctly() {
    assert_eq!(Money::new(1999, Currency::Usd).to_string(), "$19.99");
    assert_eq!(Money::new(500, Currency::Eur).to_string(), "€5.00");
    assert_eq!(Money::new(725, Currency::Gbp).to_string(), "£7.25");
    assert_eq!(Money::new(5, Currency::Usd).to_string(), "$0.05");
}
```

### Progressive hints

1. Write an impl std::fmt::Display for Money block.
2. Match on Currency for the symbol, then use amount / 100 and amount % 100 with {:02} for cents.
3. A canonical solution formats all supported currencies through the Display trait. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::fmt::Display",
          "typeName": "Money"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "money-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/money_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### money-direct-fields

Source: `lessons/money-value-object/006-money-display/compile_fail/money_direct_fields.rs`

```rust
use rust_daily_lesson::{Currency, Money};

fn main() {
    let _ = Money { amount: 500, currency: Currency::Usd };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/money-value-object/006-money-display/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: u64, currency: Currency) -> Self {
        Self { amount, currency }
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyAddError {
    CurrencyMismatch { left: Currency, right: Currency },
    AmountOverflow,
}

impl Money {
    pub fn checked_add(self, rhs: Self) -> Result<Self, MoneyAddError> {
        if self.currency != rhs.currency {
            return Err(MoneyAddError::CurrencyMismatch {
                left: self.currency,
                right: rhs.currency,
            });
        }

        let amount = self
            .amount
            .checked_add(rhs.amount)
            .ok_or(MoneyAddError::AmountOverflow)?;

        Ok(Self {
            amount,
            currency: self.currency,
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyParseError {
    Empty,
    InvalidDigits,
    TooManyDecimalPlaces,
    AmountOverflow,
}

impl TryFrom<&str> for Money {
    type Error = MoneyParseError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(MoneyParseError::Empty);
        }

        let (major_text, minor_text) = match value.split_once('.') {
            Some((major_text, minor_text)) => (major_text, Some(minor_text)),
            None => (value, None),
        };

        if major_text.is_empty() {
            return Err(MoneyParseError::InvalidDigits);
        }

        let major = major_text
            .parse::<u64>()
            .map_err(|_| MoneyParseError::InvalidDigits)?;
        let minor = match minor_text {
            None => 0,
            Some(text) if text.is_empty() => return Err(MoneyParseError::InvalidDigits),
            Some(text) if text.len() > 2 => {
                return Err(MoneyParseError::TooManyDecimalPlaces);
            }
            Some(text) => {
                let parsed = text
                    .parse::<u64>()
                    .map_err(|_| MoneyParseError::InvalidDigits)?;

                if text.len() == 1 {
                    parsed
                        .checked_mul(10)
                        .ok_or(MoneyParseError::AmountOverflow)?
                } else {
                    parsed
                }
            }
        };
        let amount = major
            .checked_mul(100)
            .and_then(|major_minor_units| major_minor_units.checked_add(minor))
            .ok_or(MoneyParseError::AmountOverflow)?;

        Ok(Self::new(amount, Currency::Usd))
    }
}

impl std::fmt::Display for Money {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let symbol = match self.currency {
            Currency::Usd => "$",
            Currency::Eur => "€",
            Currency::Gbp => "£",
        };
        let major = self.amount / 100;
        let minor = self.amount % 100;

        write!(f, "{symbol}{major}.{minor:02}")
    }
}
```

### Completion explanation

Display provides the standard formatting API while the value object keeps its representation private. Matching every supported currency also prevents enum additions from being silently ignored.

### Author notes

Teaches Display for value-object formatting while keeping currency handling explicit and consistent across supported variants.

---

## 43. Use NonZeroU16 for Port representation

Source: `lessons/host-port-config/001-port-nonzero`

| Field | Value |
| --- | --- |
| Lesson ID | `port-nonzero-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/port-nonzero-001) |
| Arc | Host and port configuration modeling (step 1 of 6) |
| Concept | NonZero ports (`port-nonzero`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

A port of 0 is invalid for this application. The standard library NonZeroU16 lets the Port type store only non-zero values after construction.

### Task

Define a Port tuple struct wrapping std::num::NonZeroU16 privately. Expose Port::new(value: u16) -> Option<Self> and Port::value(&self) -> u16.

### Concept context

Leverage NonZeroU16 so Port values store only non-zero numbers after construction.

- Prerequisites: `domain-structs`
- Tags: `domain`, `types`, `safety`, `accessors`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/host-port-config/001-port-nonzero/starter/src/lib.rs`

```rust
use std::num::NonZeroU16;

// TODO: Define Port as a public tuple struct wrapping NonZeroU16 privately.

impl Port {
    // TODO: Expose Port::new(value: u16) -> Option<Self>.

    // TODO: Expose Port::value(&self) -> u16.
}
```

#### `tests/public.rs` — test

Source: `lessons/host-port-config/001-port-nonzero/tests/public.rs`

```rust
use rust_daily_lesson::Port;

#[test]
fn port_safety() {
    assert_eq!(Port::new(8080).map(|port| port.value()), Some(8080));
    assert_eq!(Port::new(0).map(|port| port.value()), None);
}
```

### Progressive hints

1. Use a tuple struct: pub struct Port(NonZeroU16);
2. NonZeroU16::new(value) returns Option<NonZeroU16>. Map this into Port with .map(Self), then use get() in the accessor.
3. A canonical solution wraps NonZeroU16 and exposes only intentional construction and read access. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "tuple_struct_fields",
          "structName": "Port",
          "requiredTypes": [
            "NonZeroU16"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Port",
          "methodName": "new",
          "requiredSignatureIncludes": [
            "pub fn new",
            "value: u16",
            "Option<Self>"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Port",
          "methodName": "value",
          "requiredSignatureIncludes": [
            "pub fn value",
            "&self",
            "u16"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "NonZeroU16::new"
          ],
          "forbiddenSnippets": [
            ".unwrap()",
            ".expect(",
            "panic!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "port-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/port_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### port-direct-construction

Source: `lessons/host-port-config/001-port-nonzero/compile_fail/port_direct_construction.rs`

```rust
use std::num::NonZeroU16;
use rust_daily_lesson::Port;

fn main() {
    let _ = Port(NonZeroU16::new(8080).unwrap());
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/host-port-config/001-port-nonzero/solution/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}
```

### Completion explanation

Using NonZeroU16 moves the non-zero rule into the type representation after construction. Downstream code can trust Port values and does not need to repeat the zero check.

### Author notes

Teaches using NonZero integer types at construction boundaries and exposing a small value accessor instead of public internals.

---

## 44. Define and validate a Host value object

Source: `lessons/host-port-config/002-host-domain`

| Field | Value |
| --- | --- |
| Lesson ID | `host-domain-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/host-domain-002) |
| Arc | Host and port configuration modeling (step 2 of 6) |
| Concept | Validated Host value object (`host-domain`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Hosts arrive as borrowed text from configuration and adapters. We want a domain type that rejects empty values and whitespace before storing an owned String.

### Task

Define HostValidationError and a validate_host helper, then define a Host tuple struct with a private String field. Expose Host::as_str(&self) -> &str and implement TryFrom<&str> for Host by reusing validate_host.

### Concept context

Wrap host strings in a validated domain type, using TryFrom<&str> to avoid raw string usage and unnecessary caller allocation.

- Prerequisites: `domain-structs`
- Tags: `domain`, `types`, `validation`, `conversion`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/host-port-config/002-host-domain/starter/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

// Continue from the previous lesson.
// TODO: Define HostValidationError with Empty and InvalidCharacters.
// TODO: Add a validate_host(&str) helper for the shared rules.
// TODO: Define Host as a public tuple struct with a private String field.
// TODO: Expose as_str(&self) -> &str.
// TODO: Implement TryFrom<&str> for Host.
```

#### `tests/public.rs` — test

Source: `lessons/host-port-config/002-host-domain/tests/public.rs`

```rust
use rust_daily_lesson::{Host, HostValidationError};

#[test]
fn host_representation_is_validated() {
    assert_eq!(
        Host::try_from("localhost").map(|host| host.as_str().to_owned()),
        Ok("localhost".to_owned())
    );
    assert_eq!(Host::try_from(""), Err(HostValidationError::Empty));
    assert_eq!(
        Host::try_from("bad host"),
        Err(HostValidationError::InvalidCharacters)
    );
}
```

### Progressive hints

1. Put the empty and whitespace checks in validate_host so later conversions can reuse the same rules.
2. Return Empty for an empty string and InvalidCharacters if the input contains whitespace; allocate only after validation passes.
3. A canonical solution validates borrowed text before storing an owned string. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "tuple_struct_fields",
          "structName": "Host",
          "requiredTypes": [
            "String"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Host",
          "methodName": "as_str",
          "requiredSignatureIncludes": [
            "&self",
            "&str"
          ]
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<&str>",
          "typeName": "Host"
        },
        {
          "type": "enum_unit_variants",
          "enumName": "HostValidationError",
          "requiredVariants": [
            "Empty",
            "InvalidCharacters"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "to_owned"
          ],
          "forbiddenSnippets": [
            "new_unchecked",
            ".unwrap()",
            ".expect(",
            "panic!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "port-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/port_direct_construction.rs"
        },
        {
          "name": "host-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/host_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### port-direct-construction

Source: `lessons/host-port-config/002-host-domain/compile_fail/port_direct_construction.rs`

```rust
use std::num::NonZeroU16;
use rust_daily_lesson::Port;

fn main() {
    let _ = Port(NonZeroU16::new(8080).unwrap());
}
```

##### host-direct-construction

Source: `lessons/host-port-config/002-host-domain/compile_fail/host_direct_construction.rs`

```rust
use rust_daily_lesson::Host;

fn main() {
    let _ = Host(String::from("localhost"));
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/host-port-config/002-host-domain/solution/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}
```

### Completion explanation

A validated value object keeps raw strings at the boundary. Implementing TryFrom<&str> avoids forcing callers to allocate invalid input, while Host owns the accepted value after validation.

### Author notes

Teaches a primitive-wrapper value object with validation from borrowed text, avoiding unchecked constructors and unnecessary caller allocation.

---

## 45. Reuse Host validation for owned strings

Source: `lessons/host-port-config/003-host-validation`

| Field | Value |
| --- | --- |
| Lesson ID | `host-validation-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/host-validation-003) |
| Arc | Host and port configuration modeling (step 3 of 6) |
| Concept | Owned Host conversion reuse (`host-validation`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Some adapter and configuration APIs hand us owned String values. The domain type should support those call sites without duplicating validation logic.

### Task

Implement TryFrom<String> for Host by reusing the existing validate_host helper. Validate through a borrowed view, then store the original String on success.

### Concept context

Support TryFrom<String> by reusing borrowed Host validation and storing the original owned String on success.

- Prerequisites: `host-domain`
- Tags: `conversion`, `tryfrom`, `validation`, `allocation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/host-port-config/003-host-validation/starter/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

// Continue from the previous lesson.
// TODO: Implement TryFrom<String> for Host by reusing validate_host without reallocating the String.
```

#### `tests/public.rs` — test

Source: `lessons/host-port-config/003-host-validation/tests/public.rs`

```rust
use rust_daily_lesson::{Host, HostValidationError};

#[test]
fn host_try_from_string_reuses_validation() {
    assert_eq!(
        Host::try_from("localhost".to_owned()).map(|host| host.as_str().to_owned()),
        Ok("localhost".to_owned())
    );
    assert_eq!(
        Host::try_from(String::new()),
        Err(HostValidationError::Empty)
    );
    assert_eq!(
        Host::try_from("bad host".to_owned()),
        Err(HostValidationError::InvalidCharacters)
    );
}
```

### Progressive hints

1. The validate_host helper already contains the validation rules; do not copy them into a second implementation.
2. Borrow the String with value.as_str() for validation, then return Ok(Self(value)) so the owned allocation is reused.
3. A canonical solution keeps one validation function and avoids an unnecessary reallocation. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<String>",
          "typeName": "Host"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "validate_host",
            "value.as_str()",
            "Ok(Self(value))"
          ],
          "forbiddenSnippets": [
            ".unwrap()",
            ".expect(",
            "panic!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "port-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/port_direct_construction.rs"
        },
        {
          "name": "host-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/host_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### port-direct-construction

Source: `lessons/host-port-config/003-host-validation/compile_fail/port_direct_construction.rs`

```rust
use std::num::NonZeroU16;
use rust_daily_lesson::Port;

fn main() {
    let _ = Port(NonZeroU16::new(8080).unwrap());
}
```

##### host-direct-construction

Source: `lessons/host-port-config/003-host-validation/compile_fail/host_direct_construction.rs`

```rust
use rust_daily_lesson::Host;

fn main() {
    let _ = Host(String::from("localhost"));
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/host-port-config/003-host-validation/solution/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_host(value.as_str())?;

        Ok(Self(value))
    }
}
```

### Completion explanation

Supporting owned input can improve adapter ergonomics, but validation rules should still live in one place. Validating through a borrowed view and then storing the original String keeps the API consistent without an extra allocation.

### Author notes

Teaches adding an owned-input conversion for adapter ergonomics while reusing the borrowed validation implementation instead of duplicating rules.

---

## 46. Compose Host and Port into Endpoint

Source: `lessons/host-port-config/004-host-port-struct`

| Field | Value |
| --- | --- |
| Lesson ID | `host-port-struct-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/host-port-struct-004) |
| Arc | Host and port configuration modeling (step 4 of 6) |
| Concept | Composite network endpoints (`host-port-composite`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Hosts and ports travel together as a network endpoint. The composite type should keep the relationship explicit without exposing mutable internals.

### Task

Define an Endpoint struct with private host: Host and port: Port fields. Provide Endpoint::new(host: Host, port: Port) -> Self, host(&self) -> &Host, and port(&self) -> Port.

### Concept context

Group Host and Port values into an Endpoint with private fields and narrow accessors.

- Prerequisites: `host-domain`, `port-nonzero`
- Tags: `domain`, `structs`, `composition`, `encapsulation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/host-port-config/004-host-port-struct/starter/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_host(value.as_str())?;

        Ok(Self(value))
    }
}

// Continue from the previous lesson.
// TODO: Define Endpoint with private host and port fields, plus constructor and accessors.
```

#### `tests/public.rs` — test

Source: `lessons/host-port-config/004-host-port-struct/tests/public.rs`

```rust
use rust_daily_lesson::{Endpoint, Host, Port};

fn valid_host() -> Result<Host, String> {
    Host::try_from("127.0.0.1").map_err(|error| format!("invalid test host: {error:?}"))
}

fn valid_port() -> Result<Port, String> {
    Port::new(80).ok_or_else(|| "port fixture must be non-zero".to_owned())
}

#[test]
fn endpoint_composites() -> Result<(), String> {
    let host = valid_host()?;
    let port = valid_port()?;
    let endpoint = Endpoint::new(host.clone(), port);

    assert_eq!(endpoint.host(), &host);
    assert_eq!(endpoint.port(), port);

    Ok(())
}
```

### Progressive hints

1. Define Endpoint as a named-field struct, but leave the fields private.
2. The host accessor can return &Host to avoid cloning; Port is Copy, so its accessor can return Port.
3. A canonical solution composes existing value objects behind a narrow API. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Endpoint",
          "requiredFields": [
            {
              "name": "host",
              "typeIncludes": [
                "Host"
              ]
            },
            {
              "name": "port",
              "typeIncludes": [
                "Port"
              ]
            }
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Endpoint",
          "methodName": "new",
          "requiredSignatureIncludes": [
            "pub fn new",
            "host: Host",
            "port: Port",
            "Self"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Endpoint",
          "methodName": "host",
          "requiredSignatureIncludes": [
            "pub fn host",
            "&self",
            "&Host"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Endpoint",
          "methodName": "port",
          "requiredSignatureIncludes": [
            "pub fn port",
            "&self",
            "Port"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "struct Endpoint"
          ],
          "forbiddenSnippets": [
            "pub host",
            "pub port",
            ".unwrap()",
            ".expect("
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "port-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/port_direct_construction.rs"
        },
        {
          "name": "host-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/host_direct_construction.rs"
        },
        {
          "name": "endpoint-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/endpoint_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### port-direct-construction

Source: `lessons/host-port-config/004-host-port-struct/compile_fail/port_direct_construction.rs`

```rust
use std::num::NonZeroU16;
use rust_daily_lesson::Port;

fn main() {
    let _ = Port(NonZeroU16::new(8080).unwrap());
}
```

##### host-direct-construction

Source: `lessons/host-port-config/004-host-port-struct/compile_fail/host_direct_construction.rs`

```rust
use rust_daily_lesson::Host;

fn main() {
    let _ = Host(String::from("localhost"));
}
```

##### endpoint-direct-fields

Source: `lessons/host-port-config/004-host-port-struct/compile_fail/endpoint_direct_fields.rs`

```rust
use rust_daily_lesson::{Endpoint, Host, Port};

fn main() {
    let host = Host::try_from("localhost").unwrap();
    let port = Port::new(8080).unwrap();
    let _ = Endpoint { host, port };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/host-port-config/004-host-port-struct/solution/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_host(value.as_str())?;

        Ok(Self(value))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Endpoint {
    host: Host,
    port: Port,
}

impl Endpoint {
    pub fn new(host: Host, port: Port) -> Self {
        Self { host, port }
    }

    pub fn host(&self) -> &Host {
        &self.host
    }

    pub fn port(&self) -> Port {
        self.port
    }
}
```

### Completion explanation

Composing validated value objects makes the endpoint relationship explicit. Keeping Endpoint fields private preserves the ability to add endpoint-level rules later without breaking callers.

### Author notes

Teaches composing validated value objects into an aggregate while keeping aggregate fields private and exposing narrow accessors.

---

## 47. Give Endpoint sensible local defaults

Source: `lessons/host-port-config/005-endpoint-default`

| Field | Value |
| --- | --- |
| Lesson ID | `endpoint-default-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/endpoint-default-005) |
| Arc | Host and port configuration modeling (step 5 of 6) |
| Concept | Endpoint local defaults (`endpoint-default`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Most local service connections use host "localhost" and port 8080. The default should be convenient, deterministic, and free of unwrap or expect.

### Task

Implement Default for Endpoint using Host::localhost() and Port::LOCAL_DEVELOPMENT. Do not use unwrap, expect, or panic.

### Concept context

Implement Default for known local settings without unwrap, expect, or panic.

- Prerequisites: `host-port-composite`
- Tags: `traits`, `default`, `configuration`, `safety`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/host-port-config/005-endpoint-default/starter/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_host(value.as_str())?;

        Ok(Self(value))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Endpoint {
    host: Host,
    port: Port,
}

impl Endpoint {
    pub fn new(host: Host, port: Port) -> Self {
        Self { host, port }
    }

    pub fn host(&self) -> &Host {
        &self.host
    }

    pub fn port(&self) -> Port {
        self.port
    }
}

impl Port {
    pub const LOCAL_DEVELOPMENT: Self = Self(NonZeroU16::MIN.saturating_add(8079));
}

impl Host {
    pub fn localhost() -> Self {
        Self("localhost".to_owned())
    }
}

// Continue from the previous lesson.
// TODO: Implement Default for Endpoint without unwrap or expect.
```

#### `tests/public.rs` — test

Source: `lessons/host-port-config/005-endpoint-default/tests/public.rs`

```rust
use rust_daily_lesson::Endpoint;

#[test]
fn endpoint_default() {
    let default_endpoint = Endpoint::default();

    assert_eq!(default_endpoint.host().as_str(), "localhost");
    assert_eq!(default_endpoint.port().value(), 8080);
}
```

### Progressive hints

1. Use Default only for a known-good local configuration; keep fallible parsing at external boundaries.
2. The starter already gives a known-good Host::localhost() constructor and Port::LOCAL_DEVELOPMENT constant. Compose those in default().
3. A canonical solution builds defaults from named trusted constants without unwrap or expect. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "Default",
          "typeName": "Endpoint"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "Host::localhost()",
            "Port::LOCAL_DEVELOPMENT"
          ],
          "forbiddenSnippets": [
            "unwrap",
            "expect",
            "panic!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "port-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/port_direct_construction.rs"
        },
        {
          "name": "host-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/host_direct_construction.rs"
        },
        {
          "name": "endpoint-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/endpoint_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### port-direct-construction

Source: `lessons/host-port-config/005-endpoint-default/compile_fail/port_direct_construction.rs`

```rust
use std::num::NonZeroU16;
use rust_daily_lesson::Port;

fn main() {
    let _ = Port(NonZeroU16::new(8080).unwrap());
}
```

##### host-direct-construction

Source: `lessons/host-port-config/005-endpoint-default/compile_fail/host_direct_construction.rs`

```rust
use rust_daily_lesson::Host;

fn main() {
    let _ = Host(String::from("localhost"));
}
```

##### endpoint-direct-fields

Source: `lessons/host-port-config/005-endpoint-default/compile_fail/endpoint_direct_fields.rs`

```rust
use rust_daily_lesson::{Endpoint, Host, Port};

fn main() {
    let host = Host::try_from("localhost").unwrap();
    let port = Port::new(8080).unwrap();
    let _ = Endpoint { host, port };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/host-port-config/005-endpoint-default/solution/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_host(value.as_str())?;

        Ok(Self(value))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Endpoint {
    host: Host,
    port: Port,
}

impl Endpoint {
    pub fn new(host: Host, port: Port) -> Self {
        Self { host, port }
    }

    pub fn host(&self) -> &Host {
        &self.host
    }

    pub fn port(&self) -> Port {
        self.port
    }
}

impl Port {
    pub const LOCAL_DEVELOPMENT: Self = Self(NonZeroU16::MIN.saturating_add(8079));
}

impl Host {
    pub fn localhost() -> Self {
        Self("localhost".to_owned())
    }
}

impl Default for Endpoint {
    fn default() -> Self {
        Self::new(Host::localhost(), Port::LOCAL_DEVELOPMENT)
    }
}
```

### Completion explanation

Default is useful for known local configuration, but it should not normalize unwraps in library code. Trusted constants and explicit constructors keep the code deterministic without hiding failure paths.

### Author notes

Teaches implementing Default for known local configuration without unwrap/expect by using a constant NonZeroU16 and explicit trusted construction.

---

## 48. Implement Display for Endpoint

Source: `lessons/host-port-config/006-endpoint-display`

| Field | Value |
| --- | --- |
| Lesson ID | `endpoint-display-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/endpoint-display-006) |
| Arc | Host and port configuration modeling (step 6 of 6) |
| Concept | Formatting network endpoints (`endpoint-display`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Connection logs and configuration output need endpoint formatting in host:port style without exposing Endpoint internals.

### Task

Implement Display for Endpoint by formatting self.host().as_str() and self.port().value() as host:port.

### Concept context

Format endpoints through their public accessors using Display.

- Prerequisites: `host-port-composite`
- Tags: `traits`, `display`, `formatting`, `encapsulation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/host-port-config/006-endpoint-display/starter/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_host(value.as_str())?;

        Ok(Self(value))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Endpoint {
    host: Host,
    port: Port,
}

impl Endpoint {
    pub fn new(host: Host, port: Port) -> Self {
        Self { host, port }
    }

    pub fn host(&self) -> &Host {
        &self.host
    }

    pub fn port(&self) -> Port {
        self.port
    }
}

impl Port {
    pub const LOCAL_DEVELOPMENT: Self = Self(NonZeroU16::MIN.saturating_add(8079));
}

impl Host {
    pub fn localhost() -> Self {
        Self("localhost".to_owned())
    }
}

impl Default for Endpoint {
    fn default() -> Self {
        Self::new(Host::localhost(), Port::LOCAL_DEVELOPMENT)
    }
}

// Continue from the previous lesson.
// TODO: Implement std::fmt::Display for Endpoint.
```

#### `tests/public.rs` — test

Source: `lessons/host-port-config/006-endpoint-display/tests/public.rs`

```rust
use rust_daily_lesson::{Endpoint, Host, Port};

#[test]
fn endpoint_display() -> Result<(), String> {
    let host =
        Host::try_from("127.0.0.1").map_err(|error| format!("invalid test host: {error:?}"))?;
    let port = Port::new(80).ok_or_else(|| "port fixture must be non-zero".to_owned())?;
    let endpoint = Endpoint::new(host, port);

    assert_eq!(endpoint.to_string(), "127.0.0.1:80");

    Ok(())
}
```

### Progressive hints

1. Implement std::fmt::Display for Endpoint.
2. Use the public accessors: self.host().as_str() and self.port().value().
3. A canonical solution formats the composite through its public API. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::fmt::Display",
          "typeName": "Endpoint"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "fn fmt",
            "write!"
          ],
          "forbiddenSnippets": [
            ".unwrap()",
            ".expect(",
            "panic!"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "port-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/port_direct_construction.rs"
        },
        {
          "name": "host-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/host_direct_construction.rs"
        },
        {
          "name": "endpoint-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/endpoint_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### port-direct-construction

Source: `lessons/host-port-config/006-endpoint-display/compile_fail/port_direct_construction.rs`

```rust
use std::num::NonZeroU16;
use rust_daily_lesson::Port;

fn main() {
    let _ = Port(NonZeroU16::new(8080).unwrap());
}
```

##### host-direct-construction

Source: `lessons/host-port-config/006-endpoint-display/compile_fail/host_direct_construction.rs`

```rust
use rust_daily_lesson::Host;

fn main() {
    let _ = Host(String::from("localhost"));
}
```

##### endpoint-direct-fields

Source: `lessons/host-port-config/006-endpoint-display/compile_fail/endpoint_direct_fields.rs`

```rust
use rust_daily_lesson::{Endpoint, Host, Port};

fn main() {
    let host = Host::try_from("localhost").unwrap();
    let port = Port::new(8080).unwrap();
    let _ = Endpoint { host, port };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/host-port-config/006-endpoint-display/solution/src/lib.rs`

```rust
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_host(value.as_str())?;

        Ok(Self(value))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Endpoint {
    host: Host,
    port: Port,
}

impl Endpoint {
    pub fn new(host: Host, port: Port) -> Self {
        Self { host, port }
    }

    pub fn host(&self) -> &Host {
        &self.host
    }

    pub fn port(&self) -> Port {
        self.port
    }
}

impl Port {
    pub const LOCAL_DEVELOPMENT: Self = Self(NonZeroU16::MIN.saturating_add(8079));
}

impl Host {
    pub fn localhost() -> Self {
        Self("localhost".to_owned())
    }
}

impl Default for Endpoint {
    fn default() -> Self {
        Self::new(Host::localhost(), Port::LOCAL_DEVELOPMENT)
    }
}

impl std::fmt::Display for Endpoint {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}:{}", self.host().as_str(), self.port().value())
    }
}
```

### Completion explanation

Display gives the composite type a standard textual representation while callers and formatting code continue to use the public API instead of reaching into private fields.

### Author notes

Teaches Display for a composite value object using accessors rather than public fields or representation leaks.

---

## 49. Deserialize a raw register-user DTO

Source: `lessons/dto-conversions/001-raw-register-dto`

| Field | Value |
| --- | --- |
| Lesson ID | `dto-struct-raw-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/dto-struct-raw-001) |
| Arc | Converting DTOs into domain commands (step 1 of 6) |
| Concept | Define a raw register-user DTO (`dto-struct-raw`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

An HTTP adapter receives partial, untrusted data. Start by representing that boundary data separately from the domain command.

### Task

Define RegisterUserDto with public email and display_name Option<String> fields, and derive serde::Deserialize so JSON boundary input can create it directly.

### Concept context

An HTTP adapter receives partial, untrusted data. Start by representing that boundary data separately from the domain command.

- Prerequisites: None
- Tags: `conversion`, `dto`, `adapter`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/dto-conversions/001-raw-register-dto/starter/src/lib.rs`

```rust
// TODO: define the raw adapter DTO for registering a user.
```

#### `tests/public.rs` — test

Source: `lessons/dto-conversions/001-raw-register-dto/tests/public.rs`

```rust
use rust_daily_lesson::RegisterUserDto;

#[test]
fn dto_deserializes_partial_boundary_json() {
    let dto: RegisterUserDto = serde_json::from_str(r#"{"email":"ada@example.com"}"#)
        .expect("DTO JSON should deserialize");

    assert_eq!(dto.email.as_deref(), Some("ada@example.com"));
    assert_eq!(dto.display_name, None);
}
```

### Progressive hints

1. DTOs model transport input, so public fields are acceptable at the boundary.
2. Option<String> lets serde represent missing JSON fields as None.
3. Derive Deserialize on the DTO, not on the domain command. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "RegisterUserDto",
          "requiredFields": [
            {
              "name": "email",
              "typeIncludes": [
                "Option",
                "String"
              ]
            },
            {
              "name": "display_name",
              "typeIncludes": [
                "Option",
                "String"
              ]
            }
          ]
        },
        {
          "type": "derived_trait_for_type",
          "traitName": "serde::Deserialize",
          "typeName": "RegisterUserDto"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/dto-conversions/001-raw-register-dto/solution/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}
```

### Completion explanation

The adapter DTO can now be built from JSON while still keeping untrusted boundary data separate from validated domain data.

### Author notes

Teaches dto-struct-raw with cumulative, idiomatic Rust code.

---

## 50. Keep the validated command serde-free

Source: `lessons/dto-conversions/002-command-value`

| Field | Value |
| --- | --- |
| Lesson ID | `register-command-value-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/register-command-value-002) |
| Arc | Converting DTOs into domain commands (step 2 of 6) |
| Concept | Define a validated register command (`register-command-value`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

The application layer should receive a command type, not raw optional DTO fields. Keep command fields private and expose read-only accessors.

### Task

Keep RegisterUserDto active. Add RegisterUserCommand with private email and display_name fields, a constructor, and borrowed accessors. Do not derive serde traits on the command.

### Concept context

The application layer should receive a command type, not raw optional DTO fields. Keep command fields private and expose read-only accessors.

- Prerequisites: None
- Tags: `domain`, `conversion`, `encapsulation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/dto-conversions/002-command-value/starter/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

// TODO: add the validated command type without serde derives.
```

#### `tests/public.rs` — test

Source: `lessons/dto-conversions/002-command-value/tests/public.rs`

```rust
use rust_daily_lesson::{RegisterUserCommand, RegisterUserDto};

#[test]
fn command_has_private_state_and_borrowed_accessors() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");

    assert_eq!(command.email(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}

#[test]
fn dto_still_deserializes_at_the_boundary() {
    let dto: RegisterUserDto = serde_json::from_str(r#"{"email":"ada@example.com"}"#)
        .expect("DTO JSON should deserialize");

    assert_eq!(dto.email.as_deref(), Some("ada@example.com"));
}
```

### Progressive hints

1. DTOs and commands serve different layers.
2. The command owns validated data but exposes it through borrowed accessors.
3. Keep Deserialize on RegisterUserDto only. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "RegisterUserCommand",
          "requiredFields": [
            {
              "name": "email",
              "typeIncludes": [
                "String"
              ]
            },
            {
              "name": "display_name",
              "typeIncludes": [
                "String"
              ]
            }
          ]
        },
        {
          "type": "impl_method",
          "implFor": "RegisterUserCommand",
          "methodName": "email",
          "requiredSignatureIncludes": [
            "fn email(&self) -> &str"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "cases": [
        {
          "name": "command-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/command_direct_fields.rs"
        },
        {
          "name": "command-serde-free",
          "expectedDiagnostics": [
            "Serialize"
          ],
          "sourcePath": "compile_fail/command_serde_free.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### command-direct-fields

Source: `lessons/dto-conversions/002-command-value/compile_fail/command_direct_fields.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let _ = RegisterUserCommand {
        email: String::from("ada@example.com"),
        display_name: String::from("Ada"),
    };
}
```

##### command-serde-free

Source: `lessons/dto-conversions/002-command-value/compile_fail/command_serde_free.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");
    let _ = serde_json::to_string(&command).unwrap();
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/dto-conversions/002-command-value/solution/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}
```

### Completion explanation

The DTO stays a boundary shape, while the command is a domain/application shape with private state and a narrow API.

### Author notes

Teaches register-command-value with cumulative, idiomatic Rust code.

---

## 51. Convert JSON DTOs into commands with TryFrom

Source: `lessons/dto-conversions/003-dto-tryfrom`

| Field | Value |
| --- | --- |
| Lesson ID | `dto-tryfrom-command-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/dto-tryfrom-command-003) |
| Arc | Converting DTOs into domain commands (step 3 of 6) |
| Concept | Convert a DTO into a command with TryFrom (`dto-tryfrom-validation`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A raw DTO can be missing required fields. TryFrom gives the adapter a standard fallible conversion into the application command.

### Task

Add RegisterUserValidationError and implement TryFrom<RegisterUserDto> for RegisterUserCommand. Return typed errors for missing email or display_name fields.

### Concept context

A raw DTO can be missing required fields. TryFrom gives the adapter a standard fallible conversion into the application command.

- Prerequisites: `register-command-value`
- Tags: `conversion`, `tryfrom`, `validation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/dto-conversions/003-dto-tryfrom/starter/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

// TODO: add typed validation errors and TryFrom<RegisterUserDto>.
```

#### `tests/public.rs` — test

Source: `lessons/dto-conversions/003-dto-tryfrom/tests/public.rs`

```rust
use rust_daily_lesson::{RegisterUserCommand, RegisterUserDto, RegisterUserValidationError};

#[test]
fn converts_deserialized_dto_into_command() {
    let dto: RegisterUserDto = serde_json::from_str(
        r#"{"email":"ada@example.com","display_name":"Ada"}"#,
    )
    .expect("DTO JSON should deserialize");

    let command = RegisterUserCommand::try_from(dto).expect("DTO should be valid");

    assert_eq!(command.email(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}

#[test]
fn missing_display_name_is_typed_error() {
    let dto: RegisterUserDto = serde_json::from_str(r#"{"email":"ada@example.com"}"#)
        .expect("DTO JSON should deserialize");

    assert_eq!(
        RegisterUserCommand::try_from(dto),
        Err(RegisterUserValidationError::MissingDisplayName)
    );
}
```

### Progressive hints

1. Deserialize gets data into the DTO; TryFrom moves it into validated application data.
2. Use ok_or for missing Option fields.
3. The domain command should still have no serde derive. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "RegisterUserValidationError",
          "requiredVariants": [
            "MissingEmail",
            "MissingDisplayName"
          ]
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<RegisterUserDto>",
          "typeName": "RegisterUserCommand"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "cases": [
        {
          "name": "command-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/command_direct_fields.rs"
        },
        {
          "name": "command-serde-free",
          "expectedDiagnostics": [
            "Serialize"
          ],
          "sourcePath": "compile_fail/command_serde_free.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### command-direct-fields

Source: `lessons/dto-conversions/003-dto-tryfrom/compile_fail/command_direct_fields.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let _ = RegisterUserCommand {
        email: String::from("ada@example.com"),
        display_name: String::from("Ada"),
    };
}
```

##### command-serde-free

Source: `lessons/dto-conversions/003-dto-tryfrom/compile_fail/command_serde_free.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");
    let _ = serde_json::to_string(&command).unwrap();
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/dto-conversions/003-dto-tryfrom/solution/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        Ok(Self {
            email: value
                .email
                .ok_or(RegisterUserValidationError::MissingEmail)?,
            display_name: value
                .display_name
                .ok_or(RegisterUserValidationError::MissingDisplayName)?,
        })
    }
}
```

### Completion explanation

The boundary conversion is now explicit and fallible, with missing JSON fields mapped into typed validation errors.

### Author notes

Teaches dto-tryfrom-validation with cumulative, idiomatic Rust code.

---

## 52. Trim DTO fields before command creation

Source: `lessons/dto-conversions/004-trim-empty`

| Field | Value |
| --- | --- |
| Lesson ID | `dto-trim-empty-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/dto-trim-empty-004) |
| Arc | Converting DTOs into domain commands (step 4 of 6) |
| Concept | Trim and reject empty DTO fields (`dto-trim-validation`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Boundary strings often contain whitespace. Normalize only after checking the DTO field exists, then reject empty normalized values explicitly.

### Task

Update TryFrom<RegisterUserDto> so it trims both strings and returns EmptyEmail or EmptyDisplayName when a trimmed field is empty.

### Concept context

Boundary strings often contain whitespace. Normalize only after checking the DTO field exists, then reject empty normalized values explicitly.

- Prerequisites: `dto-tryfrom-validation`
- Tags: `conversion`, `normalization`, `validation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/dto-conversions/004-trim-empty/starter/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        Ok(Self {
            email: value
                .email
                .ok_or(RegisterUserValidationError::MissingEmail)?,
            display_name: value
                .display_name
                .ok_or(RegisterUserValidationError::MissingDisplayName)?,
        })
    }
}

// TODO: trim fields and reject empty values.
```

#### `tests/public.rs` — test

Source: `lessons/dto-conversions/004-trim-empty/tests/public.rs`

```rust
use rust_daily_lesson::{RegisterUserCommand, RegisterUserDto, RegisterUserValidationError};

#[test]
fn trims_deserialized_fields_before_storing_command() {
    let dto: RegisterUserDto = serde_json::from_str(
        r#"{"email":"  ada@example.com  ","display_name":"  Ada  "}"#,
    )
    .expect("DTO JSON should deserialize");

    let command = RegisterUserCommand::try_from(dto).expect("DTO should be valid");

    assert_eq!(command.email(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}

#[test]
fn rejects_trimmed_empty_email() {
    let dto = RegisterUserDto {
        email: Some("   ".to_owned()),
        display_name: Some("Ada".to_owned()),
    };

    assert_eq!(
        RegisterUserCommand::try_from(dto),
        Err(RegisterUserValidationError::EmptyEmail)
    );
}
```

### Progressive hints

1. Normalize at the boundary before constructing the command.
2. Trim borrowed string slices first, then allocate only once for accepted values.
3. Add EmptyEmail and EmptyDisplayName to the validation enum. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "RegisterUserValidationError",
          "requiredVariants": [
            "EmptyEmail",
            "EmptyDisplayName"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "trim()"
          ],
          "forbiddenSnippets": [
            "unwrap()"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "cases": [
        {
          "name": "command-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/command_direct_fields.rs"
        },
        {
          "name": "command-serde-free",
          "expectedDiagnostics": [
            "Serialize"
          ],
          "sourcePath": "compile_fail/command_serde_free.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### command-direct-fields

Source: `lessons/dto-conversions/004-trim-empty/compile_fail/command_direct_fields.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let _ = RegisterUserCommand {
        email: String::from("ada@example.com"),
        display_name: String::from("Ada"),
    };
}
```

##### command-serde-free

Source: `lessons/dto-conversions/004-trim-empty/compile_fail/command_serde_free.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");
    let _ = serde_json::to_string(&command).unwrap();
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/dto-conversions/004-trim-empty/solution/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
    EmptyEmail,
    EmptyDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        let email = value
            .email
            .ok_or(RegisterUserValidationError::MissingEmail)?;
        let display_name = value
            .display_name
            .ok_or(RegisterUserValidationError::MissingDisplayName)?;
        let email = email.trim();
        let display_name = display_name.trim();

        if email.is_empty() {
            return Err(RegisterUserValidationError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RegisterUserValidationError::EmptyDisplayName);
        }

        Ok(Self {
            email: email.to_owned(),
            display_name: display_name.to_owned(),
        })
    }
}
```

### Completion explanation

The DTO conversion now performs boundary normalization without leaking whitespace-only values into the command.

### Author notes

Teaches dto-trim-validation with cumulative, idiomatic Rust code.

---

## 53. Deserialize and validate a bulk DTO

Source: `lessons/dto-conversions/005-bulk-dto`

| Field | Value |
| --- | --- |
| Lesson ID | `dto-bulk-conversion-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/dto-bulk-conversion-005) |
| Arc | Converting DTOs into domain commands (step 5 of 6) |
| Concept | Convert a bulk DTO with indexed errors (`dto-nested-conversions`) |
| Difficulty | medium |
| Estimated time | 10 minutes |

### Scenario

Batch adapter input needs useful error context. Preserve the row index when one nested DTO cannot become a command.

### Task

Add BulkRegisterDto with serde::Deserialize, BulkRegisterCommand, and BulkRegisterError. Implement TryFrom<BulkRegisterDto>, rejecting empty batches and reporting the index of the first invalid nested DTO.

### Concept context

Batch adapter input needs useful error context. Preserve the row index when one nested DTO cannot become a command.

- Prerequisites: `dto-trim-validation`
- Tags: `conversion`, `collections`, `errors`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/dto-conversions/005-bulk-dto/starter/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
    EmptyEmail,
    EmptyDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        let email = value
            .email
            .ok_or(RegisterUserValidationError::MissingEmail)?;
        let display_name = value
            .display_name
            .ok_or(RegisterUserValidationError::MissingDisplayName)?;
        let email = email.trim();
        let display_name = display_name.trim();

        if email.is_empty() {
            return Err(RegisterUserValidationError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RegisterUserValidationError::EmptyDisplayName);
        }

        Ok(Self {
            email: email.to_owned(),
            display_name: display_name.to_owned(),
        })
    }
}

// TODO: add bulk DTO conversion with indexed errors.
```

#### `tests/public.rs` — test

Source: `lessons/dto-conversions/005-bulk-dto/tests/public.rs`

```rust
use rust_daily_lesson::{BulkRegisterCommand, BulkRegisterDto, BulkRegisterError, RegisterUserValidationError};

#[test]
fn deserializes_and_converts_bulk_dto() {
    let dto: BulkRegisterDto = serde_json::from_str(
        r#"{"users":[{"email":"ada@example.com","display_name":"Ada"}]}"#,
    )
    .expect("bulk DTO should deserialize");

    let command = BulkRegisterCommand::try_from(dto).expect("bulk DTO should be valid");

    assert_eq!(command.commands().len(), 1);
    assert_eq!(command.commands()[0].email(), "ada@example.com");
}

#[test]
fn reports_first_invalid_user_index() {
    let dto: BulkRegisterDto = serde_json::from_str(
        r#"{"users":[{"email":"ada@example.com","display_name":"Ada"},{"email":"","display_name":"Grace"}]}"#,
    )
    .expect("bulk DTO should deserialize");

    assert_eq!(
        BulkRegisterCommand::try_from(dto),
        Err(BulkRegisterError::InvalidUser {
            index: 1,
            error: RegisterUserValidationError::EmptyEmail,
        })
    );
}
```

### Progressive hints

1. The bulk DTO is another transport shape, so it can derive Deserialize.
2. Convert each nested DTO through the single-user TryFrom implementation.
3. Use enumerate so InvalidUser can report the failing index. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "BulkRegisterDto",
          "requiredFields": [
            {
              "name": "users",
              "typeIncludes": [
                "Vec",
                "RegisterUserDto"
              ]
            }
          ]
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<BulkRegisterDto>",
          "typeName": "BulkRegisterCommand"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "cases": [
        {
          "name": "command-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/command_direct_fields.rs"
        },
        {
          "name": "command-serde-free",
          "expectedDiagnostics": [
            "Serialize"
          ],
          "sourcePath": "compile_fail/command_serde_free.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### command-direct-fields

Source: `lessons/dto-conversions/005-bulk-dto/compile_fail/command_direct_fields.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let _ = RegisterUserCommand {
        email: String::from("ada@example.com"),
        display_name: String::from("Ada"),
    };
}
```

##### command-serde-free

Source: `lessons/dto-conversions/005-bulk-dto/compile_fail/command_serde_free.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");
    let _ = serde_json::to_string(&command).unwrap();
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/dto-conversions/005-bulk-dto/solution/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
    EmptyEmail,
    EmptyDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        let email = value
            .email
            .ok_or(RegisterUserValidationError::MissingEmail)?;
        let display_name = value
            .display_name
            .ok_or(RegisterUserValidationError::MissingDisplayName)?;
        let email = email.trim();
        let display_name = display_name.trim();

        if email.is_empty() {
            return Err(RegisterUserValidationError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RegisterUserValidationError::EmptyDisplayName);
        }

        Ok(Self {
            email: email.to_owned(),
            display_name: display_name.to_owned(),
        })
    }
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct BulkRegisterDto {
    pub users: Vec<RegisterUserDto>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BulkRegisterCommand {
    commands: Vec<RegisterUserCommand>,
}

impl BulkRegisterCommand {
    pub fn commands(&self) -> &[RegisterUserCommand] {
        &self.commands
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BulkRegisterError {
    EmptyBatch,
    InvalidUser {
        index: usize,
        error: RegisterUserValidationError,
    },
}

impl TryFrom<BulkRegisterDto> for BulkRegisterCommand {
    type Error = BulkRegisterError;

    fn try_from(value: BulkRegisterDto) -> Result<Self, Self::Error> {
        if value.users.is_empty() {
            return Err(BulkRegisterError::EmptyBatch);
        }

        let mut commands = Vec::with_capacity(value.users.len());
        for (index, dto) in value.users.into_iter().enumerate() {
            let command = RegisterUserCommand::try_from(dto)
                .map_err(|error| BulkRegisterError::InvalidUser { index, error })?;
            commands.push(command);
        }

        Ok(Self { commands })
    }
}
```

### Completion explanation

Bulk conversion now reuses the single DTO boundary rules and adds batch-level errors without duplicating validation.

### Author notes

Teaches dto-nested-conversions with cumulative, idiomatic Rust code.

---

## 54. Serialize an outbound DTO from a domain event

Source: `lessons/dto-conversions/006-outbound-from`

| Field | Value |
| --- | --- |
| Lesson ID | `dto-outbound-from-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/dto-outbound-from-006) |
| Arc | Converting DTOs into domain commands (step 6 of 6) |
| Concept | Convert a domain event into an outbound DTO (`from-dto-outbound`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

Outbound adapters also need explicit boundaries. A domain event can become a transport DTO through an infallible From implementation.

### Task

Add UserRegistered and UserRegisteredDto. Derive serde::Serialize for the outbound DTO and implement From<UserRegistered> for UserRegisteredDto by stringifying user_id and moving email.

### Concept context

Outbound adapters also need explicit boundaries. A domain event can become a transport DTO through an infallible From implementation.

- Prerequisites: `dto-nested-conversions`
- Tags: `conversion`, `from`, `dto`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/dto-conversions/006-outbound-from/starter/src/lib.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
    EmptyEmail,
    EmptyDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        let email = value
            .email
            .ok_or(RegisterUserValidationError::MissingEmail)?;
        let display_name = value
            .display_name
            .ok_or(RegisterUserValidationError::MissingDisplayName)?;
        let email = email.trim();
        let display_name = display_name.trim();

        if email.is_empty() {
            return Err(RegisterUserValidationError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RegisterUserValidationError::EmptyDisplayName);
        }

        Ok(Self {
            email: email.to_owned(),
            display_name: display_name.to_owned(),
        })
    }
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct BulkRegisterDto {
    pub users: Vec<RegisterUserDto>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BulkRegisterCommand {
    commands: Vec<RegisterUserCommand>,
}

impl BulkRegisterCommand {
    pub fn commands(&self) -> &[RegisterUserCommand] {
        &self.commands
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BulkRegisterError {
    EmptyBatch,
    InvalidUser {
        index: usize,
        error: RegisterUserValidationError,
    },
}

impl TryFrom<BulkRegisterDto> for BulkRegisterCommand {
    type Error = BulkRegisterError;

    fn try_from(value: BulkRegisterDto) -> Result<Self, Self::Error> {
        if value.users.is_empty() {
            return Err(BulkRegisterError::EmptyBatch);
        }

        let mut commands = Vec::with_capacity(value.users.len());
        for (index, dto) in value.users.into_iter().enumerate() {
            let command = RegisterUserCommand::try_from(dto)
                .map_err(|error| BulkRegisterError::InvalidUser { index, error })?;
            commands.push(command);
        }

        Ok(Self { commands })
    }
}

// TODO: add the outbound serializable DTO conversion.
```

#### `tests/public.rs` — test

Source: `lessons/dto-conversions/006-outbound-from/tests/public.rs`

```rust
use rust_daily_lesson::{UserRegistered, UserRegisteredDto};

#[test]
fn serializes_outbound_dto_shape() {
    let dto = UserRegisteredDto::from(UserRegistered {
        user_id: 42,
        email: "ada@example.com".to_owned(),
    });

    let json = serde_json::to_value(&dto).expect("DTO should serialize");

    assert_eq!(
        json,
        serde_json::json!({
            "id": "42",
            "email": "ada@example.com"
        })
    );
}
```

### Progressive hints

1. Outbound DTOs are also boundary types, so deriving Serialize belongs there.
2. Keep the domain event free of serde derives.
3. Use From because this conversion cannot fail. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "derived_trait_for_type",
          "traitName": "serde::Serialize",
          "typeName": "UserRegisteredDto"
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "From<UserRegistered>",
          "typeName": "UserRegisteredDto"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "cases": [
        {
          "name": "command-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/command_direct_fields.rs"
        },
        {
          "name": "command-serde-free",
          "expectedDiagnostics": [
            "Serialize"
          ],
          "sourcePath": "compile_fail/command_serde_free.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### command-direct-fields

Source: `lessons/dto-conversions/006-outbound-from/compile_fail/command_direct_fields.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let _ = RegisterUserCommand {
        email: String::from("ada@example.com"),
        display_name: String::from("Ada"),
    };
}
```

##### command-serde-free

Source: `lessons/dto-conversions/006-outbound-from/compile_fail/command_serde_free.rs`

```rust
use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");
    let _ = serde_json::to_string(&command).unwrap();
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/dto-conversions/006-outbound-from/solution/src/lib.rs`

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
    EmptyEmail,
    EmptyDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        let email = value
            .email
            .ok_or(RegisterUserValidationError::MissingEmail)?;
        let display_name = value
            .display_name
            .ok_or(RegisterUserValidationError::MissingDisplayName)?;
        let email = email.trim();
        let display_name = display_name.trim();

        if email.is_empty() {
            return Err(RegisterUserValidationError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RegisterUserValidationError::EmptyDisplayName);
        }

        Ok(Self {
            email: email.to_owned(),
            display_name: display_name.to_owned(),
        })
    }
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct BulkRegisterDto {
    pub users: Vec<RegisterUserDto>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BulkRegisterCommand {
    commands: Vec<RegisterUserCommand>,
}

impl BulkRegisterCommand {
    pub fn commands(&self) -> &[RegisterUserCommand] {
        &self.commands
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BulkRegisterError {
    EmptyBatch,
    InvalidUser {
        index: usize,
        error: RegisterUserValidationError,
    },
}

impl TryFrom<BulkRegisterDto> for BulkRegisterCommand {
    type Error = BulkRegisterError;

    fn try_from(value: BulkRegisterDto) -> Result<Self, Self::Error> {
        if value.users.is_empty() {
            return Err(BulkRegisterError::EmptyBatch);
        }

        let mut commands = Vec::with_capacity(value.users.len());
        for (index, dto) in value.users.into_iter().enumerate() {
            let command = RegisterUserCommand::try_from(dto)
                .map_err(|error| BulkRegisterError::InvalidUser { index, error })?;
            commands.push(command);
        }

        Ok(Self { commands })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserRegistered {
    pub user_id: u64,
    pub email: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct UserRegisteredDto {
    pub id: String,
    pub email: String,
}

impl From<UserRegistered> for UserRegisteredDto {
    fn from(value: UserRegistered) -> Self {
        Self {
            id: value.user_id.to_string(),
            email: value.email,
        }
    }
}
```

### Completion explanation

Inbound and outbound serde now live at the transport boundary, while command and event domain types remain independent from JSON details.

### Author notes

Teaches from-dto-outbound with cumulative, idiomatic Rust code.

---

## 55. Wrap order lines behind a slice API

Source: `lessons/collection-wrappers/001-wrap-collection`

| Field | Value |
| --- | --- |
| Lesson ID | `wrap-collection-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/wrap-collection-001) |
| Arc | Exposing iteration on collection wrappers (step 1 of 6) |
| Concept | Wrap order lines in a collection type (`wrap-collection`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

A collection wrapper can own a Vec while keeping later invariants and iteration APIs under one type.

### Task

Define OrderLines with a private Vec<OrderLine>, a constructor, len, is_empty, and as_slice so callers can inspect lines without taking ownership of the Vec.

### Concept context

A collection wrapper can own a Vec while keeping later invariants and iteration APIs under one type.

- Prerequisites: None
- Tags: `collections`, `domain`, `encapsulation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/collection-wrappers/001-wrap-collection/starter/src/lib.rs`

```rust
// TODO: wrap order lines in an API-owned collection type.
```

#### `tests/public.rs` — test

Source: `lessons/collection-wrappers/001-wrap-collection/tests/public.rs`

```rust
use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn exposes_lines_as_slice_without_moving_vec() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);

    assert_eq!(lines.len(), 1);
    assert!(!lines.is_empty());
    assert_eq!(lines.as_slice()[0].sku, "A");
}
```

### Progressive hints

1. Keep the Vec private so the wrapper can protect future invariants.
2. Return a slice for read-only access instead of cloning or exposing the Vec.
3. Add as_slice alongside len and is_empty. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "OrderLines",
          "requiredFields": [
            {
              "name": "lines",
              "typeIncludes": [
                "Vec",
                "OrderLine"
              ]
            }
          ]
        },
        {
          "type": "impl_method",
          "implFor": "OrderLines",
          "methodName": "as_slice",
          "requiredSignatureIncludes": [
            "fn as_slice(&self) -> &[OrderLine]"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/collection-wrappers/001-wrap-collection/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}
```

### Completion explanation

OrderLines now owns its representation while exposing a cheap borrowed view for callers.

### Author notes

Teaches wrap-collection with cumulative, idiomatic Rust code.

---

## 56. Expose borrowed iteration explicitly

Source: `lessons/collection-wrappers/002-borrowed-iter-method`

| Field | Value |
| --- | --- |
| Lesson ID | `wrap-borrowed-iter-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/wrap-borrowed-iter-002) |
| Arc | Exposing iteration on collection wrappers (step 2 of 6) |
| Concept | Expose borrowed iteration with iter (`wrap-borrowed-iter`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Callers often need to inspect a collection wrapper without consuming it. A borrowed iterator exposes a view without leaking fields.

### Task

Add OrderLines::iter(&self) -> std::slice::Iter<'_, OrderLine>. Keep as_slice so callers can choose either a slice or an iterator.

### Concept context

Callers often need to inspect a collection wrapper without consuming it. A borrowed iterator exposes a view without leaking fields.

- Prerequisites: `wrap-collection`
- Tags: `collections`, `borrowing`, `iterators`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/collection-wrappers/002-borrowed-iter-method/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

// TODO: add the borrowed iter method.
```

#### `tests/public.rs` — test

Source: `lessons/collection-wrappers/002-borrowed-iter-method/tests/public.rs`

```rust
use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn iter_yields_borrowed_lines() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);
    let skus: Vec<&str> = lines.iter().map(|line| line.sku.as_str()).collect();

    assert_eq!(skus, vec!["A"]);
    assert_eq!(lines.len(), 1);
}
```

### Progressive hints

1. iter should borrow self; it should not clone the Vec.
2. The item type should be &OrderLine.
3. Delegate to self.lines.iter(). The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "OrderLines",
          "methodName": "iter",
          "requiredSignatureIncludes": [
            "fn iter(&self) -> std::slice::Iter"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/collection-wrappers/002-borrowed-iter-method/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}
```

### Completion explanation

The wrapper now supports idiomatic borrowed iteration without exposing its inner Vec.

### Author notes

Teaches wrap-borrowed-iter with cumulative, idiomatic Rust code.

---

## 57. Consume a wrapper with owned IntoIterator

Source: `lessons/collection-wrappers/003-owned-intoiterator`

| Field | Value |
| --- | --- |
| Lesson ID | `wrap-owned-intoiterator-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/wrap-owned-intoiterator-003) |
| Arc | Exposing iteration on collection wrappers (step 3 of 6) |
| Concept | Consume a wrapper with IntoIterator (`wrap-into-iterator`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

When callers are done with a wrapper, IntoIterator should let them move owned values out naturally.

### Task

Implement IntoIterator for OrderLines, yielding owned OrderLine values through std::vec::IntoIter<OrderLine>.

### Concept context

When callers are done with a wrapper, IntoIterator should let them move owned values out naturally.

- Prerequisites: `wrap-borrowed-iter`
- Tags: `collections`, `conversion`, `intoiterator`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/collection-wrappers/003-owned-intoiterator/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

// TODO: add owned IntoIterator for OrderLines.
```

#### `tests/public.rs` — test

Source: `lessons/collection-wrappers/003-owned-intoiterator/tests/public.rs`

```rust
use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn owned_iteration_moves_lines_out() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);
    let skus: Vec<String> = lines.into_iter().map(|line| line.sku).collect();

    assert_eq!(skus, vec!["A".to_owned()]);
}
```

### Progressive hints

1. Owned IntoIterator should consume self.
2. The item type is OrderLine, not &OrderLine.
3. Move the inner Vec into its own iterator. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "IntoIterator",
          "typeName": "OrderLines"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/collection-wrappers/003-owned-intoiterator/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}
```

### Completion explanation

Callers can now choose ownership transfer with for line in lines when they are done with the wrapper.

### Author notes

Teaches wrap-into-iterator with cumulative, idiomatic Rust code.

---

## 58. Borrow a wrapper directly in for loops

Source: `lessons/collection-wrappers/004-ref-intoiterator`

| Field | Value |
| --- | --- |
| Lesson ID | `wrap-ref-intoiterator-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/wrap-ref-intoiterator-004) |
| Arc | Exposing iteration on collection wrappers (step 4 of 6) |
| Concept | Iterate over borrowed collection wrappers (`wrap-ref-into-iterator`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

For loops over &OrderLines should borrow each line instead of consuming the wrapper.

### Task

Implement IntoIterator for &OrderLines, yielding &OrderLine values and delegating to OrderLines::iter.

### Concept context

For loops over &OrderLines should borrow each line instead of consuming the wrapper.

- Prerequisites: `wrap-into-iterator`
- Tags: `collections`, `borrowing`, `intoiterator`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/collection-wrappers/004-ref-intoiterator/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}

// TODO: add borrowed IntoIterator for &OrderLines.
```

#### `tests/public.rs` — test

Source: `lessons/collection-wrappers/004-ref-intoiterator/tests/public.rs`

```rust
use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn borrowed_wrapper_iterates_without_consuming() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);
    let mut total = 0;

    for line in &lines {
        total += line.quantity;
    }

    assert_eq!(total, 2);
    assert_eq!(lines.len(), 1);
}
```

### Progressive hints

1. This implementation makes for line in &lines work.
2. The item type should be a shared borrow.
3. Delegate to self.iter() so the iterator logic stays in one place. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "impl<'a> IntoIterator for &'a OrderLines",
            "type Item = &'a OrderLine"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/collection-wrappers/004-ref-intoiterator/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}

impl<'a> IntoIterator for &'a OrderLines {
    type Item = &'a OrderLine;
    type IntoIter = std::slice::Iter<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}
```

### Completion explanation

OrderLines now behaves like standard collections in borrowed for loops.

### Author notes

Teaches wrap-ref-into-iterator with cumulative, idiomatic Rust code.

---

## 59. Mutate through wrapper iterators

Source: `lessons/collection-wrappers/005-mut-intoiterator`

| Field | Value |
| --- | --- |
| Lesson ID | `wrap-mut-intoiterator-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/wrap-mut-intoiterator-005) |
| Arc | Exposing iteration on collection wrappers (step 5 of 6) |
| Concept | Iterate mutably over collection wrappers (`wrap-mut-into-iterator`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Some update operations should borrow the wrapper mutably and edit each line in place without exposing the Vec field.

### Task

Add iter_mut and implement IntoIterator for &mut OrderLines, yielding &mut OrderLine values without exposing the inner Vec.

### Concept context

Some update operations should borrow the wrapper mutably and edit each line in place without exposing the Vec field.

- Prerequisites: `wrap-ref-into-iterator`
- Tags: `collections`, `borrowing`, `mutation`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/collection-wrappers/005-mut-intoiterator/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}

impl<'a> IntoIterator for &'a OrderLines {
    type Item = &'a OrderLine;
    type IntoIter = std::slice::Iter<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

// TODO: add mutable iteration over OrderLines.
```

#### `tests/public.rs` — test

Source: `lessons/collection-wrappers/005-mut-intoiterator/tests/public.rs`

```rust
use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn mutable_iteration_updates_lines_in_place() {
    let mut lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);

    for line in &mut lines {
        line.quantity += 3;
    }

    assert_eq!(lines.as_slice()[0].quantity, 5);
}
```

### Progressive hints

1. Mutable iteration should borrow the wrapper mutably.
2. Yield &mut OrderLine so callers can update line fields in place.
3. Delegate the IntoIterator implementation to iter_mut. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "OrderLines",
          "methodName": "iter_mut",
          "requiredSignatureIncludes": [
            "fn iter_mut(&mut self) -> std::slice::IterMut"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "impl<'a> IntoIterator for &'a mut OrderLines",
            "type Item = &'a mut OrderLine"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/collection-wrappers/005-mut-intoiterator/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}

impl<'a> IntoIterator for &'a OrderLines {
    type Item = &'a OrderLine;
    type IntoIter = std::slice::Iter<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

impl OrderLines {
    pub fn iter_mut(&mut self) -> std::slice::IterMut<'_, OrderLine> {
        self.lines.iter_mut()
    }
}

impl<'a> IntoIterator for &'a mut OrderLines {
    type Item = &'a mut OrderLine;
    type IntoIter = std::slice::IterMut<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter_mut()
    }
}
```

### Completion explanation

The wrapper supports controlled in-place updates while preserving ownership of the collection.

### Author notes

Teaches wrap-mut-into-iterator with cumulative, idiomatic Rust code.

---

## 60. Validate and drain collection wrappers

Source: `lessons/collection-wrappers/006-nonempty-tryfrom`

| Field | Value |
| --- | --- |
| Lesson ID | `wrap-nonempty-tryfrom-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/wrap-nonempty-tryfrom-006) |
| Arc | Exposing iteration on collection wrappers (step 6 of 6) |
| Concept | Validate collection wrappers with TryFrom (`wrap-nonempty-tryfrom`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

An order without lines is invalid. TryFrom<Vec<OrderLine>> can enforce that invariant, but only if direct empty construction is no longer public.

### Task

Keep the iterator API active. Make the existing OrderLines::new constructor private, add drain(&mut self), and implement TryFrom<Vec<OrderLine>> for OrderLines, returning OrderLinesError::Empty for an empty Vec.

### Concept context

An order without lines is invalid. TryFrom<Vec<OrderLine>> can enforce that invariant at the wrapper boundary.

- Prerequisites: `wrap-mut-into-iterator`
- Tags: `conversion`, `tryfrom`, `collections`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/collection-wrappers/006-nonempty-tryfrom/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}

impl<'a> IntoIterator for &'a OrderLines {
    type Item = &'a OrderLine;
    type IntoIter = std::slice::Iter<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

impl OrderLines {
    pub fn iter_mut(&mut self) -> std::slice::IterMut<'_, OrderLine> {
        self.lines.iter_mut()
    }
}

impl<'a> IntoIterator for &'a mut OrderLines {
    type Item = &'a mut OrderLine;
    type IntoIter = std::slice::IterMut<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter_mut()
    }
}

// TODO: add drain and non-empty TryFrom validation.
```

#### `tests/public.rs` — test

Source: `lessons/collection-wrappers/006-nonempty-tryfrom/tests/public.rs`

```rust
use rust_daily_lesson::{OrderLine, OrderLines, OrderLinesError};

#[test]
fn validates_nonempty_lines() {
    assert_eq!(OrderLines::try_from(Vec::new()), Err(OrderLinesError::Empty));
    assert_eq!(
        OrderLines::try_from(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]).map(|lines| lines.len()),
        Ok(1)
    );
}

#[test]
fn drains_owned_lines() {
    let mut lines = OrderLines::try_from(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]).expect("line is present");
    let drained: Vec<OrderLine> = lines.drain().collect();

    assert_eq!(drained.len(), 1);
    assert!(lines.is_empty());
}
```

### Progressive hints

1. TryFrom is the right public API when construction can fail.
2. Keep new available to this module by removing pub. TryFrom can still call Self::new after checking that the Vec is not empty.
3. Use the private constructor after the non-empty check passes. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "OrderLinesError",
          "requiredVariants": [
            "Empty"
          ]
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<Vec<OrderLine>>",
          "typeName": "OrderLines"
        },
        {
          "type": "impl_method",
          "implFor": "OrderLines",
          "methodName": "drain",
          "requiredSignatureIncludes": [
            "fn drain(&mut self) -> std::vec::Drain"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "orderlines-new-is-private",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/orderlines_new_is_private.rs"
        },
        {
          "name": "orderlines-direct-fields",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/orderlines_direct_fields.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### orderlines-new-is-private

Source: `lessons/collection-wrappers/006-nonempty-tryfrom/compile_fail/orderlines_new_is_private.rs`

```rust
use rust_daily_lesson::{OrderLine, OrderLines};

fn main() {
    let _ = OrderLines::new(Vec::<OrderLine>::new());
}
```

##### orderlines-direct-fields

Source: `lessons/collection-wrappers/006-nonempty-tryfrom/compile_fail/orderlines_direct_fields.rs`

```rust
use rust_daily_lesson::OrderLines;

fn main() {
    let _ = OrderLines { lines: Vec::new() };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/collection-wrappers/006-nonempty-tryfrom/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}

impl<'a> IntoIterator for &'a OrderLines {
    type Item = &'a OrderLine;
    type IntoIter = std::slice::Iter<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

impl OrderLines {
    pub fn iter_mut(&mut self) -> std::slice::IterMut<'_, OrderLine> {
        self.lines.iter_mut()
    }
}

impl<'a> IntoIterator for &'a mut OrderLines {
    type Item = &'a mut OrderLine;
    type IntoIter = std::slice::IterMut<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter_mut()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderLinesError {
    Empty,
}

impl OrderLines {
    pub fn drain(&mut self) -> std::vec::Drain<'_, OrderLine> {
        self.lines.drain(..)
    }
}

impl TryFrom<Vec<OrderLine>> for OrderLines {
    type Error = OrderLinesError;

    fn try_from(lines: Vec<OrderLine>) -> Result<Self, Self::Error> {
        if lines.is_empty() {
            return Err(OrderLinesError::Empty);
        }

        Ok(Self::new(lines))
    }
}
```

### Completion explanation

OrderLines now has a complete collection-shaped API plus one public fallible construction path for the non-empty invariant. Direct empty construction is rejected at compile time.

### Author notes

Teaches wrap-nonempty-tryfrom with cumulative, idiomatic Rust code.

---

## 61. Derive a typed config error with thiserror

Source: `lessons/config-loader-errors/001-error-enum`

| Field | Value |
| --- | --- |
| Lesson ID | `config-err-enum-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-err-enum-001) |
| Arc | Hierarchical configuration loader errors (step 1 of 6) |
| Concept | Define ConfigLoadError variants (`config-err-enum`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

A configuration loader can fail for different reasons. Start with an enum that keeps those reasons programmatic.

### Task

Define ConfigLoadError with MissingEnvironment, InvalidPort, and FileRead variants. Derive thiserror::Error and give every variant a concise #[error(...)] message.

### Concept context

A configuration loader can fail for different reasons. Start with an enum that keeps those reasons programmatic.

- Prerequisites: None
- Tags: `errors`, `configuration`, `enums`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-loader-errors/001-error-enum/starter/src/lib.rs`

```rust
// TODO: define ConfigLoadError with thiserror.
```

#### `tests/public.rs` — test

Source: `lessons/config-loader-errors/001-error-enum/tests/public.rs`

```rust
use rust_daily_lesson::ConfigLoadError;

#[test]
fn variants_have_human_readable_messages() {
    assert_eq!(ConfigLoadError::MissingEnvironment.to_string(), "missing APP_PORT");
    assert_eq!(ConfigLoadError::InvalidPort.to_string(), "invalid APP_PORT");
    assert_eq!(ConfigLoadError::FileRead.to_string(), "failed to read config file");
}
```

### Progressive hints

1. Use thiserror::Error instead of handwritten Display and Error implementations.
2. Place one #[error("...")] attribute on each variant.
3. Keep variants semantic; messages are presentation. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "ConfigLoadError",
          "requiredVariants": [
            "MissingEnvironment",
            "InvalidPort",
            "FileRead"
          ]
        },
        {
          "type": "derived_trait_for_type",
          "traitName": "thiserror::Error",
          "typeName": "ConfigLoadError"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-loader-errors/001-error-enum/solution/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead,
}
```

### Completion explanation

ConfigLoadError is a normal typed Rust error without repetitive formatting boilerplate.

### Author notes

Teaches config-err-enum through typed, idiomatic error boundaries.

---

## 62. Separate error kinds from error messages

Source: `lessons/config-loader-errors/002-display`

| Field | Value |
| --- | --- |
| Lesson ID | `config-err-display-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-err-display-002) |
| Arc | Hierarchical configuration loader errors (step 2 of 6) |
| Concept | Format ConfigLoadError for people (`config-err-display`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

Typed errors are for programs; Display provides stable human-readable messages at the boundary.

### Task

Keep the derived thiserror messages. Add ConfigLoadError::kind(&self) -> &'static str with stable snake_case values for each variant.

### Concept context

Typed errors are for programs; Display provides stable human-readable messages at the boundary.

- Prerequisites: `config-err-enum`
- Tags: `errors`, `display`, `formatting`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-loader-errors/002-display/starter/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead,
}

// TODO: add a stable programmatic kind method.
```

#### `tests/public.rs` — test

Source: `lessons/config-loader-errors/002-display/tests/public.rs`

```rust
use rust_daily_lesson::ConfigLoadError;

#[test]
fn exposes_stable_error_kinds() {
    assert_eq!(ConfigLoadError::MissingEnvironment.kind(), "missing_environment");
    assert_eq!(ConfigLoadError::InvalidPort.kind(), "invalid_port");
    assert_eq!(ConfigLoadError::FileRead.kind(), "file_read");
}
```

### Progressive hints

1. Display text is for people; a kind value is for logs and metrics.
2. Match on self and return a static string.
3. Do not parse the Display message to classify errors. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "ConfigLoadError",
          "methodName": "kind",
          "requiredSignatureIncludes": [
            "fn kind(&self) -> &str"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-loader-errors/002-display/solution/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead,
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort => "invalid_port",
            Self::FileRead => "file_read",
        }
    }
}
```

### Completion explanation

The error now has both human-readable text and a stable machine-readable classification.

### Author notes

Teaches config-err-display through typed, idiomatic error boundaries.

---

## 63. Preserve an I/O error as a source

Source: `lessons/config-loader-errors/003-io-source`

| Field | Value |
| --- | --- |
| Lesson ID | `config-err-io-source-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-err-io-source-003) |
| Arc | Hierarchical configuration loader errors (step 3 of 6) |
| Concept | Preserve I/O source errors (`config-err-io-wrap`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

When file reading fails, the high-level config error should keep the original std::io::Error as its source.

### Task

Change FileRead into a variant that stores std::io::Error in a source field marked #[source]. Update kind without changing the public error message.

### Concept context

When file reading fails, the high-level config error should keep the original std::io::Error as its source.

- Prerequisites: `config-err-display`
- Tags: `errors`, `source`, `io`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-loader-errors/003-io-source/starter/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead,
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort => "invalid_port",
            Self::FileRead => "file_read",
        }
    }
}

// TODO: store std::io::Error in FileRead with #[source].
```

#### `tests/public.rs` — test

Source: `lessons/config-loader-errors/003-io-source/tests/public.rs`

```rust
use std::error::Error;
use rust_daily_lesson::ConfigLoadError;

#[test]
fn file_read_preserves_io_source() {
    let error = ConfigLoadError::FileRead {
        source: std::io::Error::new(std::io::ErrorKind::NotFound, "missing config"),
    };

    assert_eq!(error.kind(), "file_read");
    assert!(error.source().is_some());
    assert_eq!(error.to_string(), "failed to read config file");
}
```

### Progressive hints

1. thiserror can expose a source without a handwritten Error implementation.
2. Use a named source field while this lesson focuses on explicit source tracking.
3. Match FileRead { .. } in kind. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "ConfigLoadError",
          "requiredVariants": [
            "FileRead"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-loader-errors/003-io-source/solution/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead {
        #[source]
        source: std::io::Error,
    },
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort => "invalid_port",
            Self::FileRead { .. } => "file_read",
        }
    }
}
```

### Completion explanation

The top-level config error keeps its stable message while preserving the concrete I/O cause in the standard error chain.

### Author notes

Teaches config-err-io-wrap through typed, idiomatic error boundaries.

---

## 64. Derive mechanical I/O conversion

Source: `lessons/config-loader-errors/004-from-io`

| Field | Value |
| --- | --- |
| Lesson ID | `config-err-from-io-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-err-from-io-004) |
| Arc | Hierarchical configuration loader errors (step 4 of 6) |
| Concept | Convert io::Error with From (`config-err-from-io`) |
| Difficulty | medium |
| Estimated time | 7 minutes |

### Scenario

A From implementation centralizes how low-level I/O errors become configuration errors and enables ? at call sites.

### Task

Change FileRead to the tuple variant FileRead(#[from] std::io::Error). Let thiserror derive both Error::source and From<std::io::Error>.

### Concept context

A From implementation centralizes how low-level I/O errors become configuration errors and enables ? at call sites.

- Prerequisites: `config-err-io-wrap`
- Tags: `errors`, `from`, `conversion`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-loader-errors/004-from-io/starter/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead {
        #[source]
        source: std::io::Error,
    },
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort => "invalid_port",
            Self::FileRead { .. } => "file_read",
        }
    }
}

// TODO: replace the explicit source field with #[from].
```

#### `tests/public.rs` — test

Source: `lessons/config-loader-errors/004-from-io/tests/public.rs`

```rust
use std::error::Error;
use rust_daily_lesson::ConfigLoadError;

#[test]
fn converts_io_error_and_keeps_source() {
    let error = ConfigLoadError::from(std::io::Error::new(
        std::io::ErrorKind::PermissionDenied,
        "denied",
    ));

    assert_eq!(error.kind(), "file_read");
    assert!(error.source().is_some());
}
```

### Progressive hints

1. Use #[from] when conversion is mechanical and loses no semantic information.
2. A #[from] field is also treated as the source.
3. No handwritten From implementation is needed. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "FileRead(#[from] std::io::Error)"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-loader-errors/004-from-io/solution/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead(#[from] std::io::Error),
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort => "invalid_port",
            Self::FileRead(_) => "file_read",
        }
    }
}
```

### Completion explanation

I/O failures now convert with ? through a derived From implementation while retaining their source chain.

### Author notes

Teaches config-err-from-io through typed, idiomatic error boundaries.

---

## 65. Derive ParseIntError conversion

Source: `lessons/config-loader-errors/005-parse-port`

| Field | Value |
| --- | --- |
| Lesson ID | `config-err-parse-port-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-err-parse-port-005) |
| Arc | Hierarchical configuration loader errors (step 5 of 6) |
| Concept | Wrap ParseIntError for port parsing (`config-err-parse-wrap`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Parsing configuration values should keep lower-level parse details while returning the loader error type.

### Task

Change InvalidPort to InvalidPort(#[from] ParseIntError), update kind, and implement parse_port(&str) -> Result<u16, ConfigLoadError> using ?. 

### Concept context

Parsing configuration values should keep lower-level parse details while returning the loader error type.

- Prerequisites: `config-err-from-io`
- Tags: `errors`, `from`, `parsing`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-loader-errors/005-parse-port/starter/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead(#[from] std::io::Error),
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort => "invalid_port",
            Self::FileRead(_) => "file_read",
        }
    }
}

// TODO: store ParseIntError and implement parse_port with ?.
```

#### `tests/public.rs` — test

Source: `lessons/config-loader-errors/005-parse-port/tests/public.rs`

```rust
use rust_daily_lesson::{parse_port, ConfigLoadError};

#[test]
fn parses_valid_port() {
    assert_eq!(parse_port("8080").expect("port should parse"), 8080);
}

#[test]
fn classifies_invalid_port() {
    let error = parse_port("eight").expect_err("text is not a port");

    assert!(matches!(error, ConfigLoadError::InvalidPort(_)));
    assert_eq!(error.kind(), "invalid_port");
}
```

### Progressive hints

1. ParseIntError is the concrete cause of InvalidPort.
2. Derive From with #[from].
3. Ok(value.parse()?) keeps the success type explicit. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "InvalidPort(#[from] std::num::ParseIntError)"
          ]
        },
        {
          "type": "function_signature",
          "functionName": "parse_port",
          "requiredSignatureIncludes": [
            "fn parse_port(value: &str)",
            "Result<u16, ConfigLoadError>"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-loader-errors/005-parse-port/solution/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort(#[from] std::num::ParseIntError),
    #[error("failed to read config file")]
    FileRead(#[from] std::io::Error),
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort(_) => "invalid_port",
            Self::FileRead(_) => "file_read",
        }
    }
}

pub fn parse_port(value: &str) -> Result<u16, ConfigLoadError> {
    Ok(value.parse()?)
}
```

### Completion explanation

Port parsing now preserves the parser error and propagates it through an idiomatic derived conversion.

### Author notes

Teaches config-err-parse-wrap through typed, idiomatic error boundaries.

---

## 66. Add context at the application boundary

Source: `lessons/config-loader-errors/006-load-port`

| Field | Value |
| --- | --- |
| Lesson ID | `config-load-port-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/config-load-port-006) |
| Arc | Hierarchical configuration loader errors (step 6 of 6) |
| Concept | Propagate loader errors with ? (`config-load-error-propagation`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Once conversions exist, loader functions can stay small and let ? preserve the typed error boundary.

### Task

Implement load_port with typed ConfigLoadError values. Then add load_port_with_context returning anyhow::Result<u16> and attach "failed to load APP_PORT" context without replacing the typed inner error.

### Concept context

Once conversions exist, loader functions can stay small and let ? preserve the typed error boundary.

- Prerequisites: `config-err-parse-wrap`
- Tags: `errors`, `propagation`, `configuration`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/config-loader-errors/006-load-port/starter/src/lib.rs`

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort(#[from] std::num::ParseIntError),
    #[error("failed to read config file")]
    FileRead(#[from] std::io::Error),
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort(_) => "invalid_port",
            Self::FileRead(_) => "file_read",
        }
    }
}

pub fn parse_port(value: &str) -> Result<u16, ConfigLoadError> {
    Ok(value.parse()?)
}

// TODO: implement typed load_port and contextual load_port_with_context.
```

#### `tests/public.rs` — test

Source: `lessons/config-loader-errors/006-load-port/tests/public.rs`

```rust
use rust_daily_lesson::{load_port, load_port_with_context, ConfigLoadError};

#[test]
fn loads_and_parses_port() {
    let port = load_port(|key| (key == "APP_PORT").then(|| "8080".to_owned()))
        .expect("port should load");

    assert_eq!(port, 8080);
}

#[test]
fn missing_value_remains_typed() {
    assert!(matches!(
        load_port(|_| None),
        Err(ConfigLoadError::MissingEnvironment)
    ));
}

#[test]
fn application_boundary_adds_context() {
    let error = load_port_with_context(|_| None).expect_err("port is missing");

    assert!(format!("{error:#}").contains("failed to load APP_PORT"));
    assert!(format!("{error:#}").contains("missing APP_PORT"));
}
```

### Progressive hints

1. Keep ConfigLoadError inside the reusable loader.
2. Use anyhow::Context only where the application wants operation-level context.
3. The context should wrap the typed error, not erase it. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "load_port",
          "requiredSignatureIncludes": [
            "Result<u16, ConfigLoadError>"
          ]
        },
        {
          "type": "function_signature",
          "functionName": "load_port_with_context",
          "requiredSignatureIncludes": [
            "anyhow::Result<u16>"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            ".context(\"failed to load APP_PORT\")"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/config-loader-errors/006-load-port/solution/src/lib.rs`

```rust
use anyhow::Context;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort(#[from] std::num::ParseIntError),
    #[error("failed to read config file")]
    FileRead(#[from] std::io::Error),
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort(_) => "invalid_port",
            Self::FileRead(_) => "file_read",
        }
    }
}

pub fn parse_port(value: &str) -> Result<u16, ConfigLoadError> {
    Ok(value.parse()?)
}

pub fn load_port(
    lookup: impl Fn(&str) -> Option<String>,
) -> Result<u16, ConfigLoadError> {
    let value = lookup("APP_PORT").ok_or(ConfigLoadError::MissingEnvironment)?;

    parse_port(&value)
}

pub fn load_port_with_context(
    lookup: impl Fn(&str) -> Option<String>,
) -> anyhow::Result<u16> {
    load_port(lookup).context("failed to load APP_PORT")
}
```

### Completion explanation

Reusable code returns typed errors, while the application boundary adds operational context for diagnostics.

### Author notes

Teaches config-load-error-propagation through typed, idiomatic error boundaries.

---

## 67. Design a non-exhaustive domain error

Source: `lessons/boundary-error-mapping/001-domain-error`

| Field | Value |
| --- | --- |
| Lesson ID | `boundary-domain-error-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/boundary-domain-error-001) |
| Arc | Translating errors across boundaries (step 1 of 6) |
| Concept | Define domain order errors (`boundary-domain-error`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Domain errors should name business-rule failures without mentioning databases, HTTP, or UI details.

### Task

Define CreateOrderError with EmptyOrder and InvalidQuantity. Derive thiserror::Error, add concise messages, and mark the public enum #[non_exhaustive] so new variants remain a compatible API change.

### Concept context

Domain errors should name business-rule failures without mentioning databases, HTTP, or UI details.

- Prerequisites: None
- Tags: `domain`, `errors`, `architecture`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/boundary-error-mapping/001-domain-error/starter/src/lib.rs`

```rust
// TODO: define the public domain error surface.
```

#### `tests/public.rs` — test

Source: `lessons/boundary-error-mapping/001-domain-error/tests/public.rs`

```rust
use rust_daily_lesson::CreateOrderError;

#[test]
fn domain_errors_are_specific_and_readable() {
    assert_eq!(CreateOrderError::EmptyOrder.to_string(), "order must contain at least one line");
    assert_eq!(CreateOrderError::InvalidQuantity.to_string(), "order line quantity must be positive");
}
```

### Progressive hints

1. Public error enums often gain variants over time.
2. Use #[non_exhaustive] to force downstream wildcard handling.
3. Use thiserror for the Display and Error implementations. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "CreateOrderError",
          "requiredVariants": [
            "EmptyOrder",
            "InvalidQuantity"
          ]
        },
        {
          "type": "derived_trait_for_type",
          "traitName": "thiserror::Error",
          "typeName": "CreateOrderError"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "#[non_exhaustive]"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/boundary-error-mapping/001-domain-error/solution/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}
```

### Completion explanation

The domain error is typed, readable, and designed for API evolution.

### Author notes

Teaches boundary-domain-error through typed, idiomatic error boundaries.

---

## 68. Keep repository failures at their boundary

Source: `lessons/boundary-error-mapping/002-repository-error`

| Field | Value |
| --- | --- |
| Lesson ID | `boundary-repo-error-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/boundary-repo-error-002) |
| Arc | Translating errors across boundaries (step 2 of 6) |
| Concept | Define repository boundary errors (`boundary-repo-error`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

Repository failures are infrastructure boundary failures. Keep them distinct from domain rule failures.

### Task

Keep CreateOrderError. Add a separate #[non_exhaustive] RepositoryError with Unavailable and Conflict variants, deriving thiserror::Error instead of mixing infrastructure failures into the domain enum.

### Concept context

Repository failures are infrastructure boundary failures. Keep them distinct from domain rule failures.

- Prerequisites: `boundary-domain-error`
- Tags: `errors`, `repository`, `boundary`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/boundary-error-mapping/002-repository-error/starter/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

// TODO: add a non-exhaustive RepositoryError.
```

#### `tests/public.rs` — test

Source: `lessons/boundary-error-mapping/002-repository-error/tests/public.rs`

```rust
use rust_daily_lesson::RepositoryError;

#[test]
fn repository_errors_have_boundary_specific_messages() {
    assert_eq!(RepositoryError::Unavailable.to_string(), "repository is unavailable");
    assert_eq!(RepositoryError::Conflict.to_string(), "order conflicts with existing data");
}
```

### Progressive hints

1. Repository failures belong to the repository boundary.
2. Keep domain and persistence concerns in separate enums.
3. Mark the public repository enum non-exhaustive too. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "RepositoryError",
          "requiredVariants": [
            "Unavailable",
            "Conflict"
          ]
        },
        {
          "type": "derived_trait_for_type",
          "traitName": "thiserror::Error",
          "typeName": "RepositoryError"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/boundary-error-mapping/002-repository-error/solution/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}
```

### Completion explanation

Domain and repository failures now evolve independently and remain clear at call sites.

### Author notes

Teaches boundary-repo-error through typed, idiomatic error boundaries.

---

## 69. Compose boundary errors without flattening them

Source: `lessons/boundary-error-mapping/003-usecase-error`

| Field | Value |
| --- | --- |
| Lesson ID | `boundary-usecase-error-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/boundary-usecase-error-003) |
| Arc | Translating errors across boundaries (step 3 of 6) |
| Concept | Define use-case error variants (`boundary-usecase-error`) |
| Difficulty | medium |
| Estimated time | 7 minutes |

### Scenario

The application layer can compose domain and repository errors without leaking adapter response details.

### Task

Define #[non_exhaustive] CreateOrderUseCaseError with Domain(CreateOrderError) and Repository(RepositoryError). Derive thiserror::Error and make each wrapped error a transparent source.

### Concept context

The application layer can compose domain and repository errors without leaking adapter response details.

- Prerequisites: `boundary-repo-error`
- Tags: `errors`, `application`, `boundary`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/boundary-error-mapping/003-usecase-error/starter/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}

// TODO: add CreateOrderUseCaseError with transparent sources.
```

#### `tests/public.rs` — test

Source: `lessons/boundary-error-mapping/003-usecase-error/tests/public.rs`

```rust
use std::error::Error;
use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError};

#[test]
fn usecase_error_preserves_domain_source() {
    let error = CreateOrderUseCaseError::Domain(CreateOrderError::EmptyOrder);

    assert_eq!(error.to_string(), "domain error: order must contain at least one line");
    assert!(error.source().is_some());
}
```

### Progressive hints

1. The use case should preserve which layer failed.
2. Transparent variants reuse the wrapped error message.
3. Use #[source] before adding automatic conversions. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "CreateOrderUseCaseError",
          "requiredVariants": [
            "Domain",
            "Repository"
          ]
        },
        {
          "type": "derived_trait_for_type",
          "traitName": "thiserror::Error",
          "typeName": "CreateOrderUseCaseError"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/boundary-error-mapping/003-usecase-error/solution/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    #[error("domain error: {0}")]
    Domain(#[source] CreateOrderError),
    #[error("repository error: {0}")]
    Repository(#[source] RepositoryError),
}
```

### Completion explanation

The application error composes lower-layer failures without converting them into strings or losing their sources.

### Author notes

Teaches boundary-usecase-error through typed, idiomatic error boundaries.

---

## 70. Derive mechanical boundary conversions

Source: `lessons/boundary-error-mapping/004-from-domain`

| Field | Value |
| --- | --- |
| Lesson ID | `boundary-from-domain-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/boundary-from-domain-004) |
| Arc | Translating errors across boundaries (step 4 of 6) |
| Concept | Convert domain errors into use-case errors (`boundary-domain-from`) |
| Difficulty | medium |
| Estimated time | 7 minutes |

### Scenario

From keeps application orchestration code focused by centralizing conversion from domain errors.

### Task

Change both transparent fields from #[source] to #[from]. Let thiserror derive From<CreateOrderError> and From<RepositoryError> for CreateOrderUseCaseError.

### Concept context

From keeps application orchestration code focused by centralizing conversion from domain errors.

- Prerequisites: `boundary-usecase-error`
- Tags: `errors`, `from`, `application`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/boundary-error-mapping/004-from-domain/starter/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    #[error("domain error: {0}")]
    Domain(#[source] CreateOrderError),
    #[error("repository error: {0}")]
    Repository(#[source] RepositoryError),
}

// TODO: replace source-only fields with #[from].
```

#### `tests/public.rs` — test

Source: `lessons/boundary-error-mapping/004-from-domain/tests/public.rs`

```rust
use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn converts_domain_and_repository_errors() {
    assert_eq!(
        CreateOrderUseCaseError::from(CreateOrderError::EmptyOrder),
        CreateOrderUseCaseError::Domain(CreateOrderError::EmptyOrder)
    );
    assert_eq!(
        CreateOrderUseCaseError::from(RepositoryError::Conflict),
        CreateOrderUseCaseError::Repository(RepositoryError::Conflict)
    );
}
```

### Progressive hints

1. These conversions only wrap the original typed error.
2. Use #[from] when there is no additional policy or context.
3. The wrapped value remains the standard error source. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "Domain(#[from] CreateOrderError)",
            "Repository(#[from] RepositoryError)"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/boundary-error-mapping/004-from-domain/solution/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    #[error(transparent)]
    Domain(#[from] CreateOrderError),
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}
```

### Completion explanation

Use-case code can now use ? for both lower-layer error types without handwritten conversion boilerplate.

### Author notes

Teaches boundary-domain-from through typed, idiomatic error boundaries.

---

## 71. Classify retries without parsing messages

Source: `lessons/boundary-error-mapping/005-retryable`

| Field | Value |
| --- | --- |
| Lesson ID | `boundary-retryable-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/boundary-retryable-005) |
| Arc | Translating errors across boundaries (step 5 of 6) |
| Concept | Classify retryable boundary errors (`boundary-retryable`) |
| Difficulty | medium |
| Estimated time | 7 minutes |

### Scenario

Not every failure should be retried. Classification helpers let application code make decisions without string matching.

### Task

Implement CreateOrderUseCaseError::is_retryable. Return true only for RepositoryError::Unavailable and classify by variants, not by Display text.

### Concept context

Not every failure should be retried. Classification helpers let application code make decisions without string matching.

- Prerequisites: `boundary-domain-from`
- Tags: `errors`, `classification`, `recovery`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/boundary-error-mapping/005-retryable/starter/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    #[error(transparent)]
    Domain(#[from] CreateOrderError),
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

// TODO: add is_retryable to the use-case error.
```

#### `tests/public.rs` — test

Source: `lessons/boundary-error-mapping/005-retryable/tests/public.rs`

```rust
use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn only_repository_unavailability_is_retryable() {
    assert!(CreateOrderUseCaseError::from(RepositoryError::Unavailable).is_retryable());
    assert!(!CreateOrderUseCaseError::from(RepositoryError::Conflict).is_retryable());
    assert!(!CreateOrderUseCaseError::from(CreateOrderError::EmptyOrder).is_retryable());
}
```

### Progressive hints

1. Retry policy belongs at the application boundary.
2. Use matches! for the one retryable shape.
3. Conflicts and domain errors should not be retried automatically. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "CreateOrderUseCaseError",
          "methodName": "is_retryable",
          "requiredSignatureIncludes": [
            "fn is_retryable(&self) -> bool"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/boundary-error-mapping/005-retryable/solution/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    #[error(transparent)]
    Domain(#[from] CreateOrderError),
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

impl CreateOrderUseCaseError {
    pub fn is_retryable(&self) -> bool {
        matches!(self, Self::Repository(RepositoryError::Unavailable))
    }
}
```

### Completion explanation

Retry behavior is now explicit, typed, and independent from user-facing error wording.

### Author notes

Teaches boundary-retryable through typed, idiomatic error boundaries.

---

## 72. Map typed application errors at the adapter edge

Source: `lessons/boundary-error-mapping/006-status-code`

| Field | Value |
| --- | --- |
| Lesson ID | `boundary-status-code-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/boundary-status-code-006) |
| Arc | Translating errors across boundaries (step 6 of 6) |
| Concept | Translate application errors to status codes (`boundary-http-status`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

HTTP status codes belong at the adapter edge. Translate typed application errors there instead of putting HTTP concepts in domain code.

### Task

Implement status_code(&CreateOrderUseCaseError) -> u16 at the adapter boundary: 400 for domain errors, 409 for repository conflicts, and 503 for repository unavailability.

### Concept context

HTTP status codes belong at the adapter edge. Translate typed application errors there instead of putting HTTP concepts in domain code.

- Prerequisites: `boundary-retryable`
- Tags: `errors`, `http`, `adapter`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/boundary-error-mapping/006-status-code/starter/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    #[error(transparent)]
    Domain(#[from] CreateOrderError),
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

impl CreateOrderUseCaseError {
    pub fn is_retryable(&self) -> bool {
        matches!(self, Self::Repository(RepositoryError::Unavailable))
    }
}

// TODO: implement explicit HTTP status mapping.
```

#### `tests/public.rs` — test

Source: `lessons/boundary-error-mapping/006-status-code/tests/public.rs`

```rust
use rust_daily_lesson::{status_code, CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn maps_errors_to_boundary_statuses() {
    assert_eq!(status_code(&CreateOrderUseCaseError::from(CreateOrderError::EmptyOrder)), 400);
    assert_eq!(status_code(&CreateOrderUseCaseError::from(RepositoryError::Conflict)), 409);
    assert_eq!(status_code(&CreateOrderUseCaseError::from(RepositoryError::Unavailable)), 503);
}
```

### Progressive hints

1. HTTP status is adapter policy, not a property of the domain error.
2. Match explicitly on typed variants.
3. Keep the mapping simple and exhaustive inside the crate. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "status_code",
          "requiredSignatureIncludes": [
            "fn status_code(error: &CreateOrderUseCaseError) -> u16"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/boundary-error-mapping/006-status-code/solution/src/lib.rs`

```rust
use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    #[error(transparent)]
    Domain(#[from] CreateOrderError),
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

impl CreateOrderUseCaseError {
    pub fn is_retryable(&self) -> bool {
        matches!(self, Self::Repository(RepositoryError::Unavailable))
    }
}

pub fn status_code(error: &CreateOrderUseCaseError) -> u16 {
    match error {
        CreateOrderUseCaseError::Domain(_) => 400,
        CreateOrderUseCaseError::Repository(RepositoryError::Conflict) => 409,
        CreateOrderUseCaseError::Repository(RepositoryError::Unavailable) => 503,
    }
}
```

### Completion explanation

The adapter translates application failures into HTTP policy without leaking status codes into domain or repository types.

### Author notes

Teaches boundary-http-status through typed, idiomatic error boundaries.

---

## 73. Keep async service types out of the domain

Source: `lessons/register-user-use-case/001-domain-command`

| Field | Value |
| --- | --- |
| Lesson ID | `register-domain-command-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/register-domain-command-001) |
| Arc | Register user use case boundaries (step 1 of 6) |
| Concept | Keep register-user domain types pure (`register-domain-command`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Domain types should not depend on HTTP, JSON, databases, or logging setup. Start with pure command and value-object types.

### Task

In src/domain.rs define EmailAddress and RegisterUserCommand. Keep fields private, expose borrowed accessors, and do not import Tokio, Actix, or serde into the domain module.

### Concept context

Domain types should not depend on HTTP, JSON, databases, or logging setup. Start with pure command and value-object types.

- Prerequisites: None
- Tags: `architecture`, `domain`, `boundaries`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/register-user-use-case/001-domain-command/starter/src/lib.rs`

```rust
pub mod domain;
```

#### `src/domain.rs` — editable

Source: `lessons/register-user-use-case/001-domain-command/starter/src/domain.rs`

```rust
// TODO: define framework-free register-user domain types here.
```

#### `tests/public.rs` — test

Source: `lessons/register-user-use-case/001-domain-command/tests/public.rs`

```rust
use rust_daily_lesson::domain::{EmailAddress, RegisterUserCommand};

#[test]
fn domain_command_exposes_borrowed_values() {
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    assert_eq!(command.email().as_str(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}
```

### Progressive hints

1. The domain should not know which runtime or web framework calls it.
2. Use private owned fields and borrowed accessors.
3. Keep src/domain.rs free of framework imports. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "tuple_struct_fields",
          "structName": "EmailAddress",
          "requiredTypes": [
            "String"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "RegisterUserCommand",
          "methodName": "email",
          "requiredSignatureIncludes": [
            "fn email(&self) -> &EmailAddress"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/domain.rs`

Source: `lessons/register-user-use-case/001-domain-command/solution/src/domain.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: EmailAddress,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
        Self {
            email,
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &EmailAddress {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}
```

### Completion explanation

The core register-user types are runtime-independent and can be reused by HTTP, jobs, or tests.

### Author notes

Teaches register-domain-command with async boundaries and framework isolation.

---

## 74. Define an async repository port with Send futures

Source: `lessons/register-user-use-case/002-repository-port`

| Field | Value |
| --- | --- |
| Lesson ID | `register-repository-port-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/register-repository-port-002) |
| Arc | Register user use case boundaries (step 2 of 6) |
| Concept | Define an application repository port (`register-repository-port`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Application code depends on domain types and port traits, not concrete database clients.

### Task

In src/application.rs add UserId, NewUser, and RepositoryError. Define UserRepository: Send + Sync with methods returning impl Future + Send for email_exists and save, keeping repository details out of domain types.

### Concept context

Application code depends on domain types and port traits, not concrete database clients.

- Prerequisites: `register-domain-command`
- Tags: `architecture`, `ports`, `traits`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/register-user-use-case/002-repository-port/starter/src/lib.rs`

```rust
pub mod application;
pub mod domain;
```

#### `src/domain.rs` — readonly

Source: `lessons/register-user-use-case/002-repository-port/starter/src/domain.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: EmailAddress,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
        Self {
            email,
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &EmailAddress {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}
```

#### `src/application.rs` — editable

Source: `lessons/register-user-use-case/002-repository-port/starter/src/application.rs`

```rust
// TODO: add async UserRepository operations here.
```

#### `tests/public.rs` — test

Source: `lessons/register-user-use-case/002-repository-port/tests/public.rs`

```rust
use rust_daily_lesson::application::{NewUser, UserId};
use rust_daily_lesson::domain::{EmailAddress, RegisterUserCommand};

#[test]
fn new_user_is_built_from_domain_command() {
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");
    let user = NewUser::from_command(command);

    assert_eq!(user.email(), "ada@example.com");
    assert_eq!(user.display_name(), "Ada");
    assert_eq!(UserId::new(7).value(), 7);
}
```

### Progressive hints

1. Persistence operations are asynchronous, but a public trait should state the Send bound of each returned future.
2. Use return-position impl Future<Output = Result<...>> + Send in the trait.
3. Concrete implementations can still use async fn. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "pub trait UserRepository: Send + Sync",
            "impl std::future::Future<Output = Result<bool, RepositoryError>> + Send",
            "impl std::future::Future<Output = Result<UserId, RepositoryError>> + Send"
          ]
        },
        {
          "type": "derived_trait_for_type",
          "traitName": "thiserror::Error",
          "typeName": "RepositoryError"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/application.rs`

Source: `lessons/register-user-use-case/002-repository-port/solution/src/application.rs`

```rust
use thiserror::Error;

use crate::domain::RegisterUserCommand;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn value(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NewUser {
    email: String,
    display_name: String,
}

impl NewUser {
    pub fn from_command(command: RegisterUserCommand) -> Self {
        Self {
            email: command.email().as_str().to_owned(),
            display_name: command.display_name().to_owned(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("email already exists")]
    Conflict,
}

pub trait UserRepository: Send + Sync {
    fn email_exists(
        &self,
        email: &str,
    ) -> impl std::future::Future<Output = Result<bool, RepositoryError>> + Send;

    fn save(
        &self,
        user: NewUser,
    ) -> impl std::future::Future<Output = Result<UserId, RepositoryError>> + Send;
}
```

### Completion explanation

The application owns an async persistence contract whose returned futures are explicitly safe to move between runtime worker threads.

### Author notes

Teaches register-repository-port with async boundaries and framework isolation.

---

## 75. Implement an async use case over the port

Source: `lessons/register-user-use-case/003-usecase-function`

| Field | Value |
| --- | --- |
| Lesson ID | `register-usecase-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/register-usecase-003) |
| Arc | Register user use case boundaries (step 3 of 6) |
| Concept | Implement a use case over a port (`register-usecase-function`) |
| Difficulty | medium |
| Estimated time | 9 minutes |

### Scenario

A use case coordinates domain rules and ports. It should be generic over the port trait so infrastructure stays replaceable.

### Task

In src/application.rs add RegisterUserError and implement async register_user over UserRepository. Check for an existing email, then save NewUser. Map repository conflicts to DuplicateEmail and propagate other typed repository errors.

### Concept context

A use case coordinates domain rules and ports. It should be generic over the port trait so infrastructure stays replaceable.

- Prerequisites: `register-repository-port`
- Tags: `architecture`, `application`, `ports`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/register-user-use-case/003-usecase-function/starter/src/lib.rs`

```rust
pub mod application;
pub mod domain;
```

#### `src/domain.rs` — readonly

Source: `lessons/register-user-use-case/003-usecase-function/starter/src/domain.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: EmailAddress,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
        Self {
            email,
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &EmailAddress {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}
```

#### `src/application.rs` — editable

Source: `lessons/register-user-use-case/003-usecase-function/starter/src/application.rs`

```rust
use thiserror::Error;

use crate::domain::RegisterUserCommand;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn value(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NewUser {
    email: String,
    display_name: String,
}

impl NewUser {
    pub fn from_command(command: RegisterUserCommand) -> Self {
        Self {
            email: command.email().as_str().to_owned(),
            display_name: command.display_name().to_owned(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("email already exists")]
    Conflict,
}

pub trait UserRepository: Send + Sync {
    fn email_exists(
        &self,
        email: &str,
    ) -> impl std::future::Future<Output = Result<bool, RepositoryError>> + Send;

    fn save(
        &self,
        user: NewUser,
    ) -> impl std::future::Future<Output = Result<UserId, RepositoryError>> + Send;
}

// TODO: add RegisterUserError and async register_user.
```

#### `tests/public.rs` — test

Source: `lessons/register-user-use-case/003-usecase-function/tests/public.rs`

```rust
use rust_daily_lesson::{
    application::{NewUser, RepositoryError, UserId, UserRepository, register_user},
    domain::{EmailAddress, RegisterUserCommand},
};

struct AvailableRepository;

impl UserRepository for AvailableRepository {
    async fn email_exists(&self, _email: &str) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn save(&self, _user: NewUser) -> Result<UserId, RepositoryError> {
        Ok(UserId::new(42))
    }
}

#[actix_rt::test]
async fn registers_user_through_async_port() {
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    assert_eq!(
        register_user(&AvailableRepository, command).await,
        Ok(UserId::new(42))
    );
}
```

### Progressive hints

1. Await each repository operation at the application boundary.
2. Keep DuplicateEmail as an application-level outcome.
3. Do not convert repository errors into strings. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "register_user",
          "requiredSignatureIncludes": [
            "async fn register_user",
            "Result<UserId, RegisterUserError>"
          ]
        },
        {
          "type": "derived_trait_for_type",
          "traitName": "thiserror::Error",
          "typeName": "RegisterUserError"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/application.rs`

Source: `lessons/register-user-use-case/003-usecase-function/solution/src/application.rs`

```rust
use thiserror::Error;

use crate::domain::RegisterUserCommand;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn value(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NewUser {
    email: String,
    display_name: String,
}

impl NewUser {
    pub fn from_command(command: RegisterUserCommand) -> Self {
        Self {
            email: command.email().as_str().to_owned(),
            display_name: command.display_name().to_owned(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("email already exists")]
    Conflict,
}

pub trait UserRepository: Send + Sync {
    fn email_exists(
        &self,
        email: &str,
    ) -> impl std::future::Future<Output = Result<bool, RepositoryError>> + Send;

    fn save(
        &self,
        user: NewUser,
    ) -> impl std::future::Future<Output = Result<UserId, RepositoryError>> + Send;
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RegisterUserError {
    #[error("email already exists")]
    DuplicateEmail,
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

pub async fn register_user<R: UserRepository>(
    repository: &R,
    command: RegisterUserCommand,
) -> Result<UserId, RegisterUserError> {
    if repository.email_exists(command.email().as_str()).await? {
        return Err(RegisterUserError::DuplicateEmail);
    }

    match repository.save(NewUser::from_command(command)).await {
        Ok(user_id) => Ok(user_id),
        Err(RepositoryError::Conflict) => Err(RegisterUserError::DuplicateEmail),
        Err(error) => Err(error.into()),
    }
}
```

### Completion explanation

The use case coordinates asynchronous persistence while staying generic over the repository implementation.

### Author notes

Teaches register-usecase-function with async boundaries and framework isolation.

---

## 76. Deserialize adapter input at the edge

Source: `lessons/register-user-use-case/004-adapter-dto`

| Field | Value |
| --- | --- |
| Lesson ID | `register-adapter-dto-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/register-adapter-dto-004) |
| Arc | Register user use case boundaries (step 4 of 6) |
| Concept | Translate adapter DTOs at the edge (`register-adapter-dto`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Adapter DTOs should be converted into domain commands before use-case logic runs.

### Task

In src/adapters.rs add serde-deserializable RegisterUserRequest and typed RequestError. Implement TryFrom<RegisterUserRequest> for RegisterUserCommand, trimming and validating input before it enters the use case.

### Concept context

Adapter DTOs should be converted into domain commands before use-case logic runs.

- Prerequisites: `register-usecase-function`
- Tags: `architecture`, `adapters`, `conversion`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/register-user-use-case/004-adapter-dto/starter/src/lib.rs`

```rust
pub mod adapters;
pub mod application;
pub mod domain;
```

#### `src/domain.rs` — readonly

Source: `lessons/register-user-use-case/004-adapter-dto/starter/src/domain.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: EmailAddress,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
        Self {
            email,
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &EmailAddress {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}
```

#### `src/application.rs` — readonly

Source: `lessons/register-user-use-case/004-adapter-dto/starter/src/application.rs`

```rust
use thiserror::Error;

use crate::domain::RegisterUserCommand;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn value(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NewUser {
    email: String,
    display_name: String,
}

impl NewUser {
    pub fn from_command(command: RegisterUserCommand) -> Self {
        Self {
            email: command.email().as_str().to_owned(),
            display_name: command.display_name().to_owned(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("email already exists")]
    Conflict,
}

pub trait UserRepository: Send + Sync {
    fn email_exists(
        &self,
        email: &str,
    ) -> impl std::future::Future<Output = Result<bool, RepositoryError>> + Send;

    fn save(
        &self,
        user: NewUser,
    ) -> impl std::future::Future<Output = Result<UserId, RepositoryError>> + Send;
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RegisterUserError {
    #[error("email already exists")]
    DuplicateEmail,
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

pub async fn register_user<R: UserRepository>(
    repository: &R,
    command: RegisterUserCommand,
) -> Result<UserId, RegisterUserError> {
    if repository.email_exists(command.email().as_str()).await? {
        return Err(RegisterUserError::DuplicateEmail);
    }

    match repository.save(NewUser::from_command(command)).await {
        Ok(user_id) => Ok(user_id),
        Err(RepositoryError::Conflict) => Err(RegisterUserError::DuplicateEmail),
        Err(error) => Err(error.into()),
    }
}
```

#### `src/adapters.rs` — editable

Source: `lessons/register-user-use-case/004-adapter-dto/starter/src/adapters.rs`

```rust
// TODO: add the serde request DTO and TryFrom conversion.
```

#### `tests/public.rs` — test

Source: `lessons/register-user-use-case/004-adapter-dto/tests/public.rs`

```rust
use rust_daily_lesson::{adapters::RegisterUserRequest, domain::RegisterUserCommand};

#[test]
fn deserializes_and_converts_adapter_request() {
    let request: RegisterUserRequest =
        serde_json::from_str(r#"{"email":" ada@example.com ","display_name":" Ada "}"#)
            .expect("request JSON should deserialize");

    let command = RegisterUserCommand::try_from(request).expect("request should be valid");

    assert_eq!(command.email().as_str(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}
```

### Progressive hints

1. Serde belongs on the adapter DTO, not on the command.
2. Trim before constructing domain values.
3. Return RequestError before calling application code. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "derived_trait_for_type",
          "traitName": "serde::Deserialize",
          "typeName": "RegisterUserRequest"
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<RegisterUserRequest>",
          "typeName": "RegisterUserCommand"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/adapters.rs`

Source: `lessons/register-user-use-case/004-adapter-dto/solution/src/adapters.rs`

```rust
use serde::Deserialize;
use thiserror::Error;

use crate::domain::{EmailAddress, RegisterUserCommand};

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserRequest {
    pub email: String,
    pub display_name: String,
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RequestError {
    #[error("email is empty")]
    EmptyEmail,
    #[error("display name is empty")]
    EmptyDisplayName,
}

impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
    type Error = RequestError;

    fn try_from(request: RegisterUserRequest) -> Result<Self, Self::Error> {
        let email = request.email.trim();
        let display_name = request.display_name.trim();

        if email.is_empty() {
            return Err(RequestError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RequestError::EmptyDisplayName);
        }

        Ok(RegisterUserCommand::new(
            EmailAddress::new(email),
            display_name,
        ))
    }
}
```

### Completion explanation

JSON-shaped input is converted into framework-free domain data at the adapter edge.

### Author notes

Teaches register-adapter-dto with async boundaries and framework isolation.

---

## 77. Share an in-memory repository safely

Source: `lessons/register-user-use-case/005-inmemory-repo`

| Field | Value |
| --- | --- |
| Lesson ID | `register-inmemory-repo-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/register-inmemory-repo-005) |
| Arc | Register user use case boundaries (step 5 of 6) |
| Concept | Implement an infrastructure repository (`register-inmemory-repo`) |
| Difficulty | medium |
| Estimated time | 9 minutes |

### Scenario

Infrastructure implements application ports. The application trait stays the dependency boundary.

### Task

In src/infrastructure.rs add InMemoryUserRepository backed by Arc<tokio::sync::RwLock<_>>. Implement UserRepository with read locking for lookups and write locking for atomic duplicate checking and insertion.

### Concept context

Infrastructure implements application ports. The application trait stays the dependency boundary.

- Prerequisites: `register-adapter-dto`
- Tags: `architecture`, `infrastructure`, `ports`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/register-user-use-case/005-inmemory-repo/starter/src/lib.rs`

```rust
pub mod adapters;
pub mod application;
pub mod domain;
pub mod infrastructure;
```

#### `src/domain.rs` — readonly

Source: `lessons/register-user-use-case/005-inmemory-repo/starter/src/domain.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: EmailAddress,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
        Self {
            email,
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &EmailAddress {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}
```

#### `src/application.rs` — readonly

Source: `lessons/register-user-use-case/005-inmemory-repo/starter/src/application.rs`

```rust
use thiserror::Error;

use crate::domain::RegisterUserCommand;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn value(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NewUser {
    email: String,
    display_name: String,
}

impl NewUser {
    pub fn from_command(command: RegisterUserCommand) -> Self {
        Self {
            email: command.email().as_str().to_owned(),
            display_name: command.display_name().to_owned(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("email already exists")]
    Conflict,
}

pub trait UserRepository: Send + Sync {
    fn email_exists(
        &self,
        email: &str,
    ) -> impl std::future::Future<Output = Result<bool, RepositoryError>> + Send;

    fn save(
        &self,
        user: NewUser,
    ) -> impl std::future::Future<Output = Result<UserId, RepositoryError>> + Send;
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RegisterUserError {
    #[error("email already exists")]
    DuplicateEmail,
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

pub async fn register_user<R: UserRepository>(
    repository: &R,
    command: RegisterUserCommand,
) -> Result<UserId, RegisterUserError> {
    if repository.email_exists(command.email().as_str()).await? {
        return Err(RegisterUserError::DuplicateEmail);
    }

    match repository.save(NewUser::from_command(command)).await {
        Ok(user_id) => Ok(user_id),
        Err(RepositoryError::Conflict) => Err(RegisterUserError::DuplicateEmail),
        Err(error) => Err(error.into()),
    }
}
```

#### `src/adapters.rs` — readonly

Source: `lessons/register-user-use-case/005-inmemory-repo/starter/src/adapters.rs`

```rust
use serde::Deserialize;
use thiserror::Error;

use crate::domain::{EmailAddress, RegisterUserCommand};

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserRequest {
    pub email: String,
    pub display_name: String,
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RequestError {
    #[error("email is empty")]
    EmptyEmail,
    #[error("display name is empty")]
    EmptyDisplayName,
}

impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
    type Error = RequestError;

    fn try_from(request: RegisterUserRequest) -> Result<Self, Self::Error> {
        let email = request.email.trim();
        let display_name = request.display_name.trim();

        if email.is_empty() {
            return Err(RequestError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RequestError::EmptyDisplayName);
        }

        Ok(RegisterUserCommand::new(
            EmailAddress::new(email),
            display_name,
        ))
    }
}
```

#### `src/infrastructure.rs` — editable

Source: `lessons/register-user-use-case/005-inmemory-repo/starter/src/infrastructure.rs`

```rust
// TODO: add Arc<RwLock<_>> infrastructure repository.
```

#### `tests/public.rs` — test

Source: `lessons/register-user-use-case/005-inmemory-repo/tests/public.rs`

```rust
use rust_daily_lesson::{
    application::{RegisterUserError, register_user},
    domain::{EmailAddress, RegisterUserCommand},
    infrastructure::InMemoryUserRepository,
};

#[actix_rt::test]
async fn repository_rejects_duplicate_registration() {
    let repository = InMemoryUserRepository::new();
    let command = || RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    assert!(register_user(&repository, command()).await.is_ok());
    assert_eq!(
        register_user(&repository, command()).await,
        Err(RegisterUserError::DuplicateEmail)
    );
    assert_eq!(repository.len().await, 1);
}
```

### Progressive hints

1. Arc allows cheap repository clones to share one state.
2. Use a read lock for email_exists.
3. Repeat duplicate detection under the write lock so concurrent saves stay atomic. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "Arc<RwLock<State>>",
            "self.state.read().await",
            "self.state.write().await"
          ]
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "UserRepository",
          "typeName": "InMemoryUserRepository"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/infrastructure.rs`

Source: `lessons/register-user-use-case/005-inmemory-repo/solution/src/infrastructure.rs`

```rust
use std::{collections::HashMap, sync::Arc};

use tokio::sync::RwLock;

use crate::application::{NewUser, RepositoryError, UserId, UserRepository};

#[derive(Debug, Clone)]
pub struct InMemoryUserRepository {
    state: Arc<RwLock<State>>,
}

#[derive(Debug)]
struct State {
    next_id: u64,
    users_by_email: HashMap<String, UserId>,
}

impl InMemoryUserRepository {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(State {
                next_id: 1,
                users_by_email: HashMap::new(),
            })),
        }
    }

    pub async fn len(&self) -> usize {
        self.state.read().await.users_by_email.len()
    }
}

impl Default for InMemoryUserRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl UserRepository for InMemoryUserRepository {
    async fn email_exists(&self, email: &str) -> Result<bool, RepositoryError> {
        Ok(self.state.read().await.users_by_email.contains_key(email))
    }

    async fn save(&self, user: NewUser) -> Result<UserId, RepositoryError> {
        let mut state = self.state.write().await;

        if state.users_by_email.contains_key(user.email()) {
            return Err(RepositoryError::Conflict);
        }

        let user_id = UserId::new(state.next_id);
        state.next_id += 1;
        state
            .users_by_email
            .insert(user.email().to_owned(), user_id);

        Ok(user_id)
    }
}
```

### Completion explanation

The infrastructure adapter supports concurrent async access without leaking synchronization primitives through the repository port.

### Author notes

Teaches register-inmemory-repo with async boundaries and framework isolation.

---

## 78. Add an Actix handler boundary

Source: `lessons/register-user-use-case/006-handler-boundary`

| Field | Value |
| --- | --- |
| Lesson ID | `register-handler-boundary-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/register-handler-boundary-006) |
| Arc | Register user use case boundaries (step 6 of 6) |
| Concept | Map a handler boundary without framework leakage (`register-handler-boundary`) |
| Difficulty | medium |
| Estimated time | 10 minutes |

### Scenario

A handler adapter should translate request DTOs, call timeout-aware application code, and return response data without pushing HTTP concepts into domain code.

### Task

The readonly application module already exposes register_user_with_timeout and TimedOut. In src/adapters.rs add Response, handle_register_user, and a thin Actix register_user_handler using web::Data, web::Json, HttpResponse, and Responder. Keep HTTP status mapping in adapters and the use case free of Actix types.

### Concept context

A handler adapter should translate request DTOs, call the use case, and return response data without pushing HTTP concepts into domain code.

- Prerequisites: `register-inmemory-repo`
- Tags: `architecture`, `adapters`, `boundaries`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/register-user-use-case/006-handler-boundary/starter/src/lib.rs`

```rust
pub mod adapters;
pub mod application;
pub mod domain;
pub mod infrastructure;
```

#### `src/domain.rs` — readonly

Source: `lessons/register-user-use-case/006-handler-boundary/starter/src/domain.rs`

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: EmailAddress,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
        Self {
            email,
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &EmailAddress {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}
```

#### `src/application.rs` — readonly

Source: `lessons/register-user-use-case/006-handler-boundary/starter/src/application.rs`

```rust
use std::time::Duration;

use thiserror::Error;

use crate::domain::RegisterUserCommand;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn value(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NewUser {
    email: String,
    display_name: String,
}

impl NewUser {
    pub fn from_command(command: RegisterUserCommand) -> Self {
        Self {
            email: command.email().as_str().to_owned(),
            display_name: command.display_name().to_owned(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("email already exists")]
    Conflict,
}

pub trait UserRepository: Send + Sync {
    fn email_exists(
        &self,
        email: &str,
    ) -> impl std::future::Future<Output = Result<bool, RepositoryError>> + Send;

    fn save(
        &self,
        user: NewUser,
    ) -> impl std::future::Future<Output = Result<UserId, RepositoryError>> + Send;
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RegisterUserError {
    #[error("email already exists")]
    DuplicateEmail,
    #[error("registration timed out")]
    TimedOut,
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

pub async fn register_user<R: UserRepository>(
    repository: &R,
    command: RegisterUserCommand,
) -> Result<UserId, RegisterUserError> {
    if repository.email_exists(command.email().as_str()).await? {
        return Err(RegisterUserError::DuplicateEmail);
    }

    match repository.save(NewUser::from_command(command)).await {
        Ok(user_id) => Ok(user_id),
        Err(RepositoryError::Conflict) => Err(RegisterUserError::DuplicateEmail),
        Err(error) => Err(error.into()),
    }
}

pub async fn register_user_with_timeout<R: UserRepository>(
    repository: &R,
    command: RegisterUserCommand,
    duration: Duration,
) -> Result<UserId, RegisterUserError> {
    tokio::time::timeout(duration, register_user(repository, command))
        .await
        .map_err(|_| RegisterUserError::TimedOut)?
}
```

#### `src/infrastructure.rs` — readonly

Source: `lessons/register-user-use-case/006-handler-boundary/starter/src/infrastructure.rs`

```rust
use std::{collections::HashMap, sync::Arc};

use tokio::sync::RwLock;

use crate::application::{NewUser, RepositoryError, UserId, UserRepository};

#[derive(Debug, Clone)]
pub struct InMemoryUserRepository {
    state: Arc<RwLock<State>>,
}

#[derive(Debug)]
struct State {
    next_id: u64,
    users_by_email: HashMap<String, UserId>,
}

impl InMemoryUserRepository {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(State {
                next_id: 1,
                users_by_email: HashMap::new(),
            })),
        }
    }

    pub async fn len(&self) -> usize {
        self.state.read().await.users_by_email.len()
    }
}

impl Default for InMemoryUserRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl UserRepository for InMemoryUserRepository {
    async fn email_exists(&self, email: &str) -> Result<bool, RepositoryError> {
        Ok(self.state.read().await.users_by_email.contains_key(email))
    }

    async fn save(&self, user: NewUser) -> Result<UserId, RepositoryError> {
        let mut state = self.state.write().await;

        if state.users_by_email.contains_key(user.email()) {
            return Err(RepositoryError::Conflict);
        }

        let user_id = UserId::new(state.next_id);
        state.next_id += 1;
        state
            .users_by_email
            .insert(user.email().to_owned(), user_id);

        Ok(user_id)
    }
}
```

#### `src/adapters.rs` — editable

Source: `lessons/register-user-use-case/006-handler-boundary/starter/src/adapters.rs`

```rust
use serde::Deserialize;
use thiserror::Error;

use crate::domain::{EmailAddress, RegisterUserCommand};

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserRequest {
    pub email: String,
    pub display_name: String,
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RequestError {
    #[error("email is empty")]
    EmptyEmail,
    #[error("display name is empty")]
    EmptyDisplayName,
}

impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
    type Error = RequestError;

    fn try_from(request: RegisterUserRequest) -> Result<Self, Self::Error> {
        let email = request.email.trim();
        let display_name = request.display_name.trim();

        if email.is_empty() {
            return Err(RequestError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RequestError::EmptyDisplayName);
        }

        Ok(RegisterUserCommand::new(
            EmailAddress::new(email),
            display_name,
        ))
    }
}

// TODO: add Response, handle_register_user, and the thin Actix handler.
```

#### `tests/public.rs` — test

Source: `lessons/register-user-use-case/006-handler-boundary/tests/public.rs`

```rust
use rust_daily_lesson::{
    adapters::{RegisterUserRequest, handle_register_user},
    application::{
        NewUser, RegisterUserError, RepositoryError, UserId, UserRepository,
        register_user_with_timeout,
    },
    domain::{EmailAddress, RegisterUserCommand},
    infrastructure::InMemoryUserRepository,
};
use std::time::Duration;

struct SlowRepository;

impl UserRepository for SlowRepository {
    async fn email_exists(&self, _email: &str) -> Result<bool, RepositoryError> {
        tokio::time::sleep(Duration::from_millis(50)).await;
        Ok(false)
    }

    async fn save(&self, _user: NewUser) -> Result<UserId, RepositoryError> {
        Ok(UserId::new(1))
    }
}

#[actix_rt::test]
async fn timeout_policy_maps_elapsed_work_to_timed_out() {
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    let result =
        register_user_with_timeout(&SlowRepository, command, Duration::from_millis(1)).await;

    assert_eq!(result, Err(RegisterUserError::TimedOut));
}

#[actix_rt::test]
async fn adapter_maps_success_and_duplicate_to_http_status_values() {
    let repository = InMemoryUserRepository::new();
    let request = || RegisterUserRequest {
        email: "ada@example.com".to_owned(),
        display_name: "Ada".to_owned(),
    };

    let created = handle_register_user(&repository, request()).await;
    let duplicate = handle_register_user(&repository, request()).await;

    assert_eq!(created.status, 201);
    assert_eq!(duplicate.status, 409);
}
```

### Progressive hints

1. Timeout is application policy; this file should translate its result into adapter responses.
2. The handler should only extract inputs, call adapter/application code, and build an HTTP response.
3. Do not pass web::Json or HttpResponse into domain or application modules. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "use actix_web::",
            "HttpResponse",
            "Responder",
            "pub async fn register_user_handler",
            "RegisterUserError::TimedOut"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/adapters.rs`

Source: `lessons/register-user-use-case/006-handler-boundary/solution/src/adapters.rs`

```rust
use std::time::Duration;

use actix_web::{HttpResponse, Responder, http::StatusCode, web};
use serde::Deserialize;
use thiserror::Error;

use crate::{
    application::{RegisterUserError, UserRepository, register_user_with_timeout},
    domain::{EmailAddress, RegisterUserCommand},
};

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserRequest {
    pub email: String,
    pub display_name: String,
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RequestError {
    #[error("email is empty")]
    EmptyEmail,
    #[error("display name is empty")]
    EmptyDisplayName,
}

impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
    type Error = RequestError;

    fn try_from(request: RegisterUserRequest) -> Result<Self, Self::Error> {
        let email = request.email.trim();
        let display_name = request.display_name.trim();

        if email.is_empty() {
            return Err(RequestError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RequestError::EmptyDisplayName);
        }

        Ok(RegisterUserCommand::new(
            EmailAddress::new(email),
            display_name,
        ))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Response {
    pub status: u16,
    pub body: String,
}

pub async fn handle_register_user<R: UserRepository>(
    repository: &R,
    request: RegisterUserRequest,
) -> Response {
    let command = match RegisterUserCommand::try_from(request) {
        Ok(command) => command,
        Err(error) => {
            return Response {
                status: 400,
                body: error.to_string(),
            };
        }
    };

    match register_user_with_timeout(repository, command, Duration::from_secs(1)).await {
        Ok(user_id) => Response {
            status: 201,
            body: user_id.value().to_string(),
        },
        Err(RegisterUserError::DuplicateEmail) => Response {
            status: 409,
            body: "email already exists".to_owned(),
        },
        Err(RegisterUserError::TimedOut) => Response {
            status: 504,
            body: "registration timed out".to_owned(),
        },
        Err(RegisterUserError::Repository(_)) => Response {
            status: 503,
            body: "repository is unavailable".to_owned(),
        },
    }
}

pub async fn register_user_handler<R>(
    repository: web::Data<R>,
    request: web::Json<RegisterUserRequest>,
) -> impl Responder
where
    R: UserRepository + 'static,
{
    let response = handle_register_user(repository.get_ref(), request.into_inner()).await;
    let status = StatusCode::from_u16(response.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

    HttpResponse::build(status).body(response.body)
}
```

### Completion explanation

The arc ends with cancellation-aware async application code and a thin Actix boundary that preserves module ownership.

### Author notes

Teaches register-handler-boundary with async boundaries and framework isolation.

---

## 79. Emit a structured tracing event

Source: `lessons/structured-request-logging/001-log-event`

| Field | Value |
| --- | --- |
| Lesson ID | `log-event-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-event-001) |
| Arc | Structured request logging (step 1 of 6) |
| Concept | Represent a structured log event (`log-event-struct`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

A request gateway needs queryable tracing events so support can filter production logs by request id instead of searching ad-hoc strings.

### Task

Implement log_request_received(request_id: &str) with tracing::info!. Record event_name = "request.received" and request_id as structured fields instead of formatting them into the message.

### Concept context

Structured logging starts with events that have names and levels instead of ad-hoc strings.

- Prerequisites: None
- Tags: `logging`, `events`, `levels`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/structured-request-logging/001-log-event/starter/src/lib.rs`

```rust
// TODO: emit a structured request event with tracing.
```

#### `tests/public.rs` — test

Source: `lessons/structured-request-logging/001-log-event/tests/public.rs`

```rust
use std::sync::{Arc, Mutex};

use rust_daily_lesson::log_request_received;
use tracing::{
    field::{Field, Visit},
    Event, Subscriber,
};
use tracing_subscriber::{
    layer::{Context, Layer},
    prelude::*,
    Registry,
};

#[derive(Debug, Default, PartialEq, Eq)]
struct CapturedFields {
    event_name: Option<String>,
    request_id: Option<String>,
}

#[derive(Default)]
struct FieldVisitor {
    captured: CapturedFields,
}

impl FieldVisitor {
    fn record(&mut self, name: &str, value: String) {
        match name {
            "event_name" => self.captured.event_name = Some(value),
            "request_id" => self.captured.request_id = Some(value),
            _ => {}
        }
    }
}

impl Visit for FieldVisitor {
    fn record_str(&mut self, field: &Field, value: &str) {
        self.record(field.name(), value.to_owned());
    }

    fn record_debug(&mut self, field: &Field, value: &dyn std::fmt::Debug) {
        self.record(field.name(), format!("{value:?}").trim_matches('"').to_owned());
    }
}

#[derive(Clone)]
struct CaptureLayer {
    captured: Arc<Mutex<Vec<CapturedFields>>>,
}

impl<S> Layer<S> for CaptureLayer
where
    S: Subscriber,
{
    fn on_event(&self, event: &Event<'_>, _context: Context<'_, S>) {
        let mut visitor = FieldVisitor::default();
        event.record(&mut visitor);
        self.captured.lock().unwrap().push(visitor.captured);
    }
}

#[test]
fn emits_structured_request_fields() {
    let captured = Arc::new(Mutex::new(Vec::new()));
    let subscriber = Registry::default().with(CaptureLayer {
        captured: Arc::clone(&captured),
    });

    tracing::subscriber::with_default(subscriber, || {
        log_request_received("req-1");
    });

    let events = captured.lock().unwrap();
    assert_eq!(events.len(), 1);
    assert_eq!(events[0].event_name.as_deref(), Some("request.received"));
    assert_eq!(events[0].request_id.as_deref(), Some("req-1"));
}
```

### Progressive hints

1. Structured fields belong before the message in the tracing macro.
2. Use %request_id to record its Display representation.
3. Keep the message constant so fields remain queryable. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "tracing::info!",
            "event_name = \"request.received\"",
            "request_id = %request_id"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/structured-request-logging/001-log-event/solution/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}
```

### Completion explanation

The event now uses real tracing metadata instead of a custom log-record struct or interpolated string, and the test captures the emitted fields through a subscriber.

### Author notes

Teaches log-event-struct with production-shaped Rust APIs.

---

## 80. Record consistent request fields

Source: `lessons/structured-request-logging/002-log-fields`

| Field | Value |
| --- | --- |
| Lesson ID | `log-fields-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-fields-002) |
| Arc | Structured request logging (step 2 of 6) |
| Concept | Attach request fields to log events (`log-event-fields`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

Useful logs carry fields such as request_id and attempt count so operators can filter and correlate events.

### Task

Add log_request_started with request_id, optional user_id, and attempt parameters. Emit event_name, request_id, user_id, and attempt as separate tracing fields.

### Concept context

Useful logs carry fields such as request_id and attempt count so operators can filter and correlate events.

- Prerequisites: `log-event-struct`
- Tags: `logging`, `fields`, `observability`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/structured-request-logging/002-log-fields/starter/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

// TODO: add request_id, user_id, and attempt fields.
```

#### `tests/public.rs` — test

Source: `lessons/structured-request-logging/002-log-fields/tests/public.rs`

```rust
use rust_daily_lesson::log_request_started;

#[test]
fn request_fields_support_known_and_anonymous_users() {
    log_request_started("req-1", Some("user-7"), 1);
    log_request_started("req-2", None, 2);
}
```

### Progressive hints

1. Use the same field names across events.
2. Record anonymous when no user id exists.
3. Keep numeric values as numbers instead of formatting them into text. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "user_id = user_id.unwrap_or(\"anonymous\")",
            "attempt,"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/structured-request-logging/002-log-fields/solution/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}
```

### Completion explanation

Request metadata is now queryable by stable field names across tracing backends.

### Author notes

Teaches log-event-fields with production-shaped Rust APIs.

---

## 81. Redact secrets before they reach tracing

Source: `lessons/structured-request-logging/003-redacted-secret`

| Field | Value |
| --- | --- |
| Lesson ID | `log-redacted-secret-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-redacted-secret-003) |
| Arc | Structured request logging (step 3 of 6) |
| Concept | Redact secrets in formatted output (`log-redacted-secret`) |
| Difficulty | medium |
| Estimated time | 7 minutes |

### Scenario

Logging helpers should make accidental secret exposure difficult. A wrapper can intentionally hide sensitive values when formatted.

### Task

Define Secret as a borrowed wrapper and implement Display so it always writes [redacted]. Add log_authentication_attempt that records the Secret through its Display implementation.

### Concept context

Logging helpers should make accidental secret exposure difficult. A wrapper can intentionally hide sensitive values when formatted.

- Prerequisites: `log-event-fields`
- Tags: `logging`, `redaction`, `security`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/structured-request-logging/003-redacted-secret/starter/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

// TODO: add Secret with redacted Display and log_authentication_attempt.
```

#### `tests/public.rs` — test

Source: `lessons/structured-request-logging/003-redacted-secret/tests/public.rs`

```rust
use rust_daily_lesson::{log_authentication_attempt, Secret};

#[test]
fn secret_display_is_always_redacted() {
    let secret = Secret::new("correct horse battery staple");

    assert_eq!(secret.to_string(), "[redacted]");
    assert!(!secret.is_empty());
    log_authentication_attempt("req-1", secret);
}
```

### Progressive hints

1. Redaction should happen in the type, not at every call site.
2. Store a borrow so logging does not clone sensitive data.
3. Never expose the wrapped secret through Display or Debug output. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::fmt::Display",
          "typeName": "Secret"
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "formatter.write_str(\"[redacted]\")",
            "secret = %secret"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/structured-request-logging/003-redacted-secret/solution/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

#[derive(Debug, Clone, Copy)]
pub struct Secret<'a>(&'a str);

impl<'a> Secret<'a> {
    pub fn new(value: &'a str) -> Self {
        Self(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Display for Secret<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("[redacted]")
    }
}

pub fn log_authentication_attempt(request_id: &str, secret: Secret<'_>) {
    tracing::info!(
        event_name = "authentication.attempt",
        request_id = %request_id,
        secret = %secret,
        "authentication attempted"
    );
}
```

### Completion explanation

Sensitive values now have a logging-safe representation that prevents accidental plaintext formatting.

### Author notes

Teaches log-redacted-secret with production-shaped Rust APIs.

---

## 82. Create a request span for async work

Source: `lessons/structured-request-logging/004-request-span`

| Field | Value |
| --- | --- |
| Lesson ID | `log-request-span-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-request-span-004) |
| Arc | Structured request logging (step 4 of 6) |
| Concept | Create events from a request span (`log-request-span`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A span carries context shared by multiple events. Request-scoped fields should not be rebuilt by every call site.

### Task

Implement request_span(request_id, path) -> tracing::Span with tracing::info_span!. Name it "http.request" and record request_id and path fields so async work can enter or instrument the span.

### Concept context

A span carries context shared by multiple events. Request-scoped fields should not be rebuilt by every call site.

- Prerequisites: `log-redacted-secret`
- Tags: `logging`, `spans`, `context`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/structured-request-logging/004-request-span/starter/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

#[derive(Debug, Clone, Copy)]
pub struct Secret<'a>(&'a str);

impl<'a> Secret<'a> {
    pub fn new(value: &'a str) -> Self {
        Self(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Display for Secret<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("[redacted]")
    }
}

pub fn log_authentication_attempt(request_id: &str, secret: Secret<'_>) {
    tracing::info!(
        event_name = "authentication.attempt",
        request_id = %request_id,
        secret = %secret,
        "authentication attempted"
    );
}

// TODO: add request_span with info_span!.
```

#### `tests/public.rs` — test

Source: `lessons/structured-request-logging/004-request-span/tests/public.rs`

```rust
use rust_daily_lesson::request_span;

#[test]
fn creates_request_span() {
    let _span = request_span("req-1", "/users");
}
```

### Progressive hints

1. Spans represent work with a beginning and end.
2. Return the Span so callers can enter it or instrument a future.
3. Keep request context on the span instead of repeating it in every message. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "tracing::info_span!",
            "\"http.request\"",
            "path = %path"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/structured-request-logging/004-request-span/solution/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

#[derive(Debug, Clone, Copy)]
pub struct Secret<'a>(&'a str);

impl<'a> Secret<'a> {
    pub fn new(value: &'a str) -> Self {
        Self(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Display for Secret<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("[redacted]")
    }
}

pub fn log_authentication_attempt(request_id: &str, secret: Secret<'_>) {
    tracing::info!(
        event_name = "authentication.attempt",
        request_id = %request_id,
        secret = %secret,
        "authentication attempted"
    );
}

pub fn request_span(request_id: &str, path: &str) -> tracing::Span {
    tracing::info_span!(
        "http.request",
        request_id = %request_id,
        path = %path
    )
}
```

### Completion explanation

Request-scoped context can now propagate through synchronous or asynchronous work with a real tracing span.

### Author notes

Teaches log-request-span with production-shaped Rust APIs.

---

## 83. Record typed error kinds as fields

Source: `lessons/structured-request-logging/005-error-kind`

| Field | Value |
| --- | --- |
| Lesson ID | `log-error-kind-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-error-kind-005) |
| Arc | Structured request logging (step 5 of 6) |
| Concept | Log error kinds as fields (`log-error-kind`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Logs should capture error category fields without relying on fragile message parsing.

### Task

Define ErrorKind with a stable as_str mapping. Add log_request_error that emits request_id and error.kind as structured fields without logging a full secret-bearing error value.

### Concept context

Logs should capture error category fields without relying on fragile message parsing.

- Prerequisites: `log-request-span`
- Tags: `logging`, `errors`, `fields`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/structured-request-logging/005-error-kind/starter/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

#[derive(Debug, Clone, Copy)]
pub struct Secret<'a>(&'a str);

impl<'a> Secret<'a> {
    pub fn new(value: &'a str) -> Self {
        Self(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Display for Secret<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("[redacted]")
    }
}

pub fn log_authentication_attempt(request_id: &str, secret: Secret<'_>) {
    tracing::info!(
        event_name = "authentication.attempt",
        request_id = %request_id,
        secret = %secret,
        "authentication attempted"
    );
}

pub fn request_span(request_id: &str, path: &str) -> tracing::Span {
    tracing::info_span!(
        "http.request",
        request_id = %request_id,
        path = %path
    )
}

// TODO: add ErrorKind and log_request_error.
```

#### `tests/public.rs` — test

Source: `lessons/structured-request-logging/005-error-kind/tests/public.rs`

```rust
use rust_daily_lesson::{log_request_error, ErrorKind};

#[test]
fn error_kinds_have_stable_field_values() {
    assert_eq!(ErrorKind::Validation.as_str(), "validation");
    assert_eq!(ErrorKind::Repository.as_str(), "repository");
    assert_eq!(ErrorKind::Timeout.as_str(), "timeout");
    log_request_error("req-1", ErrorKind::Validation);
}
```

### Progressive hints

1. Use a typed enum so call sites cannot invent arbitrary error kinds.
2. Map variants to stable lowercase strings.
3. Log the classification separately from the human message. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_method",
          "implFor": "ErrorKind",
          "methodName": "as_str",
          "requiredSignatureIncludes": [
            "fn as_str(self) -> &str"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "error.kind = error_kind.as_str()"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/structured-request-logging/005-error-kind/solution/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

#[derive(Debug, Clone, Copy)]
pub struct Secret<'a>(&'a str);

impl<'a> Secret<'a> {
    pub fn new(value: &'a str) -> Self {
        Self(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Display for Secret<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("[redacted]")
    }
}

pub fn log_authentication_attempt(request_id: &str, secret: Secret<'_>) {
    tracing::info!(
        event_name = "authentication.attempt",
        request_id = %request_id,
        secret = %secret,
        "authentication attempted"
    );
}

pub fn request_span(request_id: &str, path: &str) -> tracing::Span {
    tracing::info_span!(
        "http.request",
        request_id = %request_id,
        path = %path
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    Validation,
    Repository,
    Timeout,
}

impl ErrorKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Validation => "validation",
            Self::Repository => "repository",
            Self::Timeout => "timeout",
        }
    }
}

pub fn log_request_error(request_id: &str, error_kind: ErrorKind) {
    tracing::error!(
        event_name = "request.failed",
        request_id = %request_id,
        error.kind = error_kind.as_str(),
        "request failed"
    );
}
```

### Completion explanation

Error telemetry now carries a stable machine-readable classification without dumping internal error details.

### Author notes

Teaches log-error-kind with production-shaped Rust APIs.

---

## 84. Emit a boundary outcome event

Source: `lessons/structured-request-logging/006-boundary-event`

| Field | Value |
| --- | --- |
| Lesson ID | `log-boundary-event-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/log-boundary-event-006) |
| Arc | Structured request logging (step 6 of 6) |
| Concept | Create logging events at the application boundary (`log-boundary-event`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Domain code should stay free of logging setup. Application boundaries can create events with meaningful fields.

### Task

Implement register_attempt_event with request_id, optional user_id, and success. Emit a tracing event named "register.attempt" and keep every value in a structured field.

### Concept context

Domain code should stay free of logging setup. Application boundaries can create events with meaningful fields.

- Prerequisites: `log-error-kind`
- Tags: `logging`, `application`, `boundaries`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/structured-request-logging/006-boundary-event/starter/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

#[derive(Debug, Clone, Copy)]
pub struct Secret<'a>(&'a str);

impl<'a> Secret<'a> {
    pub fn new(value: &'a str) -> Self {
        Self(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Display for Secret<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("[redacted]")
    }
}

pub fn log_authentication_attempt(request_id: &str, secret: Secret<'_>) {
    tracing::info!(
        event_name = "authentication.attempt",
        request_id = %request_id,
        secret = %secret,
        "authentication attempted"
    );
}

pub fn request_span(request_id: &str, path: &str) -> tracing::Span {
    tracing::info_span!(
        "http.request",
        request_id = %request_id,
        path = %path
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    Validation,
    Repository,
    Timeout,
}

impl ErrorKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Validation => "validation",
            Self::Repository => "repository",
            Self::Timeout => "timeout",
        }
    }
}

pub fn log_request_error(request_id: &str, error_kind: ErrorKind) {
    tracing::error!(
        event_name = "request.failed",
        request_id = %request_id,
        error.kind = error_kind.as_str(),
        "request failed"
    );
}

// TODO: add register_attempt_event with outcome fields.
```

#### `tests/public.rs` — test

Source: `lessons/structured-request-logging/006-boundary-event/tests/public.rs`

```rust
use rust_daily_lesson::register_attempt_event;

#[test]
fn emits_success_and_failure_outcomes() {
    register_attempt_event("req-1", Some("user-7"), true);
    register_attempt_event("req-2", None, false);
}
```

### Progressive hints

1. Boundary events should describe outcomes, not restate implementation details.
2. Keep the event name stable.
3. Record success as a bool so backends can filter it directly. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "event_name = \"register.attempt\"",
            "success,"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/structured-request-logging/006-boundary-event/solution/src/lib.rs`

```rust
pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

#[derive(Debug, Clone, Copy)]
pub struct Secret<'a>(&'a str);

impl<'a> Secret<'a> {
    pub fn new(value: &'a str) -> Self {
        Self(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Display for Secret<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("[redacted]")
    }
}

pub fn log_authentication_attempt(request_id: &str, secret: Secret<'_>) {
    tracing::info!(
        event_name = "authentication.attempt",
        request_id = %request_id,
        secret = %secret,
        "authentication attempted"
    );
}

pub fn request_span(request_id: &str, path: &str) -> tracing::Span {
    tracing::info_span!(
        "http.request",
        request_id = %request_id,
        path = %path
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    Validation,
    Repository,
    Timeout,
}

impl ErrorKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Validation => "validation",
            Self::Repository => "repository",
            Self::Timeout => "timeout",
        }
    }
}

pub fn log_request_error(request_id: &str, error_kind: ErrorKind) {
    tracing::error!(
        event_name = "request.failed",
        request_id = %request_id,
        error.kind = error_kind.as_str(),
        "request failed"
    );
}

pub fn register_attempt_event(
    request_id: &str,
    user_id: Option<&str>,
    success: bool,
) {
    tracing::info!(
        event_name = "register.attempt",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        success,
        "register attempt completed"
    );
}
```

### Completion explanation

The logging arc now uses spans and structured tracing events with stable fields, typed error kinds, and secret redaction.

### Author notes

Teaches log-boundary-event with production-shaped Rust APIs.

---

## 85. Define a property-friendly Percentage type

Source: `lessons/table-driven-domain-tests/001-percentage-type`

| Field | Value |
| --- | --- |
| Lesson ID | `percentage-newtype-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/percentage-newtype-001) |
| Arc | Table-driven domain tests (step 1 of 6) |
| Concept | Define a bounded Percentage type (`percentage-newtype`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

Pricing discounts and rollout allocations both accept percentages from outside the service. They should not flow through the codebase as arbitrary integers.

### Task

Define Percentage, PercentageError, value, and TryFrom<u16>. Accept values from 0 through 100 for policy inputs and reject larger values without panicking.

### Concept context

A percentage should not be represented as any arbitrary integer throughout the codebase.

- Prerequisites: None
- Tags: `testing`, `domain`, `bounded-values`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/table-driven-domain-tests/001-percentage-type/starter/src/lib.rs`

```rust
// TODO: define Percentage and its range invariant.
```

#### `tests/public.rs` — test

Source: `lessons/table-driven-domain-tests/001-percentage-type/tests/public.rs`

```rust
use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn enforces_percentage_bounds() {
    assert_eq!(Percentage::try_from(100).map(Percentage::value), Ok(100));
    assert_eq!(Percentage::try_from(101), Err(PercentageError::OutOfRange));
}
```

### Progressive hints

1. Store only valid values in the private u8 field.
2. Validate before casting from u16.
3. Return a typed OutOfRange error. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "tuple_struct_fields",
          "structName": "Percentage",
          "requiredTypes": [
            "u8"
          ]
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<u16>",
          "typeName": "Percentage"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "percentage-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/percentage_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### percentage-direct-construction

Source: `lessons/table-driven-domain-tests/001-percentage-type/compile_fail/percentage_direct_construction.rs`

```rust
use rust_daily_lesson::Percentage;

fn main() {
    let _ = Percentage(255);
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/table-driven-domain-tests/001-percentage-type/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}
```

### Completion explanation

Percentage establishes a compact policy invariant that can be reused by pricing, rollout, and validation code.

### Author notes

Teaches percentage-newtype with production-shaped Rust APIs.

---

## 86. Write table-driven valid examples

Source: `lessons/table-driven-domain-tests/002-valid-table-tests`

| Field | Value |
| --- | --- |
| Lesson ID | `percentage-valid-table-tests-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/percentage-valid-table-tests-002) |
| Arc | Table-driven domain tests (step 2 of 6) |
| Concept | Write table-driven valid percentage tests (`percentage-valid-table-tests`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A discount policy has meaningful boundary cases: no discount, a common midpoint, and the maximum allowed percentage. Reviewers should see those examples together.

### Task

Add a #[cfg(test)] module with one test that loops over valid input/expected pairs for 0, 50, and 100.

### Concept context

Several valid boundary cases should be easy to scan. A table-driven test keeps inputs and expected values together.

- Prerequisites: `percentage-newtype`
- Tags: `tests`, `table-driven`, `domain`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/table-driven-domain-tests/002-valid-table-tests/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

// TODO: add a table test for valid boundary and middle values.
```

#### `tests/public.rs` — test

Source: `lessons/table-driven-domain-tests/002-valid-table-tests/tests/public.rs`

```rust
use rust_daily_lesson::Percentage;

#[test]
fn public_valid_cases_match() {
    for (input, expected) in [(0, 0), (25, 25), (100, 100)] {
        assert_eq!(Percentage::try_from(input).map(Percentage::value), Ok(expected));
    }
}
```

### Progressive hints

1. Keep cases as data rather than repeating assertions.
2. Include both boundaries and a representative middle value.
3. Map Percentage to its primitive value for concise assertions. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "let cases = [(0, 0), (50, 50), (100, 100)]",
            "for (input, expected) in cases"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "percentage-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/percentage_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### percentage-direct-construction

Source: `lessons/table-driven-domain-tests/002-valid-table-tests/compile_fail/percentage_direct_construction.rs`

```rust
use rust_daily_lesson::Percentage;

fn main() {
    let _ = Percentage(255);
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/table-driven-domain-tests/002-valid-table-tests/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        let cases = [(0, 0), (50, 50), (100, 100)];

        for (input, expected) in cases {
            assert_eq!(
                Percentage::try_from(input).map(Percentage::value),
                Ok(expected)
            );
        }
    }
}
```

### Completion explanation

One readable test now covers the important accepted points in the percentage policy.

### Author notes

Teaches percentage-valid-table-tests with production-shaped Rust APIs.

---

## 87. Write table-driven invalid examples

Source: `lessons/table-driven-domain-tests/003-invalid-table-tests`

| Field | Value |
| --- | --- |
| Lesson ID | `percentage-invalid-table-tests-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/percentage-invalid-table-tests-003) |
| Arc | Table-driven domain tests (step 3 of 6) |
| Concept | Write table-driven invalid percentage tests (`percentage-invalid-table-tests`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

Bad dashboard or API input should be rejected before it can create impossible discount or rollout settings. The rejection examples need to be as visible as accepted examples.

### Task

Keep the valid table test. Add a second test that loops over several values above 100 and checks PercentageError::OutOfRange.

### Concept context

Invalid cases deserve precise tests too. Table-driven tests make it clear which inputs should fail.

- Prerequisites: `percentage-valid-table-tests`
- Tags: `tests`, `table-driven`, `errors`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/table-driven-domain-tests/003-invalid-table-tests/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        let cases = [(0, 0), (50, 50), (100, 100)];

        for (input, expected) in cases {
            assert_eq!(
                Percentage::try_from(input).map(Percentage::value),
                Ok(expected)
            );
        }
    }
}

// TODO: add invalid values above the upper bound.
```

#### `tests/public.rs` — test

Source: `lessons/table-driven-domain-tests/003-invalid-table-tests/tests/public.rs`

```rust
use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn public_invalid_cases_match() {
    for input in [101, 500, u16::MAX] {
        assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
    }
}
```

### Progressive hints

1. Invalid cases can share one expected error.
2. Choose values close to and far from the boundary.
3. Keep the loop assertion explicit. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "fn rejects_invalid_percentages()",
            "[101, 150, 1_000]"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "percentage-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/percentage_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### percentage-direct-construction

Source: `lessons/table-driven-domain-tests/003-invalid-table-tests/compile_fail/percentage_direct_construction.rs`

```rust
use rust_daily_lesson::Percentage;

fn main() {
    let _ = Percentage(255);
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/table-driven-domain-tests/003-invalid-table-tests/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        let cases = [(0, 0), (50, 50), (100, 100)];

        for (input, expected) in cases {
            assert_eq!(
                Percentage::try_from(input).map(Percentage::value),
                Ok(expected)
            );
        }
    }

    #[test]
    fn rejects_invalid_percentages() {
        for input in [101, 150, 1_000] {
            assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
        }
    }
}
```

### Completion explanation

The example suite now documents both accepted and rejected policy inputs.

### Author notes

Teaches percentage-invalid-table-tests with production-shaped Rust APIs.

---

## 88. Test display behavior with a table

Source: `lessons/table-driven-domain-tests/004-display-tests`

| Field | Value |
| --- | --- |
| Lesson ID | `percentage-display-tests-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/percentage-display-tests-004) |
| Arc | Table-driven domain tests (step 4 of 6) |
| Concept | Test Display for Percentage (`percentage-display-tests`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

Admin screens and audit messages render percentage values for humans. Formatting is public behavior, not a throwaway detail.

### Task

Implement Display for Percentage and add a table-driven test for 0%, 50%, and 100%, preserving the existing range tests.

### Concept context

Formatting is public behavior. A small table keeps display expectations obvious.

- Prerequisites: `percentage-invalid-table-tests`
- Tags: `tests`, `display`, `docs`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/table-driven-domain-tests/004-display-tests/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        let cases = [(0, 0), (50, 50), (100, 100)];

        for (input, expected) in cases {
            assert_eq!(
                Percentage::try_from(input).map(Percentage::value),
                Ok(expected)
            );
        }
    }

    #[test]
    fn rejects_invalid_percentages() {
        for input in [101, 150, 1_000] {
            assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
        }
    }
}

// TODO: implement Display and add display cases.
```

#### `tests/public.rs` — test

Source: `lessons/table-driven-domain-tests/004-display-tests/tests/public.rs`

```rust
use rust_daily_lesson::Percentage;

#[test]
fn public_display_cases_match() {
    for (input, expected) in [(0, "0%"), (75, "75%"), (100, "100%")] {
        let percentage = Percentage::try_from(input).expect("case is valid");
        assert_eq!(percentage.to_string(), expected);
    }
}
```

### Progressive hints

1. Formatting valid Percentage values is infallible.
2. Reuse TryFrom in tests instead of constructing the private field.
3. Compare the final String with the expected text. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "impl_trait_for_type",
          "traitName": "std::fmt::Display",
          "typeName": "Percentage"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "percentage-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/percentage_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### percentage-direct-construction

Source: `lessons/table-driven-domain-tests/004-display-tests/compile_fail/percentage_direct_construction.rs`

```rust
use rust_daily_lesson::Percentage;

fn main() {
    let _ = Percentage(255);
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/table-driven-domain-tests/004-display-tests/solution/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

impl std::fmt::Display for Percentage {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}%", self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        for (input, expected) in [(0, 0), (50, 50), (100, 100)] {
            assert_eq!(Percentage::try_from(input).map(Percentage::value), Ok(expected));
        }
    }

    #[test]
    fn rejects_invalid_percentages() {
        for input in [101, 150, 1_000] {
            assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
        }
    }

    #[test]
    fn formats_percentages() {
        for (input, expected) in [(0, "0%"), (50, "50%"), (100, "100%")] {
            let percentage = Percentage::try_from(input).expect("case is in range");
            assert_eq!(percentage.to_string(), expected);
        }
    }
}
```

### Completion explanation

Display behavior is covered by the same compact table style as validation behavior, so UI and audit text stay predictable.

### Author notes

Teaches percentage-display-tests with production-shaped Rust APIs.

---

## 89. Add an executable Result-aware example

Source: `lessons/table-driven-domain-tests/005-doc-example`

| Field | Value |
| --- | --- |
| Lesson ID | `percentage-doc-example-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/percentage-doc-example-005) |
| Arc | Table-driven domain tests (step 5 of 6) |
| Concept | Document Percentage with an executable example (`percentage-doc-example`) |
| Difficulty | easy |
| Estimated time | 7 minutes |

### Scenario

Other teams will copy the public percentage API into pricing and rollout code. The docs should show fallible construction without teaching unwrap as normal usage.

### Task

Add a rustdoc example above Percentage. Show a successful TryFrom call using ? and assert the value without using unwrap.

### Concept context

A doc example should show normal usage and handle fallible APIs without unwrap or expect.

- Prerequisites: `percentage-display-tests`
- Tags: `docs`, `examples`, `tests`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/table-driven-domain-tests/005-doc-example/starter/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

impl std::fmt::Display for Percentage {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}%", self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        for (input, expected) in [(0, 0), (50, 50), (100, 100)] {
            assert_eq!(Percentage::try_from(input).map(Percentage::value), Ok(expected));
        }
    }

    #[test]
    fn rejects_invalid_percentages() {
        for input in [101, 150, 1_000] {
            assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
        }
    }

    #[test]
    fn formats_percentages() {
        for (input, expected) in [(0, "0%"), (50, "50%"), (100, "100%")] {
            let percentage = Percentage::try_from(input).expect("case is in range");
            assert_eq!(percentage.to_string(), expected);
        }
    }
}

// TODO: add a doc example that uses ? with TryFrom.
```

#### `tests/public.rs` — test

Source: `lessons/table-driven-domain-tests/005-doc-example/tests/public.rs`

```rust
use rust_daily_lesson::Percentage;

#[test]
fn documented_usage_remains_valid() -> Result<(), rust_daily_lesson::PercentageError> {
    let percentage = Percentage::try_from(75)?;
    assert_eq!(percentage.value(), 75);
    Ok(())
}
```

### Progressive hints

1. A hidden Ok type lets the doctest use ?.
2. Use the public API exactly as downstream callers would.
3. Keep the example short and executable. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "let percentage = Percentage::try_from(75)?;",
            "Ok::<(), rust_daily_lesson::PercentageError>(())"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "percentage-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/percentage_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### percentage-direct-construction

Source: `lessons/table-driven-domain-tests/005-doc-example/compile_fail/percentage_direct_construction.rs`

```rust
use rust_daily_lesson::Percentage;

fn main() {
    let _ = Percentage(255);
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/table-driven-domain-tests/005-doc-example/solution/src/lib.rs`

````rust
/// A bounded percentage from 0 through 100.
///
/// ```
/// use rust_daily_lesson::Percentage;
///
/// let percentage = Percentage::try_from(75)?;
/// assert_eq!(percentage.value(), 75);
/// # Ok::<(), rust_daily_lesson::PercentageError>(())
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

impl std::fmt::Display for Percentage {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}%", self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        for (input, expected) in [(0, 0), (50, 50), (100, 100)] {
            assert_eq!(Percentage::try_from(input).map(Percentage::value), Ok(expected));
        }
    }

    #[test]
    fn rejects_invalid_percentages() {
        for input in [101, 150, 1_000] {
            assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
        }
    }

    #[test]
    fn formats_percentages() {
        for (input, expected) in [(0, "0%"), (50, "50%"), (100, "100%")] {
            let percentage = Percentage::try_from(input).expect("case is in range");
            assert_eq!(percentage.to_string(), expected);
        }
    }
}
````

### Completion explanation

The public documentation now demonstrates fallible construction with an executable Result example that callers can copy into policy code.

### Author notes

Teaches percentage-doc-example with production-shaped Rust APIs.

---

## 90. Combine named cases with property tests

Source: `lessons/table-driven-domain-tests/006-named-cases`

| Field | Value |
| --- | --- |
| Lesson ID | `percentage-named-cases-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/percentage-named-cases-006) |
| Arc | Table-driven domain tests (step 6 of 6) |
| Concept | Name table-driven test cases (`percentage-named-test-cases`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

When a percentage boundary breaks, maintainers need to know whether the failure came from zero, maximum, or out-of-range policy input. Named examples and generated ranges make that diagnosis faster.

### Task

Replace repeated table boilerplate with a small macro_rules! helper that keeps case names visible. Add proptest properties covering every value in 0..=100 and every value above 100.

### Concept context

Named cases make failing table-driven tests easier to diagnose and easier for humans to scan.

- Prerequisites: `percentage-doc-example`
- Tags: `tests`, `table-driven`, `diagnostics`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/table-driven-domain-tests/006-named-cases/starter/src/lib.rs`

````rust
/// A bounded percentage from 0 through 100.
///
/// ```
/// use rust_daily_lesson::Percentage;
///
/// let percentage = Percentage::try_from(75)?;
/// assert_eq!(percentage.value(), 75);
/// # Ok::<(), rust_daily_lesson::PercentageError>(())
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

impl std::fmt::Display for Percentage {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}%", self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        for (input, expected) in [(0, 0), (50, 50), (100, 100)] {
            assert_eq!(Percentage::try_from(input).map(Percentage::value), Ok(expected));
        }
    }

    #[test]
    fn rejects_invalid_percentages() {
        for input in [101, 150, 1_000] {
            assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
        }
    }

    #[test]
    fn formats_percentages() {
        for (input, expected) in [(0, "0%"), (50, "50%"), (100, "100%")] {
            let percentage = Percentage::try_from(input).expect("case is in range");
            assert_eq!(percentage.to_string(), expected);
        }
    }
}

// TODO: add a small table macro and proptest invariants.
````

#### `tests/public.rs` — test

Source: `lessons/table-driven-domain-tests/006-named-cases/tests/public.rs`

```rust
use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn public_examples_still_describe_key_cases() {
    let cases = [
        ("zero", 0, Ok(0)),
        ("maximum", 100, Ok(100)),
        ("too large", 101, Err(PercentageError::OutOfRange)),
    ];

    for (name, input, expected) in cases {
        assert_eq!(
            Percentage::try_from(input).map(Percentage::value),
            expected,
            "case failed: {name}"
        );
    }
}
```

### Progressive hints

1. Keep the macro local to tests and focused on readability.
2. Example cases document business-relevant points.
3. Property tests complement examples by covering whole input ranges. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "macro_rules! percentage_cases",
            "proptest!",
            "0u16..=100",
            "101u16..=u16::MAX"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "advanced",
      "cases": [
        {
          "name": "percentage-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/percentage_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### percentage-direct-construction

Source: `lessons/table-driven-domain-tests/006-named-cases/compile_fail/percentage_direct_construction.rs`

```rust
use rust_daily_lesson::Percentage;

fn main() {
    let _ = Percentage(255);
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/table-driven-domain-tests/006-named-cases/solution/src/lib.rs`

````rust
/// A bounded percentage from 0 through 100.
///
/// ```
/// use rust_daily_lesson::Percentage;
///
/// let percentage = Percentage::try_from(75)?;
/// assert_eq!(percentage.value(), 75);
/// # Ok::<(), rust_daily_lesson::PercentageError>(())
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}

impl std::fmt::Display for Percentage {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}%", self.0)
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    macro_rules! percentage_cases {
        ($test_name:ident, { $($name:ident: $input:expr => $expected:expr),+ $(,)? }) => {
            #[test]
            fn $test_name() {
                let cases = [$( (stringify!($name), $input, $expected), )+];

                for (name, input, expected) in cases {
                    let actual = Percentage::try_from(input).map(Percentage::value);
                    assert_eq!(actual, expected, "case failed: {name}");
                }
            }
        };
    }

    percentage_cases!(named_examples, {
        zero: 0 => Ok(0),
        middle: 50 => Ok(50),
        maximum: 100 => Ok(100),
        too_large: 101 => Err(PercentageError::OutOfRange),
    });

    proptest! {
        #[test]
        fn accepts_every_value_in_range(input in 0u16..=100) {
            let percentage = Percentage::try_from(input).expect("generated value is in range");
            prop_assert_eq!(percentage.value(), input as u8);
        }

        #[test]
        fn rejects_every_value_above_range(input in 101u16..=u16::MAX) {
            prop_assert_eq!(
                Percentage::try_from(input),
                Err(PercentageError::OutOfRange)
            );
        }
    }
}
````

### Completion explanation

The final test suite combines readable named examples, executable documentation, and generated invariant coverage without hiding the percentage policy behind macro complexity.

### Author notes

Teaches percentage-named-test-cases with production-shaped Rust APIs.

---

## 91. Score as a saturating newtype

Source: `lessons/asteroids-domain/001-score-newtype`

| Field | Value |
| --- | --- |
| Lesson ID | `score-newtype-001` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/score-newtype-001) |
| Arc | Asteroids game domain (step 1 of 7) |
| Concept | Score newtype (`score-newtype`) |
| Difficulty | easy |
| Estimated time | 6 minutes |

### Scenario

The game service tracks the player's score, which accumulates from gameplay events such as destroyed asteroids. A raw u32 invites overflow and lets callers confuse the score with other amounts, so the service needs a dedicated Score value whose arithmetic saturates instead of overflowing.

### Task

In src/domain.rs define a Score newtype wrapping u32 with a private field, a ZERO constant, new and value constructors, and a saturating AddAssign impl.

### Concept context

Model a game score as a private-field newtype whose arithmetic saturates.

- Prerequisites: None
- Tags: `newtype`, `domain-modeling`, `arithmetic`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/asteroids-domain/001-score-newtype/starter/src/lib.rs`

```rust
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
```

#### `src/domain.rs` — editable

Source: `lessons/asteroids-domain/001-score-newtype/starter/src/domain.rs`

```rust
// TODO: Model the score as a domain value.
//
// In src/domain.rs define:
//   - `pub struct Score(u32)` with a PRIVATE field
//   - `pub const ZERO: Self`
//   - `pub const fn new(value: u32) -> Self` and `pub const fn value(self) -> u32`
//   - `impl std::ops::AddAssign<Score>` that SATURATES at u32::MAX
//
// Derive at least Debug, Clone, Copy, PartialEq, Eq.
```

#### `tests/public.rs` — test

Source: `lessons/asteroids-domain/001-score-newtype/tests/public.rs`

```rust
use rust_daily_lesson::domain::Score;

#[test]
fn score_holds_its_value() {
    assert_eq!(Score::ZERO.value(), 0);
    assert_eq!(Score::new(100).value(), 100);
}

#[test]
fn score_accumulates() {
    let mut score = Score::new(20);
    score += Score::new(50);
    score += Score::new(30);
    assert_eq!(score.value(), 100);
}

#[test]
fn score_saturates_instead_of_overflowing() {
    let mut score = Score::new(u32::MAX - 1);
    score += Score::new(5);
    assert_eq!(score.value(), u32::MAX);
}

#[test]
fn score_is_a_copyable_comparable_value() {
    let a = Score::new(10);
    let b = a; // Score is Copy
    assert_eq!(a, b);
    assert!(a < Score::new(20));
}
```

### Progressive hints

1. Start with a tuple struct with a private field: pub struct Score(u32); then add the constructors.
2. value(self) -> u32 returns self.0; AddAssign must use self.0.saturating_add(rhs.0) so the score pins at u32::MAX instead of wrapping.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "tuple_struct_fields",
          "structName": "Score",
          "requiredTypes": [
            "u32"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Score",
          "methodName": "value",
          "requiredSignatureIncludes": [
            "u32"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "saturating_add"
          ],
          "forbiddenSnippets": []
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "score-private-field",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/score_private_field.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### score-private-field

Source: `lessons/asteroids-domain/001-score-newtype/compile_fail/score_private_field.rs`

```rust
use rust_daily_lesson::domain::Score;

fn main() {
    let _score = Score(100);
}
```

### Authored solution

#### `src/domain.rs`

Source: `lessons/asteroids-domain/001-score-newtype/solution/src/domain.rs`

```rust
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
```

### Completion explanation

Your code matches the reference approach: the previous lesson's work stays active, and the new types compile against the public tests.

### Author notes

Teaches: score as a saturating newtype.

---

## 92. Non-zero lives and wave counters

Source: `lessons/asteroids-domain/002-lives-wave`

| Field | Value |
| --- | --- |
| Lesson ID | `lives-wave-002` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/lives-wave-002) |
| Arc | Asteroids game domain (step 2 of 7) |
| Concept | Non-zero lives and wave counters (`lives-wave`) |
| Difficulty | easy |
| Estimated time | 9 minutes |

### Scenario

A player session counts remaining lives and the current wave. Losing the last life must be the terminal game-over outcome, never a zero counter, and the wave must never overflow, so both counters need non-zero representations enforced at validation time and total transitions.

### Task

In src/domain.rs add NonZeroLives (wrapping std::num::NonZeroU8) with new, value, and lose_one returning LifeLoss, and Wave (wrapping std::num::NonZeroU32) with FIRST, new, value, and next.

### Concept context

Represent remaining lives and the wave counter as non-zero values with total terminal transitions.

- Prerequisites: `score-newtype`
- Tags: `newtype`, `nonzero`, `enums`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/asteroids-domain/002-lives-wave/starter/src/lib.rs`

```rust
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
```

#### `src/domain.rs` — editable

Source: `lessons/asteroids-domain/002-lives-wave/starter/src/domain.rs`

```rust
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
```

#### `tests/public.rs` — test

Source: `lessons/asteroids-domain/002-lives-wave/tests/public.rs`

```rust
use rust_daily_lesson::domain::{LifeLoss, NonZeroLives, Wave};

#[test]
fn lives_are_non_zero() {
    assert!(NonZeroLives::new(0).is_none());
    assert_eq!(NonZeroLives::new(3).unwrap().value(), 3);
}

#[test]
fn losing_a_life_keeps_lives_non_zero() {
    match NonZeroLives::new(3).unwrap().lose_one() {
        LifeLoss::Remaining(lives) => assert_eq!(lives.value(), 2),
        LifeLoss::GameOver => panic!("three lives should not end the session"),
    }
}

#[test]
fn losing_the_last_life_is_game_over() {
    assert!(matches!(
        NonZeroLives::new(1).unwrap().lose_one(),
        LifeLoss::GameOver
    ));
}

#[test]
fn waves_start_at_one_and_advance() {
    assert_eq!(Wave::FIRST.value(), 1);
    assert_eq!(Wave::FIRST.next().unwrap().value(), 2);
}

#[test]
fn wave_never_overflows() {
    let max = Wave::new(u32::MAX).unwrap();
    assert_eq!(max.value(), u32::MAX);
    assert!(max.next().is_none());
}
```

### Progressive hints

1. Wrap std::num::NonZeroU8 / NonZeroU32 in your own newtypes so the zero value cannot be represented.
2. lose_one returns LifeLoss::Remaining when lives remain and LifeLoss::GameOver when the last life is lost; Wave::next returns None when checked_add would overflow.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "tuple_struct_fields",
          "structName": "NonZeroLives",
          "requiredTypes": [
            "NonZeroU8"
          ]
        },
        {
          "type": "tuple_struct_fields",
          "structName": "Wave",
          "requiredTypes": [
            "NonZeroU32"
          ]
        },
        {
          "type": "enum_unit_variants",
          "enumName": "LifeLoss",
          "requiredVariants": [
            "Remaining",
            "GameOver"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "lives-private-field",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "has no field named"
          ],
          "sourcePath": "compile_fail/lives_private_field.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### lives-private-field

Source: `lessons/asteroids-domain/002-lives-wave/compile_fail/lives_private_field.rs`

```rust
use rust_daily_lesson::domain::NonZeroLives;

fn main() {
    let _lives = NonZeroLives(3);
}
```

### Authored solution

#### `src/domain.rs`

Source: `lessons/asteroids-domain/002-lives-wave/solution/src/domain.rs`

```rust
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
```

### Completion explanation

Your code matches the reference approach: the previous lesson's work stays active, and the new types compile against the public tests.

### Author notes

Teaches: non-zero lives and wave counters.

---

## 93. Ship as a state machine

Source: `lessons/asteroids-domain/003-ship-state`

| Field | Value |
| --- | --- |
| Lesson ID | `ship-state-003` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/ship-state-003) |
| Arc | Asteroids game domain (step 3 of 7) |
| Concept | Ship state machine (`ship-state`) |
| Difficulty | medium |
| Estimated time | 10 minutes |

### Scenario

The ship is never simply alive or dead: after respawning it is invulnerable while a protection timeout runs, and while respawning no ship exists at all. The game service needs these as explicit states so the invalid combinations are unrepresentable, with countdowns that expire into the next state.

### Task

In src/domain.rs define ShipState with Active(Ship), Invulnerable { ship, remaining }, and Respawning { remaining }, plus update(dt, screen), ship(), ship_mut(), and the RESPAWN_TIME and INVULNERABILITY_TIME constants. The Ship kinematics are provided above.

### Concept context

Model the ship as active, invulnerable, or respawning states with timed transitions.

- Prerequisites: `lives-wave`
- Tags: `state-machines`, `enums`, `duration`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/asteroids-domain/003-ship-state/starter/src/lib.rs`

```rust
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
```

#### `src/domain.rs` — editable

Source: `lessons/asteroids-domain/003-ship-state/starter/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}


// TODO: Model the ship as a state machine.
//
// The `Ship` kinematics above are provided. Define:
//   - `pub enum ShipState`
//       - `Active(Ship)`
//       - `Invulnerable { ship: Ship, remaining: Duration }` (spawn protection)
//       - `Respawning { remaining: Duration }` (no ship at all)
//   - `pub const INVULNERABILITY_TIME: Duration` (2 seconds) and
//     `pub const RESPAWN_TIME: Duration` (1.5 seconds)
//   - `pub fn update(&mut self, dt: Duration, screen: Screen)`
//     decrement countdowns; when Respawning finishes, spawn a ship into
//     Invulnerable; when Invulnerable finishes, go Active. The ship in
//     Active/Invulnerable keeps moving via `Ship::update`.
//   - `pub fn ship(&self) -> Option<&Ship>` and
//     `pub fn ship_mut(&mut self) -> Option<&mut Ship>` (None while Respawning)
```

#### `tests/public.rs` — test

Source: `lessons/asteroids-domain/003-ship-state/tests/public.rs`

```rust
use std::time::Duration;

use rust_daily_lesson::domain::{Ship, ShipState};
use rust_daily_lesson::Screen;

const SCREEN: Screen = Screen::new(800.0, 600.0);

#[test]
fn active_ship_is_available_and_keeps_moving() {
    let mut state = ShipState::Active(Ship::spawn(SCREEN));
    assert!(state.ship().is_some());
    state.update(Duration::from_secs(1), SCREEN);
    assert!(matches!(state, ShipState::Active(_)));
}

#[test]
fn respawning_has_no_ship_until_respawn_time_elapses() {
    let mut state = ShipState::Respawning {
        remaining: Duration::from_millis(500),
    };
    state.update(Duration::from_millis(400), SCREEN);
    assert!(state.ship().is_none());
    assert!(matches!(state, ShipState::Respawning { .. }));

    state.update(Duration::from_millis(100), SCREEN);
    assert!(state.ship().is_some());
    assert!(matches!(state, ShipState::Invulnerable { .. }));
}

#[test]
fn invulnerability_expires_into_active() {
    let mut state = ShipState::Invulnerable {
        ship: Ship::spawn(SCREEN),
        remaining: Duration::from_millis(500),
    };
    state.update(Duration::from_millis(500), SCREEN);
    assert!(matches!(state, ShipState::Active(_)));
}

#[test]
fn the_countdown_constants_match_the_game() {
    assert_eq!(ShipState::RESPAWN_TIME, Duration::from_millis(1_500));
    assert_eq!(ShipState::INVULNERABILITY_TIME, Duration::from_secs(2));
}
```

### Progressive hints

1. Three variants: Active(Ship), Invulnerable { ship, remaining }, Respawning { remaining } — the ship only exists in the first two.
2. In update, decrement remaining with saturating_sub(dt); when Respawning hits zero, transition to Invulnerable with Ship::spawn(screen) and INVULNERABILITY_TIME; when Invulnerable hits zero, transition to Active.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "ShipState",
          "requiredVariants": [
            "Active",
            "Invulnerable",
            "Respawning"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "ShipState",
          "methodName": "update",
          "requiredSignatureIncludes": [
            "Duration"
          ]
        },
        {
          "type": "source_includes",
          "requiredSnippets": [
            "saturating_sub"
          ],
          "forbiddenSnippets": []
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/domain.rs`

Source: `lessons/asteroids-domain/003-ship-state/solution/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}
```

### Completion explanation

Your code matches the reference approach: the previous lesson's work stays active, and the new types compile against the public tests.

### Author notes

Teaches: ship as a state machine.

---

## 94. Weapon cooldown and bullet lifetime

Source: `lessons/asteroids-domain/004-weapon-bullet`

| Field | Value |
| --- | --- |
| Lesson ID | `weapon-bullet-004` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/weapon-bullet-004) |
| Arc | Asteroids game domain (step 4 of 7) |
| Concept | Weapon cooldown and bullet lifetime (`weapon-bullet`) |
| Difficulty | medium |
| Estimated time | 10 minutes |

### Scenario

Firing is rate-limited by a cooldown timeout, and every bullet carries a lifetime timeout after which it is culled from the service. Both are countdown states that must expire deterministically, so the weapon and the bullet need explicit state representations.

### Task

In src/domain.rs define FiringPose from &Ship, WeaponConfig, WeaponState (Ready / CoolingDown), Weapon with new, fire taking a FiringPose and returning an optional Bullet, and update, and Bullet with new, position, and update returning whether the bullet should be kept.

### Concept context

Model rate-limited firing and bullet expiry as countdown states.

- Prerequisites: `ship-state`
- Tags: `state-machines`, `duration`, `lifecycle`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/asteroids-domain/004-weapon-bullet/starter/src/lib.rs`

```rust
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
```

#### `src/domain.rs` — editable

Source: `lessons/asteroids-domain/004-weapon-bullet/starter/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}



// TODO: Model the weapon cooldown and the bullet lifetime.
//
// Define:
//   - pub enum WeaponState { Ready, CoolingDown { remaining: Duration } }
//   - pub struct FiringPose { origin: Vec2, direction: Vec2 }
//       - impl From<&Ship> for FiringPose (this borrows the ship)
//   - pub struct WeaponConfig { cooldown, muzzle_offset, bullet_speed, bullet_lifetime }
//   - pub struct Weapon { config: WeaponConfig, state: WeaponState }
//       - pub fn new(config: WeaponConfig) -> Self (starts Ready)
//       - pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet>
//         create a bullet from the pose and return None while cooling down
//       - pub fn update(&mut self, dt: Duration) (tick; Ready when it ends)
//   - pub struct Bullet { position: Vec2, velocity: Vec2, remaining: Duration }
//       - pub fn new(position: Vec2, velocity: Vec2, remaining: Duration) -> Self
//       - pub fn position(&self) -> Vec2
//       - pub fn update(&mut self, dt: Duration, screen: Screen) -> bool
//         advance motion; return false when the bullet should be removed
//         (lifetime expired or off-screen)
```

#### `tests/public.rs` — test

Source: `lessons/asteroids-domain/004-weapon-bullet/tests/public.rs`

```rust
use std::time::Duration;

use rust_daily_lesson::domain::{Bullet, FiringPose, Ship, Weapon, WeaponConfig};
use rust_daily_lesson::{Screen, Vec2};

const SCREEN: Screen = Screen::new(800.0, 600.0);

#[test]
fn weapon_fires_when_ready_and_respects_cooldown() {
    let ship = Ship::spawn(SCREEN);
    let pose = FiringPose::from(&ship);
    let mut weapon = Weapon::new(WeaponConfig::new(
        Duration::from_millis(250),
        20.0,
        520.0,
        Duration::from_millis(1_100),
    ));

    assert!(weapon.fire(pose).is_some());
    assert!(weapon.fire(pose).is_none());

    weapon.update(Duration::from_millis(249));
    assert!(weapon.fire(pose).is_none());

    weapon.update(Duration::from_millis(1));
    assert!(weapon.fire(pose).is_some());
}

#[test]
fn bullet_moves_and_expires() {
    let mut bullet = Bullet::new(Vec2::ZERO, Vec2::new(10.0, 0.0), Duration::from_secs(2));

    assert!(bullet.update(Duration::from_secs(1), SCREEN));
    assert_eq!(bullet.position(), Vec2::new(10.0, 0.0));

    assert!(!bullet.update(Duration::from_secs(1), SCREEN)); // lifetime exhausted
}

#[test]
fn bullet_is_culled_when_offscreen() {
    let mut bullet = Bullet::new(Vec2::new(95.0, 50.0), Vec2::new(10.0, 0.0), Duration::from_secs(1));
    assert!(!bullet.update(Duration::from_secs(1), SCREEN));
}
```

### Progressive hints

1. WeaponState::CoolingDown { remaining } is the cooldown countdown; Bullet::remaining is the lifetime countdown.
2. FiringPose borrows only the ship's position and heading; Weapon::fire(pose) creates a bullet and starts the cooldown, returning None while cooling down. Bullet::update returns false when remaining reaches zero or the position leaves the screen.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "WeaponState",
          "requiredVariants": [
            "Ready",
            "CoolingDown"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Weapon",
          "methodName": "fire",
          "requiredSignatureIncludes": [
            "FiringPose",
            "Option<Bullet>"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Bullet",
          "methodName": "update",
          "requiredSignatureIncludes": [
            "bool"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/domain.rs`

Source: `lessons/asteroids-domain/004-weapon-bullet/solution/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}


/// The ship pose needed to create a bullet, without coupling Weapon to Ship.
#[derive(Debug, Clone, Copy)]
pub struct FiringPose {
    origin: Vec2,
    direction: Vec2,
}

impl From<&Ship> for FiringPose {
    fn from(ship: &Ship) -> Self {
        Self {
            origin: ship.position,
            direction: Vec2::new(ship.heading.sin(), -ship.heading.cos()),
        }
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown {
        remaining: std::time::Duration,
    },
}

#[derive(Debug, Clone, Copy)]
pub struct WeaponConfig {
    cooldown: std::time::Duration,
    muzzle_offset: f32,
    bullet_speed: f32,
    bullet_lifetime: std::time::Duration,
}

impl WeaponConfig {
    pub const fn new(
        cooldown: std::time::Duration,
        muzzle_offset: f32,
        bullet_speed: f32,
        bullet_lifetime: std::time::Duration,
    ) -> Self {
        Self {
            cooldown,
            muzzle_offset,
            bullet_speed,
            bullet_lifetime,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    config: WeaponConfig,
    state: WeaponState,
}

impl Weapon {
    pub fn new(config: WeaponConfig) -> Self {
        Self {
            config,
            state: WeaponState::Ready,
        }
    }

    /// Try to fire: creates a bullet and consumes the cooldown when ready.
    pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet> {
        if !matches!(self.state, WeaponState::Ready) {
            return None;
        }

        self.state = WeaponState::CoolingDown {
            remaining: self.config.cooldown,
        };
        Some(Bullet::new(
            pose.origin + pose.direction * self.config.muzzle_offset,
            pose.direction * self.config.bullet_speed,
            self.config.bullet_lifetime,
        ))
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        if let WeaponState::CoolingDown { remaining } = &mut self.state {
            *remaining = remaining.saturating_sub(dt);
            if remaining.is_zero() {
                self.state = WeaponState::Ready;
            }
        }
    }
}

/// A bullet in flight. Dies when its lifetime expires or it leaves the screen
/// (bullets do not wrap).
#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    position: Vec2,
    velocity: Vec2,
    remaining: std::time::Duration,
}

impl Bullet {
    pub fn new(position: Vec2, velocity: Vec2, remaining: std::time::Duration) -> Self {
        Self {
            position,
            velocity,
            remaining,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    /// Advance one frame; returns false when the bullet should be removed
    /// (lifetime expired or off-screen).
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) -> bool {
        self.position += self.velocity * dt.as_secs_f32();
        self.remaining = self.remaining.saturating_sub(dt);
        !self.remaining.is_zero() && screen.contains(self.position)
    }
}
```

### Completion explanation

Your code matches the reference approach: the previous lesson's work stays active, and the new types compile against the public tests.

### Author notes

Teaches: weapon cooldown and bullet lifetime.

---

## 95. Asteroid kinds, radii, scores, and splitting

Source: `lessons/asteroids-domain/005-asteroid-kinds`

| Field | Value |
| --- | --- |
| Lesson ID | `asteroid-kinds-005` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/asteroid-kinds-005) |
| Arc | Asteroids game domain (step 5 of 7) |
| Concept | Typed asteroid kinds (`asteroid-kinds`) |
| Difficulty | medium |
| Estimated time | 9 minutes |

### Scenario

Every asteroid shares the same kinematic body, but its size kind decides the collision radius, the score event it produces when destroyed, and whether it splits into two fragments. The game service needs a typed representation so these per-kind behaviors cannot be mixed up.

### Task

In src/domain.rs define AsteroidKind, a private AsteroidBody helper, Asteroid (with private kind and body fields), and AsteroidDestruction, with new, kind, position, velocity, radius, score, update, and destroy taking the injected randomness.

### Concept context

Represent asteroid sizes as a typed enum with per-kind radius, score, and splitting.

- Prerequisites: `weapon-bullet`
- Tags: `enums`, `domain-modeling`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/asteroids-domain/005-asteroid-kinds/starter/src/lib.rs`

```rust
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
```

#### `src/domain.rs` — editable

Source: `lessons/asteroids-domain/005-asteroid-kinds/starter/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}


/// The ship pose needed to create a bullet, without coupling Weapon to Ship.
#[derive(Debug, Clone, Copy)]
pub struct FiringPose {
    origin: Vec2,
    direction: Vec2,
}

impl From<&Ship> for FiringPose {
    fn from(ship: &Ship) -> Self {
        Self {
            origin: ship.position,
            direction: Vec2::new(ship.heading.sin(), -ship.heading.cos()),
        }
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown {
        remaining: std::time::Duration,
    },
}

#[derive(Debug, Clone, Copy)]
pub struct WeaponConfig {
    cooldown: std::time::Duration,
    muzzle_offset: f32,
    bullet_speed: f32,
    bullet_lifetime: std::time::Duration,
}

impl WeaponConfig {
    pub const fn new(
        cooldown: std::time::Duration,
        muzzle_offset: f32,
        bullet_speed: f32,
        bullet_lifetime: std::time::Duration,
    ) -> Self {
        Self {
            cooldown,
            muzzle_offset,
            bullet_speed,
            bullet_lifetime,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    config: WeaponConfig,
    state: WeaponState,
}

impl Weapon {
    pub fn new(config: WeaponConfig) -> Self {
        Self {
            config,
            state: WeaponState::Ready,
        }
    }

    /// Try to fire: creates a bullet and consumes the cooldown when ready.
    pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet> {
        if !matches!(self.state, WeaponState::Ready) {
            return None;
        }

        self.state = WeaponState::CoolingDown {
            remaining: self.config.cooldown,
        };
        Some(Bullet::new(
            pose.origin + pose.direction * self.config.muzzle_offset,
            pose.direction * self.config.bullet_speed,
            self.config.bullet_lifetime,
        ))
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        if let WeaponState::CoolingDown { remaining } = &mut self.state {
            *remaining = remaining.saturating_sub(dt);
            if remaining.is_zero() {
                self.state = WeaponState::Ready;
            }
        }
    }
}

/// A bullet in flight. Dies when its lifetime expires or it leaves the screen
/// (bullets do not wrap).
#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    position: Vec2,
    velocity: Vec2,
    remaining: std::time::Duration,
}

impl Bullet {
    pub fn new(position: Vec2, velocity: Vec2, remaining: std::time::Duration) -> Self {
        Self {
            position,
            velocity,
            remaining,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    /// Advance one frame; returns false when the bullet should be removed
    /// (lifetime expired or off-screen).
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) -> bool {
        self.position += self.velocity * dt.as_secs_f32();
        self.remaining = self.remaining.saturating_sub(dt);
        !self.remaining.is_zero() && screen.contains(self.position)
    }
}
// TODO: Model asteroid kinds and their destruction.
//
// Define:
//   - pub enum AsteroidKind { Large, Medium, Small }
//   - struct AsteroidBody { position: Vec2, velocity: Vec2 }
//   - pub struct Asteroid {
//       kind: AsteroidKind,
//       body: AsteroidBody,
//     }
//     with private fields so the kind and body stay coupled.
//   - pub enum AsteroidDestruction { Fragments([Asteroid; 2]), Destroyed }
//   - on Asteroid:
//       - pub fn new(kind: AsteroidKind, position: Vec2, velocity: Vec2) -> Self
//       - pub fn kind(&self) -> AsteroidKind
//       - pub fn position(&self) -> Vec2 / pub fn velocity(&self) -> Vec2
//       - pub fn radius(&self) -> f32  (40.0 / 22.0 / 12.0)
//       - pub fn score(&self) -> Score (20 / 50 / 100)
//       - pub fn update(&mut self, dt: Duration, screen: Screen)
//         integrate motion and wrap around the playfield
//       - pub fn destroy(self, rng: &mut impl Random) -> AsteroidDestruction
//         Large splits into two Mediums, Medium into two Smalls (both keep the
//         parent's position and draw a random velocity from the injected rng:
//         angle in 0..TAU, speed in 40..110); Small is destroyed outright.
//   - module constants SPEED_MIN (40.0) and SPEED_MAX (110.0)
```

#### `tests/public.rs` — test

Source: `lessons/asteroids-domain/005-asteroid-kinds/tests/public.rs`

```rust
use std::time::Duration;

use rust_daily_lesson::domain::{Asteroid, AsteroidDestruction, AsteroidKind};
use rust_daily_lesson::{Random, Screen, Vec2};

const SCREEN: Screen = Screen::new(800.0, 600.0);

/// Deterministic randomness: always the minimum value, never a chance hit.
struct TestRandom;

impl Random for TestRandom {
    fn range(&mut self, min: f32, _max: f32) -> f32 {
        min
    }

    fn chance(&mut self, _p: f64) -> bool {
        false
    }
}

#[test]
fn radius_and_score_follow_the_kind() {
    let pos = Vec2::new(100.0, 100.0);
    let large = Asteroid::new(AsteroidKind::Large, pos, Vec2::ZERO);
    let medium = Asteroid::new(AsteroidKind::Medium, pos, Vec2::ZERO);
    let small = Asteroid::new(AsteroidKind::Small, pos, Vec2::ZERO);

    assert_eq!(large.radius(), 40.0);
    assert_eq!(medium.radius(), 22.0);
    assert_eq!(small.radius(), 12.0);

    assert_eq!(large.score().value(), 20);
    assert_eq!(medium.score().value(), 50);
    assert_eq!(small.score().value(), 100);
}

#[test]
fn asteroids_integrate_and_wrap() {
    let mut asteroid = Asteroid::new(
        AsteroidKind::Large,
        Vec2::new(790.0, 50.0),
        Vec2::new(40.0, 0.0),
    );
    asteroid.update(Duration::from_secs(1), SCREEN);
    assert_eq!(asteroid.position(), Vec2::new(30.0, 50.0));
}

#[test]
fn asteroids_wrap_multiple_crossings() {
    let mut asteroid = Asteroid::new(
        AsteroidKind::Large,
        Vec2::new(50.0, 50.0),
        Vec2::new(-1_001.0, 1_201.0),
    );

    asteroid.update(Duration::from_secs(1), SCREEN);

    assert_eq!(asteroid.position(), Vec2::new(649.0, 51.0));
}

#[test]
fn large_asteroids_split_into_two_mediums() {
    let asteroid = Asteroid::new(AsteroidKind::Large, Vec2::new(200.0, 200.0), Vec2::ZERO);

    match asteroid.destroy(&mut TestRandom) {
        AsteroidDestruction::Fragments(parts) => {
            assert_eq!(parts.len(), 2);
            assert!(parts.iter().all(|a| a.kind() == AsteroidKind::Medium));
            assert_eq!(parts[0].position(), Vec2::new(200.0, 200.0));
            // TestRandom returns the minimum: angle 0, speed 40 -> (40, 0).
            assert_eq!(parts[0].velocity(), Vec2::new(40.0, 0.0));
        }
        AsteroidDestruction::Destroyed => panic!("large asteroids split"),
    }
}

#[test]
fn small_asteroids_are_destroyed_outright() {
    let asteroid = Asteroid::new(AsteroidKind::Small, Vec2::ZERO, Vec2::ZERO);
    assert!(matches!(
        asteroid.destroy(&mut TestRandom),
        AsteroidDestruction::Destroyed
    ));
}
```

### Progressive hints

1. Asteroid::new stores the AsteroidKind and AsteroidBody in private fields; kind(), radius(), and score() read from that shared representation.
2. destroy(self, rng) builds two Asteroid values with the next-smaller kind at the parent's position and random velocities; Small returns Destroyed.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "source_includes",
          "requiredSnippets": [
            "pub struct Asteroid {",
            "kind: AsteroidKind",
            "body: AsteroidBody"
          ],
          "forbiddenSnippets": [
            "pub enum Asteroid {"
          ]
        },
        {
          "type": "enum_unit_variants",
          "enumName": "AsteroidDestruction",
          "requiredVariants": [
            "Fragments",
            "Destroyed"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Asteroid",
          "methodName": "destroy",
          "requiredSignatureIncludes": [
            "Random"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "asteroid-body-private",
          "expectedDiagnostics": [
            "private"
          ],
          "forbiddenDiagnostics": [
            "unresolved import"
          ],
          "sourcePath": "compile_fail/asteroid_body_private.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### asteroid-body-private

Source: `lessons/asteroids-domain/005-asteroid-kinds/compile_fail/asteroid_body_private.rs`

```rust
use rust_daily_lesson::domain::AsteroidBody;

fn main() {
    let _ = AsteroidBody;
}
```

### Authored solution

#### `src/domain.rs`

Source: `lessons/asteroids-domain/005-asteroid-kinds/solution/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}


/// The ship pose needed to create a bullet, without coupling Weapon to Ship.
#[derive(Debug, Clone, Copy)]
pub struct FiringPose {
    origin: Vec2,
    direction: Vec2,
}

impl From<&Ship> for FiringPose {
    fn from(ship: &Ship) -> Self {
        Self {
            origin: ship.position,
            direction: Vec2::new(ship.heading.sin(), -ship.heading.cos()),
        }
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown {
        remaining: std::time::Duration,
    },
}

#[derive(Debug, Clone, Copy)]
pub struct WeaponConfig {
    cooldown: std::time::Duration,
    muzzle_offset: f32,
    bullet_speed: f32,
    bullet_lifetime: std::time::Duration,
}

impl WeaponConfig {
    pub const fn new(
        cooldown: std::time::Duration,
        muzzle_offset: f32,
        bullet_speed: f32,
        bullet_lifetime: std::time::Duration,
    ) -> Self {
        Self {
            cooldown,
            muzzle_offset,
            bullet_speed,
            bullet_lifetime,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    config: WeaponConfig,
    state: WeaponState,
}

impl Weapon {
    pub fn new(config: WeaponConfig) -> Self {
        Self {
            config,
            state: WeaponState::Ready,
        }
    }

    /// Try to fire: creates a bullet and consumes the cooldown when ready.
    pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet> {
        if !matches!(self.state, WeaponState::Ready) {
            return None;
        }

        self.state = WeaponState::CoolingDown {
            remaining: self.config.cooldown,
        };
        Some(Bullet::new(
            pose.origin + pose.direction * self.config.muzzle_offset,
            pose.direction * self.config.bullet_speed,
            self.config.bullet_lifetime,
        ))
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        if let WeaponState::CoolingDown { remaining } = &mut self.state {
            *remaining = remaining.saturating_sub(dt);
            if remaining.is_zero() {
                self.state = WeaponState::Ready;
            }
        }
    }
}

/// A bullet in flight. Dies when its lifetime expires or it leaves the screen
/// (bullets do not wrap).
#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    position: Vec2,
    velocity: Vec2,
    remaining: std::time::Duration,
}

impl Bullet {
    pub fn new(position: Vec2, velocity: Vec2, remaining: std::time::Duration) -> Self {
        Self {
            position,
            velocity,
            remaining,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    /// Advance one frame; returns false when the bullet should be removed
    /// (lifetime expired or off-screen).
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) -> bool {
        self.position += self.velocity * dt.as_secs_f32();
        self.remaining = self.remaining.saturating_sub(dt);
        !self.remaining.is_zero() && screen.contains(self.position)
    }
}

const SPEED_MIN: f32 = 40.0;
const SPEED_MAX: f32 = 110.0;

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
```

### Completion explanation

Your code matches the reference approach: the previous lesson's work stays active, and the new types compile against the public tests.

### Author notes

Teaches: asteroid kinds, radii, scores, and splitting.

---

## 96. Player composition facade

Source: `lessons/asteroids-domain/006-player-composition`

| Field | Value |
| --- | --- |
| Lesson ID | `player-composition-006` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/player-composition-006) |
| Arc | Asteroids game domain (step 6 of 7) |
| Concept | Player composition facade (`player-composition`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

The game service drives the player through one facade that binds the lives counter, the ship state machine, and the weapon. The facade turns service events such as being hit into outcomes and hides the delegation details.

### Task

In src/domain.rs define Player with new(lives, screen), lives, ship, update(dt, screen), hit returning whether the session is over, rotate, accelerate, and fire returning an optional bullet.

### Concept context

Compose lives, ship state, and weapon behind one player facade with outcome reporting.

- Prerequisites: `asteroid-kinds`, `ship-state`
- Tags: `composition`, `facade`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/asteroids-domain/006-player-composition/starter/src/lib.rs`

```rust
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
```

#### `src/domain.rs` — editable

Source: `lessons/asteroids-domain/006-player-composition/starter/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}


/// The ship pose needed to create a bullet, without coupling Weapon to Ship.
#[derive(Debug, Clone, Copy)]
pub struct FiringPose {
    origin: Vec2,
    direction: Vec2,
}

impl From<&Ship> for FiringPose {
    fn from(ship: &Ship) -> Self {
        Self {
            origin: ship.position,
            direction: Vec2::new(ship.heading.sin(), -ship.heading.cos()),
        }
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown {
        remaining: std::time::Duration,
    },
}

#[derive(Debug, Clone, Copy)]
pub struct WeaponConfig {
    cooldown: std::time::Duration,
    muzzle_offset: f32,
    bullet_speed: f32,
    bullet_lifetime: std::time::Duration,
}

impl WeaponConfig {
    pub const fn new(
        cooldown: std::time::Duration,
        muzzle_offset: f32,
        bullet_speed: f32,
        bullet_lifetime: std::time::Duration,
    ) -> Self {
        Self {
            cooldown,
            muzzle_offset,
            bullet_speed,
            bullet_lifetime,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    config: WeaponConfig,
    state: WeaponState,
}

impl Weapon {
    pub fn new(config: WeaponConfig) -> Self {
        Self {
            config,
            state: WeaponState::Ready,
        }
    }

    /// Try to fire: creates a bullet and consumes the cooldown when ready.
    pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet> {
        if !matches!(self.state, WeaponState::Ready) {
            return None;
        }

        self.state = WeaponState::CoolingDown {
            remaining: self.config.cooldown,
        };
        Some(Bullet::new(
            pose.origin + pose.direction * self.config.muzzle_offset,
            pose.direction * self.config.bullet_speed,
            self.config.bullet_lifetime,
        ))
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        if let WeaponState::CoolingDown { remaining } = &mut self.state {
            *remaining = remaining.saturating_sub(dt);
            if remaining.is_zero() {
                self.state = WeaponState::Ready;
            }
        }
    }
}

/// A bullet in flight. Dies when its lifetime expires or it leaves the screen
/// (bullets do not wrap).
#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    position: Vec2,
    velocity: Vec2,
    remaining: std::time::Duration,
}

impl Bullet {
    pub fn new(position: Vec2, velocity: Vec2, remaining: std::time::Duration) -> Self {
        Self {
            position,
            velocity,
            remaining,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    /// Advance one frame; returns false when the bullet should be removed
    /// (lifetime expired or off-screen).
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) -> bool {
        self.position += self.velocity * dt.as_secs_f32();
        self.remaining = self.remaining.saturating_sub(dt);
        !self.remaining.is_zero() && screen.contains(self.position)
    }
}

const SPEED_MIN: f32 = 40.0;
const SPEED_MAX: f32 = 110.0;

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
// TODO: Compose the player facade.
//
// Define `pub struct Player { lives: NonZeroLives, ship: ShipState, weapon: Weapon }`
// with:
//   - `pub fn new(lives: NonZeroLives, screen: Screen) -> Self`
//     the ship spawns INVULNERABLE (spawn protection)
//   - `pub fn lives(&self) -> NonZeroLives` and `pub fn ship(&self) -> &ShipState`
//   - `pub fn update(&mut self, dt: Duration, screen: Screen)`
//   - `pub fn hit(&mut self) -> bool`
//     only an Active ship can be hit; losing the last life returns true
//     (session over), otherwise the ship starts respawning
//   - `pub fn rotate(&mut self, turn: Turn, dt: Duration)`
//   - `pub fn accelerate(&mut self, dt: Duration)`
//   - `pub fn fire(&mut self) -> Option<Bullet>` (delegates to Weapon::fire while a ship exists)
```

#### `tests/public.rs` — test

Source: `lessons/asteroids-domain/006-player-composition/tests/public.rs`

```rust
use std::time::Duration;

use rust_daily_lesson::domain::{NonZeroLives, Player, ShipState};
use rust_daily_lesson::Screen;

const SCREEN: Screen = Screen::new(800.0, 600.0);

#[test]
fn new_player_spawns_invulnerable() {
    let player = Player::new(NonZeroLives::new(3).unwrap(), SCREEN);
    assert!(matches!(player.ship(), ShipState::Invulnerable { .. }));
    assert_eq!(player.lives().value(), 3);
}

#[test]
fn invulnerable_player_ignores_hits() {
    let mut player = Player::new(NonZeroLives::new(3).unwrap(), SCREEN);
    assert!(!player.hit());
    assert_eq!(player.lives().value(), 3);
}

#[test]
fn active_player_hit_drains_a_life_and_respawns() {
    let mut player = Player::new(NonZeroLives::new(3).unwrap(), SCREEN);
    player.update(Duration::from_secs(3), SCREEN); // spawn protection expires

    assert!(!player.hit());
    assert_eq!(player.lives().value(), 2);
    assert!(matches!(player.ship(), ShipState::Respawning { .. }));
}

#[test]
fn losing_the_last_life_reports_game_over() {
    let mut player = Player::new(NonZeroLives::new(1).unwrap(), SCREEN);
    player.update(Duration::from_secs(3), SCREEN);

    assert!(player.hit());
}

#[test]
fn firing_requires_a_ship_and_respects_cooldown() {
    let mut player = Player::new(NonZeroLives::new(3).unwrap(), SCREEN);
    player.update(Duration::from_secs(3), SCREEN);

    assert!(player.fire().is_some());
    assert!(player.fire().is_none()); // weapon cooling down
}
```

### Progressive hints

1. Player::new spawns the ship Invulnerable with ShipState::INVULNERABILITY_TIME; hit() matches on the ship state.
2. hit() returns false unless the ship is Active; then lose_one drives the result: Remaining starts a respawn, GameOver returns true. fire() needs a ship and a ready weapon.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "Player",
          "requiredFields": [
            {
              "name": "lives",
              "typeIncludes": [
                "NonZeroLives"
              ]
            },
            {
              "name": "ship",
              "typeIncludes": [
                "ShipState"
              ]
            },
            {
              "name": "weapon",
              "typeIncludes": [
                "Weapon"
              ]
            }
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Player",
          "methodName": "hit",
          "requiredSignatureIncludes": [
            "bool"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/domain.rs`

Source: `lessons/asteroids-domain/006-player-composition/solution/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}


/// The ship pose needed to create a bullet, without coupling Weapon to Ship.
#[derive(Debug, Clone, Copy)]
pub struct FiringPose {
    origin: Vec2,
    direction: Vec2,
}

impl From<&Ship> for FiringPose {
    fn from(ship: &Ship) -> Self {
        Self {
            origin: ship.position,
            direction: Vec2::new(ship.heading.sin(), -ship.heading.cos()),
        }
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown {
        remaining: std::time::Duration,
    },
}

#[derive(Debug, Clone, Copy)]
pub struct WeaponConfig {
    cooldown: std::time::Duration,
    muzzle_offset: f32,
    bullet_speed: f32,
    bullet_lifetime: std::time::Duration,
}

impl WeaponConfig {
    pub const fn new(
        cooldown: std::time::Duration,
        muzzle_offset: f32,
        bullet_speed: f32,
        bullet_lifetime: std::time::Duration,
    ) -> Self {
        Self {
            cooldown,
            muzzle_offset,
            bullet_speed,
            bullet_lifetime,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    config: WeaponConfig,
    state: WeaponState,
}

impl Weapon {
    pub fn new(config: WeaponConfig) -> Self {
        Self {
            config,
            state: WeaponState::Ready,
        }
    }

    /// Try to fire: creates a bullet and consumes the cooldown when ready.
    pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet> {
        if !matches!(self.state, WeaponState::Ready) {
            return None;
        }

        self.state = WeaponState::CoolingDown {
            remaining: self.config.cooldown,
        };
        Some(Bullet::new(
            pose.origin + pose.direction * self.config.muzzle_offset,
            pose.direction * self.config.bullet_speed,
            self.config.bullet_lifetime,
        ))
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        if let WeaponState::CoolingDown { remaining } = &mut self.state {
            *remaining = remaining.saturating_sub(dt);
            if remaining.is_zero() {
                self.state = WeaponState::Ready;
            }
        }
    }
}

/// A bullet in flight. Dies when its lifetime expires or it leaves the screen
/// (bullets do not wrap).
#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    position: Vec2,
    velocity: Vec2,
    remaining: std::time::Duration,
}

impl Bullet {
    pub fn new(position: Vec2, velocity: Vec2, remaining: std::time::Duration) -> Self {
        Self {
            position,
            velocity,
            remaining,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    /// Advance one frame; returns false when the bullet should be removed
    /// (lifetime expired or off-screen).
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) -> bool {
        self.position += self.velocity * dt.as_secs_f32();
        self.remaining = self.remaining.saturating_sub(dt);
        !self.remaining.is_zero() && screen.contains(self.position)
    }
}

const SPEED_MIN: f32 = 40.0;
const SPEED_MAX: f32 = 110.0;

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

/// The player: remaining lives, the ship (in whatever state it is in), and the
/// ship's weapon, behind one facade the session drives.
#[derive(Debug)]
pub struct Player {
    lives: NonZeroLives,
    ship: ShipState,
    weapon: Weapon,
}

impl Player {
    /// A fresh player whose ship spawns invulnerable (spawn protection).
    pub fn new(lives: NonZeroLives, screen: Screen) -> Self {
        Self {
            lives,
            ship: ShipState::Invulnerable {
                ship: Ship::spawn(screen),
                remaining: ShipState::INVULNERABILITY_TIME,
            },
            weapon: Weapon::new(WeaponConfig::new(
                std::time::Duration::from_millis(250),
                20.0,
                520.0,
                std::time::Duration::from_millis(1_100),
            )),
        }
    }

    pub fn lives(&self) -> NonZeroLives {
        self.lives
    }

    pub fn ship(&self) -> &ShipState {
        &self.ship
    }

    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.ship.update(dt, screen);
        self.weapon.update(dt);
    }

    /// The ship was hit. Only an active ship can be hit; invulnerable and
    /// respawning ships are unaffected. Returns `true` when the player has no
    /// lives left — the session is over.
    pub fn hit(&mut self) -> bool {
        if !matches!(self.ship, ShipState::Active(_)) {
            return false;
        }

        match self.lives.lose_one() {
            LifeLoss::Remaining(lives) => {
                self.lives = lives;
                self.ship = ShipState::Respawning {
                    remaining: ShipState::RESPAWN_TIME,
                };
                false
            }
            LifeLoss::GameOver => true,
        }
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        if let Some(ship) = self.ship.ship_mut() {
            ship.rotate(turn, dt);
        }
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        if let Some(ship) = self.ship.ship_mut() {
            ship.accelerate(dt);
        }
    }

    /// Fire a bullet, if a ship exists and the weapon is ready.
    pub fn fire(&mut self) -> Option<Bullet> {
        let ship = self.ship.ship()?;
        self.weapon.fire(FiringPose::from(ship))
    }
}
```

### Completion explanation

Your code matches the reference approach: the previous lesson's work stays active, and the new types compile against the public tests.

### Author notes

Teaches: player composition facade.

---

## 97. Compose the session update loop

Source: `lessons/asteroids-domain/007-game-session`

| Field | Value |
| --- | --- |
| Lesson ID | `game-session-007` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/game-session-007) |
| Arc | Asteroids game domain (step 7 of 7) |
| Concept | Session update loop (`game-session`) |
| Difficulty | medium |
| Estimated time | 10 minutes |

### Scenario

The session service turns per-frame input commands and elapsed time into game events. Each update must return an outcome event so the caller knows when the session ends, and the service must keep the wave, score, and entities consistent.

### Task

In src/domain.rs define PlayOutcome and PlayingGame with new (screen, rng), asteroids, bullets, score, and wave getters, and update(input, dt, rng) implementing steering, movement, collisions, scoring, and wave progression.

### Concept context

Compose a session update that turns input commands and injected randomness into game events.

- Prerequisites: `player-composition`, `asteroid-kinds`
- Tags: `composition`, `randomness`, `orchestration`

### Starter project files

#### `src/lib.rs` — readonly

Source: `lessons/asteroids-domain/007-game-session/starter/src/lib.rs`

```rust
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
```

#### `src/domain.rs` — editable

Source: `lessons/asteroids-domain/007-game-session/starter/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}


/// The ship pose needed to create a bullet, without coupling Weapon to Ship.
#[derive(Debug, Clone, Copy)]
pub struct FiringPose {
    origin: Vec2,
    direction: Vec2,
}

impl From<&Ship> for FiringPose {
    fn from(ship: &Ship) -> Self {
        Self {
            origin: ship.position,
            direction: Vec2::new(ship.heading.sin(), -ship.heading.cos()),
        }
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown {
        remaining: std::time::Duration,
    },
}

#[derive(Debug, Clone, Copy)]
pub struct WeaponConfig {
    cooldown: std::time::Duration,
    muzzle_offset: f32,
    bullet_speed: f32,
    bullet_lifetime: std::time::Duration,
}

impl WeaponConfig {
    pub const fn new(
        cooldown: std::time::Duration,
        muzzle_offset: f32,
        bullet_speed: f32,
        bullet_lifetime: std::time::Duration,
    ) -> Self {
        Self {
            cooldown,
            muzzle_offset,
            bullet_speed,
            bullet_lifetime,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    config: WeaponConfig,
    state: WeaponState,
}

impl Weapon {
    pub fn new(config: WeaponConfig) -> Self {
        Self {
            config,
            state: WeaponState::Ready,
        }
    }

    /// Try to fire: creates a bullet and consumes the cooldown when ready.
    pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet> {
        if !matches!(self.state, WeaponState::Ready) {
            return None;
        }

        self.state = WeaponState::CoolingDown {
            remaining: self.config.cooldown,
        };
        Some(Bullet::new(
            pose.origin + pose.direction * self.config.muzzle_offset,
            pose.direction * self.config.bullet_speed,
            self.config.bullet_lifetime,
        ))
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        if let WeaponState::CoolingDown { remaining } = &mut self.state {
            *remaining = remaining.saturating_sub(dt);
            if remaining.is_zero() {
                self.state = WeaponState::Ready;
            }
        }
    }
}

/// A bullet in flight. Dies when its lifetime expires or it leaves the screen
/// (bullets do not wrap).
#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    position: Vec2,
    velocity: Vec2,
    remaining: std::time::Duration,
}

impl Bullet {
    pub fn new(position: Vec2, velocity: Vec2, remaining: std::time::Duration) -> Self {
        Self {
            position,
            velocity,
            remaining,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    /// Advance one frame; returns false when the bullet should be removed
    /// (lifetime expired or off-screen).
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) -> bool {
        self.position += self.velocity * dt.as_secs_f32();
        self.remaining = self.remaining.saturating_sub(dt);
        !self.remaining.is_zero() && screen.contains(self.position)
    }
}

const SPEED_MIN: f32 = 40.0;
const SPEED_MAX: f32 = 110.0;

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

/// The player: remaining lives, the ship (in whatever state it is in), and the
/// ship's weapon, behind one facade the session drives.
#[derive(Debug)]
pub struct Player {
    lives: NonZeroLives,
    ship: ShipState,
    weapon: Weapon,
}

impl Player {
    /// A fresh player whose ship spawns invulnerable (spawn protection).
    pub fn new(lives: NonZeroLives, screen: Screen) -> Self {
        Self {
            lives,
            ship: ShipState::Invulnerable {
                ship: Ship::spawn(screen),
                remaining: ShipState::INVULNERABILITY_TIME,
            },
            weapon: Weapon::new(WeaponConfig::new(
                std::time::Duration::from_millis(250),
                20.0,
                520.0,
                std::time::Duration::from_millis(1_100),
            )),
        }
    }

    pub fn lives(&self) -> NonZeroLives {
        self.lives
    }

    pub fn ship(&self) -> &ShipState {
        &self.ship
    }

    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.ship.update(dt, screen);
        self.weapon.update(dt);
    }

    /// The ship was hit. Only an active ship can be hit; invulnerable and
    /// respawning ships are unaffected. Returns `true` when the player has no
    /// lives left — the session is over.
    pub fn hit(&mut self) -> bool {
        if !matches!(self.ship, ShipState::Active(_)) {
            return false;
        }

        match self.lives.lose_one() {
            LifeLoss::Remaining(lives) => {
                self.lives = lives;
                self.ship = ShipState::Respawning {
                    remaining: ShipState::RESPAWN_TIME,
                };
                false
            }
            LifeLoss::GameOver => true,
        }
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        if let Some(ship) = self.ship.ship_mut() {
            ship.rotate(turn, dt);
        }
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        if let Some(ship) = self.ship.ship_mut() {
            ship.accelerate(dt);
        }
    }

    /// Fire a bullet, if a ship exists and the weapon is ready.
    pub fn fire(&mut self) -> Option<Bullet> {
        let ship = self.ship.ship()?;
        self.weapon.fire(FiringPose::from(ship))
    }
}
// TODO: Compose the session update loop.
//
// Define:
//   - `pub enum PlayOutcome { Continued, PlayerKilled(Score) }`
//   - `pub struct PlayingGame { screen, player, asteroids, bullets, score, wave }`
//   - `pub fn new(screen: Screen, rng: &mut impl Random) -> Self`
//     player with 3 lives; spawn the first wave (4 large asteroids on random
//     playfield edges with random velocities)
//   - getters `asteroids()`, `bullets()`, `score()`, `wave()`
//   - `pub fn update(&mut self, input: &Input, dt: Duration, rng: &mut impl Random) -> PlayOutcome`
//     1. steering: rotate / accelerate / fire (fire pushes a bullet)
//     2. player.update(dt, screen)
//     3. bullets: keep those whose update(dt, screen) returns true
//     4. asteroids: update each
//     5. bullet x asteroid collisions: destroy the asteroid, add its score,
//        keep any fragments (use circle_collide with bullet radius 2.0)
//     6. ship collision (circle_collide with radius 12.0): when
//        player.hit() is true return PlayOutcome::PlayerKilled(score)
//     7. when no asteroids remain, advance the wave and spawn the next one
//        (starting_asteroids + wave - 1 large asteroids)
//
// Use constants STARTING_ASTEROIDS = 4, SHIP_COLLISION_RADIUS = 12.0,
// BULLET_RADIUS = 2.0.
```

#### `tests/public.rs` — test

Source: `lessons/asteroids-domain/007-game-session/tests/public.rs`

```rust
use std::time::Duration;

use rust_daily_lesson::domain::{PlayOutcome, PlayingGame, Score};
use rust_daily_lesson::{Input, Random, Screen, Vec2};

const SCREEN: Screen = Screen::new(800.0, 600.0);

/// Scripted randomness: `range` scales a scripted value into `min..max`;
/// `chance` compares a scripted value against the probability. The script
/// cycles if the simulation asks for more values than were provided.
struct ScriptedRandom {
    values: Vec<f32>,
    index: usize,
}

impl ScriptedRandom {
    fn new(values: Vec<f32>) -> Self {
        Self { values, index: 0 }
    }
}

impl Random for ScriptedRandom {
    fn range(&mut self, min: f32, max: f32) -> f32 {
        if self.values.is_empty() {
            return min;
        }
        let unit = self.values[self.index % self.values.len()];
        self.index += 1;
        min + (max - min) * unit
    }

    fn chance(&mut self, p: f64) -> bool {
        self.range(0.0, 1.0) < p as f32
    }
}

/// Spawn script: `chance(0.5)` is true when the scripted unit is < 0.5, so a
/// leading 1.0 picks the top/bottom edge and a 0.0 picks the top (y = 0).
/// The first asteroid appears at the top edge (x = 400) heading straight
/// down; the other three appear at the origin heading right.
const SPAWN: [f32; 20] = [
    1.0, 0.0, 0.5, 0.25, 0.0, // asteroid 1: (400, 0), velocity (0, 40)
    1.0, 0.0, 0.0, 0.0, 0.0, // asteroid 2: (0, 0), velocity (40, 0)
    1.0, 0.0, 0.0, 0.0, 0.0, // asteroid 3: (0, 0), velocity (40, 0)
    1.0, 0.0, 0.0, 0.0, 0.0, // asteroid 4: (0, 0), velocity (40, 0)
];

#[test]
fn new_game_spawns_the_first_wave() {
    let game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));

    assert_eq!(game.wave().value(), 1);
    assert_eq!(game.asteroids().len(), 4);
}

#[test]
fn asteroids_move_with_the_scripted_velocity() {
    let mut game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));

    game.update(&Input::default(), Duration::from_secs(1), &mut ScriptedRandom::new(SPAWN.to_vec()));

    // Asteroids 2-4 spawned at the origin with velocity (40, 0).
    assert_eq!(game.asteroids()[1].position(), Vec2::new(40.0, 0.0));
}

#[test]
fn holding_fire_is_rate_limited_by_the_cooldown() {
    let mut game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));
    let fire = Input {
        fire: true,
        ..Input::default()
    };

    game.update(&fire, Duration::ZERO, &mut ScriptedRandom::new(SPAWN.to_vec()));
    assert_eq!(game.bullets().len(), 1);

    game.update(&fire, Duration::from_millis(100), &mut ScriptedRandom::new(SPAWN.to_vec()));
    assert_eq!(game.bullets().len(), 1);

    game.update(&fire, Duration::from_millis(200), &mut ScriptedRandom::new(SPAWN.to_vec()));
    assert_eq!(game.bullets().len(), 1);

    game.update(&fire, Duration::ZERO, &mut ScriptedRandom::new(SPAWN.to_vec()));
    assert_eq!(game.bullets().len(), 2);
}

#[test]
fn shooting_destroys_an_asteroid_and_scores() {
    let mut game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));
    let fire = Input {
        fire: true,
        ..Input::default()
    };

    let outcome = game.update(
        &fire,
        Duration::from_millis(500),
        &mut ScriptedRandom::new(SPAWN.to_vec()),
    );

    assert_eq!(outcome, PlayOutcome::Continued);
    assert_eq!(game.score().value(), 20);
    assert!(game.bullets().is_empty());
    assert_eq!(game.asteroids().len(), 5); // 3 originals + 2 medium fragments
}

#[test]
fn ship_collisions_ultimately_end_the_session() {
    let mut game = PlayingGame::new(SCREEN, &mut ScriptedRandom::new(SPAWN.to_vec()));
    let mut rng = ScriptedRandom::new(SPAWN.to_vec());
    let step = Duration::from_secs_f32(7.5);

    // The scripted asteroid crosses the ship every 15 s (one wrap cycle);
    // three crossings drain all three lives.
    assert_eq!(game.update(&Input::default(), step, &mut rng), PlayOutcome::Continued);
    assert_eq!(game.update(&Input::default(), step, &mut rng), PlayOutcome::Continued);
    assert_eq!(game.update(&Input::default(), step, &mut rng), PlayOutcome::Continued);
    assert_eq!(game.update(&Input::default(), step, &mut rng), PlayOutcome::Continued);
    assert_eq!(
        game.update(&Input::default(), step, &mut rng),
        PlayOutcome::PlayerKilled(Score::ZERO)
    );
}
```

### Progressive hints

1. Follow the seven steps in the TODO comment in order: steering, player.update, bullet culling, asteroid motion, bullet collisions, ship collision, wave progression.
2. For bullet collisions, scan each bullet against the asteroids, swap_remove the hit asteroid, add its score, extend fragments, and swap_remove the bullet; a while loop over the bullet index keeps indices valid.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "PlayOutcome",
          "requiredVariants": [
            "Continued",
            "PlayerKilled"
          ]
        },
        {
          "type": "impl_method",
          "implFor": "PlayingGame",
          "methodName": "update",
          "requiredSignatureIncludes": [
            "PlayOutcome"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/domain.rs`

Source: `lessons/asteroids-domain/007-game-session/solution/src/domain.rs`

```rust
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

/// The player's ship: kinematics are provided; the state machine is your task.
#[derive(Debug, Clone, Copy)]
pub struct Ship {
    position: Vec2,
    velocity: Vec2,
    heading: f32,
}

impl Ship {
    const ROTATION_SPEED: f32 = 3.5;
    const THRUST: f32 = 220.0;
    const MAX_SPEED: f32 = 380.0;

    /// Spawn the ship at the center of the playfield.
    pub fn spawn(screen: Screen) -> Self {
        Self {
            position: screen.center(),
            velocity: Vec2::ZERO,
            heading: 0.0,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    pub fn heading(&self) -> f32 {
        self.heading
    }

    /// Integrate motion and wrap around the playfield.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.position += self.velocity * dt.as_secs_f32();
        self.position = screen.wrap(self.position);
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        self.heading += turn.direction() * Self::ROTATION_SPEED * dt.as_secs_f32();
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        let facing = Vec2::new(self.heading.sin(), -self.heading.cos());
        self.velocity += facing * (Self::THRUST * dt.as_secs_f32());
        let speed = self.velocity.length();
        if speed > Self::MAX_SPEED {
            self.velocity *= Self::MAX_SPEED / speed;
        }
    }
}

/// The three states a ship can be in. There is no "dead" state: a dead ship is
/// either respawning or the session is over.
#[derive(Debug, Clone, Copy)]
pub enum ShipState {
    Active(Ship),

    /// Recently respawned; the ship exists but collisions are ignored.
    Invulnerable {
        ship: Ship,
        remaining: std::time::Duration,
    },

    /// Waiting to respawn; there is no ship at all.
    Respawning {
        remaining: std::time::Duration,
    },
}

impl ShipState {
    pub const INVULNERABILITY_TIME: std::time::Duration = std::time::Duration::from_secs(2);
    pub const RESPAWN_TIME: std::time::Duration = std::time::Duration::from_millis(1_500);

    /// Advance one frame: the ship moves, countdowns tick, and expired
    /// countdowns transition to the next state.
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        match self {
            Self::Active(ship) => {
                ship.update(dt, screen);
            }
            Self::Invulnerable { ship, remaining } => {
                ship.update(dt, screen);
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    let ship = std::mem::replace(ship, Ship::spawn(screen));
                    *self = Self::Active(ship);
                }
            }
            Self::Respawning { remaining } => {
                *remaining = remaining.saturating_sub(dt);
                if remaining.is_zero() {
                    *self = Self::Invulnerable {
                        ship: Ship::spawn(screen),
                        remaining: Self::INVULNERABILITY_TIME,
                    };
                }
            }
        }
    }

    /// The ship, if one currently exists.
    pub fn ship(&self) -> Option<&Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }

    pub fn ship_mut(&mut self) -> Option<&mut Ship> {
        match self {
            Self::Active(ship) | Self::Invulnerable { ship, .. } => Some(ship),
            Self::Respawning { .. } => None,
        }
    }
}


/// The ship pose needed to create a bullet, without coupling Weapon to Ship.
#[derive(Debug, Clone, Copy)]
pub struct FiringPose {
    origin: Vec2,
    direction: Vec2,
}

impl From<&Ship> for FiringPose {
    fn from(ship: &Ship) -> Self {
        Self {
            origin: ship.position,
            direction: Vec2::new(ship.heading.sin(), -ship.heading.cos()),
        }
    }
}

/// The weapon: ready to fire, or cooling down after a shot.
#[derive(Debug, Clone, Copy)]
pub enum WeaponState {
    Ready,
    CoolingDown {
        remaining: std::time::Duration,
    },
}

#[derive(Debug, Clone, Copy)]
pub struct WeaponConfig {
    cooldown: std::time::Duration,
    muzzle_offset: f32,
    bullet_speed: f32,
    bullet_lifetime: std::time::Duration,
}

impl WeaponConfig {
    pub const fn new(
        cooldown: std::time::Duration,
        muzzle_offset: f32,
        bullet_speed: f32,
        bullet_lifetime: std::time::Duration,
    ) -> Self {
        Self {
            cooldown,
            muzzle_offset,
            bullet_speed,
            bullet_lifetime,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Weapon {
    config: WeaponConfig,
    state: WeaponState,
}

impl Weapon {
    pub fn new(config: WeaponConfig) -> Self {
        Self {
            config,
            state: WeaponState::Ready,
        }
    }

    /// Try to fire: creates a bullet and consumes the cooldown when ready.
    pub fn fire(&mut self, pose: FiringPose) -> Option<Bullet> {
        if !matches!(self.state, WeaponState::Ready) {
            return None;
        }

        self.state = WeaponState::CoolingDown {
            remaining: self.config.cooldown,
        };
        Some(Bullet::new(
            pose.origin + pose.direction * self.config.muzzle_offset,
            pose.direction * self.config.bullet_speed,
            self.config.bullet_lifetime,
        ))
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        if let WeaponState::CoolingDown { remaining } = &mut self.state {
            *remaining = remaining.saturating_sub(dt);
            if remaining.is_zero() {
                self.state = WeaponState::Ready;
            }
        }
    }
}

/// A bullet in flight. Dies when its lifetime expires or it leaves the screen
/// (bullets do not wrap).
#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    position: Vec2,
    velocity: Vec2,
    remaining: std::time::Duration,
}

impl Bullet {
    pub fn new(position: Vec2, velocity: Vec2, remaining: std::time::Duration) -> Self {
        Self {
            position,
            velocity,
            remaining,
        }
    }

    pub fn position(&self) -> Vec2 {
        self.position
    }

    /// Advance one frame; returns false when the bullet should be removed
    /// (lifetime expired or off-screen).
    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) -> bool {
        self.position += self.velocity * dt.as_secs_f32();
        self.remaining = self.remaining.saturating_sub(dt);
        !self.remaining.is_zero() && screen.contains(self.position)
    }
}

const SPEED_MIN: f32 = 40.0;
const SPEED_MAX: f32 = 110.0;

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

/// The player: remaining lives, the ship (in whatever state it is in), and the
/// ship's weapon, behind one facade the session drives.
#[derive(Debug)]
pub struct Player {
    lives: NonZeroLives,
    ship: ShipState,
    weapon: Weapon,
}

impl Player {
    /// A fresh player whose ship spawns invulnerable (spawn protection).
    pub fn new(lives: NonZeroLives, screen: Screen) -> Self {
        Self {
            lives,
            ship: ShipState::Invulnerable {
                ship: Ship::spawn(screen),
                remaining: ShipState::INVULNERABILITY_TIME,
            },
            weapon: Weapon::new(WeaponConfig::new(
                std::time::Duration::from_millis(250),
                20.0,
                520.0,
                std::time::Duration::from_millis(1_100),
            )),
        }
    }

    pub fn lives(&self) -> NonZeroLives {
        self.lives
    }

    pub fn ship(&self) -> &ShipState {
        &self.ship
    }

    pub fn update(&mut self, dt: std::time::Duration, screen: Screen) {
        self.ship.update(dt, screen);
        self.weapon.update(dt);
    }

    /// The ship was hit. Only an active ship can be hit; invulnerable and
    /// respawning ships are unaffected. Returns `true` when the player has no
    /// lives left — the session is over.
    pub fn hit(&mut self) -> bool {
        if !matches!(self.ship, ShipState::Active(_)) {
            return false;
        }

        match self.lives.lose_one() {
            LifeLoss::Remaining(lives) => {
                self.lives = lives;
                self.ship = ShipState::Respawning {
                    remaining: ShipState::RESPAWN_TIME,
                };
                false
            }
            LifeLoss::GameOver => true,
        }
    }

    pub fn rotate(&mut self, turn: Turn, dt: std::time::Duration) {
        if let Some(ship) = self.ship.ship_mut() {
            ship.rotate(turn, dt);
        }
    }

    pub fn accelerate(&mut self, dt: std::time::Duration) {
        if let Some(ship) = self.ship.ship_mut() {
            ship.accelerate(dt);
        }
    }

    /// Fire a bullet, if a ship exists and the weapon is ready.
    pub fn fire(&mut self) -> Option<Bullet> {
        let ship = self.ship.ship()?;
        self.weapon.fire(FiringPose::from(ship))
    }
}

/// How a frame of play ended.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlayOutcome {
    /// The session continues.
    Continued,
    /// The player lost their last ship; `score` is the final score.
    PlayerKilled(Score),
}

/// A live session: the player, every asteroid and bullet in flight, and the
/// session counters.
#[derive(Debug)]
pub struct PlayingGame {
    screen: Screen,
    player: Player,
    asteroids: Vec<Asteroid>,
    bullets: Vec<Bullet>,
    score: Score,
    wave: Wave,
}

impl PlayingGame {
    const STARTING_ASTEROIDS: usize = 4;
    const SHIP_COLLISION_RADIUS: f32 = 12.0;
    const BULLET_RADIUS: f32 = 2.0;

    /// A fresh session: the player spawns invulnerable and the first wave is
    /// spawned from the injected randomness.
    pub fn new(screen: Screen, rng: &mut impl Random) -> Self {
        let mut game = Self {
            screen,
            player: Player::new(
                NonZeroLives::new(3).expect("three lives is non-zero"),
                screen,
            ),
            asteroids: Vec::new(),
            bullets: Vec::new(),
            score: Score::ZERO,
            wave: Wave::FIRST,
        };
        game.spawn_wave(rng);
        game
    }

    pub fn asteroids(&self) -> &[Asteroid] {
        &self.asteroids
    }

    pub fn bullets(&self) -> &[Bullet] {
        &self.bullets
    }

    pub fn score(&self) -> Score {
        self.score
    }

    pub fn wave(&self) -> Wave {
        self.wave
    }

    /// Advance one frame: input, physics, collisions, wave progression.
    pub fn update(
        &mut self,
        input: &Input,
        dt: std::time::Duration,
        rng: &mut impl Random,
    ) -> PlayOutcome {
        let screen = self.screen;

        if let Some(turn) = input.turn {
            self.player.rotate(turn, dt);
        }
        if input.thrust {
            self.player.accelerate(dt);
        }
        if input.fire {
            if let Some(bullet) = self.player.fire() {
                self.bullets.push(bullet);
            }
        }

        self.player.update(dt, screen);

        self.bullets.retain_mut(|bullet| bullet.update(dt, screen));
        for asteroid in &mut self.asteroids {
            asteroid.update(dt, screen);
        }

        // Bullet x asteroid collisions: destroy the first asteroid each bullet
        // touches, add its score, and keep any fragments.
        let mut bullet_index = 0;
        while bullet_index < self.bullets.len() {
            let bullet_position = self.bullets[bullet_index].position();
            let hit = self.asteroids.iter().position(|asteroid| {
                circle_collide(
                    bullet_position,
                    Self::BULLET_RADIUS,
                    asteroid.position(),
                    asteroid.radius(),
                )
            });
            if let Some(asteroid_index) = hit {
                let asteroid = self.asteroids.swap_remove(asteroid_index);
                self.score += asteroid.score();
                match asteroid.destroy(rng) {
                    AsteroidDestruction::Fragments(parts) => self.asteroids.extend(parts),
                    AsteroidDestruction::Destroyed => {}
                }
                self.bullets.swap_remove(bullet_index);
            } else {
                bullet_index += 1;
            }
        }

        // Ship x asteroid collision: the player can only be hit while active.
        let ship_hit = self.player.ship().ship().is_some_and(|ship| {
            self.asteroids.iter().any(|asteroid| {
                circle_collide(
                    ship.position(),
                    Self::SHIP_COLLISION_RADIUS,
                    asteroid.position(),
                    asteroid.radius(),
                )
            })
        });
        if ship_hit && self.player.hit() {
            return PlayOutcome::PlayerKilled(self.score);
        }

        // The field was cleared: advance the wave and spawn the next one.
        if self.asteroids.is_empty() {
            if let Some(next) = self.wave.next() {
                self.wave = next;
            }
            self.spawn_wave(rng);
        }

        PlayOutcome::Continued
    }

    /// Spawn `starting + wave - 1` large asteroids on random playfield edges
    /// with random velocities from the injected randomness.
    fn spawn_wave(&mut self, rng: &mut impl Random) {
        let count = Self::STARTING_ASTEROIDS + (self.wave.value() as usize - 1);
        for _ in 0..count {
            let position = if rng.chance(0.5) {
                let x = if rng.chance(0.5) { 0.0 } else { self.screen.width() };
                Vec2::new(x, rng.range(0.0, self.screen.height()))
            } else {
                let y = if rng.chance(0.5) { 0.0 } else { self.screen.height() };
                Vec2::new(rng.range(0.0, self.screen.width()), y)
            };
            let angle = rng.range(0.0, std::f32::consts::TAU);
            let speed = rng.range(SPEED_MIN, SPEED_MAX);
            let velocity = Vec2::new(angle.cos() * speed, angle.sin() * speed);
            self.asteroids
                .push(Asteroid::new(AsteroidKind::Large, position, velocity));
        }
    }
}
```

### Completion explanation

Your code matches the reference approach: the previous lesson's work stays active, and the new types compile against the public tests.

### Author notes

Teaches: compose the session update loop.

---

## 98. Validate a request into a command

Source: `lessons/validate-prepare-commit/098-validated-transfer-command`

| Field | Value |
| --- | --- |
| Lesson ID | `validated-transfer-command-098` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/validated-transfer-command-098) |
| Arc | Validate, prepare, then commit (step 1 of 5) |
| Concept | Validated command boundary (`validated-transfer-command`) |
| Difficulty | medium |
| Estimated time | 8 minutes |

### Scenario

A transfer request arrives from an API boundary with a source account, a destination account, and an amount in cents. The request can still describe work the ledger must never execute: a transfer to the same account or a transfer of nothing. Those request-only rules should be settled before the ledger is borrowed at all.

### Task

In src/lib.rs, define a private TransferAmount(NonZeroU64) value and a TransferCommand whose private source, destination, and amount fields hold the validated data. Implement TryFrom<TransferRequest> so a same-account request or a zero amount is rejected with TransferRequestError, and add getters that expose the validated source, destination, and amount.

### Concept context

Convert a raw transfer request into an unforgeable command whose type records request-only invariants before application state is accessed.

- Prerequisites: `dto-tryfrom-validation`
- Tags: `validation`, `newtypes`, `tryfrom`, `architecture`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/validate-prepare-commit/098-validated-transfer-command/starter/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

// TODO: add the validated transfer command.
//
// Define a private `TransferAmount(NonZeroU64)` value, give `TransferCommand`
// private `source`, `destination`, and `amount` fields, and implement
// `TryFrom<TransferRequest>` so a zero amount or a same-account request is
// rejected with `TransferRequestError` before any ledger state is read. Expose
// the validated source, destination, and amount through getters.
```

#### `tests/public.rs` — test

Source: `lessons/validate-prepare-commit/098-validated-transfer-command/tests/public.rs`

```rust
use rust_daily_lesson::{AccountId, Money, TransferCommand, TransferRequest, TransferRequestError};

fn id(value: u32) -> AccountId {
    AccountId::new(value)
}

fn money(cents: u64) -> Money {
    Money::from_cents(cents)
}

#[test]
fn accepts_a_positive_transfer_between_distinct_accounts() {
    let request = TransferRequest::new(id(1), id(2), 250);

    let command = TransferCommand::try_from(request).expect("a positive transfer is valid");

    assert_eq!(command.source(), id(1));
    assert_eq!(command.destination(), id(2));
    assert_eq!(command.amount(), money(250));
}

#[test]
fn rejects_a_zero_amount() {
    let request = TransferRequest::new(id(1), id(2), 0);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::ZeroAmount)
    );
}

#[test]
fn rejects_a_transfer_to_the_same_account() {
    let request = TransferRequest::new(id(7), id(7), 500);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::SameAccount)
    );
}
```

### Progressive hints

1. A request only records what the caller asked for. Separate "the request was supplied" from "the request is legal to execute" with a second type that the ledger accepts.
2. NonZeroU64::new turns the zero check into a type invariant, and comparing the two account IDs rejects a self-transfer. Reject source == destination first, then build the command, and keep its fields private so no caller can skip the conversion.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "tuple_struct_fields",
          "structName": "TransferAmount",
          "requiredTypes": [
            "NonZeroU64"
          ]
        },
        {
          "type": "struct_fields",
          "structName": "TransferCommand",
          "requiredFields": [
            {
              "name": "source",
              "typeIncludes": [
                "AccountId"
              ]
            },
            {
              "name": "destination",
              "typeIncludes": [
                "AccountId"
              ]
            },
            {
              "name": "amount",
              "typeIncludes": [
                "TransferAmount"
              ]
            }
          ]
        },
        {
          "type": "impl_trait_for_type",
          "traitName": "TryFrom<TransferRequest>",
          "typeName": "TransferCommand"
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "transfer-command-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/transfer_command_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### transfer-command-direct-construction

Source: `lessons/validate-prepare-commit/098-validated-transfer-command/compile_fail/transfer_command_direct_construction.rs`

```rust
use rust_daily_lesson::{AccountId, TransferCommand};

fn main() {
    let id = AccountId::new(1);
    let _ = TransferCommand {
        source: id,
        destination: AccountId::new(2),
        amount: todo!(),
    };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/validate-prepare-commit/098-validated-transfer-command/solution/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}
```

### Completion explanation

TransferCommand is evidence that the request-only rules already passed, so the later phases can accept a command instead of rechecking the zero-amount and same-account cases. The private fields matter as much as the conversion: a validated type is only trustworthy when external code cannot forge it, and TryFrom<TransferRequest> is now the only way to obtain one.

### Author notes

## Concept Boundary

One concept: a raw request and a validated command are different types because
they carry different guarantees. `TransferCommand` records that the
request-only rules (no self-transfer, no zero amount) already passed. This
lesson is not about `Result`, `TryFrom`, or `NonZeroU64` in isolation; those are
established tools being composed into a validated boundary.

## Intended Solution

Keep `TransferRequest` as the shape the caller supplied and add a private
`TransferAmount(NonZeroU64)` plus a `TransferCommand` whose `source`,
`destination`, and `amount` fields stay private. `TryFrom<TransferRequest>` is
the single construction path: it rejects a self-transfer, then rejects a zero
amount through `NonZeroU64::new`, and only then builds the command. Getters
expose the validated values as `AccountId` and `Money`, never the internal
`TransferAmount`.

## Validation Strategy

Public tests prove that a positive distinct-account request converts and that
both request-only failures return their exact typed error. The `tuple_struct_fields`
and `struct_fields` checks protect the stable shape: the amount stays a
non-zero newtype and the command keeps its three private fields. The compile-fail
fixture proves external callers cannot bypass validation with a struct literal.
Cargo tests remain authoritative for behavior; the checks never assert on local
names or on the order of the checks inside `try_from`.

## Common Wrong Solutions

Reject storing the amount as a plain `u64` in `TransferCommand`, making the
command fields public, adding a `TransferCommand::new` that accepts unchecked
values, reading ledger state inside `TryFrom`, returning `String` or `&str`
errors instead of `TransferRequestError`, and using `assert!` or `panic!` for
zero or same-account validation.

## Arc Continuity

This is the first lesson of the arc, so the arc starts from the provided ledger
support types: `AccountId`, `Money`, `DuplicateAccount`, `Account`, `Ledger`,
and `TransferRequest`. Every later lesson starts from this authored solution and
keeps `TryFrom<TransferRequest>` as the only way to produce a command.

## Review Checklist

Confirm the scenario and instructions describe the request-only invariants, the
starter contains only the transfer command TODO, the public tests cover the
accept path and both reject paths with exact errors, and hint 3 matches the
authored solution.

---

## 99. Prepare a transfer without mutating

Source: `lessons/validate-prepare-commit/099-prepare-transfer`

| Field | Value |
| --- | --- |
| Lesson ID | `prepare-transfer-099` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/prepare-transfer-099) |
| Arc | Validate, prepare, then commit (step 2 of 5) |
| Concept | Prepare before mutation (`prepare-before-mutation`) |
| Difficulty | medium |
| Estimated time | 10 minutes |

### Scenario

A validated command can still fail against current state: the source or destination account may be missing, the source may not hold enough money, or crediting the destination may overflow its balance. Every one of those failures has to be resolved before a balance changes, so a rejected transfer leaves the ledger exactly as it was.

### Task

In src/lib.rs, add private checked_add and checked_sub helpers to Money and a TransferRejection enum with SourceNotFound, DestinationNotFound, InsufficientFunds, and DestinationOverflow. Add a value-only PreparedTransfer holding the source, destination, amount, source_after, and destination_after, and implement Ledger::prepare_transfer(&self, command) to resolve both accounts and both post-state balances with checked arithmetic without mutating the ledger.

### Concept context

Resolve state-dependent lookups and checked post-state before authoritative mutation so preparation failures leave state unchanged.

- Prerequisites: `validated-transfer-command`
- Tags: `transactions`, `validation`, `state`, `architecture`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/validate-prepare-commit/099-prepare-transfer/starter/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}

// TODO: prepare the transfer before anything mutates.
//
// Add private `checked_add` and `checked_sub` helpers to `Money`, add a
// `TransferRejection` enum with `SourceNotFound`, `DestinationNotFound`,
// `InsufficientFunds`, and `DestinationOverflow`, and add a value-only
// `PreparedTransfer` that stores the source, destination, amount, and both
// post-transfer balances. Then implement `Ledger::prepare_transfer(&self,
// command)` so it resolves both accounts and computes both post-state balances
// with checked arithmetic, returning the prepared value without changing a
// single balance. Rejected preparations must leave the ledger unchanged too,
// and `commit` does not exist yet.
```

#### `tests/public.rs` — test

Source: `lessons/validate-prepare-commit/099-prepare-transfer/tests/public.rs`

```rust
use rust_daily_lesson::{
    AccountId, Ledger, Money, TransferCommand, TransferRejection, TransferRequest,
    TransferRequestError,
};

fn id(value: u32) -> AccountId {
    AccountId::new(value)
}

fn money(cents: u64) -> Money {
    Money::from_cents(cents)
}

fn two_account_ledger(source: u64, destination: u64) -> Ledger {
    Ledger::try_new([(id(1), money(source)), (id(2), money(destination))])
        .expect("fixture account IDs are unique")
}

fn command(source: u32, destination: u32, amount_cents: u64) -> TransferCommand {
    TransferCommand::try_from(TransferRequest::new(
        id(source),
        id(destination),
        amount_cents,
    ))
    .expect("fixture requests are valid")
}

#[test]
fn accepts_a_positive_transfer_between_distinct_accounts() {
    let request = TransferRequest::new(id(1), id(2), 250);

    let validated = TransferCommand::try_from(request).expect("a positive transfer is valid");

    assert_eq!(validated.source(), id(1));
    assert_eq!(validated.destination(), id(2));
    assert_eq!(validated.amount(), money(250));
}

#[test]
fn rejects_a_zero_amount() {
    let request = TransferRequest::new(id(1), id(2), 0);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::ZeroAmount)
    );
}

#[test]
fn rejects_a_transfer_to_the_same_account() {
    let request = TransferRequest::new(id(7), id(7), 500);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::SameAccount)
    );
}

#[test]
fn prepares_a_transfer_without_moving_money() {
    let ledger = two_account_ledger(500, 100);

    let prepared = ledger.prepare_transfer(command(1, 2, 250));

    assert!(prepared.is_ok(), "the transfer should be preparable");
    assert_eq!(ledger.balance(id(1)), Some(money(500)));
    assert_eq!(ledger.balance(id(2)), Some(money(100)));
}

#[test]
fn a_missing_source_is_rejected_without_touching_the_ledger() {
    let ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(9, 1, 250));

    assert_eq!(result, Err(TransferRejection::SourceNotFound));
    assert_eq!(ledger, before);
}

#[test]
fn a_missing_destination_is_rejected_without_touching_the_ledger() {
    let ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 9, 250));

    assert_eq!(result, Err(TransferRejection::DestinationNotFound));
    assert_eq!(ledger, before);
}

#[test]
fn insufficient_funds_is_rejected_without_touching_the_ledger() {
    let ledger = two_account_ledger(100, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 2, 250));

    assert_eq!(result, Err(TransferRejection::InsufficientFunds));
    assert_eq!(ledger, before);
}

#[test]
fn destination_overflow_is_rejected_without_touching_the_ledger() {
    let ledger = two_account_ledger(500, u64::MAX);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 2, 250));

    assert_eq!(result, Err(TransferRejection::DestinationOverflow));
    assert_eq!(ledger, before);
}
```

### Progressive hints

1. Treat preparation as a calculation over the current ledger, not as a partial transfer. Nothing in this step is allowed to write.
2. Use checked_sub for the source and checked_add for the destination, then store the successful results in PreparedTransfer. A failed lookup or a failed checked operation returns before anything is written, so the ledger is untouched on every rejection.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "enum_unit_variants",
          "enumName": "TransferRejection",
          "requiredVariants": [
            "SourceNotFound",
            "DestinationNotFound",
            "InsufficientFunds",
            "DestinationOverflow"
          ]
        },
        {
          "type": "struct_fields",
          "structName": "PreparedTransfer",
          "requiredFields": [
            {
              "name": "source_after",
              "typeIncludes": [
                "Money"
              ]
            },
            {
              "name": "destination_after",
              "typeIncludes": [
                "Money"
              ]
            }
          ]
        },
        {
          "type": "impl_method",
          "implFor": "Ledger",
          "methodName": "prepare_transfer",
          "requiredSignatureIncludes": [
            "&self",
            "TransferCommand",
            "Result<PreparedTransfer",
            "TransferRejection"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    }
  ]
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/validate-prepare-commit/099-prepare-transfer/solution/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }

    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.0.checked_add(rhs.0).map(Self)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.0.checked_sub(rhs.0).map(Self)
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}

/// The state-dependent reasons a validated command cannot be prepared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

/// Everything a transfer needs once current ledger state has been resolved.
///
/// This is a plan, not a permission: it records which accounts are involved and
/// which balances they should hold afterwards, but nothing here can reach the
/// ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PreparedTransfer {
    source: AccountId,
    destination: AccountId,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Resolve every state-dependent failure before anything is mutated.
    pub fn prepare_transfer(
        &self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer, TransferRejection> {
        let amount = command.amount();

        let source_balance = self
            .balance(command.source())
            .ok_or(TransferRejection::SourceNotFound)?;
        let destination_balance = self
            .balance(command.destination())
            .ok_or(TransferRejection::DestinationNotFound)?;

        let source_after = source_balance
            .checked_sub(amount)
            .ok_or(TransferRejection::InsufficientFunds)?;
        let destination_after = destination_balance
            .checked_add(amount)
            .ok_or(TransferRejection::DestinationOverflow)?;

        Ok(PreparedTransfer {
            source: command.source(),
            destination: command.destination(),
            amount,
            source_after,
            destination_after,
        })
    }
}
```

### Completion explanation

Preparation now resolves the account lookups and both pieces of checked arithmetic before any mutation, so every expected failure leaves the ledger untouched. Be careful about what the prepared value actually is, though: it is only a snapshot. It remembers account IDs and the balances they should hold, which means a later mutation could make the stored post-state stale before anyone uses it. The next lesson fixes that by having preparation keep exclusive authority over the two accounts instead of copying their state.

### Author notes

## Concept Boundary

One concept: fallible work that depends on current state belongs before the
mutation, not inside it. `prepare_transfer` performs every account lookup and
both pieces of checked arithmetic, and returns a rejection instead of a
partially applied transfer. This lesson is not about `Result`, `Option`, or
error enums in isolation; those tools are being arranged around the mutation
boundary.

## Intended Solution

Add private `Money::checked_add` and `Money::checked_sub` helpers, a
`TransferRejection` enum with one variant per state-dependent failure, and a
value-only `PreparedTransfer` that carries the account IDs, the amount, and both
post-transfer balances. `Ledger::prepare_transfer(&self, command)` resolves the
source balance, then the destination balance, then computes `source_after` with
checked subtraction and `destination_after` with checked addition. Every failure
returns before the function could write, and taking `&self` makes that guarantee
visible in the signature.

## Validation Strategy

The public tests check the rejection variants and, just as importantly, compare
the whole ledger against a clone taken before the call: an error that still
moved money fails the lesson. The structural checks protect stable API shape
only: the four rejection variants, the two `Money` post-state fields on
`PreparedTransfer`, and a `prepare_transfer` that takes the command and returns
`Result<PreparedTransfer, TransferRejection>`. Nothing checks local variable
names or the order of the `checked_*` calls; the Cargo tests remain
authoritative.

## Common Wrong Solutions

Reject decrementing the source before the destination overflow check, mutating
and then restoring balances on error, using saturating arithmetic, using
unchecked `+` or `-` for the post-state, taking `&mut self` while still storing
only copied IDs and balances, and adding `commit` early.

## Arc Continuity

`TryFrom<TransferRequest>` remains the only way to obtain a `TransferCommand`,
and its zero-amount and same-account tests stay active in this lesson's suite.
The prepared type introduced here is deliberately value-only: the next lesson
replaces it with a borrow-bound capability, and this lesson's completion text
says so explicitly so the intermediate design is never mistaken for the target
design.

## Review Checklist

Confirm the scenario and instructions describe state-dependent failures,
preparation is described as a calculation rather than a partial transfer, the
starter contains only the preparation TODO, every rejection test compares the
ledger with its pre-call clone, and the completion text labels the value-only
plan as intermediate.

---

## 100. Bind prepared work to exclusive state

Source: `lessons/validate-prepare-commit/100-bind-prepared-transfer`

| Field | Value |
| --- | --- |
| Lesson ID | `bind-prepared-transfer-100` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/bind-prepared-transfer-100) |
| Arc | Validate, prepare, then commit (step 3 of 5) |
| Concept | Borrow-bound prepared capability (`borrow-bound-preparation`) |
| Difficulty | advanced |
| Estimated time | 10 minutes |

### Scenario

The value-only plan from the previous lesson can outlive the state it was calculated from, so nothing stops the ledger from changing before the plan is applied. A version counter or a second validation pass would only paper over that. In a local, synchronous API the prepared operation can borrow the exact accounts it is authorized to change and hold those borrows until it is used.

### Task

In src/lib.rs, replace the value-only PreparedTransfer with PreparedTransfer<'a>, which holds &'a mut Account for the source and the destination. Change Ledger::prepare_transfer to take &mut self and return PreparedTransfer<'_>, keeping the same account lookups, the same checked post-state, and the same rejections, and take the two account references from the provided account_pair_mut helper. The prepared type must not derive or implement Clone or Copy.

### Concept context

Bind prepared work to exclusive mutable references so state cannot drift between preparation and commit.

- Prerequisites: `prepare-before-mutation`
- Tags: `borrowing`, `lifetimes`, `capabilities`, `ownership`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/validate-prepare-commit/100-bind-prepared-transfer/starter/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }

    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.0.checked_add(rhs.0).map(Self)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.0.checked_sub(rhs.0).map(Self)
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}

/// The state-dependent reasons a validated command cannot be prepared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

/// Everything a transfer needs once current ledger state has been resolved.
///
/// This is a plan, not a permission: it records which accounts are involved and
/// which balances they should hold afterwards, but nothing here can reach the
/// ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PreparedTransfer {
    source: AccountId,
    destination: AccountId,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Resolve every state-dependent failure before anything is mutated.
    pub fn prepare_transfer(
        &self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer, TransferRejection> {
        let amount = command.amount();

        let source_balance = self
            .balance(command.source())
            .ok_or(TransferRejection::SourceNotFound)?;
        let destination_balance = self
            .balance(command.destination())
            .ok_or(TransferRejection::DestinationNotFound)?;

        let source_after = source_balance
            .checked_sub(amount)
            .ok_or(TransferRejection::InsufficientFunds)?;
        let destination_after = destination_balance
            .checked_add(amount)
            .ok_or(TransferRejection::DestinationOverflow)?;

        Ok(PreparedTransfer {
            source: command.source(),
            destination: command.destination(),
            amount,
            source_after,
            destination_after,
        })
    }
}

impl Ledger {
    /// Borrow the source and the destination at the same time without `unsafe`
    /// code or interior mutability. Provided support code: use it rather than
    /// rebuilding it.
    fn account_pair_mut(
        &mut self,
        source: AccountId,
        destination: AccountId,
    ) -> Option<(&mut Account, &mut Account)> {
        if source == destination {
            return None;
        }

        let source_index = self.accounts.iter().position(|account| account.id == source)?;
        let destination_index = self
            .accounts
            .iter()
            .position(|account| account.id == destination)?;

        if source_index < destination_index {
            let (before_destination, from_destination) =
                self.accounts.split_at_mut(destination_index);
            let source = before_destination.get_mut(source_index)?;
            let destination = from_destination.first_mut()?;
            Some((source, destination))
        } else {
            let (before_source, from_source) = self.accounts.split_at_mut(source_index);
            let destination = before_source.get_mut(destination_index)?;
            let source = from_source.first_mut()?;
            Some((source, destination))
        }
    }
}

// TODO: bind the prepared transfer to the state it is allowed to change.
//
// Replace the value-only `PreparedTransfer` with `PreparedTransfer<'a>` holding
// `&'a mut Account` for the source and the destination, and change
// `Ledger::prepare_transfer` to take `&mut self` and return
// `PreparedTransfer<'_>`. Resolve the account lookups and the checked
// post-state exactly as before, then take the two distinct account references
// from the provided `account_pair_mut` helper. Keep every rejection identical,
// keep both balances unchanged during preparation, and do not derive or
// implement `Clone` or `Copy` on the prepared type.
```

#### `tests/public.rs` — test

Source: `lessons/validate-prepare-commit/100-bind-prepared-transfer/tests/public.rs`

```rust
use rust_daily_lesson::{
    AccountId, Ledger, Money, TransferCommand, TransferRejection, TransferRequest,
    TransferRequestError,
};

fn id(value: u32) -> AccountId {
    AccountId::new(value)
}

fn money(cents: u64) -> Money {
    Money::from_cents(cents)
}

fn two_account_ledger(source: u64, destination: u64) -> Ledger {
    Ledger::try_new([(id(1), money(source)), (id(2), money(destination))])
        .expect("fixture account IDs are unique")
}

fn command(source: u32, destination: u32, amount_cents: u64) -> TransferCommand {
    TransferCommand::try_from(TransferRequest::new(
        id(source),
        id(destination),
        amount_cents,
    ))
    .expect("fixture requests are valid")
}

#[test]
fn accepts_a_positive_transfer_between_distinct_accounts() {
    let request = TransferRequest::new(id(1), id(2), 250);

    let validated = TransferCommand::try_from(request).expect("a positive transfer is valid");

    assert_eq!(validated.source(), id(1));
    assert_eq!(validated.destination(), id(2));
    assert_eq!(validated.amount(), money(250));
}

#[test]
fn rejects_a_zero_amount() {
    let request = TransferRequest::new(id(1), id(2), 0);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::ZeroAmount)
    );
}

#[test]
fn rejects_a_transfer_to_the_same_account() {
    let request = TransferRequest::new(id(7), id(7), 500);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::SameAccount)
    );
}

#[test]
fn prepares_a_transfer_without_moving_money() {
    let mut ledger = two_account_ledger(500, 100);

    let prepared = ledger.prepare_transfer(command(1, 2, 250));

    assert!(prepared.is_ok(), "the transfer should be preparable");
    drop(prepared);

    assert_eq!(ledger.balance(id(1)), Some(money(500)));
    assert_eq!(ledger.balance(id(2)), Some(money(100)));
}

#[test]
fn a_missing_source_is_rejected_without_touching_the_ledger() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(9, 1, 250));

    assert!(matches!(result, Err(TransferRejection::SourceNotFound)));
    assert_eq!(ledger, before);
}

#[test]
fn a_missing_destination_is_rejected_without_touching_the_ledger() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 9, 250));

    assert!(matches!(
        result,
        Err(TransferRejection::DestinationNotFound)
    ));
    assert_eq!(ledger, before);
}

#[test]
fn insufficient_funds_is_rejected_without_touching_the_ledger() {
    let mut ledger = two_account_ledger(100, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 2, 250));

    assert!(matches!(result, Err(TransferRejection::InsufficientFunds)));
    assert_eq!(ledger, before);
}

#[test]
fn destination_overflow_is_rejected_without_touching_the_ledger() {
    let mut ledger = two_account_ledger(500, u64::MAX);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 2, 250));

    assert!(matches!(
        result,
        Err(TransferRejection::DestinationOverflow)
    ));
    assert_eq!(ledger, before);
}
```

### Progressive hints

1. A prepared value does not have to describe authority. It can hold the authority itself as a borrow.
2. Resolve both checked post-balances first, then take two distinct &mut Account references and store them in PreparedTransfer<'_>. The exclusive borrow is what stops the ledger from changing underneath the preparation, and it is also why the type cannot be Clone or Copy.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "PreparedTransfer",
          "requiredFields": [
            {
              "name": "source",
              "typeIncludes": [
                "mut Account"
              ]
            },
            {
              "name": "destination",
              "typeIncludes": [
                "mut Account"
              ]
            }
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "prepared-blocks-ledger-reborrow",
          "expectedDiagnostics": [
            "cannot borrow"
          ],
          "sourcePath": "compile_fail/prepared_blocks_ledger_reborrow.rs"
        },
        {
          "name": "prepared-not-copy",
          "expectedDiagnostics": [
            "moved"
          ],
          "sourcePath": "compile_fail/prepared_not_copy.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### prepared-blocks-ledger-reborrow

Source: `lessons/validate-prepare-commit/100-bind-prepared-transfer/compile_fail/prepared_blocks_ledger_reborrow.rs`

```rust
use rust_daily_lesson::{AccountId, Ledger, Money, TransferCommand, TransferRequest};

fn main() {
    let mut ledger = Ledger::try_new([
        (AccountId::new(1), Money::from_cents(500)),
        (AccountId::new(2), Money::from_cents(100)),
    ])
    .unwrap();

    let command = TransferCommand::try_from(TransferRequest::new(
        AccountId::new(1),
        AccountId::new(2),
        250,
    ))
    .unwrap();

    let prepared = ledger.prepare_transfer(command).unwrap();
    let _balance = ledger.balance(AccountId::new(1));
    let _keep_borrow_alive = prepared;
}
```

##### prepared-not-copy

Source: `lessons/validate-prepare-commit/100-bind-prepared-transfer/compile_fail/prepared_not_copy.rs`

```rust
use rust_daily_lesson::{AccountId, Ledger, Money, TransferCommand, TransferRequest};

fn main() {
    let mut ledger = Ledger::try_new([
        (AccountId::new(1), Money::from_cents(500)),
        (AccountId::new(2), Money::from_cents(100)),
    ])
    .unwrap();

    let command = TransferCommand::try_from(TransferRequest::new(
        AccountId::new(1),
        AccountId::new(2),
        250,
    ))
    .unwrap();

    let prepared = ledger.prepare_transfer(command).unwrap();
    let duplicate = prepared;
    let _original = prepared;
    let _ = duplicate;
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/validate-prepare-commit/100-bind-prepared-transfer/solution/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }

    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.0.checked_add(rhs.0).map(Self)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.0.checked_sub(rhs.0).map(Self)
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}

/// The state-dependent reasons a validated command cannot be prepared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

/// The two accounts a transfer has resolved, borrowed for the whole time the
/// preparation is alive.
///
/// The exclusive borrows are the capability: while a `PreparedTransfer` exists,
/// nothing else can read or write the two accounts, so the post-state it holds
/// cannot go stale. The fields stay private and no constructor is public.
#[derive(Debug)]
pub struct PreparedTransfer<'a> {
    source: &'a mut Account,
    destination: &'a mut Account,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Borrow the source and the destination at the same time without `unsafe`
    /// code or interior mutability. Provided support code: use it rather than
    /// rebuilding it.
    fn account_pair_mut(
        &mut self,
        source: AccountId,
        destination: AccountId,
    ) -> Option<(&mut Account, &mut Account)> {
        if source == destination {
            return None;
        }

        let source_index = self.accounts.iter().position(|account| account.id == source)?;
        let destination_index = self
            .accounts
            .iter()
            .position(|account| account.id == destination)?;

        if source_index < destination_index {
            let (before_destination, from_destination) =
                self.accounts.split_at_mut(destination_index);
            let source = before_destination.get_mut(source_index)?;
            let destination = from_destination.first_mut()?;
            Some((source, destination))
        } else {
            let (before_source, from_source) = self.accounts.split_at_mut(source_index);
            let destination = before_source.get_mut(destination_index)?;
            let source = from_source.first_mut()?;
            Some((source, destination))
        }
    }

    /// Resolve every state-dependent failure and keep exclusive authority over
    /// the two accounts the transfer is allowed to change.
    pub fn prepare_transfer(
        &mut self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer<'_>, TransferRejection> {
        let amount = command.amount();

        let source_balance = self
            .balance(command.source())
            .ok_or(TransferRejection::SourceNotFound)?;
        let destination_balance = self
            .balance(command.destination())
            .ok_or(TransferRejection::DestinationNotFound)?;

        let source_after = source_balance
            .checked_sub(amount)
            .ok_or(TransferRejection::InsufficientFunds)?;
        let destination_after = destination_balance
            .checked_add(amount)
            .ok_or(TransferRejection::DestinationOverflow)?;

        let Some((source, destination)) =
            self.account_pair_mut(command.source(), command.destination())
        else {
            // Both accounts were resolved above and `TransferCommand` guarantees
            // distinct account IDs, so this is a defensive preparation
            // rejection rather than an assertion or a panic.
            return Err(TransferRejection::SourceNotFound);
        };

        Ok(PreparedTransfer {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        })
    }
}
```

### Completion explanation

PreparedTransfer<'a> is a capability now, not a copy of state: while it exists, the ledger cannot be borrowed in any other way, so the post-state it carries cannot go stale and the borrow checker enforces that for free. The same exclusive borrows explain why the type cannot be Clone or Copy. Duplicating the preparation would duplicate authority over the same two accounts, which is exactly the guarantee this design is trying to keep.

### Author notes

## Concept Boundary

One concept: prepared work can *hold* the authority it needs instead of merely
describing it. `PreparedTransfer<'a>` borrows the two accounts exclusively, so
the ledger cannot be read or written again until the preparation is consumed or
dropped. This lesson is not about lifetimes in isolation; the lifetime is the
mechanism that turns a stale-able plan into a capability.

## Intended Solution

Keep every lookup and every checked computation from the previous lesson, then
change the prepared type to `PreparedTransfer<'a>` with `source: &'a mut Account`
and `destination: &'a mut Account`, and change `Ledger::prepare_transfer` to
take `&mut self` and return `PreparedTransfer<'_>`. The provided
`account_pair_mut` helper yields both exclusive references without `unsafe` code
or interior mutability. `Clone` and `Copy` disappear, because a capability that
can be duplicated is not a capability.

## Validation Strategy

The Cargo tests keep lesson 99's behavior: successful preparation leaves both
balances untouched, and each rejection leaves the entire ledger equal to its
pre-call clone; only the fixture setup became `mut`, because preparation now
takes `&mut self`. The compile-fail fixtures carry the architectural contract:
`prepared_blocks_ledger_reborrow` proves the ledger cannot be borrowed while the
preparation is alive, and `prepared_not_copy` proves the capability cannot be
duplicated. The structural check only records that the prepared fields are
mutable account references; it deliberately does not prescribe a lifetime name.

## Common Wrong Solutions

Reject `Rc<RefCell<Account>>`, raw pointers or `unsafe`, storing account IDs
again while claiming stale-state protection, cloning accounts into the prepared
value, adding a second revalidation step before use, deriving `Clone` or `Copy`,
and holding a borrow of the whole ledger when two account references are enough.

## Intermediate Warning

Nothing consumes the prepared capability in this lesson, so the compiler reports
the stored fields as never read. That is accurate for this snapshot: the
consuming `commit` arrives in lesson 101, where every field becomes a read. Do
not silence it with `#[allow(dead_code)]` or by adding an unused getter.

## Arc Continuity

The value-only plan from lesson 99 is replaced, not kept alongside: the
rejections, the checked arithmetic, the command boundary, and the public tests
from the earlier lessons all stay active. The next lesson adds `commit` on this
borrow-bound type, and the final lesson composes the three phases.

## Review Checklist

Confirm the starter keeps the lesson 99 solution verbatim and adds only the
provided helper plus the refactor TODO, `prepare_transfer` returns
`PreparedTransfer<'_>` from `&mut self`, the prepared type derives neither
`Clone` nor `Copy`, and both compile-fail fixtures fail for the documented
reason.

---

## 101. Commit prepared work infallibly

Source: `lessons/validate-prepare-commit/101-commit-prepared-transfer`

| Field | Value |
| --- | --- |
| Lesson ID | `commit-prepared-transfer-101` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/commit-prepared-transfer-101) |
| Arc | Validate, prepare, then commit (step 4 of 5) |
| Concept | Consuming infallible commit (`consuming-infallible-commit`) |
| Difficulty | advanced |
| Estimated time | 9 minutes |

### Scenario

Preparation has already resolved existence, funds, and overflow, and it holds exclusive access to the two accounts. Commit should stop behaving like another validation function: it consumes the prepared capability, applies only the balances that were computed ahead of time, and reports the outcome.

### Task

In src/lib.rs, add a TransferReceipt with private source, destination, and amount fields plus getters, and implement PreparedTransfer::commit(self) -> TransferReceipt. Commit assigns the two precomputed post-balances to the borrowed accounts and builds the receipt. It must not return Result or Option, look an account up again, run checked arithmetic, or revalidate the request.

### Concept context

Consume a prepared capability to perform only prevalidated mutation and return an outcome without a recoverable failure channel.

- Prerequisites: `borrow-bound-preparation`
- Tags: `ownership`, `state-transitions`, `api-design`, `transactions`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/validate-prepare-commit/101-commit-prepared-transfer/starter/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }

    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.0.checked_add(rhs.0).map(Self)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.0.checked_sub(rhs.0).map(Self)
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}

/// The state-dependent reasons a validated command cannot be prepared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

/// The two accounts a transfer has resolved, borrowed for the whole time the
/// preparation is alive.
///
/// The exclusive borrows are the capability: while a `PreparedTransfer` exists,
/// nothing else can read or write the two accounts, so the post-state it holds
/// cannot go stale. The fields stay private and no constructor is public.
#[derive(Debug)]
pub struct PreparedTransfer<'a> {
    source: &'a mut Account,
    destination: &'a mut Account,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Borrow the source and the destination at the same time without `unsafe`
    /// code or interior mutability. Provided support code: use it rather than
    /// rebuilding it.
    fn account_pair_mut(
        &mut self,
        source: AccountId,
        destination: AccountId,
    ) -> Option<(&mut Account, &mut Account)> {
        if source == destination {
            return None;
        }

        let source_index = self.accounts.iter().position(|account| account.id == source)?;
        let destination_index = self
            .accounts
            .iter()
            .position(|account| account.id == destination)?;

        if source_index < destination_index {
            let (before_destination, from_destination) =
                self.accounts.split_at_mut(destination_index);
            let source = before_destination.get_mut(source_index)?;
            let destination = from_destination.first_mut()?;
            Some((source, destination))
        } else {
            let (before_source, from_source) = self.accounts.split_at_mut(source_index);
            let destination = before_source.get_mut(destination_index)?;
            let source = from_source.first_mut()?;
            Some((source, destination))
        }
    }

    /// Resolve every state-dependent failure and keep exclusive authority over
    /// the two accounts the transfer is allowed to change.
    pub fn prepare_transfer(
        &mut self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer<'_>, TransferRejection> {
        let amount = command.amount();

        let source_balance = self
            .balance(command.source())
            .ok_or(TransferRejection::SourceNotFound)?;
        let destination_balance = self
            .balance(command.destination())
            .ok_or(TransferRejection::DestinationNotFound)?;

        let source_after = source_balance
            .checked_sub(amount)
            .ok_or(TransferRejection::InsufficientFunds)?;
        let destination_after = destination_balance
            .checked_add(amount)
            .ok_or(TransferRejection::DestinationOverflow)?;

        let Some((source, destination)) =
            self.account_pair_mut(command.source(), command.destination())
        else {
            // Both accounts were resolved above and `TransferCommand` guarantees
            // distinct account IDs, so this is a defensive preparation
            // rejection rather than an assertion or a panic.
            return Err(TransferRejection::SourceNotFound);
        };

        Ok(PreparedTransfer {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        })
    }
}

// TODO: cross the authoritative boundary once.
//
// Add a `TransferReceipt` with private `source`, `destination`, and `amount`
// fields plus getters for each, then implement
// `PreparedTransfer::commit(self) -> TransferReceipt`. Commit assigns the two
// balances that preparation already computed and builds the receipt from the
// two account IDs and the amount. It must not return `Result` or `Option`, look
// an account up again, run checked arithmetic, or revalidate the request: every
// expected failure was consumed by preparation.
```

#### `tests/public.rs` — test

Source: `lessons/validate-prepare-commit/101-commit-prepared-transfer/tests/public.rs`

```rust
use rust_daily_lesson::{
    AccountId, Ledger, Money, PreparedTransfer, TransferCommand, TransferReceipt, TransferRejection,
    TransferRequest, TransferRequestError,
};

fn id(value: u32) -> AccountId {
    AccountId::new(value)
}

fn money(cents: u64) -> Money {
    Money::from_cents(cents)
}

fn two_account_ledger(source: u64, destination: u64) -> Ledger {
    Ledger::try_new([(id(1), money(source)), (id(2), money(destination))])
        .expect("fixture account IDs are unique")
}

fn command(source: u32, destination: u32, amount_cents: u64) -> TransferCommand {
    TransferCommand::try_from(TransferRequest::new(
        id(source),
        id(destination),
        amount_cents,
    ))
    .expect("fixture requests are valid")
}

#[test]
fn accepts_a_positive_transfer_between_distinct_accounts() {
    let request = TransferRequest::new(id(1), id(2), 250);

    let validated = TransferCommand::try_from(request).expect("a positive transfer is valid");

    assert_eq!(validated.source(), id(1));
    assert_eq!(validated.destination(), id(2));
    assert_eq!(validated.amount(), money(250));
}

#[test]
fn rejects_a_zero_amount() {
    let request = TransferRequest::new(id(1), id(2), 0);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::ZeroAmount)
    );
}

#[test]
fn rejects_a_transfer_to_the_same_account() {
    let request = TransferRequest::new(id(7), id(7), 500);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::SameAccount)
    );
}

#[test]
fn preparing_still_leaves_both_balances_unchanged() {
    let mut ledger = two_account_ledger(500, 100);

    let prepared = ledger.prepare_transfer(command(1, 2, 250));

    assert!(prepared.is_ok(), "the transfer should be preparable");
    drop(prepared);

    assert_eq!(ledger.balance(id(1)), Some(money(500)));
    assert_eq!(ledger.balance(id(2)), Some(money(100)));
}

#[test]
fn a_missing_source_is_rejected_without_touching_the_ledger() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(9, 1, 250));

    assert!(matches!(result, Err(TransferRejection::SourceNotFound)));
    assert_eq!(ledger, before);
}

#[test]
fn a_missing_destination_is_rejected_without_touching_the_ledger() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 9, 250));

    assert!(matches!(
        result,
        Err(TransferRejection::DestinationNotFound)
    ));
    assert_eq!(ledger, before);
}

#[test]
fn insufficient_funds_is_rejected_without_touching_the_ledger() {
    let mut ledger = two_account_ledger(100, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 2, 250));

    assert!(matches!(result, Err(TransferRejection::InsufficientFunds)));
    assert_eq!(ledger, before);
}

#[test]
fn destination_overflow_is_rejected_without_touching_the_ledger() {
    let mut ledger = two_account_ledger(500, u64::MAX);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 2, 250));

    assert!(matches!(
        result,
        Err(TransferRejection::DestinationOverflow)
    ));
    assert_eq!(ledger, before);
}

#[test]
fn committing_applies_the_prepared_balances() {
    let mut ledger = two_account_ledger(500, 100);

    let receipt = ledger
        .prepare_transfer(command(1, 2, 250))
        .expect("the transfer should be preparable")
        .commit();

    assert_eq!(receipt.source(), id(1));
    assert_eq!(receipt.destination(), id(2));
    assert_eq!(receipt.amount(), money(250));
    assert_eq!(ledger.balance(id(1)), Some(money(250)));
    assert_eq!(ledger.balance(id(2)), Some(money(350)));
}

#[test]
fn a_committed_transfer_preserves_the_combined_balance() {
    let mut ledger = two_account_ledger(500, 100);

    ledger
        .prepare_transfer(command(1, 2, 250))
        .expect("the transfer should be preparable")
        .commit();

    let source = ledger.balance(id(1)).expect("the source account exists");
    let destination = ledger
        .balance(id(2))
        .expect("the destination account exists");

    assert_eq!(source.cents() + destination.cents(), 600);
}

#[test]
fn commit_is_consuming_and_infallible() {
    // The parameter type forces a by-value receiver and an outcome return type,
    // so a `&mut self` or `Result`-returning commit would not coerce here.
    fn assert_signature<'a>(commit: fn(PreparedTransfer<'a>) -> TransferReceipt) {
        let _ = commit;
    }

    assert_signature(PreparedTransfer::commit);
}
```

### Progressive hints

1. If commit still has to ask "can I?", preparation has not finished its job. The body should read as bookkeeping, not as a decision.
2. Destructure self, capture the two account IDs before assigning, apply source_after and destination_after through the exclusive borrows, then build the receipt. There is no branch left that can fail, so the return type is a plain outcome.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "struct_fields",
          "structName": "TransferReceipt",
          "requiredFields": [
            {
              "name": "source",
              "typeIncludes": [
                "AccountId"
              ]
            },
            {
              "name": "destination",
              "typeIncludes": [
                "AccountId"
              ]
            },
            {
              "name": "amount",
              "typeIncludes": [
                "Money"
              ]
            }
          ]
        },
        {
          "type": "impl_method",
          "implFor": "PreparedTransfer",
          "methodName": "commit",
          "requiredSignatureIncludes": [
            "self",
            "TransferReceipt"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "prepared-commit-twice",
          "expectedDiagnostics": [
            "moved"
          ],
          "sourcePath": "compile_fail/prepared_commit_twice.rs"
        },
        {
          "name": "prepared-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/prepared_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### prepared-commit-twice

Source: `lessons/validate-prepare-commit/101-commit-prepared-transfer/compile_fail/prepared_commit_twice.rs`

```rust
use rust_daily_lesson::{AccountId, Ledger, Money, TransferCommand, TransferRequest};

fn main() {
    let mut ledger = Ledger::try_new([
        (AccountId::new(1), Money::from_cents(500)),
        (AccountId::new(2), Money::from_cents(100)),
    ])
    .unwrap();

    let command = TransferCommand::try_from(TransferRequest::new(
        AccountId::new(1),
        AccountId::new(2),
        250,
    ))
    .unwrap();

    let prepared = ledger.prepare_transfer(command).unwrap();
    let _first = prepared.commit();
    let _second = prepared.commit();
}
```

##### prepared-direct-construction

Source: `lessons/validate-prepare-commit/101-commit-prepared-transfer/compile_fail/prepared_direct_construction.rs`

```rust
use rust_daily_lesson::PreparedTransfer;

fn main() {
    let _ = PreparedTransfer {
        source: todo!(),
        destination: todo!(),
        amount: todo!(),
        source_after: todo!(),
        destination_after: todo!(),
    };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/validate-prepare-commit/101-commit-prepared-transfer/solution/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }

    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.0.checked_add(rhs.0).map(Self)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.0.checked_sub(rhs.0).map(Self)
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}

/// The state-dependent reasons a validated command cannot be prepared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

/// The two accounts a transfer has resolved, borrowed for the whole time the
/// preparation is alive.
///
/// The exclusive borrows are the capability: while a `PreparedTransfer` exists,
/// nothing else can read or write the two accounts, so the post-state it holds
/// cannot go stale. The fields stay private and no constructor is public.
#[derive(Debug)]
pub struct PreparedTransfer<'a> {
    source: &'a mut Account,
    destination: &'a mut Account,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Borrow the source and the destination at the same time without `unsafe`
    /// code or interior mutability. Provided support code: use it rather than
    /// rebuilding it.
    fn account_pair_mut(
        &mut self,
        source: AccountId,
        destination: AccountId,
    ) -> Option<(&mut Account, &mut Account)> {
        if source == destination {
            return None;
        }

        let source_index = self.accounts.iter().position(|account| account.id == source)?;
        let destination_index = self
            .accounts
            .iter()
            .position(|account| account.id == destination)?;

        if source_index < destination_index {
            let (before_destination, from_destination) =
                self.accounts.split_at_mut(destination_index);
            let source = before_destination.get_mut(source_index)?;
            let destination = from_destination.first_mut()?;
            Some((source, destination))
        } else {
            let (before_source, from_source) = self.accounts.split_at_mut(source_index);
            let destination = before_source.get_mut(destination_index)?;
            let source = from_source.first_mut()?;
            Some((source, destination))
        }
    }

    /// Resolve every state-dependent failure and keep exclusive authority over
    /// the two accounts the transfer is allowed to change.
    pub fn prepare_transfer(
        &mut self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer<'_>, TransferRejection> {
        let amount = command.amount();

        let source_balance = self
            .balance(command.source())
            .ok_or(TransferRejection::SourceNotFound)?;
        let destination_balance = self
            .balance(command.destination())
            .ok_or(TransferRejection::DestinationNotFound)?;

        let source_after = source_balance
            .checked_sub(amount)
            .ok_or(TransferRejection::InsufficientFunds)?;
        let destination_after = destination_balance
            .checked_add(amount)
            .ok_or(TransferRejection::DestinationOverflow)?;

        let Some((source, destination)) =
            self.account_pair_mut(command.source(), command.destination())
        else {
            // Both accounts were resolved above and `TransferCommand` guarantees
            // distinct account IDs, so this is a defensive preparation
            // rejection rather than an assertion or a panic.
            return Err(TransferRejection::SourceNotFound);
        };

        Ok(PreparedTransfer {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        })
    }
}

/// What a committed transfer did.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferReceipt {
    source: AccountId,
    destination: AccountId,
    amount: Money,
}

impl TransferReceipt {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount
    }
}

impl PreparedTransfer<'_> {
    /// Cross the authoritative boundary: apply the balances that preparation
    /// already computed and report what happened.
    ///
    /// Consuming `self` makes the capability one-shot, and there is no failure
    /// channel because nothing recoverable is left to discover.
    pub fn commit(self) -> TransferReceipt {
        let Self {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        } = self;

        let source_id = source.id;
        let destination_id = destination.id;

        source.balance = source_after;
        destination.balance = destination_after;

        TransferReceipt {
            source: source_id,
            destination: destination_id,
            amount,
        }
    }
}
```

### Completion explanation

commit(self) is the authoritative boundary: it is the only place balances change, and because it consumes the prepared capability, the same preparation cannot be replayed. The return type is a receipt rather than a Result because every expected failure was consumed by validation and preparation; leaving a recoverable failure channel here would mean some check still had to happen after mutation. Note that the same argument does not apply to every operation, only to ones where the expected failures really can be resolved ahead of the mutation.

### Author notes

## Concept Boundary

One concept: the authoritative boundary is a consuming, infallible method.
`commit(self)` is the only place balances change, it can be called exactly once,
and it has no recoverable failure channel because everything recoverable was
already resolved. This lesson is not about `Result` or ownership in isolation;
it is about where fallibility is allowed to live relative to mutation.

## Intended Solution

Add a `TransferReceipt` carrying the two account IDs and the amount with
getters, then implement `PreparedTransfer::commit(self) -> TransferReceipt`:
destructure the capability, capture the two account IDs, assign the two
precomputed balances through the exclusive borrows, and build the receipt.
Nothing in the body can fail, so the return type is an outcome rather than a
`Result`.

## Validation Strategy

The Cargo tests keep every earlier behavior and add the commit contract:
preparation still leaves both balances untouched, committing applies exactly the
precomputed balances, the receipt reports the exact source, destination, and
amount, and the combined balance is preserved. The signature test coerces
`PreparedTransfer::commit` to `for<'a> fn(PreparedTransfer<'a>) ->
TransferReceipt`, which proves consuming and infallible in one type-level
assertion instead of a textual check. The compile-fail fixtures prove the
capability cannot be replayed (`moved` after the first commit) and cannot be
forged from outside the module (`private`).

## Common Wrong Solutions

Reject `commit(&mut self)`, `commit(&self)` with interior mutability,
`Result<TransferReceipt, _>` from commit, checked arithmetic or account lookups
inside commit, applying the source mutation before a remaining fallible
destination step, and rollback logic added to compensate for a fallible commit.

## Arc Continuity

The borrow-bound preparation from lesson 100 is unchanged; commit is added on
top of it, so the exclusive borrow now ends by being consumed rather than
dropped. The dead-code report from the previous lesson disappears here because
every stored field is read by commit.

## Review Checklist

Confirm the starter keeps the lesson 100 solution verbatim and adds only the
commit TODO, commit takes `self` and returns `TransferReceipt`, the tests assert
exact post-commit balances plus the receipt values, and both compile-fail
fixtures fail for the documented reason.

---

## 102. Compose the staged mutation pipeline

Source: `lessons/validate-prepare-commit/102-execute-transfer-pipeline`

| Field | Value |
| --- | --- |
| Lesson ID | `execute-transfer-pipeline-102` |
| Production lesson | [Open lesson](https://borrowquest.site/#lesson/execute-transfer-pipeline-102) |
| Arc | Validate, prepare, then commit (step 5 of 5) |
| Concept | Staged mutation pipeline (`staged-mutation-pipeline`) |
| Difficulty | advanced |
| Estimated time | 10 minutes |

### Scenario

The individual phases now have useful types and contracts, and the application needs one call that cannot be misused. The public operation should accept the raw request and the ledger, keep validation, preparation, and commit in that order, and report which phase refused the transfer when one of them does.

### Task

In src/lib.rs, add a TransferError enum with Invalid(TransferRequestError) and Rejected(TransferRejection) variants and implement From for both phase errors so ? keeps the phase distinction. Then add execute_transfer(&mut Ledger, TransferRequest) -> Result<TransferReceipt, TransferError>, whose body performs exactly three steps: validate the request into a TransferCommand, prepare it against the ledger, and commit the prepared transfer.

### Concept context

Compose validation, preparation, and consuming commit so expected failures occur before the authoritative mutation boundary.

- Prerequisites: `consuming-infallible-commit`
- Tags: `architecture`, `orchestration`, `errors`, `transactions`

### Starter project files

#### `src/lib.rs` — editable

Source: `lessons/validate-prepare-commit/102-execute-transfer-pipeline/starter/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }

    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.0.checked_add(rhs.0).map(Self)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.0.checked_sub(rhs.0).map(Self)
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}

/// The state-dependent reasons a validated command cannot be prepared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

/// The two accounts a transfer has resolved, borrowed for the whole time the
/// preparation is alive.
///
/// The exclusive borrows are the capability: while a `PreparedTransfer` exists,
/// nothing else can read or write the two accounts, so the post-state it holds
/// cannot go stale. The fields stay private and no constructor is public.
#[derive(Debug)]
pub struct PreparedTransfer<'a> {
    source: &'a mut Account,
    destination: &'a mut Account,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Borrow the source and the destination at the same time without `unsafe`
    /// code or interior mutability. Provided support code: use it rather than
    /// rebuilding it.
    fn account_pair_mut(
        &mut self,
        source: AccountId,
        destination: AccountId,
    ) -> Option<(&mut Account, &mut Account)> {
        if source == destination {
            return None;
        }

        let source_index = self.accounts.iter().position(|account| account.id == source)?;
        let destination_index = self
            .accounts
            .iter()
            .position(|account| account.id == destination)?;

        if source_index < destination_index {
            let (before_destination, from_destination) =
                self.accounts.split_at_mut(destination_index);
            let source = before_destination.get_mut(source_index)?;
            let destination = from_destination.first_mut()?;
            Some((source, destination))
        } else {
            let (before_source, from_source) = self.accounts.split_at_mut(source_index);
            let destination = before_source.get_mut(destination_index)?;
            let source = from_source.first_mut()?;
            Some((source, destination))
        }
    }

    /// Resolve every state-dependent failure and keep exclusive authority over
    /// the two accounts the transfer is allowed to change.
    pub fn prepare_transfer(
        &mut self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer<'_>, TransferRejection> {
        let amount = command.amount();

        let source_balance = self
            .balance(command.source())
            .ok_or(TransferRejection::SourceNotFound)?;
        let destination_balance = self
            .balance(command.destination())
            .ok_or(TransferRejection::DestinationNotFound)?;

        let source_after = source_balance
            .checked_sub(amount)
            .ok_or(TransferRejection::InsufficientFunds)?;
        let destination_after = destination_balance
            .checked_add(amount)
            .ok_or(TransferRejection::DestinationOverflow)?;

        let Some((source, destination)) =
            self.account_pair_mut(command.source(), command.destination())
        else {
            // Both accounts were resolved above and `TransferCommand` guarantees
            // distinct account IDs, so this is a defensive preparation
            // rejection rather than an assertion or a panic.
            return Err(TransferRejection::SourceNotFound);
        };

        Ok(PreparedTransfer {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        })
    }
}

/// What a committed transfer did.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferReceipt {
    source: AccountId,
    destination: AccountId,
    amount: Money,
}

impl TransferReceipt {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount
    }
}

impl PreparedTransfer<'_> {
    /// Cross the authoritative boundary: apply the balances that preparation
    /// already computed and report what happened.
    ///
    /// Consuming `self` makes the capability one-shot, and there is no failure
    /// channel because nothing recoverable is left to discover.
    pub fn commit(self) -> TransferReceipt {
        let Self {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        } = self;

        let source_id = source.id;
        let destination_id = destination.id;

        source.balance = source_after;
        destination.balance = destination_after;

        TransferReceipt {
            source: source_id,
            destination: destination_id,
            amount,
        }
    }
}

// TODO: compose the phases into one application-facing operation.
//
// Add a `TransferError` enum with an `Invalid(TransferRequestError)` variant and
// a `Rejected(TransferRejection)` variant, and implement `From` for both
// phase-specific errors so `?` keeps the phase visible. Then add
// `execute_transfer(&mut Ledger, TransferRequest) -> Result<TransferReceipt, TransferError>`
// whose body performs exactly three steps: validate the request into a
// `TransferCommand`, prepare it against the ledger, and commit the prepared
// transfer. Do not interleave checks with mutation.
```

#### `tests/public.rs` — test

Source: `lessons/validate-prepare-commit/102-execute-transfer-pipeline/tests/public.rs`

```rust
use rust_daily_lesson::{
    execute_transfer, AccountId, Ledger, Money, PreparedTransfer, TransferCommand, TransferError,
    TransferReceipt, TransferRejection, TransferRequest, TransferRequestError,
};

fn id(value: u32) -> AccountId {
    AccountId::new(value)
}

fn money(cents: u64) -> Money {
    Money::from_cents(cents)
}

fn two_account_ledger(source: u64, destination: u64) -> Ledger {
    Ledger::try_new([(id(1), money(source)), (id(2), money(destination))])
        .expect("fixture account IDs are unique")
}

fn command(source: u32, destination: u32, amount_cents: u64) -> TransferCommand {
    TransferCommand::try_from(TransferRequest::new(
        id(source),
        id(destination),
        amount_cents,
    ))
    .expect("fixture requests are valid")
}

#[test]
fn accepts_a_positive_transfer_between_distinct_accounts() {
    let request = TransferRequest::new(id(1), id(2), 250);

    let validated = TransferCommand::try_from(request).expect("a positive transfer is valid");

    assert_eq!(validated.source(), id(1));
    assert_eq!(validated.destination(), id(2));
    assert_eq!(validated.amount(), money(250));
}

#[test]
fn rejects_a_zero_amount() {
    let request = TransferRequest::new(id(1), id(2), 0);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::ZeroAmount)
    );
}

#[test]
fn rejects_a_transfer_to_the_same_account() {
    let request = TransferRequest::new(id(7), id(7), 500);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::SameAccount)
    );
}

#[test]
fn preparing_still_leaves_both_balances_unchanged() {
    let mut ledger = two_account_ledger(500, 100);

    let prepared = ledger.prepare_transfer(command(1, 2, 250));

    assert!(prepared.is_ok(), "the transfer should be preparable");
    drop(prepared);

    assert_eq!(ledger.balance(id(1)), Some(money(500)));
    assert_eq!(ledger.balance(id(2)), Some(money(100)));
}

#[test]
fn execute_transfer_moves_money_and_reports_the_receipt() {
    let mut ledger = two_account_ledger(500, 100);

    let receipt = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 250))
        .expect("the transfer should succeed");

    assert_eq!(receipt.source(), id(1));
    assert_eq!(receipt.destination(), id(2));
    assert_eq!(receipt.amount(), money(250));
    assert_eq!(ledger.balance(id(1)), Some(money(250)));
    assert_eq!(ledger.balance(id(2)), Some(money(350)));
}

#[test]
fn a_successful_transfer_preserves_the_combined_balance() {
    let mut ledger = two_account_ledger(500, 100);

    execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 250))
        .expect("the transfer should succeed");

    let source = ledger.balance(id(1)).expect("the source account exists");
    let destination = ledger
        .balance(id(2))
        .expect("the destination account exists");

    assert_eq!(source.cents() + destination.cents(), 600);
}

#[test]
fn a_zero_amount_is_invalid_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 0));

    assert_eq!(
        result,
        Err(TransferError::Invalid(TransferRequestError::ZeroAmount))
    );
    assert_eq!(ledger, before);
}

#[test]
fn a_same_account_transfer_is_invalid_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(1), 250));

    assert_eq!(
        result,
        Err(TransferError::Invalid(TransferRequestError::SameAccount))
    );
    assert_eq!(ledger, before);
}

#[test]
fn a_missing_source_is_rejected_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(9), id(1), 250));

    assert_eq!(
        result,
        Err(TransferError::Rejected(TransferRejection::SourceNotFound))
    );
    assert_eq!(ledger, before);
}

#[test]
fn a_missing_destination_is_rejected_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(9), 250));

    assert_eq!(
        result,
        Err(TransferError::Rejected(
            TransferRejection::DestinationNotFound
        ))
    );
    assert_eq!(ledger, before);
}

#[test]
fn insufficient_funds_is_rejected_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(100, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 250));

    assert_eq!(
        result,
        Err(TransferError::Rejected(TransferRejection::InsufficientFunds))
    );
    assert_eq!(ledger, before);
}

#[test]
fn destination_overflow_is_rejected_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, u64::MAX);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 250));

    assert_eq!(
        result,
        Err(TransferError::Rejected(
            TransferRejection::DestinationOverflow
        ))
    );
    assert_eq!(ledger, before);
}

#[test]
fn a_rejection_leaves_the_ledger_usable_for_a_later_transfer() {
    let mut ledger = two_account_ledger(500, 100);

    let rejected = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 900));
    assert_eq!(
        rejected,
        Err(TransferError::Rejected(TransferRejection::InsufficientFunds))
    );

    let receipt = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 400))
        .expect("the ledger still accepts a valid transfer");

    assert_eq!(receipt.amount(), money(400));
    assert_eq!(ledger.balance(id(1)), Some(money(100)));
    assert_eq!(ledger.balance(id(2)), Some(money(500)));
}

#[test]
fn commit_is_consuming_and_infallible() {
    // The parameter type forces a by-value receiver and an outcome return type,
    // so a `&mut self` or `Result`-returning commit would not coerce here.
    fn assert_signature<'a>(commit: fn(PreparedTransfer<'a>) -> TransferReceipt) {
        let _ = commit;
    }

    assert_signature(PreparedTransfer::commit);
}
```

### Progressive hints

1. The orchestration function should read like the phase diagram: raw request in, command, prepared capability, receipt out.
2. Convert both phase-specific errors into TransferError and use ? for validation and preparation. Commit needs no ?, because the prepared capability already resolved every expected failure.
3. The reference approach for this lesson. The authored code is included in the Solution section.

### Validation contract

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "structural",
      "timeoutMs": 10000,
      "checks": [
        {
          "type": "function_signature",
          "functionName": "execute_transfer",
          "requiredSignatureIncludes": [
            "&mut Ledger",
            "TransferRequest",
            "Result<TransferReceipt, TransferError>"
          ]
        }
      ]
    },
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "testFiles": [
        {
          "path": "tests/public.rs",
          "sourcePath": "tests/public.rs"
        }
      ]
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 10000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "transfer-command-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/transfer_command_direct_construction.rs"
        },
        {
          "name": "prepared-blocks-ledger-reborrow",
          "expectedDiagnostics": [
            "cannot borrow"
          ],
          "sourcePath": "compile_fail/prepared_blocks_ledger_reborrow.rs"
        },
        {
          "name": "prepared-commit-twice",
          "expectedDiagnostics": [
            "moved"
          ],
          "sourcePath": "compile_fail/prepared_commit_twice.rs"
        },
        {
          "name": "prepared-direct-construction",
          "expectedDiagnostics": [
            "private"
          ],
          "sourcePath": "compile_fail/prepared_direct_construction.rs"
        }
      ]
    }
  ]
}
```

#### Compile-fail fixtures

##### transfer-command-direct-construction

Source: `lessons/validate-prepare-commit/102-execute-transfer-pipeline/compile_fail/transfer_command_direct_construction.rs`

```rust
use rust_daily_lesson::{AccountId, TransferCommand};

fn main() {
    let id = AccountId::new(1);
    let _ = TransferCommand {
        source: id,
        destination: AccountId::new(2),
        amount: todo!(),
    };
}
```

##### prepared-blocks-ledger-reborrow

Source: `lessons/validate-prepare-commit/102-execute-transfer-pipeline/compile_fail/prepared_blocks_ledger_reborrow.rs`

```rust
use rust_daily_lesson::{AccountId, Ledger, Money, TransferCommand, TransferRequest};

fn main() {
    let mut ledger = Ledger::try_new([
        (AccountId::new(1), Money::from_cents(500)),
        (AccountId::new(2), Money::from_cents(100)),
    ])
    .unwrap();

    let command = TransferCommand::try_from(TransferRequest::new(
        AccountId::new(1),
        AccountId::new(2),
        250,
    ))
    .unwrap();

    let prepared = ledger.prepare_transfer(command).unwrap();
    let _balance = ledger.balance(AccountId::new(1));
    let _keep_borrow_alive = prepared;
}
```

##### prepared-commit-twice

Source: `lessons/validate-prepare-commit/102-execute-transfer-pipeline/compile_fail/prepared_commit_twice.rs`

```rust
use rust_daily_lesson::{AccountId, Ledger, Money, TransferCommand, TransferRequest};

fn main() {
    let mut ledger = Ledger::try_new([
        (AccountId::new(1), Money::from_cents(500)),
        (AccountId::new(2), Money::from_cents(100)),
    ])
    .unwrap();

    let command = TransferCommand::try_from(TransferRequest::new(
        AccountId::new(1),
        AccountId::new(2),
        250,
    ))
    .unwrap();

    let prepared = ledger.prepare_transfer(command).unwrap();
    let _first = prepared.commit();
    let _second = prepared.commit();
}
```

##### prepared-direct-construction

Source: `lessons/validate-prepare-commit/102-execute-transfer-pipeline/compile_fail/prepared_direct_construction.rs`

```rust
use rust_daily_lesson::PreparedTransfer;

fn main() {
    let _ = PreparedTransfer {
        source: todo!(),
        destination: todo!(),
        amount: todo!(),
        source_after: todo!(),
        destination_after: todo!(),
    };
}
```

### Authored solution

#### `src/lib.rs`

Source: `lessons/validate-prepare-commit/102-execute-transfer-pipeline/solution/src/lib.rs`

```rust
//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }

    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.0.checked_add(rhs.0).map(Self)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.0.checked_sub(rhs.0).map(Self)
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}

/// The state-dependent reasons a validated command cannot be prepared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

/// The two accounts a transfer has resolved, borrowed for the whole time the
/// preparation is alive.
///
/// The exclusive borrows are the capability: while a `PreparedTransfer` exists,
/// nothing else can read or write the two accounts, so the post-state it holds
/// cannot go stale. The fields stay private and no constructor is public.
#[derive(Debug)]
pub struct PreparedTransfer<'a> {
    source: &'a mut Account,
    destination: &'a mut Account,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Borrow the source and the destination at the same time without `unsafe`
    /// code or interior mutability. Provided support code: use it rather than
    /// rebuilding it.
    fn account_pair_mut(
        &mut self,
        source: AccountId,
        destination: AccountId,
    ) -> Option<(&mut Account, &mut Account)> {
        if source == destination {
            return None;
        }

        let source_index = self.accounts.iter().position(|account| account.id == source)?;
        let destination_index = self
            .accounts
            .iter()
            .position(|account| account.id == destination)?;

        if source_index < destination_index {
            let (before_destination, from_destination) =
                self.accounts.split_at_mut(destination_index);
            let source = before_destination.get_mut(source_index)?;
            let destination = from_destination.first_mut()?;
            Some((source, destination))
        } else {
            let (before_source, from_source) = self.accounts.split_at_mut(source_index);
            let destination = before_source.get_mut(destination_index)?;
            let source = from_source.first_mut()?;
            Some((source, destination))
        }
    }

    /// Resolve every state-dependent failure and keep exclusive authority over
    /// the two accounts the transfer is allowed to change.
    pub fn prepare_transfer(
        &mut self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer<'_>, TransferRejection> {
        let amount = command.amount();

        let source_balance = self
            .balance(command.source())
            .ok_or(TransferRejection::SourceNotFound)?;
        let destination_balance = self
            .balance(command.destination())
            .ok_or(TransferRejection::DestinationNotFound)?;

        let source_after = source_balance
            .checked_sub(amount)
            .ok_or(TransferRejection::InsufficientFunds)?;
        let destination_after = destination_balance
            .checked_add(amount)
            .ok_or(TransferRejection::DestinationOverflow)?;

        let Some((source, destination)) =
            self.account_pair_mut(command.source(), command.destination())
        else {
            // Both accounts were resolved above and `TransferCommand` guarantees
            // distinct account IDs, so this is a defensive preparation
            // rejection rather than an assertion or a panic.
            return Err(TransferRejection::SourceNotFound);
        };

        Ok(PreparedTransfer {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        })
    }
}

/// What a committed transfer did.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferReceipt {
    source: AccountId,
    destination: AccountId,
    amount: Money,
}

impl TransferReceipt {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount
    }
}

impl PreparedTransfer<'_> {
    /// Cross the authoritative boundary: apply the balances that preparation
    /// already computed and report what happened.
    ///
    /// Consuming `self` makes the capability one-shot, and there is no failure
    /// channel because nothing recoverable is left to discover.
    pub fn commit(self) -> TransferReceipt {
        let Self {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        } = self;

        let source_id = source.id;
        let destination_id = destination.id;

        source.balance = source_after;
        destination.balance = destination_after;

        TransferReceipt {
            source: source_id,
            destination: destination_id,
            amount,
        }
    }
}

/// Everything that can stop a transfer before the authoritative boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferError {
    /// The request itself was not legal to execute.
    Invalid(TransferRequestError),
    /// The request was legal, but current ledger state rejected it.
    Rejected(TransferRejection),
}

impl From<TransferRequestError> for TransferError {
    fn from(error: TransferRequestError) -> Self {
        Self::Invalid(error)
    }
}

impl From<TransferRejection> for TransferError {
    fn from(error: TransferRejection) -> Self {
        Self::Rejected(error)
    }
}

/// Validate the request, prepare it against the ledger, then commit.
///
/// The three phases stay visible on purpose: everything that can fail happens
/// before `commit` is called, and `commit` itself has no `?` to write.
pub fn execute_transfer(
    ledger: &mut Ledger,
    request: TransferRequest,
) -> Result<TransferReceipt, TransferError> {
    let command = TransferCommand::try_from(request)?;
    let prepared = ledger.prepare_transfer(command)?;
    Ok(prepared.commit())
}
```

### Completion explanation

The whole arc is visible in one function now: TryFrom establishes the request-only invariants, prepare_transfer resolves the current-state failures while taking exclusive authority over the two accounts, PreparedTransfer<'_> keeps that authority until it is used, commit(self) crosses the authoritative boundary exactly once, and execute_transfer makes the ordering reviewable at a glance. This structure is worth its cost when the mutation is authoritative and the expected failures can genuinely be resolved before it; it is not a shape every operation needs.

### Author notes

## Concept Boundary

One concept: orchestration that keeps the phases visible. `execute_transfer`
reads as validate, prepare, commit, and the `TransferError` variants keep the
phase where a failure happened. The lesson is not an invitation to build a
service framework: there is no trait, no generic pipeline, and no repository.

## Intended Solution

Add `TransferError` with `Invalid(TransferRequestError)` and
`Rejected(TransferRejection)`, implement `From` for both phase errors so `?`
works without losing the distinction, and write `execute_transfer` as three
statements: `TransferCommand::try_from(request)?`,
`ledger.prepare_transfer(command)?`, and `prepared.commit()`. The commit call
has no `?` because it cannot fail.

## Validation Strategy

The public tests are the arc's final contract: the success path checks exact
balances and the exact receipt, the combined balance is preserved, every
invalid and rejected path compares the whole ledger against a pre-call clone,
and a rejection is followed by a valid transfer to prove the ledger stays
usable. The type-level signature check keeps `commit` consuming and infallible.
The four compile-fail fixtures recreate the architectural contracts in the
final snapshot: commands and prepared capabilities cannot be forged from
outside the module, a live preparation blocks ledger access, and a committed
preparation cannot be replayed.

## Common Wrong Solutions

Reject one giant `execute_transfer` that interleaves checks with mutation while
producing the same output, a `Result` returned from commit, raw IDs or amounts
flowing straight into commit, re-running validation after mutation has begun,
mutate-then-rollback compensation, and `#[allow(dead_code)]` or assertions
standing in for type or phase design.

## Arc Continuity

This lesson is the arc snapshot: `TryFrom<TransferRequest>` still guards the
command, `prepare_transfer` still resolves every state-dependent failure while
holding exclusive authority, and `PreparedTransfer<'_>` is unchanged. Do not
extend the file into events, projections, persistence, or async work; that
boundary belongs to a later arc.

## Review Checklist

Confirm the starter keeps the lesson 101 solution verbatim and adds only the
orchestration TODO, `execute_transfer` performs exactly three steps, the error
type keeps the phase distinction, and all four compile-fail fixtures fail for
the documented reason.

---
