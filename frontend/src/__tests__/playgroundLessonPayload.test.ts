import { describe, expect, it } from "vitest";
import type { Lesson } from "../types/lesson";
import {
    createPlaygroundDraftId,
    decodePlaygroundLesson,
} from "../playground/lessonPayload";

const lesson: Lesson = {
    schemaVersion: 2,
    id: "shared-score",
    arcId: "playground",
    arcTitle: "Playground",
    order: 1,
    day: 1,
    arcLength: 1,
    title: "Create a score type",
    conceptId: "newtypes",
    difficulty: "easy",
    estimatedMinutes: 5,
    scenario: "La puntuación necesita un tipo propio.",
    instructions: "Add the score type.",
    starterCode: "pub struct Score(pub u32);\n",
    files: [{
        path: "src/lib.rs",
        role: "editable",
        content: "pub struct Score(pub u32);\n",
    }],
    hints: [{ level: 1, body: "Use a tuple struct." }],
    completionExplanation: "The score now has a distinct type.",
    validation: {
        mode: "structural",
        timeoutMs: 1000,
        checks: [{ type: "source_includes", requiredSnippets: ["struct Score"] }],
    },
};

const encode = (value: unknown) => {
    const jsonBytes = new TextEncoder().encode(JSON.stringify(value));
    const binary = Array.from(jsonBytes, (byte) => String.fromCharCode(byte)).join("");

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
};

describe("decodePlaygroundLesson", () => {
    it("decodes a complete public lesson payload", () => {
        expect(decodePlaygroundLesson(encode(lesson))).toMatchObject({
            ok: true,
            lesson: {
                id: "shared-score",
                scenario: "La puntuación necesita un tipo propio.",
            },
        });
    });

    it("rejects unsafe paths, multiple editable files, and unknown validation modes", () => {
        const unsafePath = {
            ...lesson,
            files: [{ ...lesson.files[0], path: "src/../Cargo.toml" }],
        };
        const unsupportedPath = {
            ...lesson,
            files: [{ ...lesson.files[0], path: "Cargo.toml" }],
        };
        const multipleEditable = {
            ...lesson,
            files: [lesson.files[0], { ...lesson.files[0], path: "src/main.rs" }],
        };
        const mismatchedStarter = {
            ...lesson,
            starterCode: "pub struct Other;\n",
        };
        const unknownValidation = {
            ...lesson,
            validation: { mode: "run-shell-command" },
        };
        const unknownStructuralCheck = {
            ...lesson,
            validation: {
                mode: "structural",
                timeoutMs: 1000,
                checks: [{ type: "toString" }],
            },
        };

        expect(decodePlaygroundLesson(encode(unsafePath)).ok).toBe(false);
        expect(decodePlaygroundLesson(encode(unsupportedPath)).ok).toBe(false);
        expect(decodePlaygroundLesson(encode(multipleEditable)).ok).toBe(false);
        expect(decodePlaygroundLesson(encode(mismatchedStarter)).ok).toBe(false);
        expect(decodePlaygroundLesson(encode(unknownValidation)).ok).toBe(false);
        expect(decodePlaygroundLesson(encode(unknownStructuralCheck)).ok).toBe(false);
    });

    it("rejects invalid and over-limit encodings", () => {
        expect(decodePlaygroundLesson("%%%")).toMatchObject({ ok: false });
        expect(decodePlaygroundLesson("A".repeat(43_692))).toMatchObject({ ok: false });
    });
});

describe("createPlaygroundDraftId", () => {
    it("returns the same identity for canonical payload JSON and separates changes", async () => {
        const first = await createPlaygroundDraftId('{"a":1,"b":2}');
        const same = await createPlaygroundDraftId('{"a":1,"b":2}');
        const changed = await createPlaygroundDraftId('{"a":1,"b":3}');

        expect(first).toBe(same);
        expect(first).not.toBe(changed);
        expect(first).toMatch(/^playground:[0-9a-f]{64}$/);
    });
});