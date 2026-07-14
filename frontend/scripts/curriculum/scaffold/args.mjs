import { formatPresetList } from "../scaffold-presets.mjs";

const BOOLEAN_FLAGS = new Set([
  "--structural",
  "--register-arc",
  "--register-concept",
  "--force",
  "--dry-run",
  "--help",
  "--list-presets",
]);
const VALUE_FLAGS = new Map([
  ["--arc", "arc"],
  ["--lesson", "lesson"],
  ["--title", "title"],
  ["--concept", "concept"],
  ["--difficulty", "difficulty"],
  ["--dependency-set", "dependencySet"],
  ["--editable", "editable"],
  ["--estimated-minutes", "estimatedMinutes"],
  ["--arc-title", "arcTitle"],
  ["--arc-pillar", "arcPillar"],
  ["--arc-description", "arcDescription"],
  ["--arc-length", "arcLength"],
  ["--readonly", "readonly"],
  ["--test", "tests"],
  ["--compile-fail", "compileFail"],
  ["--preset", "preset"],
]);
const REPEATABLE_KEYS = new Set(["readonly", "tests", "compileFail"]);

const emptyOptions = () => ({
  readonly: [],
  tests: [],
  compileFail: [],
  structural: false,
  registerArc: false,
  registerConcept: false,
  force: false,
  dryRun: false,
});

const flagToBooleanKey = (flag) =>
  flag
    .slice(2)
    .replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());

const readFlagValue = (argv, index, arg, errors) => {
  const value = argv[index + 1];

  if (value === undefined || value.startsWith("--")) {
    errors.push(`${arg} requires a value.`);
    return null;
  }

  return value;
};

const applyValueOption = (options, key, value, arg, errors) => {
  if (REPEATABLE_KEYS.has(key)) {
    options[key].push(value);
    return;
  }

  if (options[key] === undefined) {
    options[key] = value;
    return;
  }

  errors.push(`${arg} can be provided only once.`);
};

const parseValueFlagArg = (argv, index, options, errors) => {
  const arg = argv[index];
  const key = VALUE_FLAGS.get(arg);

  if (!key) {
    errors.push(`Unknown flag ${arg}.`);
    return index;
  }

  const value = readFlagValue(argv, index, arg, errors);

  if (value === null) {
    return index;
  }

  applyValueOption(options, key, value, arg, errors);
  return index + 1;
};

const parseFlagArg = (argv, index, options, errors) => {
  const arg = argv[index];

  if (!arg.startsWith("--")) {
    errors.push(`Unexpected positional argument ${arg}.`);
    return index;
  }

  if (BOOLEAN_FLAGS.has(arg)) {
    options[flagToBooleanKey(arg)] = true;
    return index;
  }

  return parseValueFlagArg(argv, index, options, errors);
};

export const parseArgs = (argv) => {
  const options = emptyOptions();
  const errors = [];

  for (let index = 0; index < argv.length; index += 1) {
    index = parseFlagArg(argv, index, options, errors);
  }

  return { options, errors };
};

export const usageText = () => `Usage:
  scripts/curriculum/scaffold-lesson --arc <arc-id> --lesson <nnn-slug> \\
    --title <title> --concept <concept-id> --difficulty <easy|medium|advanced> \\
    --editable <src/file.rs> [--dependency-set <std|advanced>] [options]

Required unless supplied by a preset:
  --dependency-set <std|advanced>

Common options:
  --preset <preset-id>
  --readonly <path>
  --test <tests/path.rs>
  --compile-fail <case-name>
  --structural
  --register-arc --arc-title <title> --arc-pillar <pillar> --arc-description <text>
  --register-concept
  --estimated-minutes <minutes>
  --arc-length <count>
  --force
  --dry-run

Discovery:
  --help
  --list-presets

Presets:
${formatPresetList()}

Example:
  scripts/curriculum/scaffold-lesson --preset advanced-borrowed-api \\
    --arc borrowed-views --lesson 091-config-view --title "Borrowed config view" \\
    --concept borrowed-config-view --difficulty advanced --editable src/lib.rs \\
    --register-arc --arc-title "Borrowed Views" --arc-pillar ownership \\
    --arc-description "Design borrowed APIs." --register-concept
`;
