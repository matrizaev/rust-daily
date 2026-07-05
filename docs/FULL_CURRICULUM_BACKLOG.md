# Rust Daily - Full Curriculum Backlog

This document defines the complete backlog of **500 lessons** for the Rust Daily curriculum, structured into cohesive learning arcs under the 10 pillars of writing production-quality, idiomatic Rust.

## Overview by Pillar

The 500 lessons are distributed across the 10 pillars as follows:

| Pillar | Focus Area | Lessons |
|---|---|---|
| **1. Domain Modeling** | Structs, enums, states, invariants, newtypes | 68 |
| **2. Conversion Design** | From, Into, TryFrom, TryInto, FromStr, AsRef | 47 |
| **3. Error Architecture** | Error enums, Display, std::error::Error, source | 47 |
| **4. Ownership and Borrowing** | Lifetimes, references, Cow, allocation minimization | 34 |
| **5. Traits and API Ergonomics** | Std traits (Default, Clone, Copy, Ord), generics | 35 |
| **6. Iterators & Collections** | Iterator combinators, HashMap Entry API, folding | 34 |
| **7. Testing & Executable Docs** | Unit tests, table-driven tests, doc tests, fakes | 35 |
| **8. Clean Architecture** | Modules, Use Cases, Ports, Adapters, boundaries | 46 |
| **9. Async Rust & Side Effects** | Tokio runtime, Arc/Mutex, cancellation, timeouts | 22 |
| **10. Observability** | Tracing, structured logs, spans, redaction | 22 |
| **Total** | | **500** |

---

## Lesson Backlog


### Arc: Configure a small service (`config-service`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 1 | 1 | `config-struct-fields-001` | Shape a service Config | `struct-field-design` |
| 2 | 2 | `config-default-impl-002` | Give Config sensible defaults | `default-impl` |
| 3 | 3 | `config-methods-003` | Add a small Config setter | `methods-basic` |
| 4 | 4 | `config-option-timeout-004` | Model an optional timeout | `option-modeling` |
| 5 | 5 | `config-result-validate-005` | Return validation errors with Result | `result-validation` |
| 6 | 6 | `config-borrowed-key-006` | Borrow setting keys | `borrowing-api` |

### Arc: Parse a user from text (`parse-user`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 7 | 1 | `error-enum-parse-user-001` | Design a parse error enum | `error-enum-design` |
| 8 | 2 | `display-parse-user-error-002` | Format parse errors for people | `display-parse-error` |
| 9 | 3 | `error-trait-parse-user-error-003` | Mark the parse error as an Error | `error-trait` |
| 10 | 4 | `source-parse-int-error-004` | Preserve the ID parse source | `error-source` |
| 11 | 5 | `from-parse-int-error-005` | Convert ParseIntError with From | `from-error-conversion` |
| 12 | 6 | `tryfrom-user-str-006` | Parse User with TryFrom | `tryfrom-user` |
| 13 | 7 | `parse-user-public-tests-007` | Write parser behavior checks | `basic-tests` |

### Arc: Summarize inventory (`inventory-summary`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 14 | 1 | `inventory-item-struct-001` | Define an inventory item | `domain-structs` |
| 15 | 2 | `inventory-filter-map-002` | Collect available item names | `filter-map` |
| 16 | 3 | `inventory-fold-total-003` | Fold quantities into a total | `fold-sum` |
| 17 | 4 | `inventory-clear-loop-004` | Choose clarity over clever chains | `iterator-judgment` |
| 18 | 5 | `inventory-intoiterator-005` | Make Inventory iterable | `intoiterator-wrapper` |
| 19 | 6 | `inventory-sort-by-key-006` | Sort items by key | `sort-by-key` |

### Arc: Inspect log lines (`log-lines`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 20 | 1 | `log-entry-borrowed-001` | Borrow fields in a log entry | `borrowed-fields` |
| 21 | 2 | `log-view-lifetime-002` | Create a lifetime-backed view | `lifetime-view` |
| 22 | 3 | `log-level-match-003` | Map log levels with match | `pattern-matching` |
| 23 | 4 | `log-message-cow-004` | Allow borrowed or owned messages | `cow-strings` |
| 24 | 5 | `log-filter-tests-005` | Check log filtering behavior | `focused-tests` |

### Arc: Build a request API (`request-api`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 25 | 1 | `request-struct-001` | Define the Request surface | `api-structs` |
| 26 | 2 | `request-builder-owned-setters-002` | Add consuming builder setters | `builder-setters` |
| 27 | 3 | `request-builder-default-003` | Start the builder from Default | `builder-default` |
| 28 | 4 | `request-builder-result-004` | Validate builder output | `builder-result` |
| 29 | 5 | `request-builder-tryfrom-005` | Convert RawRequest with TryFrom | `tryfrom-request` |
| 30 | 6 | `request-doc-example-006` | Document the request builder | `doc-examples` |

### Arc: Email address value object (`email-address-value-object`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 31 | 1 | `email-address-private-field-001` | Hide EmailAddress internals | `email-address-private-field` |
| 32 | 2 | `email-address-tryfrom-str-002` | Validate EmailAddress with TryFrom | `tryfrom-email-address` |
| 33 | 3 | `email-address-domain-error-003` | Name the missing domain case | `email-validation-error` |
| 34 | 4 | `email-address-display-004` | Format EmailAddress with Display | `display-email-address` |
| 35 | 5 | `email-validation-error-display-005` | Format validation errors | `display-email-validation-error` |
| 36 | 6 | `email-address-fromstr-006` | Parse EmailAddress with FromStr | `fromstr-email-address` |

### Arc: Money and currency domain representation (`money-value-object`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 37 | 1 | `money-struct-001` | Define a basic Money struct | `money-struct` |
| 38 | 2 | `currency-enum-002` | Add supported Currency enums | `currency-enum` |
| 39 | 3 | `money-invariants-003` | Control Money construction invariants | `money-invariants` |
| 40 | 4 | `money-add-004` | Implement Add for same Currency | `money-add-impl` |
| 41 | 5 | `money-tryfrom-decimal-005` | Parse Money value from Decimal | `money-try-from-decimal` |
| 42 | 6 | `money-display-006` | Implement Display for Money with currency symbols | `money-display-format` |

### Arc: Host and port configuration modeling (`host-port-config`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 43 | 1 | `port-nonzero-001` | Use NonZeroU16 for Port representation | `port-nonzero` |
| 44 | 2 | `host-domain-002` | Define Host domain value object | `host-domain` |
| 45 | 3 | `host-validation-003` | Validate Host names with TryFrom | `host-validation` |
| 46 | 4 | `host-port-struct-004` | Compose Host and Port into Endpoint | `host-port-composite` |
| 47 | 5 | `endpoint-default-005` | Give Endpoint sensible local defaults | `endpoint-default` |
| 48 | 6 | `endpoint-display-006` | Implement Display for Endpoint URL formatting | `endpoint-display` |

### Arc: Percentage and bounded value objects (`percentage-bounded`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 49 | 1 | `percentage-newtype-001` | Define Percentage wrapping a ratio float | `percentage-newtype` |
| 50 | 2 | `percentage-bounds-002` | Check bounds in validating constructor | `percentage-bounds-check` |
| 51 | 3 | `percentage-default-003` | Provide zero and hundred percent defaults | `percentage-default` |
| 52 | 4 | `percentage-ops-004` | Implement arithmetic operations with overflow checks | `percentage-ops` |
| 53 | 5 | `percentage-display-005` | Implement Display with percent sign suffix | `percentage-display` |

### Arc: Strongly typed entity identifiers (`uuid-identifier`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 54 | 1 | `entity-id-newtype-001` | Wrap raw UUIDs in typed UserId and OrderId newtypes | `entity-id-newtype` |
| 55 | 2 | `entity-id-gen-002` | Expose new ID generation constructors | `entity-id-generator` |
| 56 | 3 | `entity-id-fromstr-003` | Implement FromStr for UUID conversion | `entity-id-fromstr` |
| 57 | 4 | `entity-id-display-004` | Format typed IDs as standard UUID strings | `entity-id-display` |
| 58 | 5 | `entity-id-cmp-005` | Derive standard ordering and hashing for IDs | `entity-id-comparisons` |

