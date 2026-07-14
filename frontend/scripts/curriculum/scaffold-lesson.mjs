import { formatPresetList } from "./scaffold-presets.mjs";
import { parseArgs, usageText } from "./scaffold/args.mjs";
import { buildWritePlan } from "./scaffold/build.mjs";
import { normalizeInputs } from "./scaffold/options.mjs";
import {
  executeWritePlan,
  printDryRun,
  printSuccess,
  validateWritePlan,
} from "./scaffold/write-plan.mjs";

const reportAndExit = (errors) => {
  console.error(`Scaffold failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
};

const handleDiscoveryOutput = (options) => {
  if (options.help) {
    console.log(usageText());
    return true;
  }

  if (options.listPresets) {
    console.log(formatPresetList());
    return true;
  }

  return false;
};

const reportIfErrors = (errors) => {
  if (errors.length > 0) {
    reportAndExit(errors);
  }
};

const writeScaffold = async (options) => {
  const { lessonJson, writes } = await buildWritePlan(options);
  const writeErrors = await validateWritePlan(writes, options.force);

  reportIfErrors(writeErrors);

  if (options.dryRun) {
    printDryRun(options, lessonJson, writes);
    return;
  }

  await executeWritePlan(writes);
  printSuccess(options, writes);
};

const main = async () => {
  const parsed = parseArgs(process.argv.slice(2));

  if (handleDiscoveryOutput(parsed.options)) {
    return;
  }

  reportIfErrors(parsed.errors);

  const { options, errors } = await normalizeInputs(parsed.options, []);

  reportIfErrors(errors);

  await writeScaffold(options);
};

await main();
