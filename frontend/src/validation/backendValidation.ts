import type {
  LessonValidationStep,
  ValidationFailure,
  ValidationRequest,
  ValidationResult,
  ValidationStatus,
} from "../types/validation";

const DIAGNOSTICS_LIMIT = 4096;
const SUMMARY_LIMIT = 240;
const FAILURE_LIMIT = 20;

type BackendRunStatus =
  | "passed"
  | "failed"
  | "compile_error"
  | "timed_out"
  | "internal_error";

type BackendRunResult = {
  status: BackendRunStatus;
  stdout: string;
  stderr: string;
  duration_ms: number;
};

type BackendRunRequest = {
  dependencySet: string;
  files: Array<{
    path: "src/lib.rs" | "tests/lesson.rs";
    content: string;
  }>;
};

type BackendValidationRequest = ValidationRequest & {
  validation: Extract<LessonValidationStep, { mode: "backend-cargo-test" }>;
};

type CargoCompilerMessage = {
  reason: "compiler-message";
  message?: {
    rendered?: string;
    message?: string;
  };
};

const BACKEND_STATUSES = new Set<string>([
  "passed",
  "failed",
  "compile_error",
  "timed_out",
  "internal_error",
]);

const truncateText = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const durationSince = (startedAt: number) =>
  Math.max(0, Math.round(performance.now() - startedAt));

const limitFailures = (failures: ValidationFailure[]) =>
  failures.slice(0, FAILURE_LIMIT);

const result = (
  status: ValidationStatus,
  startedAt: number,
  summary: string,
  diagnostics = "",
  failures: ValidationFailure[] = [],
  durationMs = durationSince(startedAt),
): ValidationResult => ({
  status,
  durationMs,
  summary: truncateText(summary, SUMMARY_LIMIT),
  diagnostics: truncateText(diagnostics, DIAGNOSTICS_LIMIT),
  failures: limitFailures(failures),
});

const buildRunUrl = (backendUrl: string) =>
  `${backendUrl.trim().replace(/\/+$/, "")}/run`;

const joinTestFiles = (files: Array<{ path: string; content: string }>) =>
  files
    .map((file) => `// ${file.path}\n${file.content}`)
    .join("\n\n");

const requestTestFiles = (request: BackendValidationRequest) =>
  Object.entries(request.files)
    .filter(([path]) => path.startsWith("tests/"))
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([path, content]) => ({ path, content }));

const testCodeFromRequest = (
  request: BackendValidationRequest,
) => {
  const { validation } = request;

  if (typeof validation.testCode === "string") {
    return validation.testCode;
  }

  if (validation.testFiles?.length) {
    return joinTestFiles(validation.testFiles);
  }

  return joinTestFiles(requestTestFiles(request));
};