### Arc: Order status state machine enums (`order-state-machine`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 59 | 1 | `order-status-enum-001` | Define OrderStatus enum variants | `order-status-enum` |
| 60 | 2 | `order-state-trans-002` | Implement fallible transition methods | `order-state-transitions` |
| 61 | 3 | `order-transition-err-003` | Model typed OrderTransitionError | `order-transition-errors` |
| 62 | 4 | `order-status-invar-004` | Enforce transition paths in Order struct | `order-status-invariants` |
| 63 | 5 | `order-status-display-005` | Implement Display for status names | `order-status-display` |
| 64 | 6 | `order-status-checks-006` | Expose state query utility functions | `order-status-checks` |

### Arc: Time intervals and business hours (`duration-time`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 65 | 1 | `duration-seconds-001` | Define TimeInterval wrapper with seconds duration | `duration-seconds` |
| 66 | 2 | `duration-neg-002` | Reject negative durations in time limits | `duration-negative-check` |
| 67 | 3 | `duration-ops-003` | Implement math ops between TimeIntervals | `duration-ops` |
| 68 | 4 | `duration-conv-004` | Convert TimeInterval to std::time::Duration | `duration-conversions` |
| 69 | 5 | `duration-bounds-005` | Validate opening and closing time boundaries | `duration-time-bounds` |
| 70 | 6 | `duration-display-006` | Format duration to human time strings | `duration-display` |

### Arc: Sensitive values and PII redaction (`sensitive-data`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 71 | 1 | `sensitive-wrap-001` | Define SecretValue newtype wrapper for strings | `sensitive-wrapper` |
| 72 | 2 | `sensitive-debug-002` | Implement custom Debug to hide secrets in outputs | `sensitive-debug` |
| 73 | 3 | `sensitive-display-003` | Implement custom Display to prevent printing PII | `sensitive-display` |
| 74 | 4 | `sensitive-access-004` | Expose inner value explicitly via expose_secret | `sensitive-accessor` |
| 75 | 5 | `sensitive-zero-005` | Use drop trait to zeroize memory on drop | `sensitive-zeroization` |

### Arc: Physical units and measurement types (`physical-units`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 76 | 1 | `units-weight-001` | Define Weight newtype wrapping floats | `units-weight` |
| 77 | 2 | `units-invar-002` | Validate positive non-zero measurements | `units-invariants` |
| 78 | 3 | `units-conv-003` | Convert between Pounds and Kilograms fallibly | `units-conversions` |
| 79 | 4 | `units-ops-004` | Implement Addition and Subtraction preventing mixing units | `units-ops` |
| 80 | 5 | `units-cmp-005` | Compare physical values of similar units | `units-comparisons` |
| 81 | 6 | `units-display-006` | Format measurements with unit abbreviations | `units-display` |

### Arc: Converting DTOs into domain commands (`dto-conversions`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 82 | 1 | `dto-struct-raw-001` | Define raw DTO structs representing JSON input | `dto-struct-raw` |
| 83 | 2 | `dto-tryfrom-002` | Implement TryFrom<RawDto> for domain commands | `dto-tryfrom-validation` |
| 84 | 3 | `dto-errors-003` | Design typed ValidationError for raw inputs | `dto-validation-errors` |
| 85 | 4 | `dto-nested-004` | Convert nested structures inside arrays fallibly | `dto-nested-conversions` |
| 86 | 5 | `dto-into-blanket-005` | Verify Into blanket conversions at adapter boundaries | `dto-into-blanket` |
| 87 | 6 | `dto-test-006` | Write behavior assertions for valid and corrupted DTOs | `dto-test-cases` |

### Arc: Infallible conversions and blanket impls (`from-into-blanket`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 88 | 1 | `from-infallible-001` | Implement From<String> for custom wrapper types | `from-infallible-struct` |
| 89 | 2 | `from-into-callsite-002` | Leverage Into trait bound at callers | `from-into-callsite` |
| 90 | 3 | `from-config-003` | Convert domain configurations to external client setups | `from-infallible-config` |
| 91 | 4 | `from-dto-out-004` | Convert domain events into outbound DTO message formats | `from-dto-outbound` |
| 92 | 5 | `from-primitives-005` | Define infallible mapping from primitives to enums | `from-primitives` |

### Arc: Cheap reference conversions with AsRef (`cheap-views`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 93 | 1 | `asref-slice-001` | Implement AsRef<str> for custom string wrappers | `asref-slice` |
| 94 | 2 | `asmut-slice-002` | Implement AsMut<[u8]> for buffer wrappers | `asmut-slice` |
| 95 | 3 | `borrow-trait-003` | Understand Borrow and BorrowMut in collections | `borrow-trait` |
| 96 | 4 | `borrow-key-004` | Use Borrow to query HashMaps with wrapper keys | `borrow-hashmap-key` |
| 97 | 5 | `asref-generic-005` | Write generic methods accepting impl AsRef<Path> | `asref-generic` |
| 98 | 6 | `asref-borrow-diff-006` | Compare AsRef and Borrow equivalence contracts | `asref-borrow-diff` |

### Arc: Exposing iteration on collection wrappers (`collection-wrappers`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 99 | 1 | `wrap-collection-001` | Wrap Vec<Item> in custom OrderLines struct | `wrap-collection` |
| 100 | 2 | `wrap-into-iter-002` | Implement IntoIterator for owning wrapper | `wrap-into-iterator` |
| 101 | 3 | `wrap-borrow-iter-003` | Implement IntoIterator for reference views | `wrap-borrow-iterator` |
| 102 | 4 | `wrap-mut-iter-004` | Implement IntoIterator for mutable references | `wrap-mut-iterator` |
| 103 | 5 | `wrap-methods-005` | Expose iter() and iter_mut() convenience helpers | `wrap-custom-methods` |

### Arc: Zero-copy strings and lazy allocation (`cow-lazy`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 104 | 1 | `cow-basics-001` | Use Cow<'_, str> as struct field for input | `cow-str-basics` |
| 105 | 2 | `cow-borrow-002` | Pass borrowed strings through Cow without copies | `cow-borrow-matching` |
| 106 | 3 | `cow-to-mut-003` | Trigger allocation using to_mut() only when editing | `cow-to-mut` |
| 107 | 4 | `cow-deser-004` | Perform zero-copy deserialization of log payloads | `cow-zero-copy-deser` |
| 108 | 5 | `cow-generic-005` | Write functions accepting Into<Cow<'a, str>> | `cow-generic-function` |
| 109 | 6 | `cow-test-006` | Assert allocation limits in zero-copy conversions | `cow-test-allocation` |

### Arc: Hierarchical configuration loader errors (`config-loader-errors`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 110 | 1 | `config-err-enum-001` | Define ConfigLoadError enum variants | `config-err-enum` |
| 111 | 2 | `config-err-io-002` | Wrap std::io::Error in I/O failure case | `config-err-io-wrap` |
| 112 | 3 | `config-err-parse-003` | Wrap serde_json::Error in parsing failure case | `config-err-parse-wrap` |
| 113 | 4 | `config-err-val-004` | Expose semantic value validation failure variant | `config-err-validation` |
| 114 | 5 | `config-err-display-005` | Implement Display for nested config errors | `config-err-display` |
| 115 | 6 | `config-err-source-006` | Implement Error source chain for config loaders | `config-err-source` |

### Arc: Preserving error source chains manually (`error-sources`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 116 | 1 | `source-manual-001` | Expose lower-level errors in source method | `source-manual-trait` |
| 117 | 2 | `source-lifetime-002` | Navigate 'static lifetime bounds in Error source | `source-lifetime-static` |
| 118 | 3 | `source-downcast-003` | Downcast standard errors back into concrete types | `source-downcasting` |
| 119 | 4 | `source-chain-iter-004` | Write iterator-like helper printing error cause chains | `source-chain-iter` |
| 120 | 5 | `source-backtrace-005` | Integrate standard Backtrace support in errors | `source-backtrace` |
| 121 | 6 | `source-test-006` | Assert nested error types in unit test frameworks | `source-testing` |

