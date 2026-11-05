import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HintPanel from "../components/HintPanel";

const scrollIntoViewMock = vi.fn();

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoViewMock,
});

const hints = [
    { level: 1, body: "First hint." },
    { level: 2, body: "Second hint." },
];

afterEach(() => {
    cleanup();
    scrollIntoViewMock.mockReset();
});

describe("HintPanel", () => {
    it("scrolls to each newly revealed hint, but not on initial render", () => {
        const { rerender } = render(<HintPanel hints={hints} revealedCount={0} />);

        expect(scrollIntoViewMock).not.toHaveBeenCalled();

        rerender(<HintPanel hints={hints} revealedCount={1} />);

        expect(screen.getByText("First hint.")).toBeTruthy();
        expect(scrollIntoViewMock).toHaveBeenCalledOnce();
        expect(scrollIntoViewMock).toHaveBeenLastCalledWith({
            behavior: "smooth",
            block: "center",
        });

        rerender(<HintPanel hints={hints} revealedCount={2} />);

        expect(screen.getByText("Second hint.")).toBeTruthy();
        expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
    });
});