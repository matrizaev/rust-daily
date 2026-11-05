import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ValidationPanel, {
    type ValidationPanelState,
} from "../components/ValidationPanel";

const scrollIntoViewMock = vi.fn();

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoViewMock,
});

const resultState = (
    status: "passed" | "failed" | "compile_error" | "timeout" | "internal_error",
): ValidationPanelState => ({
    kind: "result",
    stale: false,
    result: {
        status,
        durationMs: 1,
        summary: status === "passed" ? "All checks passed." : "Needs changes.",
        diagnostics: "",
        failures: status === "passed" ? [] : [{ name: "check", message: "Fix this issue." }],
    },
});

afterEach(() => {
    cleanup();
    scrollIntoViewMock.mockReset();
});

describe("ValidationPanel", () => {
    it.each(["failed", "compile_error", "timeout", "internal_error"] as const)(
        "scrolls the %s result into view",
        (status) => {
            render(<ValidationPanel state={resultState(status)} />);

            expect(screen.getByText("Fix this issue.")).toBeTruthy();
            expect(scrollIntoViewMock).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "center",
            });
        },
    );

    it("does not scroll a successful result into view", () => {
        render(<ValidationPanel state={resultState("passed")} />);

        expect(screen.getByText("All checks passed.")).toBeTruthy();
        expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });
});