### Arc: Translating errors across boundaries (`boundary-mapping`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 122 | 1 | `boundary-db-001` | Map database driver errors to repository errors | `boundary-db-map` |
| 123 | 2 | `boundary-repo-002` | Translate repository errors to use case errors | `boundary-repo-translate` |
| 124 | 3 | `boundary-dto-003` | Map parser anomalies to user-facing input errors | `boundary-dto-validate` |
| 125 | 4 | `boundary-http-004` | Convert application errors to HTTP status codes | `boundary-http-translate` |
| 126 | 5 | `boundary-safety-005` | Redact internal system error details in outputs | `boundary-error-safety` |
| 127 | 6 | `boundary-test-006` | Assert specific translations occur under test | `boundary-test-assertion` |

### Arc: Recoverable vs fatal failure strategies (`recoverable-failures`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 128 | 1 | `recover-retry-001` | Design Transient vs Permanent failure variants | `recover-retry-enum` |
| 129 | 2 | `recover-check-002` | Implement is_recoverable helper methods | `recover-check-logic` |
| 130 | 3 | `recover-loop-003` | Write retry logic relying on error categories | `recover-loop-handling` |
| 131 | 4 | `recover-fatal-004` | Convert unrecoverable system failures to clean panics | `recover-fatal-panics` |
| 132 | 5 | `recover-test-005` | Simulate transient disruptions to verify recovery | `recover-test-resilience` |

### Arc: Panic boundaries and catch_unwind (`panic-boundaries`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 133 | 1 | `panic-unwind-001` | Catch panics at thread limits using catch_unwind | `panic-unwind-basics` |
| 134 | 2 | `panic-assert-002` | Understand AssertUnwindSafe wrapper requirements | `panic-assert-unwind` |
| 135 | 3 | `panic-safe-003` | Identify UnwindSafe and RefUnwindSafe type contracts | `panic-safe-types` |
| 136 | 4 | `panic-fallback-004` | Return fallback errors when catching panics | `panic-recovery-fallback` |
| 137 | 5 | `panic-test-005` | Write tests expecting panic boundary recovery | `panic-test-isolation` |

### Arc: Boilerplate reduction with thiserror (`thiserror-library`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 138 | 1 | `thiserror-derive-001` | Use thiserror::Error macro for enum errors | `thiserror-derive` |
| 139 | 2 | `thiserror-display-002` | Format human messages with #[error("...")] | `thiserror-display` |
| 140 | 3 | `thiserror-from-003` | Derive automatic conversion with #[from] attributes | `thiserror-from` |
| 141 | 4 | `thiserror-source-004` | Specify source errors with #[source] attributes | `thiserror-source-attr` |
| 142 | 5 | `thiserror-forward-005` | Combine source and display forwarding | `thiserror-forwarding` |
| 143 | 6 | `thiserror-tests-006` | Validate derived errors match manual contracts | `thiserror-tests` |

### Arc: Contextual error management with anyhow (`anyhow-application`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 144 | 1 | `anyhow-result-001` | Return anyhow::Result from binary main entrypoint | `anyhow-result` |
| 145 | 2 | `anyhow-context-002` | Attach human context to errors with context() | `anyhow-context-str` |
| 146 | 3 | `anyhow-lazy-003` | Use with_context() for expensive context builds | `anyhow-lazy-context` |
| 147 | 4 | `anyhow-downcast-004` | Inspect and downcast inner errors inside anyhow | `anyhow-downcasting` |
| 148 | 5 | `anyhow-bail-005` | Exit early using anyhow bail! and ensure! macros | `anyhow-bail-macro` |
| 149 | 6 | `anyhow-test-006` | Assert context chains inside application tests | `anyhow-custom-tests` |

### Arc: Lifetimes and struct reference bounds (`lifetime-bounds`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 150 | 1 | `lifetime-struct-001` | Declare lifetime parameters on reference holders | `lifetime-struct-basic` |
| 151 | 2 | `lifetime-outlive-002` | Define multiple lifetimes with outlives bounds ('a: 'b) | `lifetime-bounds-outlive` |
| 152 | 3 | `lifetime-fn-003` | Annotate input and output references in functions | `lifetime-function-bounds` |
| 153 | 4 | `lifetime-elision-004` | Apply compiler lifetime elision rules manually | `lifetime-elision-rules` |
| 154 | 5 | `lifetime-static-005` | Differentiate 'static data from T: 'static trait bounds | `lifetime-static-bound` |
| 155 | 6 | `lifetime-comp-006` | Verify lifetime limits with compile-fail checks | `lifetime-compile-fail` |

### Arc: Zero-copy data parsers and lifetimes (`zero-copy-parser`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 156 | 1 | `parser-zero-copy-001` | Define a zero-copy configuration parser | `parser-zero-copy-struct` |
| 157 | 2 | `parser-life-002` | Track input buffers lifetimes across return slices | `parser-lifetime-tracking` |
| 158 | 3 | `parser-nested-003` | Implement nested struct references sharing lifetimes | `parser-nested-lifetime` |
| 159 | 4 | `parser-split-004` | Parse lines returning token vectors of borrowed slices | `parser-split-methods` |
| 160 | 5 | `parser-mut-005` | Avoid simultaneous mutable borrowing in parse loops | `parser-mut-borrow` |
| 161 | 6 | `parser-test-006` | Validate zero-allocation behavior under heavy parsing | `parser-zero-copy-tests` |

### Arc: Consuming vs non-consuming builders (`builder-ownership`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 162 | 1 | `builder-consume-001` | Write consuming builder taking self by value | `builder-consuming` |
| 163 | 2 | `builder-non-consume-002` | Write non-consuming builder taking &mut self | `builder-non-consuming` |
| 164 | 3 | `builder-ref-003` | Expose builder setters borrowing input parameters | `builder-reference-setters` |
| 165 | 4 | `builder-temp-004` | Avoid compiling issues with temporary lifetimes | `builder-temporary-lifetime` |
| 166 | 5 | `builder-append-005` | Build collections incrementally inside structures | `builder-collection-append` |
| 167 | 6 | `builder-cmp-006` | Compare ergonomics and allocation of both styles | `builder-comparison-suite` |

### Arc: Zero-copy search indexes and views (`index-views`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 168 | 1 | `index-struct-001` | Define search index borrowing raw document strings | `index-struct-lifetimes` |
| 169 | 2 | `index-view-002` | Expose lookups returning list of borrowed token references | `index-lookup-view` |
| 170 | 3 | `index-hash-003` | Store references inside HashMaps with lifetime bounds | `index-hashmap-lifetime` |
| 171 | 4 | `index-inval-004` | Ensure borrow checker prevents index outliving data | `index-invalidation` |
| 172 | 5 | `index-range-005` | Extract specific matched ranges as borrows | `index-range-slices` |
| 173 | 6 | `index-perf-006` | Measure performance differences vs owning indexes | `index-performance-checks` |

### Arc: Multiple lifetime parameters and variance (`lifetime-annotations`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 174 | 1 | `lifetime-multi-001` | Write functions using multiple generic lifetimes | `lifetime-multi-params` |
| 175 | 2 | `lifetime-sub-002` | Define subtyping constraints between generic lifetimes | `lifetime-subtyping` |
| 176 | 3 | `lifetime-variance-003` | Differentiate covariant vs invariant generic structs | `lifetime-variance` |
| 177 | 4 | `lifetime-invar-004` | Handle compilation errors from mutable invariance | `lifetime-mutable-invariance` |
| 178 | 5 | `lifetime-adv-005` | Write lifetime-bounded generic trait implementations | `lifetime-advanced-bounds` |

### Arc: Clone and Copy traits semantics (`clone-copy-semantics`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 179 | 1 | `clone-derive-001` | Derive and understand standard Clone implementations | `clone-derive` |
| 180 | 2 | `copy-derive-002` | Derive Copy on lightweight primitive stack types | `copy-derive` |
| 181 | 3 | `clone-manual-003` | Implement Clone manually for custom heap allocations | `clone-manual` |
| 182 | 4 | `copy-restrict-004` | Identify why structs holding String cannot be Copy | `copy-restrictions` |
| 183 | 5 | `clone-prevent-005` | Write APIs that encourage borrowing instead of cloning | `clone-prevention` |

