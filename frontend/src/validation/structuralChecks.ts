import type { StructuralCheck, ValidationFailure } from "../types/validation";

type EnumUnitVariantsCheck = Extract<
  StructuralCheck,
  { type: "enum_unit_variants" }
>;
type FunctionSignatureCheck = Extract<
  StructuralCheck,
  { type: "function_signature" }
>;
type ImplMethodCheck = Extract<StructuralCheck, { type: "impl_method" }>;
type ImplTraitForTypeCheck = Extract<
  StructuralCheck,
  { type: "impl_trait_for_type" }
>;
type SourceIncludesCheck = Extract<StructuralCheck, { type: "source_includes" }>;
type StructFieldsCheck = Extract<StructuralCheck, { type: "struct_fields" }>;
type TupleStructFieldsCheck = Extract<
  StructuralCheck,
  { type: "tuple_struct_fields" }
>;

const RUST_IDENTIFIER = /^([A-Za-z_][A-Za-z0-9_]*)\s*(?:=\s*[^({]+)?$/;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripRustComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) =>
      comment.replace(/[^\n\r]/g, " "),
    )
    .replace(/\/\/[^\n\r]*/g, "");

const optionalGenericsPattern = "(?:\\s*<[^>{}]*>)?";

const findNamedOpenBrace = (source: string, keyword: string, name: string) => {
  const pattern = new RegExp(
    `\\b${keyword}\\s+${escapeRegex(name)}${optionalGenericsPattern}\\s*\\{`,
  );
  const match = pattern.exec(source);

  return match ? match.index + match[0].lastIndexOf("{") : -1;
};

const braceDelta = (char: string) => Number(char === "{") - Number(char === "}");

const extractBraceBody = (source: string, openBraceIndex: number) => {
  let depth = 1;

  for (let index = openBraceIndex + 1; index < source.length; index += 1) {
    depth += braceDelta(source[index]);

    if (depth === 0) {
      return source.slice(openBraceIndex + 1, index);
    }
  }

  return null;
};

const extractNamedBody = (source: string, keyword: string, name: string) => {
  const openBraceIndex = findNamedOpenBrace(source, keyword, name);

  return openBraceIndex < 0 ? null : extractBraceBody(source, openBraceIndex);
};

const findNamedOpenDelimiter = (
  source: string,
  keyword: string,
  name: string,
  openDelimiter: string,
) => {
  const escapedDelimiter = escapeRegex(openDelimiter);
  const pattern = new RegExp(
    `\\b${keyword}\\s+${escapeRegex(name)}${optionalGenericsPattern}\\s*${escapedDelimiter}`,
  );
  const match = pattern.exec(source);

  return match ? match.index + match[0].lastIndexOf(openDelimiter) : -1;
};

const updateDelimitedDepth = (
  char: string,
  depth: number,
  openDelimiter: string,
  closeDelimiter: string,
) => {
  if (char === openDelimiter) {
    return depth + 1;
  }

  if (char === closeDelimiter) {
    return depth - 1;
  }

  return depth;
};

const extractDelimitedBody = (
  source: string,
  openIndex: number,
  openDelimiter: string,
  closeDelimiter: string,
) => {
  let depth = 1;

  for (let index = openIndex + 1; index < source.length; index += 1) {
    depth = updateDelimitedDepth(
      source[index],
      depth,
      openDelimiter,
      closeDelimiter,
    );

    if (depth === 0) {
      return source.slice(openIndex + 1, index);
    }
  }

  return null;
};

const extractNamedDelimitedBody = (
  source: string,
  keyword: string,
  name: string,
  openDelimiter: string,
  closeDelimiter: string,
) => {
  const openIndex = findNamedOpenDelimiter(source, keyword, name, openDelimiter);

  return openIndex < 0
    ? null
    : extractDelimitedBody(source, openIndex, openDelimiter, closeDelimiter);
};

