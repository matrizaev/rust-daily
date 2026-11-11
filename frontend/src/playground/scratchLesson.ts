import type { Lesson } from "../types/lesson";

const starterCode = "// Write and experiment with Rust here.\n";

export const PLAYGROUND_SCRATCH_DRAFT_ID = "playground:scratch";

export const playgroundScratchLesson: Lesson = {
    schemaVersion: 2,
    id: "playground-scratch",
    arcId: "playground",
    arcTitle: "Playground",
    order: 0,
    day: 1,
    arcLength: 1,
    title: "Rust scratch workspace",
    conceptId: "rust-practice",
    difficulty: "easy",
    estimatedMinutes: 5,
    scenario: "Experiment with Rust code in a temporary workspace.",
    instructions:
        "Write code in src/lib.rs and run the check. The backend verifies compilation only; no behavioral assertions are run.",
    starterCode,
    files: [
        {
            path: "src/lib.rs",
            role: "editable",
            content: starterCode,
        },
        {
            path: "tests/playground.rs",
            role: "test",
            content: "#[test]\nfn playground_compiles() {}\n",
        },
    ],
    hints: [],
    completionExplanation:
        "The Rust project compiled and the empty test harness ran. This confirms compilation, not behavioral correctness.",
    validation: {
        mode: "backend-cargo-test",
        timeoutMs: 30_000,
        dependencySet: "std",
    },
};