### Arc: Custom comparisons and ordering traits (`partialeq-eq-ord`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 184 | 1 | `cmp-partialeq-001` | Implement PartialEq manually for custom struct logic | `cmp-partialeq` |
| 185 | 2 | `cmp-eq-002` | Implement Eq marker trait for total equivalence | `cmp-eq-marker` |
| 186 | 3 | `cmp-partialord-003` | Implement PartialOrd for bounded domain values | `cmp-partialord` |
| 187 | 4 | `cmp-ord-004` | Implement Ord manually for entities sorting | `cmp-ord-total` |
| 188 | 5 | `cmp-sort-005` | Sort slices of domain entities with custom orderings | `cmp-sorting-slices` |
| 189 | 6 | `cmp-float-006` | Solve float ordering issues using wrapper types | `cmp-float-problems` |

### Arc: Custom formatting with Display and Debug (`display-debug-formatting`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 190 | 1 | `fmt-debug-derive-001` | Derive Debug and format with pretty prints | `fmt-debug-derive` |
| 191 | 2 | `fmt-debug-manual-002` | Implement Debug manually to redact sensitive fields | `fmt-debug-manual` |
| 192 | 3 | `fmt-display-manual-003` | Implement Display for clean user reporting | `fmt-display-manual` |
| 193 | 4 | `fmt-write-004` | Use formatting macros: format!, write!, and writeln! | `fmt-write-macros` |
| 194 | 5 | `fmt-debug-builder-005` | Use DebugStruct and DebugList formatter builders | `fmt-builder-debug` |
| 195 | 6 | `fmt-perf-006` | Avoid heap allocations inside formatting implementations | `fmt-performance` |

### Arc: Custom Hashing and Hash trait (`hash-custom`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 196 | 1 | `hash-derive-001` | Derive standard Hash trait on simple structures | `hash-derive` |
| 197 | 2 | `hash-manual-002` | Implement Hash manually targeting entity ID fields | `hash-manual` |
| 198 | 3 | `hash-hasher-003` | Feed custom byte arrays into standard Hashers | `hash-hasher-usage` |
| 199 | 4 | `hash-eq-004` | Maintain strict equivalence rules between Hash and Eq | `hash-eq-consistency` |
| 200 | 5 | `hash-custom-hasher-005` | Differentiate default SipHash from fast non-cryptographic hashers | `hash-custom-hasher` |

### Arc: Generic bounds and dynamic dispatch (`trait-bounds-generics`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 201 | 1 | `bounds-generic-001` | Declare simple generic bounds on function signatures | `bounds-generic-fn` |
| 202 | 2 | `bounds-where-002` | Simplify complex trait bounds using where clauses | `bounds-where-clause` |
| 203 | 3 | `bounds-impl-trait-003` | Use impl Trait syntax in arguments and returns | `bounds-impl-trait` |
| 204 | 4 | `bounds-dyn-004` | Understand dynamic dispatch using trait objects (&dyn Trait) | `bounds-dyn-dispatch` |
| 205 | 5 | `bounds-safety-005` | Identify and resolve object safety compilation errors | `bounds-object-safety` |
| 206 | 6 | `bounds-mono-006` | Compare compilation time and runtime cost of dispatch styles | `bounds-monomorphization` |

### Arc: Advanced iterator combinators (`iterator-combinators`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 207 | 1 | `iter-flatmap-001` | Flatten nested structures with flat_map | `iter-flat-map` |
| 208 | 2 | `iter-zip-002` | Combine parallel iterations into pairs with zip | `iter-zip` |
| 209 | 3 | `iter-peek-003` | Look ahead in the iteration stream using Peekable | `iter-peekable` |
| 210 | 4 | `iter-by-ref-004` | Iterate over reference chunks using by_ref | `iter-by-ref` |
| 211 | 5 | `iter-chain-005` | Collect iteration results into custom containers | `iter-chain-collect` |
| 212 | 6 | `iter-lazy-006` | Design lazy evaluations preventing intermediate allocations | `iter-lazy-eval` |

### Arc: Batch validation with fold and try_fold (`fold-try-fold`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 213 | 1 | `fold-accum-001` | Accumulate complex state using standard fold | `fold-accumulator` |
| 214 | 2 | `fold-tryfold-002` | Implement early-exit folding using try_fold | `fold-try-fold-basic` |
| 215 | 3 | `fold-validation-003` | Collect validation failures across batches | `fold-batch-validation` |
| 216 | 4 | `fold-errors-004` | Map parsing errors incrementally in collections | `fold-map-errors` |
| 217 | 5 | `fold-result-005` | Convert Iter<Result<T, E>> into Result<Vec<T>, E> | `fold-result-collect` |
| 218 | 6 | `fold-perf-006` | Benchmark fold speed compared to imperative loop checks | `fold-performance` |

### Arc: HashMap Entry API optimization (`hashmap-entry`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 219 | 1 | `entry-insert-001` | Insert missing values efficiently with Entry API | `entry-api-insert` |
| 220 | 2 | `entry-modify-002` | Modify existing values in-place using or_default | `entry-api-modify` |
| 221 | 3 | `entry-complex-003` | Use and_modify to perform custom increments on match | `entry-api-complex` |
| 222 | 4 | `entry-double-004` | Avoid double lookup overhead using Entry references | `entry-api-double-lookup` |
| 223 | 5 | `entry-group-005` | Group multi-field records into lists of keys | `entry-api-grouping` |
| 224 | 6 | `entry-tests-006` | Assert correctness of entry mutations under test cases | `entry-api-tests` |

### Arc: BTreeMap and ordered collections (`btreemap-ordered`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 225 | 1 | `btree-range-001` | Expose range-based lookup queries in BTreeMaps | `btree-range-query` |
| 226 | 2 | `btree-prefix-002` | Implement alphabetical prefix searches | `btree-prefix-match` |
| 227 | 3 | `btree-sorted-003` | Retrieve sorted keys without sorting arrays | `btree-sorted-keys` |
| 228 | 4 | `btree-entry-004` | Leverage Entry API on BTreeMaps | `btree-entry-api` |
| 229 | 5 | `btree-perf-005` | Compare search complexity of BTreeMap vs HashMap | `btree-performance` |

### Arc: Implementing custom Iterator types (`custom-iterators`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 230 | 1 | `custom-iter-001` | Define a custom pagination token iterator | `custom-iter-struct` |
| 231 | 2 | `custom-iter-next-002` | Implement next() method tracking state indices | `custom-iter-next` |
| 232 | 3 | `custom-iter-infin-003` | Design an infinite generator sequence iterator | `custom-iter-infinite` |
| 233 | 4 | `custom-iter-hint-004` | Expose upper and lower bounds in size_hint | `custom-iter-size-hint` |
| 234 | 5 | `custom-iter-ended-005` | Implement DoubleEndedIterator for reverse walks | `custom-iter-double-ended` |

### Arc: Unit testing domain invariants (`unit-testing-invariants`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 235 | 1 | `test-invar-happy-001` | Write happy path validation assertions | `test-invariant-happy` |
| 236 | 2 | `test-invar-reject-002` | Test rejected edge inputs systematically | `test-invariant-rejections` |
| 237 | 3 | `test-private-003` | Test private helpers using module child paths | `test-private-helper` |
| 238 | 4 | `test-panic-expect-004` | Assert expected panics with should_panic | `test-panic-expect` |
| 239 | 5 | `test-custom-assert-005` | Write clean macros for domain assertions | `test-custom-assertions` |

### Arc: Table-driven and parameterized tests (`table-driven-tests`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 240 | 1 | `table-setup-001` | Structure table test cases with input-output structs | `table-test-setup` |
| 241 | 2 | `table-iter-002` | Loop over test cases reporting specific failures | `table-test-iteration` |
| 242 | 3 | `table-desc-003` | Include descriptive labels for test debugs | `table-test-descriptions` |
| 243 | 4 | `table-macro-004` | Refactor table tests into macro declarations | `table-test-macro` |
| 244 | 5 | `table-val-005` | Verify parser outputs against massive input lists | `table-test-validation` |
| 245 | 6 | `table-maint-006` | Maintain readable test vectors without code bloats | `table-test-maintenance` |

