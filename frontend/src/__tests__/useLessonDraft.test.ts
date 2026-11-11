import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Lesson } from "../types/lesson";
import { readDraft, saveDraft } from "../storage/draftStore";
import { useLessonDraft } from "../components/lesson/useLessonDraft";

const lesson: Lesson = {
    schemaVersion: 2,
    id: "same-shared-id",
    arcId: "playground",
    arcTitle: "Playground",
    order: 1,
    day: 1,
    arcLength: 1,
    title: "Create a score type",
    conceptId: "newtypes",
    difficulty: "easy",
    estimatedMinutes: 5,
    scenario: "A game needs a dedicated score type.",
    instructions: "Add the score type.",
    starterCode: "pub struct Score(pub u32);\n",
    files: [{
        path: "src/lib.rs",
        role: "editable",
        content: "pub struct Score(pub u32);\n",
    }],
    hints: [{ level: 1, body: "Use a tuple struct." }],
    completionExplanation: "The score now has a distinct type.",
    validation: { mode: "self-check" },
};

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe("useLessonDraft with a Playground draft identity", () => {
    it("restores and resets only the draft for the selected payload", () => {
        saveDraft("playground:payload-a", "draft A");
        saveDraft("playground:payload-b", "draft B");

        const { result, rerender } = renderHook(
            ({ draftId }) => useLessonDraft(lesson, draftId),
            { initialProps: { draftId: "playground:payload-a" } },
        );

        expect(result.current.code).toBe("draft A");

        act(() => rerender({ draftId: "playground:payload-b" }));
        expect(result.current.code).toBe("draft B");

        act(() => result.current.handleReset());

        expect(readDraft("playground:payload-a")).toMatchObject({
            ok: true,
            record: { code: "draft A" },
        });
        expect(readDraft("playground:payload-b")).toMatchObject({
            ok: true,
            record: null,
        });
    });
});