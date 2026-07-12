import { afterEach, describe, expect, it, vi } from "vitest";
import { runBackendValidation } from "../validation/backendValidation";
import type { ValidationRequest } from "../types/validation";

const backendResult = (
  body: Record<string, unknown>,
  init: ResponseInit = {},
) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const cargoRequest = (
  validation: ValidationRequest["validation"] = {
    mode: "backend-cargo-test",
    timeoutMs: 1000,
    dependencySet: "std",
    testCode: "#[test]\nfn code_compiles() {}\n",
  },
): ValidationRequest => ({
  lessonId: "lesson-1",
  validation,
  files: {
    "src/lib.rs": "pub fn answer() -> u8 { 42 }\n",
  },
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("runBackendValidation", () => {
  it("maps passed cargo-test responses and sends normalized files", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      backendResult({
        status: "passed",
        stdout:
          '{"reason":"compiler-message","message":{"rendered":"\\u001b[31mchecked\\u001b[0m"}}\nplain stdout',
        stderr: "",
        duration_ms: 12.4,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runBackendValidation(cargoRequest(), "http://runner/");

    expect(result.status).toBe("passed");
    expect(result.summary).toBe("All Rust tests passed.");
    expect(result.durationMs).toBe(12);
    expect(result.diagnostics).toContain("checked");
    expect(result.diagnostics).toContain("plain stdout");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0][0]).toBe("http://runner/run");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      mode: "cargo-test",
      dependencySet: "std",
      files: [
        { path: "src/lib.rs" },
        { path: "tests/lesson.rs", content: "#[test]\nfn code_compiles() {}\n" },
      ],
    });
  });

  it("does not duplicate explicit test files", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      backendResult({
        status: "passed",
        stdout: "",
        stderr: "",
        duration_ms: 1,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await runBackendValidation(
      {
        ...cargoRequest(),
        files: {
          "tests/lesson.rs": "#[test]\nfn explicit_test() {}\n",
          "src/lib.rs": "pub fn answer() -> u8 { 42 }\n",
        },
      },
      "http://runner",
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      files: Array<{ path: string }>;
    };

    expect(body.files.map((file) => file.path)).toEqual([
      "src/lib.rs",
      "tests/lesson.rs",
    ]);
  });

  it("maps compile-fail failures with user-facing failure text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      backendResult({
        status: "failed",
        stdout: "",
        stderr: "case did not fail",
        duration_ms: 5,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runBackendValidation(
      cargoRequest({
        mode: "backend-compile-fail",
        timeoutMs: 1000,
        dependencySet: "advanced",
        cases: [
          {
            name: "private fields",
            path: "tests/ui/private.rs",
            content: "fn main() {}",
            expectedDiagnostics: ["private field"],
          },
        ],
      }),
      "http://runner",
    );

    expect(result.status).toBe("failed");
    expect(result.summary).toBe("Compile-fail checks failed.");
    expect(result.failures).toEqual([
      {
        name: "compile-fail checks",
        message: "At least one compile-fail case did not fail as expected.",
      },
    ]);
  });

  it("maps backend HTTP errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("too large", { status: 413 }))
      .mockResolvedValueOnce(new Response("busy", { status: 429 }))
      .mockResolvedValueOnce(new Response("broken", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(runBackendValidation(cargoRequest(), "http://runner")).resolves
      .toMatchObject({
        status: "failed",
        summary: "This lesson payload is too large for the Rust runner.",
      });
    await expect(runBackendValidation(cargoRequest(), "http://runner")).resolves
      .toMatchObject({
        status: "unsupported",
        summary: "The Rust runner is busy. Try again shortly.",
      });
    await expect(runBackendValidation(cargoRequest(), "http://runner")).resolves
      .toMatchObject({
        status: "unsupported",
        summary: "The Rust runner could not complete this check. Try again shortly.",
      });
  });

  it("uses only service-unavailable correlation IDs from error bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "service_unavailable",
            error: "do not show this operational detail",
            details: { correlation_id: "3db63dd2-7e7a-4cb6-ae5d-bdf7df13ca89" },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(runBackendValidation(cargoRequest(), "http://runner")).resolves
      .toMatchObject({
        status: "unsupported",
        summary:
          "The Rust runner is temporarily unavailable. Try again shortly. Reference: 3db63dd2-7e7a-4cb6-ae5d-bdf7df13ca89.",
        diagnostics: "",
      });
  });

  it("does not render arbitrary correlation text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "service_unavailable",
            details: { correlation_id: "database connection failed at /secret" },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(runBackendValidation(cargoRequest(), "http://runner")).resolves
      .toMatchObject({
        status: "unsupported",
        summary: "The Rust runner is temporarily unavailable. Try again shortly.",
        diagnostics: "",
      });
  });

  it("handles invalid requests, invalid payloads, and unavailable backend", async () => {
    await expect(
      runBackendValidation(
        cargoRequest({ mode: "self-check" }),
        "http://runner",
      ),
    ).resolves.toMatchObject({ status: "unsupported" });

    await expect(runBackendValidation(cargoRequest(), "")).resolves.toMatchObject({
      status: "unsupported",
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{")));
    await expect(runBackendValidation(cargoRequest(), "http://runner")).resolves
      .toMatchObject({
        status: "unsupported",
        summary: "The Rust runner returned an invalid response.",
      });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(runBackendValidation(cargoRequest(), "http://runner")).resolves
      .toMatchObject({
        status: "unsupported",
        summary: "The Rust runner is unavailable. Try again shortly.",
      });
  });
});