### Arc: Testing error cases and display outputs (`testing-errors`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 246 | 1 | `test-err-var-001` | Assert specific enum error variants are returned | `test-error-variants` |
| 247 | 2 | `test-err-display-002` | Verify Display output matches expected sentences | `test-error-display` |
| 248 | 3 | `test-err-source-003` | Test nested error causes are populated properly | `test-error-source-chain` |
| 249 | 4 | `test-err-macro-004` | Use assert_matches! macro for error checks | `test-error-matching-macro` |
| 250 | 5 | `test-err-unwrap-005` | Handle error unwraps safely in test functions | `test-error-unwrapping` |

### Arc: Faking repository ports for unit tests (`fake-repository-ports`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 251 | 1 | `fake-repo-struct-001` | Implement db port trait using thread-safe state | `fake-repo-struct` |
| 252 | 2 | `fake-repo-ok-002` | Simulate successful database operations in memory | `fake-repo-success` |
| 253 | 3 | `fake-repo-err-003` | Simulate specific adapter errors under test | `fake-repo-failures` |
| 254 | 4 | `fake-repo-assert-004` | Verify domain entities received expected calls | `fake-repo-assertions` |
| 255 | 5 | `fake-repo-mutex-005` | Manage shared mutable fake states safely | `fake-repo-mutex` |
| 256 | 6 | `fake-repo-clean-006` | Reset fake records between test cases | `fake-repo-cleanup` |

### Arc: Test data builders pattern (`test-data-builders`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 257 | 1 | `test-builder-001` | Create TestUserBuilder for setting up test data | `test-builder-pattern` |
| 258 | 2 | `test-builder-def-002` | Provide standard valid default entity fields | `test-builder-defaults` |
| 259 | 3 | `test-builder-over-003` | Allow overriding specific values in setters | `test-builder-override` |
| 260 | 4 | `test-builder-inv-004` | Add helper method building invalid structures | `test-builder-invalid` |
| 261 | 5 | `test-builder-nested-005` | Compose nested builders for complex child objects | `test-builder-nested` |
| 262 | 6 | `test-builder-ergo-006` | Refactor builders to reduce test setup boilerplates | `test-builder-ergonomics` |

### Arc: Domain purity and architectural boundaries (`domain-purity`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 263 | 1 | `domain-pure-001` | Separate pure domain rules from async framework logic | `domain-purity-concept` |
| 264 | 2 | `domain-dto-002` | Separate external DTO classes from inner domain structs | `domain-dto-separation` |
| 265 | 3 | `domain-no-io-003` | Ensure domain types contain no network/filesystem side effects | `domain-no-io` |
| 266 | 4 | `domain-vo-004` | Enforce business invariants in domain value object constructors | `domain-value-objects` |
| 267 | 5 | `domain-mut-005` | Limit mutable fields in entities via change methods | `domain-entity-mutability` |
| 268 | 6 | `domain-boundary-006` | Assert zero adapter dependencies in domain Cargo packages | `domain-clean-boundaries` |

### Arc: Designing application service use cases (`application-use-cases`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 269 | 1 | `usecase-struct-001` | Define a RegisterUser use case orchestrator | `usecase-struct` |
| 270 | 2 | `usecase-ports-002` | Inject dependency ports in the usecase struct | `usecase-ports` |
| 271 | 3 | `usecase-execute-003` | Implement execute() method driving the transaction | `usecase-execution` |
| 272 | 4 | `usecase-validate-004` | Convert input command to domain object at service layer | `usecase-validation` |
| 273 | 5 | `usecase-events-005` | Publish domain events upon transaction success | `usecase-events` |
| 274 | 6 | `usecase-errors-006` | Map repository errors to application usecase failures | `usecase-errors` |

### Arc: Dependency inversion and port traits (`port-traits-di`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 275 | 1 | `ports-repo-001` | Define a UserRepository port trait representing database | `ports-repository` |
| 276 | 2 | `ports-async-002` | Handle async method definitions in port traits | `ports-async-trait` |
| 277 | 3 | `ports-mailer-003` | Define outbound EmailSender port trait | `ports-mailer` |
| 278 | 4 | `ports-tx-004` | Model transactional boundaries using database ports | `ports-transactional` |
| 279 | 5 | `ports-dyn-005` | Inject ports using dynamic trait objects | `ports-dynamic-dispatch` |
| 280 | 6 | `ports-mock-006` | Design port boundaries for easy mock injections | `ports-mocking-readiness` |

### Arc: Designing Actix Web adapter endpoints (`web-adapter-actix`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 281 | 1 | `web-route-001` | Define basic Actix HTTP handler endpoints | `web-actix-route` |
| 282 | 2 | `web-dto-002` | Parse JSON requests into raw adapter DTO objects | `web-actix-dto` |
| 283 | 3 | `web-usecase-003` | Call application use cases from Actix handlers | `web-actix-usecase` |
| 284 | 4 | `web-resp-004` | Translate domain values into Actix HTTP responses | `web-actix-response` |
| 285 | 5 | `web-err-005` | Implement ResponseError trait on app failures | `web-actix-errors` |
| 286 | 6 | `web-test-006` | Write integration tests mocking HTTP adapters | `web-actix-testing` |

### Arc: Designing Sqlx database adapters (`database-adapter-sqlx`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 287 | 1 | `db-connection-001` | Setup Sqlx database connection adapter pools | `db-sqlx-connection` |
| 288 | 2 | `db-queries-002` | Write type-checked SQL queries using sqlx macros | `db-sqlx-queries` |
| 289 | 3 | `db-mapping-003` | Map raw database rows into domain structures | `db-sqlx-mapping` |
| 290 | 4 | `db-repo-004` | Implement UserRepository port using SQL queries | `db-sqlx-repository` |
| 291 | 5 | `db-tx-005` | Manage database transactions inside sqlx adapters | `db-sqlx-tx` |
| 292 | 6 | `db-errors-006` | Map SQL connection errors to domain failures | `db-sqlx-errors` |

### Arc: Application composition root and wiring (`composition-root`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 293 | 1 | `comp-main-001` | Structure application main entry point | `comp-root-main` |
| 294 | 2 | `comp-config-002` | Parse environment settings and configs | `comp-root-config` |
| 295 | 3 | `comp-wiring-003` | Instantiate adapters and inject them into use cases | `comp-root-wiring` |
| 296 | 4 | `comp-lifecycle-004` | Handle graceful shutdown of adapters | `comp-root-lifecycle` |
| 297 | 5 | `comp-mig-005` | Trigger database migrations automatically at startup | `comp-root-db-migrations` |
| 298 | 6 | `comp-smoke-006` | Write smoke tests verifying service wiring | `comp-root-smoke-test` |

### Arc: Explicit boundary data conversions (`boundary-dto-command`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 299 | 1 | `bound-dto-001` | Define distinct RequestDTO and ResponseDTO structures | `boundary-dto-dto` |
| 300 | 2 | `bound-map-002` | Implement TryFrom<RequestDTO> for domain commands | `boundary-dto-mapping` |
| 301 | 3 | `bound-resp-003` | Convert domain entities into ResponseDTOs | `boundary-dto-response` |
| 302 | 4 | `bound-sanitize-004` | Sanitize sensitive input fields during conversion | `boundary-dto-sanitization` |
| 303 | 5 | `bound-tests-005` | Assert strict separation between DTOs and domains | `boundary-dto-tests` |

### Arc: Context propagation across layers (`context-propagation`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 304 | 1 | `context-struct-001` | Define RequestContext carrying correlation IDs | `context-prop-struct` |
| 305 | 2 | `context-thread-002` | Pass context down to application service layers | `context-prop-thread` |
| 306 | 3 | `context-log-003` | Attach correlation IDs to all downstream logs | `context-prop-logging` |
| 307 | 4 | `context-db-004` | Pass client metadata down to database adapters | `context-prop-db` |
| 308 | 5 | `context-tests-005` | Assert context is propagated successfully in integrations | `context-prop-tests` |

### Arc: Async Rust fundamentals and Tokio (`async-basics`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 309 | 1 | `async-basics-fn-001` | Define asynchronous functions with async fn | `async-basics-fn` |
| 310 | 2 | `async-basics-await-002` | Drive futures to completion using .await | `async-basics-await` |
| 311 | 3 | `async-basics-block-003` | Run async loops from main using tokio::main | `async-basics-block-on` |
| 312 | 4 | `async-join-004` | Execute parallel tasks concurrently with tokio::join! | `async-basics-join` |
| 313 | 5 | `async-spawn-005` | Spawn background tasks using tokio::spawn | `async-basics-spawn` |
| 314 | 6 | `async-block-006` | Offload CPU-bound calculations using spawn_blocking | `async-basics-blocking` |

