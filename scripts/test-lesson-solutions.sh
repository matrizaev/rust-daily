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

editable_path_for_lesson() {
  node -e '
const fs = require("fs");
const lesson = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const editableFiles = Array.isArray(lesson.files)
  ? lesson.files.filter((file) => file?.role === "editable")
  : [];
if (editableFiles.length !== 1 || typeof editableFiles[0].path !== "string") {
  console.error(`${process.argv[1]} must define exactly one editable file`);
  process.exit(66);
}
console.log(editableFiles[0].path);
' "$1"
}

prepare_compile_fail_cases() {
  local lesson_dir="$1"
  local crate_dir="$2"
  local manifest_path="$3"

  node -e '
const fs = require("fs");
const path = require("path");

const [lessonJsonPath, lessonDir, crateDir, manifestPath] = process.argv.slice(1);
const lesson = JSON.parse(fs.readFileSync(lessonJsonPath, "utf8"));
const validations = lesson.validation?.mode === "all"
  ? lesson.validation.validations
  : [lesson.validation];
const compileFailSteps = validations.filter((step) => step?.mode === "backend-compile-fail");
const lines = [];

fs.mkdirSync(path.join(crateDir, "tests"), { recursive: true });

for (const step of compileFailSteps) {
  for (const compileFailCase of step.cases ?? []) {
    const safeName = compileFailCase.name.replace(/-/g, "_");
    const targetName = `compile_fail_${safeName}`;
    const sourcePath = path.join(lessonDir, compileFailCase.sourcePath);
    const targetPath = path.join(crateDir, "tests", `${targetName}.rs`);
    const content = fs.readFileSync(sourcePath, "utf8");
    fs.writeFileSync(targetPath, content);
    lines.push([
      targetName,
      compileFailCase.name,
      Buffer.from(JSON.stringify(compileFailCase.expectedDiagnostics ?? [])).toString("base64"),
      Buffer.from(JSON.stringify(compileFailCase.forbiddenDiagnostics ?? [])).toString("base64"),
    ].join("\t"));
  }
}

fs.writeFileSync(manifestPath, `${lines.join("\n")}${lines.length ? "\n" : ""}`);
' "$lesson_dir/lesson.json" "$lesson_dir" "$crate_dir" "$manifest_path"
}

check_compile_fail_diagnostics() {
  local rel_path="$1"
  local case_name="$2"
  local expected_b64="$3"
  local forbidden_b64="$4"
  local output="$5"

  node -e '
const [relPath, caseName, expectedRaw, forbiddenRaw] = process.argv.slice(1);
const expected = JSON.parse(Buffer.from(expectedRaw, "base64").toString("utf8"));
const forbidden = JSON.parse(Buffer.from(forbiddenRaw, "base64").toString("utf8"));
let output = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => output += chunk);
process.stdin.on("end", () => {
  const missing = expected.filter((snippet) => !output.includes(snippet));
  const forbiddenHits = forbidden.filter((snippet) => output.includes(snippet));

  if (missing.length > 0 || forbiddenHits.length > 0) {
    if (missing.length > 0) {
      console.error(`${relPath} compile-fail case ${caseName} missing diagnostics: ${missing.join(", ")}`);
    }
    if (forbiddenHits.length > 0) {
      console.error(`${relPath} compile-fail case ${caseName} included forbidden diagnostics: ${forbiddenHits.join(", ")}`);
    }
    process.exit(1);
  }
});
' "$rel_path" "$case_name" "$expected_b64" "$forbidden_b64" <<< "$output"
}

run_compile_fail_cases() {
  local lesson_dir="$1"
  local crate_dir="$2"
  local rel_path="$3"
  local manifest_path="$crate_dir/compile-fail-cases.tsv"

  prepare_compile_fail_cases "$lesson_dir" "$crate_dir" "$manifest_path"

  if [[ ! -s "$manifest_path" ]]; then
    return
  fi

  while IFS=$'\t' read -r target_name case_name expected_b64 forbidden_b64; do
    set +e
    output="$(
      CARGO_TARGET_DIR="$tmp_dir/target" \
        cargo check --manifest-path "$crate_dir/Cargo.toml" --offline --test "$target_name" --message-format=json 2>&1
    )"
    status=$?
    set -e

    if [[ "$status" -eq 0 ]]; then
      echo "$rel_path compile-fail case $case_name compiled successfully; expected failure" >&2
      exit 1
    fi

    check_compile_fail_diagnostics "$rel_path" "$case_name" "$expected_b64" "$forbidden_b64" "$output"
    printf 'passed %s compile-fail %s\n' "$rel_path" "$case_name"
  done < "$manifest_path"
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

if [[ -f "$target_path/lesson.json" ]]; then
  lesson_dirs+=("$target_path")
else
  while IFS= read -r -d '' lesson_json; do
    lesson_dir="${lesson_json%/lesson.json}"
    if [[ -d "$lesson_dir/starter" && -d "$lesson_dir/tests" ]]; then
      lesson_dirs+=("$lesson_dir")
    fi
  done < <(
    find "$target_path" -type f -name lesson.json -print0 |
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
  editable_path="$(editable_path_for_lesson "$lesson_dir/lesson.json")"
  solution_file="$lesson_dir/solution/$editable_path"

  if [[ ! -f "$solution_file" ]]; then
    echo "Missing solution file for $rel_path editable path: $editable_path" >&2
    exit 66
  fi

  cargo new --lib "$crate_dir" --name rust_daily_lesson --quiet
  append_dependencies "$crate_dir" "$dependency_set"
  cp -R "$lesson_dir/starter/." "$crate_dir/"
  mkdir -p "$(dirname "$crate_dir/$editable_path")"
  cp "$solution_file" "$crate_dir/$editable_path"
  mkdir -p "$crate_dir/tests"
  cp -R "$lesson_dir/tests/." "$crate_dir/tests/"

  CARGO_TARGET_DIR="$tmp_dir/target" \
    cargo test --manifest-path "$crate_dir/Cargo.toml" --offline --quiet
  run_compile_fail_cases "$lesson_dir" "$crate_dir" "$rel_path"
  printf 'passed %s\n' "$rel_path"
done