const OPEN_DEPTH_CHARS = new Set(["(", "[", "{"]);
const CLOSE_DEPTH_CHARS = new Set([")", "]", "}"]);

const updateDepth = (char: string, depth: number) => {
  if (OPEN_DEPTH_CHARS.has(char)) {
    return depth + 1;
  }

  if (CLOSE_DEPTH_CHARS.has(char)) {
    return Math.max(0, depth - 1);
  }

  return depth;
};

const splitTopLevelEntries = (body: string) => {
  const entries: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];

    if (char === "," && depth === 0) {
      entries.push(body.slice(start, index));
      start = index + 1;
    } else {
      depth = updateDepth(char, depth);
    }
  }

  entries.push(body.slice(start));
  return entries;
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const includesAll = (source: string, snippets: string[]) =>
  snippets.every((snippet) => source.includes(snippet));

const failure = (name: string, message: string): ValidationFailure => ({
  name,
  message,
});

const missingSnippetFailures = (source: string, snippets: string[]) =>
  snippets
    .filter((snippet) => !source.includes(snippet))
    .map((snippet) => failure(snippet, `Missing required snippet: ${snippet}.`));

const forbiddenSnippetFailures = (source: string, snippets: string[]) =>
  snippets
    .filter((snippet) => source.includes(snippet))
    .map((snippet) => failure(snippet, `Remove forbidden snippet: ${snippet}.`));

const getUnitVariantName = (entry: string) => {
  const match = RUST_IDENTIFIER.exec(entry.trim());

  return match?.[1] ?? null;
};

const isString = (value: string | null): value is string => value !== null;

const missingVariantFailures = (
  variants: Set<string>,
  requiredVariants: string[],
) =>
  requiredVariants
    .filter((variant) => !variants.has(variant))
    .map((variant) => failure(variant, `Missing variant: ${variant}.`));

const runEnumUnitVariantsCheck = (
  source: string,
  check: EnumUnitVariantsCheck,
) => {
  const body = extractNamedBody(source, "enum", check.enumName);

  if (body === null) {
    return [failure(check.enumName, `${check.enumName} enum was not found.`)];
  }

  const variants = new Set(
    splitTopLevelEntries(body).map(getUnitVariantName).filter(isString),
  );
  const missing = missingVariantFailures(variants, check.requiredVariants);

  return variants.size === 0
    ? [failure(check.enumName, `${check.enumName} enum is empty.`), ...missing]
    : missing;
};

const parseStructField = (entry: string) => {
  const match = /^\s*(?:pub(?:\([^)]*\))?\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^,]+)\s*$/.exec(
    entry,
  );

  return match ? { name: match[1], typeText: normalizeWhitespace(match[2]) } : null;
};

const getStructFields = (body: string) =>
  splitTopLevelEntries(body).map(parseStructField).filter((field) => field !== null);

const fieldFailure = (structName: string, fieldName: string) =>
  failure(fieldName, `${structName}.${fieldName} field is missing or has the wrong type.`);

const runStructFieldsCheck = (source: string, check: StructFieldsCheck) => {
  const body = extractNamedBody(source, "struct", check.structName);

  if (body === null) {
    return [failure(check.structName, `${check.structName} struct was not found.`)];
  }

  const fields = getStructFields(body);

  return check.requiredFields.flatMap((requiredField) => {
    const field = fields.find((field) => field.name === requiredField.name);

    return field && includesAll(field.typeText, requiredField.typeIncludes)
      ? []
      : [fieldFailure(check.structName, requiredField.name)];
  });
};

const getTupleStructFieldTypes = (body: string) =>
  splitTopLevelEntries(body)
    .map((entry) => normalizeWhitespace(entry.replace(/^\s*pub(?:\([^)]*\))?\s+/, "")))
    .filter(Boolean);

