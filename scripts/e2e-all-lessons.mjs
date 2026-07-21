#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultBaseUrl = "http://localhost:5173";
const defaultBackendUrl = "http://127.0.0.1:8080";
const artifactDir = path.join(repoRoot, "output", "playwright", "all-lessons");

const usage = `Usage: node scripts/e2e-all-lessons.mjs [options]

Solve canonical lessons through the real Rust Daily browser UI and Check flow.

Options:
  --start                 Start the backend and Vite server for this run.
  --build-runner          Build the Podman runner image before starting servers.
  --base-url <url>        Frontend URL. Default: ${defaultBaseUrl}
  --backend-url <url>     Backend URL. Default: ${defaultBackendUrl}
  --from <order>          Start at this curriculum order. Default: 1
  --limit <count>         Run at most this many lessons.
  --timeout-ms <ms>       Per-lesson validation timeout. Default: 45000
  --headed                Show the browser window.
  --keep-browser          Leave the Playwright session open after the run.
  -h, --help              Show this help.

Examples:
  node scripts/e2e-all-lessons.mjs --start
  node scripts/e2e-all-lessons.mjs --base-url http://localhost:5174 --limit 3
  make e2e-lessons FRONTEND_PORT=5174
`;

const failUsage = (message) => {
  console.error(message);
  console.error(usage);
  process.exit(64);
};

const positiveInteger = (value, flag) => {
  if (!/^\d+$/.test(value ?? "") || Number(value) < 1) {
    failUsage(`${flag} requires a positive integer.`);
  }
  return Number(value);
};

const parseArgs = (argv) => {
  const options = {
    start: false,
    buildRunner: false,
    baseUrl: defaultBaseUrl,
    backendUrl: defaultBackendUrl,
    from: 1,
    limit: Number.POSITIVE_INFINITY,
    timeoutMs: 45_000,
    headed: false,
    keepBrowser: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    switch (argument) {
      case "--start":
        options.start = true;
        break;
      case "--build-runner":
        options.buildRunner = true;
        break;
      case "--headed":
        options.headed = true;
        break;
      case "--keep-browser":
        options.keepBrowser = true;
        break;
      case "--base-url":
        options.baseUrl = argv[++index] ?? failUsage("--base-url requires a value.");
        break;
      case "--backend-url":
        options.backendUrl = argv[++index] ?? failUsage("--backend-url requires a value.");
        break;
      case "--from":
        options.from = positiveInteger(argv[++index], "--from");
        break;
      case "--limit":
        options.limit = positiveInteger(argv[++index], "--limit");
        break;
      case "--timeout-ms":
        options.timeoutMs = positiveInteger(argv[++index], "--timeout-ms");
        break;
      case "-h":
      case "--help":
        console.log(usage);
        process.exit(0);
      default:
        failUsage(`Unknown option: ${argument}`);
    }
  }

  for (const [flag, value] of [
    ["--base-url", options.baseUrl],
    ["--backend-url", options.backendUrl],
  ]) {
    try {
      new URL(value);
    } catch {
      failUsage(`${flag} must be an absolute URL.`);
    }
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, "");
  options.backendUrl = options.backendUrl.replace(/\/+$/, "");
  return options;
};

const findPlaywrightCli = () => {
  if (process.env.PWCLI) {
    return path.resolve(process.env.PWCLI);
  }

  const codexRoot = process.env.CODEX_HOME
    ? path.resolve(process.env.CODEX_HOME)
    : path.join(os.homedir(), ".codex");
  return path.join(codexRoot, "skills", "playwright", "scripts", "playwright_cli.sh");
};

const loadLessons = () => {
  const lessonsRoot = path.join(repoRoot, "lessons");
  const lessons = [];

  for (const arcName of fs.readdirSync(lessonsRoot)) {
    const arcPath = path.join(lessonsRoot, arcName);
    if (!fs.statSync(arcPath).isDirectory()) continue;

    for (const lessonName of fs.readdirSync(arcPath)) {
      const lessonDir = path.join(arcPath, lessonName);
      const lessonPath = path.join(lessonDir, "lesson.json");
      if (!fs.existsSync(lessonPath)) continue;

      const lesson = JSON.parse(fs.readFileSync(lessonPath, "utf8"));
      const editableFiles = lesson.files.filter((file) => file.role === "editable");
      if (editableFiles.length !== 1) {
        throw new Error(`${path.relative(repoRoot, lessonPath)} must have one editable file.`);
      }

      const solutionPath = path.join(
        lessonDir,
        lesson.author.solutionPath,
        editableFiles[0].path,
      );
      if (!fs.existsSync(solutionPath)) {
        throw new Error(`Missing solution: ${path.relative(repoRoot, solutionPath)}`);
      }

      lessons.push({
        id: lesson.id,
        order: lesson.order,
        title: lesson.title,
        solution: fs.readFileSync(solutionPath, "utf8"),
      });
    }
  }

  return lessons.sort((left, right) => left.order - right.order);
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
};