### Arc: Thread-safe shared state in async (`shared-thread-safe-state`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 315 | 1 | `shared-arc-001` | Share read-only services across tasks using Arc | `shared-state-arc` |
| 316 | 2 | `shared-mutex-002` | Protect mutable states using tokio::sync::Mutex | `shared-state-mutex` |
| 317 | 3 | `shared-rwlock-003` | Optimize read-heavy states using tokio::sync::RwLock | `shared-state-rwlock` |
| 318 | 4 | `shared-poison-004` | Understand lock poisoning in standard sync locks | `shared-state-poisoning` |
| 319 | 5 | `shared-content-005` | Avoid lock deadlocks and contention issues | `shared-state-contention` |
| 320 | 6 | `shared-alt-006` | Use atomic primitives instead of locks for counters | `shared-state-alternatives` |

### Arc: Cancellation safety in async tasks (`cancellation-safety`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 321 | 1 | `cancel-safe-001` | Understand how futures are cancelled when dropped | `cancel-safety-concept` |
| 322 | 2 | `cancel-select-002` | Handle task cancellation inside select! macros | `cancel-safety-select` |
| 323 | 3 | `cancel-db-003` | Clean up transactions safely upon timeout drops | `cancel-safety-db` |
| 324 | 4 | `cancel-io-004` | Implement cancellation-safe socket reading loops | `cancel-safety-io` |
| 325 | 5 | `cancel-tests-005` | Write tests verifying cancellation does not leak states | `cancel-safety-tests` |

### Arc: Asynchronous timeouts and retries (`async-timeouts-retries`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 326 | 1 | `timeout-tokio-001` | Add timeouts to async calls using tokio::time::timeout | `timeout-tokio` |
| 327 | 2 | `timeout-map-002` | Map timeout failures to domain-specific errors | `timeout-mapping` |
| 328 | 3 | `retry-interval-003` | Implement retry loops with constant time sleep gaps | `retry-interval` |
| 329 | 4 | `retry-backoff-004` | Design exponential backoff logic for remote calls | `retry-backoff` |
| 330 | 5 | `retry-state-005` | Track retry attempts state inside typed structures | `retry-stateful` |

### Arc: Structured logging fundamentals (`tracing-basics`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 331 | 1 | `tracing-info-001` | Replace println! with tracing::info! events | `log-tracing-info` |
| 332 | 2 | `tracing-levels-002` | Use target levels: Trace, Debug, Info, Warn, Error | `log-tracing-levels` |
| 333 | 3 | `tracing-fields-003` | Attach key-value metadata to tracing events | `log-tracing-fields` |
| 334 | 4 | `tracing-sub-004` | Setup tracing subscriber in binary composition roots | `log-tracing-sub` |
| 335 | 5 | `tracing-test-005` | Assert expected log messages appear during tests | `log-tracing-test` |

### Arc: Tracing spans and context propagation (`tracing-spans`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 336 | 1 | `span-create-001` | Create tracing spans to group related logs | `span-create` |
| 337 | 2 | `span-enter-002` | Enter spans manually using guard structures | `span-enter` |
| 338 | 3 | `span-instrument-003` | Instrument async functions with #[instrument] macro | `span-instrument` |
| 339 | 4 | `span-fields-004` | Record dynamic fields inside active spans | `span-fields` |
| 340 | 5 | `span-parent-005` | Wire parent-child relations across task boundaries | `span-parent` |
| 341 | 6 | `span-leak-006` | Avoid lock issues with span guards across await boundaries | `span-leak-avoidance` |

### Arc: PII redaction and security in logging (`pii-redaction`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 342 | 1 | `redact-fields-001` | Ensure secrets are never printed in log fields | `redact-log-fields` |
| 343 | 2 | `redact-wrap-002` | Design LogRedacted wrapper type for passwords | `redact-log-wrapper` |
| 344 | 3 | `redact-sub-003` | Customize tracing formatting to filter inputs | `redact-log-subscriber` |
| 345 | 4 | `redact-policy-004` | Redact email strings before writing to logs | `redact-log-policy` |
| 346 | 5 | `redact-tests-005` | Verify sensitive text never leaks to logs under test | `redact-log-tests` |

### Arc: Diagnostic logs and error reporting (`error-diagnostic-logs`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 347 | 1 | `diag-err-001` | Log application errors with structured error fields | `diag-err-log` |
| 348 | 2 | `diag-err-ctx-002` | Log error causes recursively down the chain | `diag-err-context` |
| 349 | 3 | `diag-err-bt-003` | Capture and log backtraces for unhandled errors | `diag-err-backtrace` |
| 350 | 4 | `diag-err-cor-004` | Correlate error logs with request trace IDs | `diag-err-correlation` |
| 351 | 5 | `diag-err-alert-005` | Map error levels to distinct alerting targets | `diag-err-alerting` |
| 352 | 6 | `diag-err-tests-006` | Validate log serialization format is parseable JSON | `diag-err-tests` |

### Arc: Smart pointers Box, Rc and RefCell (`smart-pointers`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 353 | 1 | `smart-box-001` | Allocate recursive data structures on the heap with Box | `smart-box-heap` |
| 354 | 2 | `smart-rc-002` | Share immutable ownership inside threads with Rc | `smart-rc-share` |
| 355 | 3 | `smart-refcell-003` | Achieve interior mutability in single threads with RefCell | `smart-refcell-mut` |
| 356 | 4 | `smart-weak-004` | Avoid memory leaks by breaking cycles with Weak references | `smart-weak-refs` |
| 357 | 5 | `smart-borrow-005` | Enforce borrow checking at runtime using RefCell | `smart-borrow-checker` |
| 358 | 6 | `smart-pointer-tests-006` | Assert reference count increments in tests | `smart-pointers-tests` |

### Arc: Interior mutability and thread safety (`interior-mutability`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 359 | 1 | `interior-cell-001` | Copy and mutate values in structs with Cell | `interior-cell` |
| 360 | 2 | `interior-mutex-002` | Share mutable state between threads using sync Mutex | `interior-mutex-sync` |
| 361 | 3 | `interior-rwlock-003` | Expose multiple concurrent readers with sync RwLock | `interior-rwlock-sync` |
| 362 | 4 | `interior-poison-004` | Handle lock poisoning in system threads safely | `interior-poison-handling` |
| 363 | 5 | `interior-dead-005` | Avoid nested lock acquisition deadlocks | `interior-deadlock-avoid` |
| 364 | 6 | `interior-tests-006` | Test thread contention behaviors | `interior-safety-tests` |

### Arc: Smart pointer ergonomics with Deref (`deref-trait`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 365 | 1 | `deref-immut-001` | Implement Deref for custom value object wrappers | `deref-immutable` |
| 366 | 2 | `deref-mut-002` | Implement DerefMut to enable inner mutations | `deref-mutable` |
| 367 | 3 | `deref-coerce-003` | Understand compiler deref coercion rules | `deref-coercion` |
| 368 | 4 | `deref-overuse-004` | Avoid using Deref as a replacement for inheritance | `deref-overuse` |
| 369 | 5 | `deref-smart-005` | Design custom smart pointers wrapping buffers | `deref-smart-pointers` |
| 370 | 6 | `deref-tests-006` | Assert coercion pathways resolve under test | `deref-tests` |

### Arc: Associated types and operator traits (`associated-types-traits`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 371 | 1 | `assoc-def-001` | Define traits with associated output types | `assoc-types-def` |
| 372 | 2 | `assoc-add-002` | Implement Add trait for custom types | `assoc-operator-add` |
| 373 | 3 | `assoc-sub-003` | Implement Sub trait for custom types | `assoc-operator-sub` |
| 374 | 4 | `assoc-mul-004` | Implement Mul trait for custom types | `assoc-operator-mul` |
| 375 | 5 | `assoc-index-005` | Implement Index and IndexMut for buffer wrappers | `assoc-operator-index` |
| 376 | 6 | `assoc-vs-gen-006` | Differentiate associated types from generic parameters | `assoc-vs-generics` |

