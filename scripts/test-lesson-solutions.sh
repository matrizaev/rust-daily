#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/test-lesson-solutions.sh [arc-or-lesson-path]

Runs each lesson solution against its public tests in a temporary Cargo crate.

Examples:
  scripts/test-lesson-solutions.sh parse-user
  scripts/test-lesson-solutions.sh lessons/parse-user/004-source-parse-int
  scripts/test-lesson-solutions.sh lessons
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${1:-lessons}"

case "$target" in
  /*) target_path="$target" ;;
  lessons|lessons/*) target_path="$repo_root/$target" ;;
  *) target_path="$repo_root/lessons/$target" ;;
esac

if [[ ! -d "$target_path" ]]; then
  echo "No such lesson target: $target" >&2
  usage >&2
  exit 64
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/lesson-solution-check-XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

dependency_set_for_lesson() {
  node -e '
const fs = require("fs");
const lesson = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const validation = lesson.validation;
const steps = validation?.mode === "all" ? validation.validations : [validation];
const backendStep = steps.find((step) => step?.mode === "backend-cargo-test");
console.log(backendStep?.dependencySet || "std");
' "$1"
}

append_dependencies() {
  local crate_dir="$1"
  local dependency_set="$2"

  case "$dependency_set" in
    std)
      ;;
    advanced)
      cat >> "$crate_dir/Cargo.toml" <<'TOML'
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"
anyhow = "1"
tokio = { version = "1", features = ["macros", "rt", "sync", "time"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt"] }
actix-web = { version = "4", default-features = false }
actix-rt = "2"
http = "1"
proptest = { version = "1", default-features = false, features = ["std"] }
TOML
      ;;
    *)
      echo "Unknown dependencySet '$dependency_set' in $crate_dir" >&2
      exit 66
      ;;
  esac

  cat >> "$crate_dir/Cargo.toml" <<'TOML'

[profile.test]
debug = 0
incremental = false
TOML
}

lesson_dirs=()

if [[ -f "$target_path/solution/src/lib.rs" && -d "$target_path/tests" ]]; then
  lesson_dirs+=("$target_path")
else
  while IFS= read -r -d '' solution_file; do
    lesson_dir="${solution_file%/solution/src/lib.rs}"
    if [[ -f "$lesson_dir/solution/src/lib.rs" && -d "$lesson_dir/tests" ]]; then
      lesson_dirs+=("$lesson_dir")
    fi
  done < <(
    find "$target_path" -type f -path '*/solution/src/lib.rs' -print0 |
      sort -z
  )
fi

if [[ "${#lesson_dirs[@]}" -eq 0 ]]; then
  echo "No lesson solution/test pairs found under: $target_path" >&2
  exit 65
fi

for lesson_dir in "${lesson_dirs[@]}"; do
  rel_path="${lesson_dir#"$repo_root"/}"
  crate_dir="$tmp_dir/${rel_path//\//__}"
  dependency_set="$(dependency_set_for_lesson "$lesson_dir/lesson.json")"

  cargo new --lib "$crate_dir" --name rust_daily_lesson --quiet
  append_dependencies "$crate_dir" "$dependency_set"
  cp -R "$lesson_dir/solution/." "$crate_dir/"
  mkdir -p "$crate_dir/tests"
  cp -R "$lesson_dir/tests/." "$crate_dir/tests/"

  CARGO_TARGET_DIR="$tmp_dir/target" \
    cargo test --manifest-path "$crate_dir/Cargo.toml" --offline --quiet
  printf 'passed %s\n' "$rel_path"
done