const waitForUrl = async (url, child, label, timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";

  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) {
      throw new Error(`${label} exited with status ${child.exitCode}.`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (child && child.exitCode !== null) {
          throw new Error(`${label} exited with status ${child.exitCode}.`);
        }
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`${label} did not become ready at ${url}: ${lastError}`);
};

const assertUrlAvailable = async (url, label) => {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1_000) });
  } catch {
    return;
  }

  throw new Error(
    `${label} address is already in use at ${url}. Stop the existing service, ` +
      "choose another port, or omit --start to use services that are already running.",
  );
};

const startServers = async (options) => {
  fs.mkdirSync(artifactDir, { recursive: true });

  await Promise.all([
    assertUrlAvailable(options.baseUrl, "Frontend"),
    assertUrlAvailable(`${options.backendUrl}/healthz`, "Backend"),
  ]);

  if (options.buildRunner) {
    const build = run("make", ["runner-image"], { stdio: "inherit" });
    if (build.status !== 0) throw new Error("Runner image build failed.");
  }

  const frontendUrl = new URL(options.baseUrl);
  const backendUrl = new URL(options.backendUrl);
  const backendLog = fs.openSync(path.join(artifactDir, "backend.log"), "w");
  const frontendLog = fs.openSync(path.join(artifactDir, "frontend.log"), "w");
  const children = [];

  const backend = spawn("cargo", ["run", "--manifest-path", "backend/Cargo.toml"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      RUST_DAILY_ENV: "local",
      RUST_DAILY_SERVER__CORS_ORIGIN: frontendUrl.origin,
      RUST_DAILY_SERVER__PORT: backendUrl.port || "80",
      RUST_DAILY_RUNNER__IMAGE: process.env.RUNNER_IMAGE ?? "rust-runner:1.95",
    },
    stdio: ["ignore", backendLog, backendLog],
  });
  children.push(backend);

  const frontend = spawn(
    "npm",
    ["run", "dev", "--", "--strictPort", "--host", frontendUrl.hostname, "--port", frontendUrl.port || "80"],
    {
      cwd: path.join(repoRoot, "frontend"),
      env: {
        ...process.env,
        VITE_RUST_DAILY_BACKEND_URL: options.backendUrl,
      },
      stdio: ["ignore", frontendLog, frontendLog],
    },
  );
  children.push(frontend);

  try {
    await Promise.all([
      waitForUrl(`${options.backendUrl}/healthz`, backend, "Backend"),
      waitForUrl(options.baseUrl, frontend, "Frontend"),
    ]);
  } catch (error) {
    for (const child of children) child.kill("SIGTERM");
    throw error;
  }

  return children;
};

const stopServers = async (children) => {
  for (const child of children) child.kill("SIGTERM");
  await Promise.all(
    children.map(
      (child) => new Promise((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once("exit", resolve);
        setTimeout(() => {
          if (child.exitCode === null) child.kill("SIGKILL");
          resolve();
        }, 5_000).unref();
      }),
    ),
  );
};

const parseCliResult = (result, lessonId) => {
  if (result.status !== 0) {
    return {
      id: lessonId,
      status: "automation_error",
      error: (result.stderr || result.stdout).trim() || `CLI exited ${result.status}`,
    };
  }

  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    return {
      id: lessonId,
      status: "automation_error",
      error: `Could not parse Playwright output: ${result.stdout.trim()}`,
    };
  }
};

