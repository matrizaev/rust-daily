import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      all: true,
      include: [
        "src/progress/**/*.ts",
        "src/progression/**/*.ts",
        "src/storage/**/*.ts",
        "src/validation/backendValidation.ts",
        "src/validation/structuralChecks.ts",
      ],
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