### Arc: Async fn in traits and dyn Future dispatch (`asynchronous-traits`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 377 | 1 | `async-native-001` | Define native async fn in traits (Rust 1.75+) | `async-trait-native` |
| 378 | 2 | `async-macro-002` | Implement backward-compatible async traits using #[async_trait] | `async-trait-macro` |
| 379 | 3 | `async-dyn-003` | Dispatch async traits dynamically using BoxFuture | `async-trait-dyn` |
| 380 | 4 | `async-send-004` | Add Send bounds to async futures for multithread spawns | `async-trait-send` |
| 381 | 5 | `async-bounds-005` | Resolve lifetime mismatches in async traits | `async-trait-bounds` |
| 382 | 6 | `async-trait-tests-006` | Test dynamic async dispatching under fakes | `async-trait-tests` |

### Arc: Designing Axum web adapter layers (`axum-web-adapters`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 383 | 1 | `axum-end-001` | Define basic Axum handler functions and routing | `axum-endpoint` |
| 384 | 2 | `axum-extract-002` | Parse JSON payloads using Axum Extractors | `axum-extractor` |
| 385 | 3 | `axum-state-003` | Inject shared application services via Axum State | `axum-state-injection` |
| 386 | 4 | `axum-resp-004` | Implement IntoResponse for custom HTTP responses | `axum-response` |
| 387 | 5 | `axum-err-005` | Map domain errors to Axum HTTP status codes | `axum-error-mapping` |
| 388 | 6 | `axum-test-006` | Write HTTP integration tests for Axum endpoints | `axum-integration-test` |

### Arc: Mocking port traits with mockall (`mockall-testing`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 389 | 1 | `mock-derive-001` | Generate mock structures automatically using #[automock] | `mockall-derive` |
| 390 | 2 | `mock-expect-002` | Define expectations on mock calls and return values | `mockall-expectations` |
| 391 | 3 | `mock-params-003` | Assert specific parameters were passed to mocks | `mockall-parameters` |
| 392 | 4 | `mock-seq-004` | Enforce invocation orders using mock sequences | `mockall-sequences` |
| 393 | 5 | `mock-err-005` | Simulate adapter failures using mock panic throws | `mockall-error-sim` |
| 394 | 6 | `mock-tests-006` | Write complex use case tests using mock injections | `mockall-integration` |

### Arc: Integration testing in separate crates (`integration-testing`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 395 | 1 | `integ-folder-001` | Setup integration tests inside project's /tests directory | `integ-folder` |
| 396 | 2 | `integ-db-002` | Spin up temporary Postgres test instances fallibly | `integ-db-setup` |
| 397 | 3 | `integ-db-tx-003` | Roll back database mutations between integration runs | `integ-db-tx` |
| 398 | 4 | `integ-http-004` | Make HTTP requests to test services using reqwest | `integ-http-client` |
| 399 | 5 | `integ-assert-005` | Assert database state directly after HTTP calls | `integ-assertions` |
| 400 | 6 | `integ-perf-006` | Isolate slow integration suites from unit tests | `integ-performance` |

### Arc: Declarative macros with macro_rules! (`custom-macros-basic`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 401 | 1 | `macro-rules-basics-001` | Write basic declarative macro expansions | `macro-rules-basics` |
| 402 | 2 | `macro-patterns-002` | Match identifiers, expressions, and statements | `macro-patterns` |
| 403 | 3 | `macro-repeats-003` | Handle repeated arguments using * and + operators | `macro-repetitions` |
| 404 | 4 | `macro-assert-004` | Write custom domain assert macros for testing | `macro-assertions` |
| 405 | 5 | `macro-debug-005` | Debug macro expansion compile errors using trace_macros | `macro-debugging` |
| 406 | 6 | `macro-tests-006` | Validate expanded macros compile under test cases | `macro-tests` |

### Arc: Custom serialization with serde (`serde-custom-serialization`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 407 | 1 | `serde-ser-001` | Implement custom Serialize manually | `serde-serialize-impl` |
| 408 | 2 | `serde-deser-002` | Implement custom Deserialize manually | `serde-deserialize-impl` |
| 409 | 3 | `serde-date-003` | Serialize DateTime formats customly | `serde-date-format` |
| 410 | 4 | `serde-enum-004` | Handle internally, externally, and untagged enums | `serde-enum-tagging` |
| 411 | 5 | `serde-rename-005` | Manipulate key names using field attributes | `serde-rename-attributes` |
| 412 | 6 | `serde-val-006` | Enforce validation invariants during deserialization | `serde-validation-deser` |

### Arc: Serde serialization at adapter boundaries (`serde-boundary-dto`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 413 | 1 | `serde-dto-unknown-001` | Handle unknown fields using deny_unknown_fields | `serde-dto-unknown` |
| 414 | 2 | `serde-dto-defaults-002` | Provide default values for missing JSON fields | `serde-dto-defaults` |
| 415 | 3 | `serde-dto-flatten-003` | Flatten nested JSON blobs into flat structures | `serde-dto-flatten` |
| 416 | 4 | `serde-dto-raw-004` | Postpone parsing nested JSON with serde_json::Value | `serde-dto-raw-value` |
| 417 | 5 | `serde-dto-url-005` | Parse URL-encoded forms using serde_urlencoded | `serde-dto-url` |
| 418 | 6 | `serde-dto-tests-006` | Assert serialization behaves as expected at edge | `serde-dto-tests` |

### Arc: Managing database transactions in Sqlx (`sqlx-transactions`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 419 | 1 | `sqlx-tx-begin-001` | Begin database transactions with pool.begin() | `sqlx-tx-begin` |
| 420 | 2 | `sqlx-tx-commit-002` | Commit successful transaction edits | `sqlx-tx-commit` |
| 421 | 3 | `sqlx-tx-rollback-003` | Rollback transactions on adapter errors | `sqlx-tx-rollback` |
| 422 | 4 | `sqlx-tx-pass-004` | Pass Transaction references down SQL adapters | `sqlx-tx-passing` |
| 423 | 5 | `sqlx-tx-iso-005` | Set custom isolation levels in transactions | `sqlx-tx-isolation` |
| 424 | 6 | `sqlx-tx-tests-006` | Assert transaction rollbacks prevent DB state leaks | `sqlx-tx-tests` |

### Arc: Offline compilation and SQL verification (`sqlx-offline-mode`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 425 | 1 | `sqlx-offline-json-001` | Generate query cache files with sqlx-data.json | `sqlx-offline-json` |
| 426 | 2 | `sqlx-offline-cargo-002` | Verify database queries offline using SQLX_OFFLINE=true | `sqlx-offline-cargo` |
| 427 | 3 | `sqlx-offline-mig-003` | Verify migrations compile without a running database | `sqlx-offline-migrations` |
| 428 | 4 | `sqlx-offline-ci-004` | Setup query verification in CI pipelines | `sqlx-offline-ci` |
| 429 | 5 | `sqlx-offline-trouble-005` | Solve metadata sync drift issues | `sqlx-offline-troubleshoot` |
| 430 | 6 | `sqlx-offline-tests-006` | Validate database build health in offline suites | `sqlx-offline-tests` |

### Arc: Message passing using Tokio channels (`tokio-tasks-channels`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 431 | 1 | `chan-mpsc-001` | Send commands using multi-producer single-consumer channels | `chan-mpsc` |
| 432 | 2 | `chan-oneshot-002` | Receive task replies using oneshot channels | `chan-oneshot` |
| 433 | 3 | `chan-broadcast-003` | Publish events to multiple receivers using broadcast | `chan-broadcast` |
| 434 | 4 | `chan-watch-004` | Track shared configurations using state watch channels | `chan-watch` |
| 435 | 5 | `chan-backpressure-005` | Manage sender backpressure using bounded channels | `chan-backpressure` |
| 436 | 6 | `chan-tests-006` | Verify channel message passing is leak-free under test | `chan-tests` |

