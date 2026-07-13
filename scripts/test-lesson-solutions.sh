#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/test-lesson-solutions.sh [options] [arc-or-lesson-path]

Runs lesson solutions against public tests in temporary Cargo crates.

Options:
  --changed          Run lessons changed against --base.
  --base <ref>       Base ref for --changed. Default: origin/main.
  --jobs <n>         Number of lessons to run in parallel. Default: 1.
  --list             List selected lesson directories and exit.
  --format text|json Output text or JSON. Default: text.
  -h, --help         Show this help.

Examples:
  scripts/test-lesson-solutions.sh parse-user
  scripts/test-lesson-solutions.sh lessons/parse-user/004-source-parse-int
  scripts/test-lesson-solutions.sh lessons
  scripts/test-lesson-solutions.sh --changed --jobs 4
USAGE
}

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
base="origin/main"
changed=false
list_only=false
format="text"
jobs_count=1
target="lessons"
target_provided=false

die_usage() {
  echo "$1" >&2
  usage >&2
  exit 64
}

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --changed)
      changed=true
      shift
      ;;
    --base)
      [[ "${2:-}" != "" && "${2:-}" != --* ]] || die_usage "--base requires a value."
      base="$2"
      shift 2
      ;;
    --jobs)
      [[ "${2:-}" =~ ^[1-9][0-9]*$ ]] || die_usage "--jobs requires a positive integer."
      jobs_count="$2"
      shift 2
      ;;
    --list)
      list_only=true
      shift
      ;;
    --format)
      [[ "${2:-}" == "text" || "${2:-}" == "json" ]] || die_usage "--format must be text or json."
      format="$2"
      shift 2
      ;;
    --*)
      die_usage "Unknown option $1."
      ;;
    *)
      if [[ "$target_provided" == true ]]; then
        die_usage "Unexpected positional argument $1."
      fi
      target="$1"
      target_provided=true
      shift
      ;;
  esac
done

if [[ "$changed" == true && "$target_provided" == true ]]; then
  die_usage "--changed cannot be combined with a positional target."
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/lesson-solution-check-XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT
cargo_network_flags=()
if [[ "${LESSON_SOLUTIONS_CARGO_OFFLINE:-true}" != "false" ]]; then
  cargo_network_flags+=(--offline)
fi

