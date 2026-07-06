#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def load_json(path: Path):
    with path.open() as handle:
        return json.load(handle)


def print_error(errors: list[str], message: str) -> None:
    print(message)
    errors.append(message)


def load_source_lessons() -> list[dict]:
    lesson_paths = sorted(ROOT.glob("lessons/*/*/lesson.json"))
    return [load_json(path) for path in lesson_paths]


def with_file_content(base_path: Path, file_record: dict) -> dict:
    normalized = {
        key: value for key, value in file_record.items() if key != "sourcePath"
    }
    source_path = file_record.get("sourcePath")
    if source_path:
        normalized["content"] = (base_path / source_path).read_text()
    return normalized


def normalize_validation(base_path: Path, validation: dict | None) -> dict | None:
    if validation is None:
        return None

    if validation.get("mode") != "all":
        return validation

    normalized_steps = []
    for step in validation.get("validations", []):
        if step.get("mode") != "backend-cargo-test":
            normalized_steps.append(step)
            continue

        normalized_step = {
            key: value for key, value in step.items() if key != "testFiles"
        }
        test_files = []
        for test_file in step.get("testFiles", []):
            normalized_test_file = {
                key: value for key, value in test_file.items() if key != "sourcePath"
            }
            source_path = test_file.get("sourcePath")
            if source_path:
                normalized_test_file["content"] = (base_path / source_path).read_text()
            test_files.append(normalized_test_file)
        normalized_step["testFiles"] = test_files
        normalized_steps.append(normalized_step)

    return {
        **validation,
        "validations": normalized_steps,
    }


def normalize_newlines(value):
    if isinstance(value, str):
        return value.replace("\r\n", "\n")
    if isinstance(value, list):
        return [normalize_newlines(item) for item in value]
    if isinstance(value, dict):
        return {
            key: normalize_newlines(item)
            for key, item in value.items()
        }
    return value


def source_lesson_dir(lesson: dict) -> Path:
    matches = list(ROOT.glob(f'lessons/*/*/lesson.json'))
    for path in matches:
        if load_json(path).get("id") == lesson["id"]:
            return path.parent
    raise FileNotFoundError(f'Could not find source directory for lesson "{lesson["id"]}"')


def normalize_source_lesson_for_frontend(lesson: dict) -> dict:
    lesson_dir = source_lesson_dir(lesson)
    normalized = {key: value for key, value in lesson.items() if key != "author"}
    normalized["files"] = [
        with_file_content(lesson_dir, file_record)
        for file_record in lesson.get("files", [])
    ]
    normalized["validation"] = normalize_validation(
        lesson_dir,
        lesson.get("validation"),
    )
    return normalized