const buildRunRequest = (
  request: BackendValidationRequest,
): BackendRunRequest => ({
  dependencySet: request.validation.dependencySet ?? "std",
  files: [
    {
      path: "src/lib.rs",
      content: request.files["src/lib.rs"] ?? "",
    },
    {
      path: "tests/lesson.rs",
      content: testCodeFromRequest(request),
    },
  ],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasBackendRunStatus = (value: Record<string, unknown>) =>
  typeof value.status === "string" && BACKEND_STATUSES.has(value.status);

const hasBackendRunStreams = (value: Record<string, unknown>) =>
  typeof value.stdout === "string" && typeof value.stderr === "string";

const hasBackendRunDuration = (value: Record<string, unknown>) =>
  typeof value.duration_ms === "number" && Number.isFinite(value.duration_ms);

const isBackendRunResult = (value: unknown): value is BackendRunResult =>
  isRecord(value) &&
  hasBackendRunStatus(value) &&
  hasBackendRunStreams(value) &&
  hasBackendRunDuration(value);

const stripAnsi = (value: string) =>
  value.replace(/\u001b\[[0-9;]*m/g, "");

const parseJsonRecord = (value: string) => {
  try {
    const parsed = JSON.parse(value) as unknown;

    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const isCargoMessage = (value: Record<string, unknown>) =>
  typeof value.reason === "string";

const looksLikeCargoMessageLine = (value: string) =>
  value.trimStart().startsWith('{"reason":');

const isCargoCompilerMessage = (
  value: Record<string, unknown>,
): value is CargoCompilerMessage =>
  value.reason === "compiler-message" &&
  ("message" in value ? isRecord(value.message) : true);

const compilerMessageText = (value: CargoCompilerMessage) => {
  const message = value.message;

  if (!message) {
    return "";
  }

  return typeof message.rendered === "string"
    ? message.rendered
    : typeof message.message === "string"
      ? message.message
      : "";
};

const compilerDiagnosticsFromStream = (stream: string) =>
  stream
    .split(/\r?\n/)
    .map(parseJsonRecord)
    .filter((line): line is CargoCompilerMessage =>
      line !== null && isCargoCompilerMessage(line),
    )
    .map(compilerMessageText)
    .map(stripAnsi)
    .map((message) => message.trim())
    .filter(Boolean);

const plainOutputFromStream = (stream: string) =>
  stream
    .split(/\r?\n/)
    .filter((line) => {
      const parsed = parseJsonRecord(line);

      if (parsed === null) {
        return !looksLikeCargoMessageLine(line);
      }

      return !isCargoMessage(parsed);
    })
    .join("\n")
    .trim();

const namedOutputBlock = (name: string, output: string) =>
  output ? `${name}:\n${stripAnsi(output)}` : "";

const diagnosticsFromStreams = (stdout: string, stderr: string) => {
  const compilerDiagnostics = [
    ...compilerDiagnosticsFromStream(stdout),
    ...compilerDiagnosticsFromStream(stderr),
  ];

  const compilerBlock = compilerDiagnostics.length
    ? `Compiler diagnostics:\n${compilerDiagnostics.join("\n\n")}`
    : "";

  return [
    compilerBlock,
    namedOutputBlock("stdout", plainOutputFromStream(stdout)),
    namedOutputBlock("stderr", plainOutputFromStream(stderr)),
  ]
    .filter(Boolean)
    .join("\n\n");
};

const statusSummary = (status: BackendRunStatus) => {
  const summaries: Record<BackendRunStatus, string> = {
    passed: "All Rust tests passed.",
    failed: "Rust tests failed.",
    compile_error: "The Rust code did not compile.",
    timed_out: "The Rust runner timed out.",
    internal_error: "The Rust runner failed internally.",
  };

  return summaries[status];
};

const failureForStatus = (status: BackendRunStatus): ValidationFailure[] => {
  if (status === "passed") {
    return [];
  }

  const messages: Record<Exclude<BackendRunStatus, "passed">, string> = {
    failed: "At least one public Rust test failed.",
    compile_error: "Fix the compile error before running the tests again.",
    timed_out: "The runner stopped this check after the lesson timeout.",
    internal_error: "The runner could not complete this check.",
  };

  return [
    {
      name: "cargo test",
      message: messages[status],
    },
  ];
};

const mapBackendStatus = (status: BackendRunStatus): ValidationStatus =>
  status === "timed_out" ? "timeout" : status;

const resultFromBackend = (
  response: BackendRunResult,
  startedAt: number,
): ValidationResult =>
  result(
    mapBackendStatus(response.status),
    startedAt,
    statusSummary(response.status),
    diagnosticsFromStreams(response.stdout, response.stderr),
    failureForStatus(response.status),
    Math.max(0, Math.round(response.duration_ms)),
  );

const readErrorDiagnostics = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return "";
  }
};

const resultFromHttpError = async (
  response: Response,
  startedAt: number,
): Promise<ValidationResult> => {
  const diagnostics = await readErrorDiagnostics(response);

  if (response.status === 413) {
    return result(
      "failed",
      startedAt,
      "This lesson payload is too large for the Rust runner.",
      diagnostics,
      [
        {
          name: "runner payload",
          message:
            "The editable code or public test file exceeds the runner size limit.",
        },
      ],
    );
  }

  if (response.status === 429) {
    return result(
      "unsupported",
      startedAt,
      "The Rust runner is busy. Try again shortly.",
      diagnostics,
    );
  }

  return result(
    "internal_error",
    startedAt,
    `The Rust runner returned HTTP ${response.status}.`,
    diagnostics,
  );
};

const invalidBackendResponseResult = (startedAt: number) =>
  result(
    "internal_error",
    startedAt,
    "The Rust runner returned an invalid response.",
  );

const timeoutResult = (startedAt: number) =>
  result(
    "timeout",
    startedAt,
    "The Rust runner did not respond before the check timeout.",
  );

const unavailableResult = (startedAt: number) =>
  result(
    "unsupported",
    startedAt,
    "The Rust runner could not be reached. Check the configured backend URL and CORS setting.",
  );

const isBackendValidationRequest = (
  request: ValidationRequest,
): request is BackendValidationRequest =>
  request.validation.mode === "backend-cargo-test";

const hasBackendUrl = (backendUrl: string) => backendUrl.trim().length > 0;

const parseBackendPayload = async (
  response: Response,
  startedAt: number,
) => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return invalidBackendResponseResult(startedAt);
  }
};

const resultFromOkResponse = async (
  response: Response,
  startedAt: number,
) => {
  const payload = await parseBackendPayload(response, startedAt);

  return isBackendRunResult(payload)
    ? resultFromBackend(payload, startedAt)
    : invalidBackendResponseResult(startedAt);
};

const resultFromResponse = (response: Response, startedAt: number) =>
  response.ok
    ? resultFromOkResponse(response, startedAt)
    : resultFromHttpError(response, startedAt);

const fetchBackendRun = (
  request: BackendValidationRequest,
  backendUrl: string,
  signal: AbortSignal,
) =>
  fetch(buildRunUrl(backendUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildRunRequest(request)),
    signal,
  });

const createBackendTimeout = (timeoutMs: number) => {
  const controller = new AbortController();
  let didTimeout = false;
  const timer = window.setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  return {
    didTimeout: () => didTimeout,
    signal: controller.signal,
    clear: () => window.clearTimeout(timer),
  };
};

const resultFromFetchError = (
  error: unknown,
  didTimeout: boolean,
  startedAt: number,
) => {
  const errorName = error instanceof Error ? error.name : "";

  return didTimeout || errorName === "AbortError"
    ? timeoutResult(startedAt)
    : unavailableResult(startedAt);
};

export const runBackendValidation = async (
  request: ValidationRequest,
  backendUrl: string,
): Promise<ValidationResult> => {
  const startedAt = performance.now();

  if (!isBackendValidationRequest(request)) {
    return unavailableResult(startedAt);
  }

  if (!hasBackendUrl(backendUrl)) {
    return unavailableResult(startedAt);
  }

  const timeout = createBackendTimeout(request.validation.timeoutMs);

  try {
    const response = await fetchBackendRun(request, backendUrl, timeout.signal);

    timeout.clear();
    return await resultFromResponse(response, startedAt);
  } catch (error) {
    timeout.clear();
    return resultFromFetchError(error, timeout.didTimeout(), startedAt);
  }
};
