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
const BACKEND_RESPONSE_GRACE_MS = 3000;
const MAX_JSON_PAYLOAD_BYTES = 1_600_000;

type BackendRunStatus =
  | "passed"
  | "failed"
  | "compile_error"
  | "timed_out";

type BackendRunResult = {
  status: BackendRunStatus;
  stdout: string;
  stderr: string;
  duration_ms: number;
};

type ServiceUnavailableResponse = {
  code?: unknown;
  details?: {
    correlation_id?: unknown;
  };
};

type BackendRunRequest = {
  mode: "cargo-test" | "compile-fail";
  dependencySet: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  compileFailCases?: Array<{
    name: string;
    path: string;
    content: string;
    expectedDiagnostics: string[];
    forbiddenDiagnostics?: string[];
  }>;
};

type BackendValidationRequest = ValidationRequest & {
  validation: Extract<
    LessonValidationStep,
    { mode: "backend-cargo-test" | "backend-compile-fail" }
  >;
};

type BackendCargoTestRequest = ValidationRequest & {
  validation: Extract<LessonValidationStep, { mode: "backend-cargo-test" }>;
};

const isBackendCargoTestRequest = (
  request: BackendValidationRequest,
): request is BackendCargoTestRequest =>
  request.validation.mode === "backend-cargo-test";

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
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isCorrelationId = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

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

const serializedByteLength = (value: string) => new TextEncoder().encode(value).byteLength;

type BackendRunFile = BackendRunRequest["files"][number];

const hasTestFile = (files: BackendRunFile[]) =>
  files.some((file) => file.path.startsWith("tests/") && file.path.endsWith(".rs"));

const sortedRequestFiles = (request: BackendValidationRequest): BackendRunFile[] =>
  Object.entries(request.files)
    .map(([path, content]) => ({ path, content }))
    .sort((left, right) => left.path.localeCompare(right.path));

const addFileIfMissing = (
  files: BackendRunFile[],
  seenPaths: Set<string>,
  file: BackendRunFile,
) => {
  if (seenPaths.has(file.path)) {
    return;
  }

  seenPaths.add(file.path);
  files.push(file);
};

const addLegacyTestInputs = (
  files: BackendRunFile[],
  request: BackendCargoTestRequest,
) => {
  const seenPaths = new Set(files.map((file) => file.path));

  addLegacyTestFiles(files, seenPaths, request);
  addLegacyTestCode(files, seenPaths, request);

  return files;
};

const addLegacyTestFiles = (
  files: BackendRunFile[],
  seenPaths: Set<string>,
  request: BackendCargoTestRequest,
) => {
  if (!request.validation.testFiles?.length) {
    return;
  }

  request.validation.testFiles.forEach((file) =>
    addFileIfMissing(files, seenPaths, file),
  );
};

const addLegacyTestCode = (
  files: BackendRunFile[],
  seenPaths: Set<string>,
  request: BackendCargoTestRequest,
) => {
  if (hasTestFile(files) || typeof request.validation.testCode !== "string") {
    return;
  }

  addFileIfMissing(files, seenPaths, {
    path: "tests/lesson.rs",
    content: request.validation.testCode,
  });
};

const requestFilesForValidation = (request: BackendValidationRequest) =>
  isBackendCargoTestRequest(request)
    ? addLegacyTestInputs(sortedRequestFiles(request), request)
    : sortedRequestFiles(request);

const buildCompileFailRunRequest = (
  request: BackendValidationRequest,
  files: BackendRunFile[],
): BackendRunRequest => ({
  mode: "compile-fail",
  dependencySet: request.validation.dependencySet ?? "std",
  files,
  compileFailCases:
    request.validation.mode === "backend-compile-fail"
      ? request.validation.cases
      : [],
});

const buildCargoTestRunRequest = (
  request: BackendValidationRequest,
  files: BackendRunFile[],
): BackendRunRequest => ({
  mode: "cargo-test",
  dependencySet: request.validation.dependencySet ?? "std",
  files,
});

const buildRunRequest = (
  request: BackendValidationRequest,
): BackendRunRequest => {
  const files = requestFilesForValidation(request);

  return request.validation.mode === "backend-compile-fail"
    ? buildCompileFailRunRequest(request, files)
    : buildCargoTestRunRequest(request, files);
};

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

