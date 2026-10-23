import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEPENDENCY_SET_DETAILS,
  dependencySetForValidation,
} from "../validation/dependencySets";
import type { LessonValidation } from "../types/validation";

const dependencyNamesFromManifest = (manifest: string) => {
  const dependencySection = manifest.match(
    /\[dependencies\]\r?\n(?<dependencies>[\s\S]*?)(?=\r?\n\[|$)/,
  )?.groups?.dependencies ?? "";

  return dependencySection
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("=")[0].trim());
};

describe("dependency set metadata", () => {
  it("defaults lessons without backend validation to standard library only", () => {
    expect(dependencySetForValidation({ mode: "self-check" })).toBe("std");
    expect(dependencySetForValidation(undefined)).toBe("std");
  });

  it("uses the lesson backend dependency set when one is authored", () => {
    const validation: LessonValidation = {
      mode: "all",
      validations: [
        { mode: "structural", timeoutMs: 1000, checks: [] },
        {
          mode: "backend-cargo-test",
          timeoutMs: 1000,
          dependencySet: "advanced",
        },
      ],
    };

    expect(dependencySetForValidation(validation)).toBe("advanced");
  });

  it("uses advanced-db when a lesson requests the database dependency set", () => {
    const validation: LessonValidation = {
      mode: "backend-cargo-test",
      timeoutMs: 1000,
      dependencySet: "advanced-db",
    };

    expect(dependencySetForValidation(validation)).toBe("advanced-db");
  });

  it("keeps advanced crate names aligned with the runner manifest", () => {
    const advancedDependencyManifest = readFileSync(
      "../docker/dependency-cache/Cargo.toml",
      "utf8",
    );

    expect(DEPENDENCY_SET_DETAILS.advanced.availableCrates).toEqual(
      dependencyNamesFromManifest(advancedDependencyManifest),
    );
  });

  it("keeps advanced-db crate names aligned with its runner manifest", () => {
    const advancedDbDependencyManifest = readFileSync(
      "../docker/dependency-cache/advanced-db/Cargo.toml",
      "utf8",
    );

    expect(DEPENDENCY_SET_DETAILS["advanced-db"].availableCrates).toEqual(
      dependencyNamesFromManifest(advancedDbDependencyManifest),
    );
  });
});