const lessonFunction = (lesson, options) => `async page => {
  const terminalTitles = [
    "Passed",
    "Self-check complete",
    "Needs changes",
    "Compile error",
    "Timed out",
    "Unavailable",
    "Check failed"
  ];
  const consoleErrors = [];
  const onConsole = message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  page.on("console", onConsole);
  try {
    await page.goto(${JSON.stringify(`${options.baseUrl}/#lesson/${lesson.id}`)}, {
      waitUntil: "domcontentloaded",
      timeout: 15000
    });
    const editor = page.getByRole("textbox");
    await editor.waitFor({ state: "visible", timeout: 10000 });
    await editor.fill(${JSON.stringify(lesson.solution)});
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await page.waitForFunction(
      titles => titles.includes(document.querySelector("#validation-title")?.textContent?.trim()),
      terminalTitles,
      { timeout: ${options.timeoutMs} }
    );
    const title = (await page.locator("#validation-title").textContent())?.trim() ?? "Unknown";
    const panel = page.locator(".validation-panel");
    const summary = (await panel.locator("p").first().textContent())?.trim() ?? "";
    const passed = title === "Passed" || title === "Self-check complete";
    const completed = await page.getByRole("heading", { name: "Lesson complete" }).isVisible();
    return {
      id: ${JSON.stringify(lesson.id)},
      order: ${lesson.order},
      title: ${JSON.stringify(lesson.title)},
      status: passed && completed ? "passed" : passed ? "progress_error" : "failed",
      validationTitle: title,
      summary,
      completed,
      consoleErrors
    };
  } finally {
    page.off("console", onConsole);
  }
}`;

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const playwrightCli = findPlaywrightCli();
  if (!fs.existsSync(playwrightCli)) {
    throw new Error(`Playwright CLI wrapper not found: ${playwrightCli}`);
  }

  const selected = loadLessons()
    .filter((lesson) => lesson.order >= options.from)
    .slice(0, options.limit);
  if (selected.length === 0) throw new Error("No lessons matched the requested range.");

  fs.mkdirSync(artifactDir, { recursive: true });
  const session = `rust-daily-lessons-${process.pid}`;
  const cli = (...args) => run("bash", [playwrightCli, `-s=${session}`, ...args]);
  let servers = [];

  const cleanup = async () => {
    if (!options.keepBrowser) cli("close");
    await stopServers(servers);
  };

  process.once("SIGINT", () => cleanup().finally(() => process.exit(130)));
  process.once("SIGTERM", () => cleanup().finally(() => process.exit(143)));

  try {
    if (options.start) {
      console.log(`Starting backend at ${options.backendUrl} and frontend at ${options.baseUrl}...`);
      servers = await startServers(options);
    } else {
      await Promise.all([
        waitForUrl(`${options.backendUrl}/healthz`, null, "Backend", 5_000),
        waitForUrl(options.baseUrl, null, "Frontend", 5_000),
      ]);
    }

    const openArgs = ["open", options.baseUrl];
    if (options.headed) openArgs.push("--headed");
    const opened = cli(...openArgs);
    if (opened.status !== 0) {
      throw new Error((opened.stderr || opened.stdout).trim() || "Could not open browser.");
    }

    console.log(`Running ${selected.length} lesson${selected.length === 1 ? "" : "s"}...`);
    const results = [];
    for (const lesson of selected) {
      const startedAt = Date.now();
      const raw = cli("--raw", "run-code", lessonFunction(lesson, options));
      const result = parseCliResult(raw, lesson.id);
      result.wallTimeMs = Date.now() - startedAt;
      results.push(result);

      const marker = result.status === "passed" ? "PASS" : "FAIL";
      console.log(`[${String(lesson.order).padStart(2, "0")}/90] ${marker} ${lesson.id} (${result.wallTimeMs} ms)`);
      if (result.status !== "passed") {
        const screenshot = path.join(
          artifactDir,
          `${String(lesson.order).padStart(2, "0")}-${lesson.id}.png`,
        );
        cli("screenshot", "--filename", screenshot, "--full-page");
        console.log(`  ${result.validationTitle ?? result.status}: ${result.summary ?? result.error}`);
      }
    }

    const progressRaw = cli(
      "--raw",
      "run-code",
      `async page => {
        const value = JSON.parse(await page.evaluate(() => localStorage.getItem("rust-daily:v1:progress")) || "{}");
        return { completionCount: value.completions?.length ?? 0 };
      }`,
    );
    const progress = progressRaw.status === 0
      ? JSON.parse(progressRaw.stdout.trim())
      : { completionCount: null };

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: options.baseUrl,
      backendUrl: options.backendUrl,
      selectedLessons: selected.length,
      passed: results.filter((result) => result.status === "passed").length,
      failed: results.filter((result) => result.status !== "passed").length,
      browserCompletionCount: progress.completionCount,
      results,
    };
    const reportPath = path.join(artifactDir, "report.json");
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

    console.log(
      `Finished: ${report.passed} passed, ${report.failed} failed; browser has ${report.browserCompletionCount} completions.`,
    );
    console.log(`Report: ${path.relative(repoRoot, reportPath)}`);
    if (report.failed > 0) process.exitCode = 1;
  } finally {
    await cleanup();
  }
};

main().catch((error) => {
  console.error(`E2E lesson run failed: ${error.message}`);
  process.exitCode = 1;
});
