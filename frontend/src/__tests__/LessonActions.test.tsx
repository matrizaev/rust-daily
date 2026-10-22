import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LessonActions from "../components/LessonActions";
import type { ValidationStatus } from "../types/validation";

const renderLessonActions = (
  checkStatus: ValidationStatus | null,
  nextLessonId: string | null = "next-lesson-002",
  onOpenLesson = vi.fn(),
) => {
  render(
    <LessonActions
      canCheck
      canRevealHint
      checkStatus={checkStatus}
      isChecking={false}
      nextLessonId={nextLessonId}
      onCheck={() => undefined}
      onOpenLesson={onOpenLesson}
      onReset={() => undefined}
      onRevealHint={() => undefined}
    />,
  );

  return onOpenLesson;
};

afterEach(() => {
  cleanup();
});

describe("LessonActions", () => {
  it.each(["passed", "self_check"] as const)(
    "shows next lesson navigation after %s check",
    (checkStatus) => {
      const onOpenLesson = renderLessonActions(checkStatus);

      fireEvent.click(screen.getByRole("button", { name: "Go to next lesson" }));

      expect(onOpenLesson).toHaveBeenCalledWith("next-lesson-002");
    },
  );

  it.each([null, "failed"] as const)(
    "hides next lesson navigation when check status is %s",
    (checkStatus) => {
      renderLessonActions(checkStatus);

      expect(
        screen.queryByRole("button", { name: "Go to next lesson" }),
      ).toBeNull();
    },
  );

  it("hides next lesson navigation when no lesson follows", () => {
    renderLessonActions("passed", null);

    expect(
      screen.queryByRole("button", { name: "Go to next lesson" }),
    ).toBeNull();
  });
});