target_path_for() {
  local value="$1"

  case "$value" in
    /*) printf '%s\n' "$value" ;;
    lessons|lessons/*) printf '%s\n' "$repo_root/$value" ;;
    *) printf '%s\n' "$repo_root/lessons/$value" ;;
  esac
}

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
  local cargo_target_dir="$4"
  local manifest_path="$crate_dir/compile-fail-cases.tsv"

  prepare_compile_fail_cases "$lesson_dir" "$crate_dir" "$manifest_path"

  if [[ ! -s "$manifest_path" ]]; then
    return
  fi

  while IFS=$'\t' read -r target_name case_name expected_b64 forbidden_b64; do
    set +e
    output="$(
      CARGO_TARGET_DIR="$cargo_target_dir" \
        cargo check --manifest-path "$crate_dir/Cargo.toml" "${cargo_network_flags[@]}" --test "$target_name" --message-format=json 2>&1
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

safe_rel_name() {
  printf '%s\n' "${1//\//__}"
}

run_lesson() {
  local lesson_dir="$1"
  local rel_path="${lesson_dir#"$repo_root"/}"
  local safe_name
  safe_name="$(safe_rel_name "$rel_path")"
  local crate_dir="$tmp_dir/crates/$safe_name"
  local cargo_target_dir="$tmp_dir/targets/$safe_name"
  local dependency_set
  local editable_path
  local solution_file

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

  CARGO_TARGET_DIR="$cargo_target_dir" \
    cargo test --manifest-path "$crate_dir/Cargo.toml" "${cargo_network_flags[@]}" --quiet
  run_compile_fail_cases "$lesson_dir" "$crate_dir" "$rel_path" "$cargo_target_dir"
  printf 'passed %s\n' "$rel_path"
}

resolve_lesson_dirs_for_target() {
  local value="$1"
  local target_path
  target_path="$(target_path_for "$value")"

  if [[ ! -d "$target_path" ]]; then
    echo "No such lesson target: $value" >&2
    usage >&2
    exit 64
  fi

  if [[ -f "$target_path/lesson.json" ]]; then
    printf '%s\0' "$target_path"
    return
  fi

  while IFS= read -r -d '' lesson_json; do
    lesson_dir="${lesson_json%/lesson.json}"
    if [[ -d "$lesson_dir/starter" && -d "$lesson_dir/tests" ]]; then
      printf '%s\0' "$lesson_dir"
    fi
  done < <(
    find "$target_path" -type f -name lesson.json -print0 |
      sort -z
  )
}

resolve_changed_lesson_dirs() {
  while IFS= read -r rel_path; do
    [[ -n "$rel_path" ]] || continue
    if [[ -d "$repo_root/$rel_path" ]]; then
      printf '%s\0' "$repo_root/$rel_path"
    fi
  done < <("$repo_root/scripts/curriculum/changed-lessons" --base "$base")
}

lesson_dirs=()
if [[ "$changed" == true ]]; then
  while IFS= read -r -d '' lesson_dir; do
    lesson_dirs+=("$lesson_dir")
  done < <(resolve_changed_lesson_dirs)
else
  while IFS= read -r -d '' lesson_dir; do
    lesson_dirs+=("$lesson_dir")
  done < <(resolve_lesson_dirs_for_target "$target")
fi

if [[ "${#lesson_dirs[@]}" -eq 0 ]]; then
  if [[ "$changed" == true ]]; then
    if [[ "$format" == "json" ]]; then
      node -e 'console.log(JSON.stringify({ base: process.argv[1], target: "changed", jobs: Number(process.argv[2]), lessons: [], summary: { passed: 0, failed: 0, durationMs: 0 } }, null, 2))' "$base" "$jobs_count"
    else
      echo "No changed lesson solution/test pairs found."
    fi
    exit 0
  fi

  echo "No lesson solution/test pairs found under: $(target_path_for "$target")" >&2
  exit 65
fi

if [[ "$list_only" == true ]]; then
  for lesson_dir in "${lesson_dirs[@]}"; do
    printf '%s\n' "${lesson_dir#"$repo_root"/}"
  done
  exit 0
fi

if [[ "$format" == "text" ]]; then
  printf 'Running %d lesson solution check(s) with %d job(s); logs are buffered per lesson.\n' \
    "${#lesson_dirs[@]}" "$jobs_count"
fi

mkdir -p "$tmp_dir/logs" "$tmp_dir/status" "$tmp_dir/meta" "$tmp_dir/crates" "$tmp_dir/targets"
started_ms="$(date +%s%3N)"

write_meta() {
  local lesson_dir="$1"
  local safe_name="$2"
  local started="$3"
  local status="$4"
  local duration_ms="$5"
  local rel_path="${lesson_dir#"$repo_root"/}"
  local dependency_set="unknown"

  if [[ -f "$lesson_dir/lesson.json" ]]; then
    dependency_set="$(dependency_set_for_lesson "$lesson_dir/lesson.json")"
  fi

  printf '%s\t%s\t%s\t%s\t%s\n' "$rel_path" "$dependency_set" "$status" "$duration_ms" "$started" > "$tmp_dir/meta/$safe_name.tsv"
}

run_lesson_job() {
  local lesson_dir="$1"
  local rel_path="${lesson_dir#"$repo_root"/}"
  local safe_name
  safe_name="$(safe_rel_name "$rel_path")"
  local lesson_started_ms
  lesson_started_ms="$(date +%s%3N)"

  set +e
  run_lesson "$lesson_dir" > "$tmp_dir/logs/$safe_name.log" 2>&1
  local status=$?
  set -e

  local lesson_finished_ms
  lesson_finished_ms="$(date +%s%3N)"
  local duration_ms=$((lesson_finished_ms - lesson_started_ms))

  echo "$status" > "$tmp_dir/status/$safe_name.status"
  write_meta "$lesson_dir" "$safe_name" "$lesson_started_ms" "$status" "$duration_ms"
}

throttle_jobs() {
  while [[ "$(jobs -rp | wc -l)" -ge "$jobs_count" ]]; do
    sleep 0.2
  done
}

for lesson_dir in "${lesson_dirs[@]}"; do
  throttle_jobs
  run_lesson_job "$lesson_dir" &
done

set +e
wait
set -e

finished_ms="$(date +%s%3N)"
duration_ms=$((finished_ms - started_ms))
failed=0
passed=0
first_failure=""

for lesson_dir in "${lesson_dirs[@]}"; do
  rel_path="${lesson_dir#"$repo_root"/}"
  safe_name="$(safe_rel_name "$rel_path")"
  status="$(cat "$tmp_dir/status/$safe_name.status")"

  if [[ "$status" -eq 0 ]]; then
    passed=$((passed + 1))
  else
    failed=$((failed + 1))
    if [[ -z "$first_failure" ]]; then
      first_failure="$safe_name"
    fi
  fi
done

if [[ "$format" == "json" ]]; then
  node -e '
const fs = require("fs");
const path = require("path");
const [base, target, jobs, duration, metaDir, logDir] = process.argv.slice(1);
const lessons = fs.readdirSync(metaDir)
  .filter((file) => file.endsWith(".tsv"))
  .sort()
  .map((file) => {
    const [lessonPath, dependencySet, statusCode, durationMs] = fs
      .readFileSync(path.join(metaDir, file), "utf8")
      .trim()
      .split("\t");
    const status = statusCode === "0" ? "passed" : "failed";
    const log = fs.readFileSync(path.join(logDir, file.replace(/\.tsv$/, ".log")), "utf8");
    return {
      path: lessonPath,
      status,
      dependencySet,
      durationMs: Number(durationMs),
      ...(status === "failed" ? { log } : {}),
    };
  });
const passed = lessons.filter((lesson) => lesson.status === "passed").length;
const failed = lessons.length - passed;
console.log(JSON.stringify({
  base,
  target,
  jobs: Number(jobs),
  lessons,
  summary: {
    passed,
    failed,
    durationMs: Number(duration),
  },
}, null, 2));
' "$base" "$([[ "$changed" == true ]] && printf 'changed' || printf '%s' "$target")" "$jobs_count" "$duration_ms" "$tmp_dir/meta" "$tmp_dir/logs"
else
  for lesson_dir in "${lesson_dirs[@]}"; do
    rel_path="${lesson_dir#"$repo_root"/}"
    safe_name="$(safe_rel_name "$rel_path")"
    status="$(cat "$tmp_dir/status/$safe_name.status")"

    if [[ "$status" -eq 0 ]]; then
      cat "$tmp_dir/logs/$safe_name.log"
    fi
  done

  if [[ "$failed" -gt 0 ]]; then
    echo "First failing lesson log:" >&2
    cat "$tmp_dir/logs/$first_failure.log" >&2
  fi

  printf 'Lesson solution checks: %d passed, %d failed in %d ms.\n' "$passed" "$failed" "$duration_ms"
fi

if [[ "$failed" -gt 0 ]]; then
  exit 1
fi
