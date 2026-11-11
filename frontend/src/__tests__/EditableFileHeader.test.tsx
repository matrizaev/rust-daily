import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditableFileHeader } from "../components/EditableFileHeader";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("EditableFileHeader", () => {
  it("copies current editor contents and announces success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<EditableFileHeader filePath="src/lib.rs" content="fn answer() {}" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy editor contents" }));

    expect(writeText).toHaveBeenCalledWith("fn answer() {}");
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("Editor contents copied.");
      expect(
        screen.getByRole("button", { name: "Editor contents copied" }),
      ).toBeTruthy();
    });
  });

  it("announces when copying fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard unavailable"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<EditableFileHeader filePath="src/lib.rs" content="fn answer() {}" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy editor contents" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "Could not copy editor contents.",
      );
    });
  });
});
