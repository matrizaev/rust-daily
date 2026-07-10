#!/usr/bin/env python3
"""Tiny client for trying the local Rust Daily backend."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request


LESSON_TEST = """#[test]
fn answer_is_42() {
    assert_eq!(rust_daily_lesson::answer(), 42);
}
"""

SOURCES = {
    "pass": "pub fn answer() -> u64 { 42 }\n",
    "fail": "pub fn answer() -> u64 { 41 }\n",
    "compile-error": "pub fn answer() -> u64 { missing_value }\n",
    "timeout": "pub fn answer() -> u64 { loop {} }\n",
}

MULTI_FILE_PAYLOAD = {
    "files": [
        {"path": "src/lib.rs", "content": "pub mod domain;\n"},
        {"path": "src/domain.rs", "content": "pub fn answer() -> u64 { 42 }\n"},
        {
            "path": "tests/domain_contract.rs",
            "content": """#[test]
fn answer_is_42() {
    assert_eq!(rust_daily_lesson::domain::answer(), 42);
}
""",
        },
    ]
}

COMPILE_FAIL_TEST = """#[test]
fn user_id_uses_constructor() {
    let id = rust_daily_lesson::UserId::new(42);
    assert_eq!(id.value(), 42);
}
"""

COMPILE_FAIL_CASE = """use rust_daily_lesson::UserId;

#[test]
fn cannot_construct_user_id_directly() {
    let _ = UserId { value: 42 };
}
"""

COMPILE_FAIL_WRONG_DIAGNOSTIC_CASE = """#[test]
fn missing_symbol_fails_for_wrong_reason() {
    let _ = MissingType;
}
"""

COMPILE_FAIL_PRIVATE_LIB = """pub struct UserId {
    value: u64,
}

impl UserId {
    pub fn new(value: u64) -> Self {
        Self { value }
    }

    pub fn value(&self) -> u64 {
        self.value
    }
}
"""

COMPILE_FAIL_PUBLIC_LIB = """pub struct UserId {
    pub value: u64,
}

impl UserId {
    pub fn new(value: u64) -> Self {
        Self { value }
    }

    pub fn value(&self) -> u64 {
        self.value
    }
}
"""

EXPECTED_STATUSES = {
    "pass": "passed",
    "fail": "failed",
    "compile-error": "compile_error",
    "timeout": "timed_out",
    "multi-file-pass": "passed",
    "compile-fail-pass": "passed",
    "compile-fail-unexpected-pass": "failed",
    "compile-fail-wrong-diagnostic": "failed",
}


def build_payload(source: str) -> dict[str, object]:
    return {
        "files": [
            {"path": "src/lib.rs", "content": source},
            {"path": "tests/lesson.rs", "content": LESSON_TEST},
        ]
    }


def build_compile_fail_payload(
    source: str,
    case_content: str,
    expected_diagnostics: list[str] | None = None,
) -> dict[str, object]:
    return {
        "mode": "compile-fail",
        "files": [
            {"path": "src/lib.rs", "content": source},
            {"path": "tests/public.rs", "content": COMPILE_FAIL_TEST},
        ],
        "compileFailCases": [
            {
                "name": "private-field-construction",
                "path": "compile_fail/private_field_construction.rs",
                "content": case_content,
                "expectedDiagnostics": expected_diagnostics
                or ["field `value` of struct `UserId` is private"],
            }
        ],
    }


def payload_for_case(case: str) -> dict[str, object]:
    if case == "multi-file-pass":
        return MULTI_FILE_PAYLOAD
    if case == "compile-fail-pass":
        return build_compile_fail_payload(COMPILE_FAIL_PRIVATE_LIB, COMPILE_FAIL_CASE)
    if case == "compile-fail-unexpected-pass":
        return build_compile_fail_payload(COMPILE_FAIL_PUBLIC_LIB, COMPILE_FAIL_CASE)
    if case == "compile-fail-wrong-diagnostic":
        return build_compile_fail_payload(
            COMPILE_FAIL_PRIVATE_LIB,
            COMPILE_FAIL_WRONG_DIAGNOSTIC_CASE,
        )

    return build_payload(SOURCES[case])


def post_run(url: str, payload: dict[str, object], timeout: float) -> tuple[int, str]:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url.rstrip("/") + "/run",
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "rust-daily-smoke/1.0",
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.status, response.read().decode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="POST a sample run to the backend")
    parser.add_argument("--url", default="http://127.0.0.1:8080")
    parser.add_argument(
        "--case",
        choices=sorted(EXPECTED_STATUSES),
        default="pass",
    )
    parser.add_argument("--http-timeout", type=float, default=20.0)
    args = parser.parse_args()

    payload = payload_for_case(args.case)

    try:
        status, body = post_run(args.url, payload, args.http_timeout)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(f"HTTP {error.code}")
        print(body)
        return 1
    except urllib.error.URLError as error:
        print(f"Request failed: {error}", file=sys.stderr)
        return 1

    print(f"HTTP {status}")
    try:
        payload = json.loads(body)
        print(json.dumps(payload, indent=2))
    except json.JSONDecodeError:
        print(body)
        return 1

    expected_status = EXPECTED_STATUSES[args.case]
    actual_status = payload.get("status")

    if actual_status != expected_status:
        print(
            f"Expected runner status {expected_status}, got {actual_status}",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
