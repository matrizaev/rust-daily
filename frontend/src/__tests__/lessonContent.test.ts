import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLessonIndex,
  loadLesson,
} from "../content/lessonContent";

const detailResponse = (lessonId: string, schemaVersion: 1 | 2) => ({
  id: lessonId,
  schemaVersion,
  detail: {
    instructions: "Implement the lesson.",
    starterCode: "pub fn answer() {}\n",
    files: [
      {
        path: "src/lib.rs",
        role: "editable",
        content: "pub fn answer() {}\n",
      },
    ],
    hints: [{ level: 1, body: "Start small." }],
    completionExplanation: "Complete.",
    validation: { mode: "self-check" },
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runtime lesson details", () => {
  it("accepts an exact detail DTO and preserves index identity", async () => {
    const lesson = getLessonIndex()[0];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(detailResponse(lesson.id, lesson.schemaVersion))),
    ));

    await expect(loadLesson(lesson.id)).resolves.toMatchObject({
      id: lesson.id,
      title: lesson.title,
      instructions: "Implement the lesson.",
    });
  });

  it("rejects unknown detail fields and malformed validation DTOs", async () => {
    const lesson = getLessonIndex()[1];
    const response = detailResponse(lesson.id, lesson.schemaVersion);
    const invalid = {
      ...response,
      detail: {
        ...response.detail,
        unexpectedIdentityOverride: "bad",
        validation: { mode: "backend-cargo-test", timeoutMs: 10, unexpected: true },
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(invalid)),
    ));

    await expect(loadLesson(lesson.id)).rejects.toThrow(
      `Invalid lesson detail schema for ${lesson.id}.`,
    );
  });
});