const statusSummary = (
  status: BackendRunStatus,
  validationMode: BackendValidationRequest["validation"]["mode"],
) => {
  if (validationMode === "backend-compile-fail") {
    const summaries: Record<BackendRunStatus, string> = {
      passed: "All compile-fail checks passed.",
      failed: "Compile-fail checks failed.",
      compile_error: "The Rust code did not compile.",
      timed_out: "The Rust runner timed out.",
    };

    return summaries[status];
  }

  const summaries: Record<BackendRunStatus, string> = {
    passed: "All Rust tests passed.",
    failed: "Rust tests failed.",
    compile_error: "The Rust code did not compile.",
    timed_out: "The Rust runner timed out.",
  };

  return summaries[status];
};

const failureForStatus = (
  status: BackendRunStatus,
  validationMode: BackendValidationRequest["validation"]["mode"],
): ValidationFailure[] => {
  if (status === "passed") {
    return [];
  }

  const messages: Record<Exclude<BackendRunStatus, "passed">, string> =
    validationMode === "backend-compile-fail"
      ? {
          failed: "At least one compile-fail case did not fail as expected.",
          compile_error:
            "Fix the compile error before running the compile-fail cases.",
          timed_out: "The runner stopped this check after the lesson timeout.",
        }
      : {
          failed: "At least one public Rust test failed.",
          compile_error: "Fix the compile error before running the tests again.",
          timed_out: "The runner stopped this check after the lesson timeout.",
        };

  return [
    {
      name:
        validationMode === "backend-compile-fail"
          ? "compile-fail checks"
          : "cargo test",
      message: messages[status],
    },
  ];
};

const mapBackendStatus = (status: BackendRunStatus): ValidationStatus =>
  status === "timed_out" ? "timeout" : status;

const resultFromBackend = (
  response: BackendRunResult,
  validationMode: BackendValidationRequest["validation"]["mode"],
  startedAt: number,
): ValidationResult =>
  result(
    mapBackendStatus(response.status),
    startedAt,
    statusSummary(response.status, validationMode),
    diagnosticsFromStreams(response.stdout, response.stderr),
    failureForStatus(response.status, validationMode),
    Math.max(0, Math.round(response.duration_ms)),
  );

const resultFromHttpError = async (
  response: Response,
  startedAt: number,
): Promise<ValidationResult> => {
  if (response.status === 413) {
    return result(
      "failed",
      startedAt,
      "This lesson payload is too large for the Rust runner.",
      "",
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
    );
  }

  if (response.status === 503) {
    const correlationId = await response
      .json()
      .then((payload: ServiceUnavailableResponse) =>
        payload.code === "service_unavailable" &&
        isCorrelationId(payload.details?.correlation_id)
          ? payload.details.correlation_id
          : null,
      )
      .catch(() => null);

    return result(
      "unsupported",
      startedAt,
      correlationId
        ? `The Rust runner is temporarily unavailable. Try again shortly. Reference: ${correlationId}.`
        : "The Rust runner is temporarily unavailable. Try again shortly.",
    );
  }

  return result(
    "unsupported",
    startedAt,
    "The Rust runner could not complete this check. Try again shortly.",
  );
};

const invalidBackendResponseResult = (startedAt: number) =>
  result(
    "unsupported",
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
    "The Rust runner is unavailable. Try again shortly.",
  );

const isBackendValidationRequest = (
  request: ValidationRequest,
): request is BackendValidationRequest =>
  request.validation.mode === "backend-cargo-test" ||
  request.validation.mode === "backend-compile-fail";

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
  request: BackendValidationRequest,
  response: Response,
  startedAt: number,
) => {
  const payload = await parseBackendPayload(response, startedAt);

  return isBackendRunResult(payload)
    ? resultFromBackend(payload, request.validation.mode, startedAt)
    : invalidBackendResponseResult(startedAt);
};

const resultFromResponse = (
  request: BackendValidationRequest,
  response: Response,
  startedAt: number,
) =>
  response.ok
    ? resultFromOkResponse(request, response, startedAt)
    : resultFromHttpError(response, startedAt);

const fetchBackendRun = (
  request: BackendValidationRequest,
  backendUrl: string,
  signal: AbortSignal,
) => {
  const body = JSON.stringify(buildRunRequest(request));

  if (serializedByteLength(body) > MAX_JSON_PAYLOAD_BYTES) {
    return Promise.resolve(new Response(null, { status: 413 }));
  }

  return fetch(buildRunUrl(backendUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    signal,
  });
};

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

  const timeout = createBackendTimeout(
    request.validation.timeoutMs + BACKEND_RESPONSE_GRACE_MS,
  );

  try {
    const response = await fetchBackendRun(request, backendUrl, timeout.signal);

    timeout.clear();
    return await resultFromResponse(request, response, startedAt);
  } catch (error) {
    timeout.clear();
    return resultFromFetchError(error, timeout.didTimeout(), startedAt);
  }
};
