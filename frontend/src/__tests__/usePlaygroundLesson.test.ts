import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AppRoute } from "../app/routes";
import { usePlaygroundLesson } from "../playground/usePlaygroundLesson";

const scratchRoute: AppRoute = {
    kind: "playground",
    encodedLesson: null,
    payloadError: null,
};

describe("usePlaygroundLesson", () => {
    it("opens the scratch workspace for a route without a shared payload", async () => {
        const { result } = renderHook(() => usePlaygroundLesson(scratchRoute));

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current).toMatchObject({
            kind: "ready",
            lesson: {
                id: "playground-scratch",
                files: [
                    { path: "src/lib.rs", role: "editable" },
                    { path: "tests/playground.rs", role: "test" },
                ],
                validation: { mode: "backend-cargo-test", dependencySet: "std" },
            },
            draftId: "playground:scratch",
            isScratch: true,
        });
    });

    it("keeps invalid shared payloads out of the scratch workspace", async () => {
        const route: AppRoute = {
            kind: "playground",
            encodedLesson: "invalid",
            payloadError: null,
        };
        const { result } = renderHook(() => usePlaygroundLesson(route));

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.kind).toBe("invalid");
    });
});