### Arc: Task synchronization in async environments (`concurrency-synchronization`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 437 | 1 | `sync-sem-001` | Rate-limit API requests using Tokio Semaphores | `sync-semaphore` |
| 438 | 2 | `sync-bar-002` | Coordinate parallel startup stages using Barriers | `sync-barrier` |
| 439 | 3 | `sync-notify-003` | Notify individual background workers with Notify | `sync-notify` |
| 440 | 4 | `sync-select-004` | Manage parallel operations inside loop select! statements | `sync-select-multi` |
| 441 | 5 | `sync-deadlock-005` | Diagnose deadlocks in cross-channel synchronization | `sync-deadlock-cases` |
| 442 | 6 | `sync-primitives-tests-006` | Test task coordination in race-prone tests | `sync-primitives-tests` |

### Arc: Telemetry metrics and performance counters (`metrics-observability`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 443 | 1 | `metrics-count-001` | Track event frequency using performance counters | `metrics-counter` |
| 444 | 2 | `metrics-gauge-002` | Measure resources occupancy using gauges | `metrics-gauge` |
| 445 | 3 | `metrics-hist-003` | Analyze request duration distributions using histograms | `metrics-histogram` |
| 446 | 4 | `metrics-adapter-004` | Expose metrics endpoints without polluting domains | `metrics-adapter` |
| 447 | 5 | `metrics-agg-005` | Setup registry aggregation inside main roots | `metrics-aggregation` |
| 448 | 6 | `metrics-tests-006` | Assert metric counters increment in use cases | `metrics-tests` |

### Arc: Performance profiling and span traces (`performance-profiling`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 449 | 1 | `prof-spans-001` | Measure function execution time using profiling spans | `prof-spans-measure` |
| 450 | 2 | `prof-spans-meta-002` | Attach performance metadata to active traces | `prof-spans-metadata` |
| 451 | 3 | `prof-spans-export-003` | Format profiling traces for flamegraph analyzers | `prof-spans-export` |
| 452 | 4 | `prof-spans-neck-004` | Identify blocking calls inside async runtimes | `prof-spans-bottlenecks` |
| 453 | 5 | `prof-subscriber-005` | Setup tracing chrome-trace exporters | `prof-spans-tracing-subscriber` |
| 454 | 6 | `prof-spans-tests-006` | Validate span structure matches expected hierarchies | `prof-spans-tests` |

### Arc: Environment configuration hierarchies (`configuration-environments`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 455 | 1 | `env-load-001` | Load environment variables from files using dotenvy | `env-config-load` |
| 456 | 2 | `env-fallback-002` | Provide safe configuration fallbacks for local runs | `env-config-fallback` |
| 457 | 3 | `env-typed-003` | Map environment settings to strongly typed structures | `env-config-typed` |
| 458 | 4 | `env-envs-004` | Differentiate Local, Test, and Production profiles | `env-config-environments` |
| 459 | 5 | `env-redact-005` | Filter sensitive passwords from config dumps | `env-config-redacted` |
| 460 | 6 | `env-tests-006` | Verify configuration loading behaves safely under missing envs | `env-config-tests` |

### Arc: Modular feature flags and Cargo features (`feature-flags`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 461 | 1 | `features-cargo-001` | Define optional components using Cargo feature flags | `features-cargo` |
| 462 | 2 | `features-cond-002` | Compile conditional adapters using #[cfg(feature = "...")] | `features-conditional` |
| 463 | 3 | `features-toggle-003` | Implement runtime feature toggles in domain rules | `features-runtime-toggle` |
| 464 | 4 | `features-dep-004` | Include optional external dependencies conditionally | `features-dependency` |
| 465 | 5 | `features-docs-005` | Document feature dependencies in crate API docs | `features-documentation` |
| 466 | 6 | `features-tests-006` | Write test suites verifying features combine cleanly | `features-tests` |

### Arc: Unsafe boundaries and safety contracts (`unsafe-boundaries`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 467 | 1 | `unsafe-block-001` | Differentiate unsafe blocks from standard safe code | `unsafe-block-basics` |
| 468 | 2 | `unsafe-ptr-002` | Manipulate raw pointers and perform dereferences | `unsafe-raw-pointers` |
| 469 | 3 | `unsafe-invar-003` | Maintain memory safety invariants manually | `unsafe-invariant-check` |
| 470 | 4 | `unsafe-abstract-004` | Expose safe public APIs wrapping unsafe code | `unsafe-abstraction` |
| 471 | 5 | `unsafe-tests-005` | Test safety wrappers under memory debuggers | `unsafe-boundaries-tests` |

### Arc: FFI boundaries and native bindings (`ffi-native-bindings`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 472 | 1 | `ffi-extern-001` | Interface with native C libraries using extern blocks | `ffi-extern-c` |
| 473 | 2 | `ffi-types-002` | Map primitive types to standard libc representations | `ffi-types-mapping` |
| 474 | 3 | `ffi-safe-003` | Wrap unsafe FFI bindings in idiomatic Rust APIs | `ffi-safe-wrappers` |
| 475 | 4 | `ffi-mem-004` | Avoid memory leaks by freeing allocated FFI buffers | `ffi-memory-management` |
| 476 | 5 | `ffi-tests-005` | Assert FFI bindings correctly process inputs | `ffi-tests` |

### Arc: Generic Associated Types (GATs) (`generic-associated-types`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 477 | 1 | `gat-def-001` | Declare associated types containing lifetime parameters | `gat-definition` |
| 478 | 2 | `gat-stream-002` | Build zero-allocation Streaming Iterators using GATs | `gat-streaming-iter` |
| 479 | 3 | `gat-bounds-003` | Apply trait bounds to generic associated type parameters | `gat-bounds` |
| 480 | 4 | `gat-vs-life-004` | Solve lifetime compilation issues in standard trait bounds | `gat-gats-vs-lifetimes` |
| 481 | 5 | `gat-adapters-005` | Implement GAT-based database repositories | `gat-impl-adapters` |
| 482 | 6 | `gat-tests-006` | Validate zero-copy stream processing behaves as expected | `gat-tests` |

### Arc: Pinned futures and custom Future types (`pinned-futures`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 483 | 1 | `pin-future-001` | Implement custom Future trait manually | `pinned-future-trait` |
| 484 | 2 | `pin-poll-002` | Drive state machines in poll() returning Poll::Pending | `pinned-poll-basics` |
| 485 | 3 | `pin-type-003` | Understand Pin and Unpin type wrapper contracts | `pinned-pin-type` |
| 486 | 4 | `pin-waker-004` | Coordinate async runtime wakes using Waker contexts | `pinned-waker-waking` |
| 487 | 5 | `pin-drop-005` | Ensure drop safety inside custom polled futures | `pinned-drop-safety` |
| 488 | 6 | `pin-tests-006` | Test custom polled futures using Tokio test environments | `pinned-futures-tests` |

### Arc: Actix actor model and state loops (`actix-actor-basics`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 489 | 1 | `actix-actor-001` | Define basic Actix Actor structures | `actix-actor-struct` |
| 490 | 2 | `actix-msg-002` | Implement Message trait for actor requests | `actix-actor-message` |
| 491 | 3 | `actix-handler-003` | Handle inbound messages using Handler traits | `actix-actor-handler` |
| 492 | 4 | `actix-ctx-004` | Control actor execution lifecycles in Context | `actix-actor-context` |
| 493 | 5 | `actix-chans-005` | Coordinate multiple actors using system addresses | `actix-actor-channels` |
| 494 | 6 | `actix-actor-tests-006` | Assert actor message processing state transitions | `actix-actor-tests` |

### Arc: Building a full architectural slice (`clean-architecture-full-slice`)

| Order | Day | Lesson ID | Title | Concept ID |
|---|---|---|---|---|
| 495 | 1 | `slice-domain-001` | Design pure domain entity rules and invariants | `slice-domain` |
| 496 | 2 | `slice-app-002` | Implement the application use case transaction boundary | `slice-application` |
| 497 | 3 | `slice-ports-003` | Define input/output port traits for dependency inversion | `slice-ports` |
| 498 | 4 | `slice-db-004` | Implement Sqlx repository adapter connecting databases | `slice-db-adapter` |
| 499 | 5 | `slice-web-005` | Implement Axum endpoint handler parsing request DTOs | `slice-web-adapter` |
| 500 | 6 | `slice-main-006` | Wire all components inside composition root and run integration tests | `slice-composition` |