def main() -> int:
    arcs = load_json(ROOT / "lessons/arcs.json")
    concepts = load_json(ROOT / "lessons/concepts.json")
    source_lessons = load_source_lessons()
    frontend_lessons = load_json(ROOT / "frontend/src/content/lessons.json")
    frontend_concepts = load_json(ROOT / "frontend/src/content/concepts.json")

    arc_ids = {arc["id"] for arc in arcs}
    source_concept_ids = {concept["id"] for concept in concepts}
    frontend_concept_ids = {concept["id"] for concept in frontend_concepts}
    known_concept_ids = source_concept_ids | frontend_concept_ids
    source_lesson_ids = {lesson["id"] for lesson in source_lessons}
    frontend_lessons_by_id = {lesson["id"]: lesson for lesson in frontend_lessons}
    errors: list[str] = []

    print("=== Concept -> Source lesson ID checks ===")
    for concept in concepts:
        for lesson_id in concept.get("lessonIds", []):
            if lesson_id not in source_lesson_ids:
                print_error(
                    errors,
                    f'  MISSING source lesson "{lesson_id}" referenced by concept "{concept["id"]}"',
                )

    print("=== Source lesson -> Concept ID checks ===")
    for lesson in source_lessons:
        concept_id = lesson.get("conceptId", "")
        if concept_id and concept_id not in source_concept_ids:
            print_error(
                errors,
                f'  MISSING source concept "{concept_id}" referenced by lesson "{lesson["id"]}"',
            )

    print("=== Source lesson -> Arc ID checks ===")
    for lesson in source_lessons:
        arc_id = lesson.get("arcId", "")
        if arc_id and arc_id not in arc_ids:
            print_error(
                errors,
                f'  MISSING arc "{arc_id}" referenced by lesson "{lesson["id"]}"',
            )

    print("=== Concept prerequisite checks ===")
    for concept in concepts:
        for prerequisite_id in concept.get("prerequisites", []):
            if prerequisite_id not in known_concept_ids:
                print_error(
                    errors,
                    f'  MISSING prerequisite concept "{prerequisite_id}" for concept "{concept["id"]}"',
                )

    print("=== Source -> frontend lesson presence checks ===")
    for lesson in source_lessons:
        if lesson["id"] not in frontend_lessons_by_id:
            print_error(
                errors,
                f'  MISSING frontend lesson "{lesson["id"]}" for source lesson sync',
            )

    print("=== Source -> frontend concept parity checks ===")
    for concept in concepts:
        if concept["id"] not in frontend_concept_ids:
            print_error(
                errors,
                f'  MISSING frontend concept "{concept["id"]}" for source concept sync',
            )

    print("=== Order number checks ===")
    for lesson in sorted(source_lessons, key=lambda item: item["order"]):
        print(
            f'  {lesson["id"]}: order={lesson["order"]}, day={lesson["day"]}, arcId={lesson["arcId"]}'
        )

    all_frontend_orders = sorted(
        lesson["order"]
        for lesson in frontend_lessons
        if isinstance(lesson.get("order"), int)
    )
    for index in range(1, len(all_frontend_orders)):
        if all_frontend_orders[index] == all_frontend_orders[index - 1]:
            print_error(
                errors,
                f"  DUPLICATE order number: {all_frontend_orders[index]}",
            )

    print("=== Duplicate ID checks ===")
    seen_lesson_ids: set[str] = set()
    for lesson in source_lessons:
        if lesson["id"] in seen_lesson_ids:
            print_error(errors, f'  DUPLICATE source lesson id: {lesson["id"]}')
        seen_lesson_ids.add(lesson["id"])

    seen_concept_ids: set[str] = set()
    for concept in concepts:
        if concept["id"] in seen_concept_ids:
            print_error(errors, f'  DUPLICATE source concept id: {concept["id"]}')
        seen_concept_ids.add(concept["id"])

    print("=== Arc orderStart vs source lesson orders ===")
    for arc in arcs:
        arc_lessons = [lesson for lesson in source_lessons if lesson.get("arcId") == arc["id"]]
        if not arc_lessons:
            continue

        min_order = min(lesson["order"] for lesson in arc_lessons)
        max_order = max(lesson["order"] for lesson in arc_lessons)
        count = len(arc_lessons)
        print(
            f'  Arc "{arc["id"]}": orderStart={arc["orderStart"]}, '
            f'targetLessonCount={arc["targetLessonCount"]}, actual count={count}, '
            f"orders={min_order}-{max_order}"
        )

        if min_order != arc["orderStart"]:
            print_error(
                errors,
                f'    MISMATCH: orderStart={arc["orderStart"]} but min order={min_order}',
            )
        if count != arc["targetLessonCount"]:
            print_error(
                errors,
                f'    MISMATCH: targetLessonCount={arc["targetLessonCount"]} but actual={count}',
            )

    print("=== Source -> frontend lesson parity checks ===")
    for source_lesson in source_lessons:
        frontend_lesson = frontend_lessons_by_id.get(source_lesson["id"])
        if frontend_lesson is None:
            continue

        normalized_source = normalize_source_lesson_for_frontend(source_lesson)
        comparable_fields = [
            "schemaVersion",
            "id",
            "arcId",
            "arcTitle",
            "order",
            "day",
            "arcLength",
            "title",
            "conceptId",
            "difficulty",
            "estimatedMinutes",
            "scenario",
            "instructions",
            "files",
            "hints",
            "completionExplanation",
            "validation",
        ]
        for field_name in comparable_fields:
            if normalize_newlines(frontend_lesson.get(field_name)) != normalize_newlines(
                normalized_source.get(field_name)
            ):
                print_error(
                    errors,
                    f'  FRONTEND MISMATCH for lesson "{source_lesson["id"]}" field "{field_name}"',
                )

        normalized_starter = ""
        for file_record in normalized_source.get("files", []):
            if file_record.get("role") == "editable":
                normalized_starter = file_record.get("content", "")
                break

        if normalize_newlines(frontend_lesson.get("starterCode")) != normalize_newlines(
            normalized_starter
        ):
            print_error(
                errors,
                f'  FRONTEND MISMATCH for lesson "{source_lesson["id"]}" field "starterCode"',
            )

    print(f"\n=== Summary: {len(errors)} error(s) found ===")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
