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

lesson_dirs=()

if [[ -f "$target_path/solution/src/lib.rs" && -d "$target_path/tests" ]]; then
  lesson_dirs+=("$target_path")
else
  while IFS= read -r -d '' lesson_dir; do
    if [[ -f "$lesson_dir/solution/src/lib.rs" && -d "$lesson_dir/tests" ]]; then
      lesson_dirs+=("$lesson_dir")
    fi
  done < <(find "$target_path" -mindepth 1 -maxdepth 1 -type d -print0 | sort -z)
fi

if [[ "${#lesson_dirs[@]}" -eq 0 ]]; then
  echo "No lesson solution/test pairs found under: $target_path" >&2
  exit 65
fi

for lesson_dir in "${lesson_dirs[@]}"; do
  rel_path="${lesson_dir#"$repo_root"/}"
  crate_dir="$tmp_dir/${rel_path//\//__}"

  cargo new --lib "$crate_dir" --name rust_daily_lesson --quiet
  cp -R "$lesson_dir/solution/." "$crate_dir/"
  mkdir -p "$crate_dir/tests"
  cp -R "$lesson_dir/tests/." "$crate_dir/tests/"

  cargo test --manifest-path "$crate_dir/Cargo.toml" --quiet
  printf 'passed %s\n' "$rel_path"
done
