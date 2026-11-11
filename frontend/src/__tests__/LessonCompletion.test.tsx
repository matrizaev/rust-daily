import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Lesson } from "../types/lesson";
import { LessonCompletion } from "../components/LessonScreen";

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

const lessonProgress = {
    completedNow: true,
    completion: null,
} as ReturnType<typeof import("../components/lesson/useLessonProgress").useLessonProgress>;

afterEach(cleanup);

describe("LessonCompletion", () => {
    it("shows Playground success and explanation without a stored completion", () => {
        render(
            <LessonCompletion
                isPlayground
                lesson={lesson}
                lessonProgress={lessonProgress}
                onReturnHome={vi.fn()}
            />,
        );

        expect(screen.getByRole("heading", { name: "Checks passed" })).toBeTruthy();
        expect(screen.getByText(lesson.completionExplanation)).toBeTruthy();
        expect(screen.queryByText(/Completed on/)).toBeNull();
    });

    it("does not show an incomplete curriculum lesson", () => {
        render(
            <LessonCompletion
                isPlayground={false}
                lesson={lesson}
                lessonProgress={{
                    ...lessonProgress,
                    completedNow: false,
                }}
                onReturnHome={vi.fn()}
            />,
        );

        expect(screen.queryByText(lesson.completionExplanation)).toBeNull();
    });
});