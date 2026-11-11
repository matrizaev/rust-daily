import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Lesson } from "../types/lesson";
import type { ProgressStore } from "../types/progress";
import {
    ensureLessonAttempt,
    recordHintReveal,
    recordLessonCompletion,
    recordValidationAttempt,
} from "../progress/progressStore";
import { useLessonProgress } from "../components/lesson/useLessonProgress";

vi.mock("../progress/progressStore", () => ({
    ensureLessonAttempt: vi.fn(),
    PROGRESS_STORAGE_EVENT: "test-progress-storage",
    recordHintReveal: vi.fn(),
    recordLessonCompletion: vi.fn(),
    recordValidationAttempt: vi.fn(),
}));

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

afterEach(() => vi.clearAllMocks());

describe("useLessonProgress in Playground mode", () => {
    it("keeps completion local without writing curriculum progress", () => {
        const onProgressChange = vi.fn();
        const { result } = renderHook(() =>
            useLessonProgress({
                concept: null,
                lesson,
                onProgressChange,
                progress: {} as ProgressStore,
                recordProgress: false,
                revealedHints: 1,
            }),
        );

        act(() => {
            result.current.recordValidation();
            result.current.recordCompletion();
        });

        expect(result.current.completedNow).toBe(true);
        expect(result.current.completion).toBeNull();
        expect(ensureLessonAttempt).not.toHaveBeenCalled();
        expect(recordHintReveal).not.toHaveBeenCalled();
        expect(recordValidationAttempt).not.toHaveBeenCalled();
        expect(recordLessonCompletion).not.toHaveBeenCalled();
        expect(onProgressChange).not.toHaveBeenCalled();
    });
});