const runTupleStructFieldsCheck = (
  source: string,
  check: TupleStructFieldsCheck,
) => {
  const body = extractNamedDelimitedBody(source, "struct", check.structName, "(", ")");

  if (body === null) {
    return [failure(check.structName, `${check.structName} tuple struct was not found.`)];
  }

  const fieldTypes = getTupleStructFieldTypes(body);

  if (fieldTypes.length !== check.requiredTypes.length) {
    return [
      failure(
        check.structName,
        `${check.structName} should have ${check.requiredTypes.length} tuple field(s).`,
      ),
    ];
  }

  return check.requiredTypes.flatMap((requiredType, index) =>
    fieldTypes[index] && includesAll(fieldTypes[index], [requiredType])
      ? []
      : [
          failure(
            `${check.structName}.${index}`,
            `${check.structName} field ${index + 1} should include type ${requiredType}.`,
          ),
        ],
  );
};

const implPattern = (implFor: string) =>
  new RegExp(`\\bimpl${optionalGenericsPattern}\\s+${escapeRegex(implFor)}\\s*\\{`);

const extractImplBody = (source: string, implFor: string) => {
  const match = implPattern(implFor).exec(source);

  return match ? extractBraceBody(source, match.index + match[0].lastIndexOf("{")) : null;
};

const functionPattern = (functionName: string) =>
  new RegExp(
    `\\b(?:pub\\s+)?fn\\s+${escapeRegex(functionName)}\\s*\\([^)]*\\)\\s*(?:->\\s*[^\\{;]+)?`,
  );

const findFunctionSignature = (source: string, functionName: string) => {
  const match = functionPattern(functionName).exec(source);

  return match ? normalizeWhitespace(match[0]) : null;
};

const methodSignatureFailures = (
  signature: string | null,
  methodName: string,
  requiredIncludes: string[],
) => {
  if (signature === null) {
    return [failure(methodName, `${methodName} method was not found.`)];
  }

  return missingSnippetFailures(signature, requiredIncludes);
};

const runImplMethodCheck = (source: string, check: ImplMethodCheck) => {
  const body = extractImplBody(source, check.implFor);

  if (body === null) {
    return [failure(check.implFor, `impl ${check.implFor} block was not found.`)];
  }

  return methodSignatureFailures(
    findFunctionSignature(body, check.methodName),
    check.methodName,
    check.requiredSignatureIncludes,
  );
};

const runFunctionSignatureCheck = (
  source: string,
  check: FunctionSignatureCheck,
) =>
  methodSignatureFailures(
    findFunctionSignature(source, check.functionName),
    check.functionName,
    check.requiredSignatureIncludes,
  );

const runImplTraitForTypeCheck = (
  source: string,
  check: ImplTraitForTypeCheck,
) => {
  const pattern = new RegExp(
    `\\bimpl${optionalGenericsPattern}\\s+${escapeRegex(check.traitName)}\\s+for\\s+${escapeRegex(check.typeName)}\\b`,
  );

  return pattern.test(source)
    ? []
    : [
        failure(
          check.traitName,
          `impl ${check.traitName} for ${check.typeName} was not found.`,
        ),
      ];
};

const runSourceIncludesCheck = (source: string, check: SourceIncludesCheck) => [
  ...missingSnippetFailures(source, check.requiredSnippets),
  ...forbiddenSnippetFailures(source, check.forbiddenSnippets ?? []),
];

const checkRunners = {
  enum_unit_variants: runEnumUnitVariantsCheck,
  function_signature: runFunctionSignatureCheck,
  impl_method: runImplMethodCheck,
  impl_trait_for_type: runImplTraitForTypeCheck,
  source_includes: runSourceIncludesCheck,
  struct_fields: runStructFieldsCheck,
  tuple_struct_fields: runTupleStructFieldsCheck,
};

const runStructuralCheck = (source: string, check: StructuralCheck) =>
  checkRunners[check.type](source, check as never);

export const runStructuralChecks = (
  source: string,
  checks: StructuralCheck[],
) => {
  const cleanSource = stripRustComments(source);

  return checks.flatMap((check) => runStructuralCheck(cleanSource, check));
};
