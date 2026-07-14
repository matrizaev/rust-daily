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
type DerivedTraitForTypeCheck = Extract<
  StructuralCheck,
  { type: "derived_trait_for_type" }
>;
type SourceIncludesCheck = Extract<StructuralCheck, { type: "source_includes" }>;
type StructFieldsCheck = Extract<StructuralCheck, { type: "struct_fields" }>;
type TupleStructFieldsCheck = Extract<
  StructuralCheck,
  { type: "tuple_struct_fields" }
>;

const ENUM_VARIANT_IDENTIFIER = /^([A-Za-z_][A-Za-z0-9_]*)\b/;
const IDENTIFIER_SNIPPET = /^[A-Za-z_][A-Za-z0-9_:]*$/;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripRustComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) =>
      comment.replace(/[^\n\r]/g, " "),
    )
    .replace(/\/\/[^\n\r]*/g, "");

const skipWhitespace = (source: string, index: number) => {
  let cursor = index;

  while (cursor < source.length && /\s/.test(source[cursor])) {
    cursor += 1;
  }

  return cursor;
};

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
  const closeIndex = findMatchingDelimiter(
    source,
    openIndex,
    openDelimiter,
    closeDelimiter,
  );

  return closeIndex < 0 ? null : source.slice(openIndex + 1, closeIndex);
};

const findMatchingDelimiter = (
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
      return index;
    }
  }

  return -1;
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

const OPEN_DEPTH_CHARS = new Set(["(", "[", "{", "<"]);
const CLOSE_DEPTH_CHARS = new Set([")", "]", "}", ">"]);

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

const snippetBoundaryClass = (snippet: string) =>
  snippet.includes("::") ? "A-Za-z0-9_:" : "A-Za-z0-9_";

const boundedSnippetPattern = (snippet: string) =>
  new RegExp(
    `(^|[^${snippetBoundaryClass(snippet)}])${escapeRegex(snippet)}(?=$|[^${snippetBoundaryClass(snippet)}])`,
  );

const includesBoundedSnippet = (source: string, snippet: string) =>
  boundedSnippetPattern(snippet).test(source);

const includesForbiddenSnippet = (source: string, snippet: string) =>
  IDENTIFIER_SNIPPET.test(snippet)
    ? includesBoundedSnippet(source, snippet)
    : source.includes(snippet);

const failure = (name: string, message: string): ValidationFailure => ({
  name,
  message,
});

const missingSnippetFailures = (source: string, snippets: string[]) =>
  snippets
    .filter((snippet) => !source.includes(snippet))
    .map((snippet) => failure(snippet, `Missing required snippet: ${snippet}.`));

const stripLifetimeAnnotations = (source: string) =>
  source
    .replace(/<\s*'[A-Za-z_][A-Za-z0-9_]*\s*>/g, "")
    .replace(/&\s*'[A-Za-z_][A-Za-z0-9_]*\s+/g, "&")
    .replace(/&\s*'[A-Za-z_][A-Za-z0-9_]*/g, "&");

const signatureIncludesSnippet = (signature: string, snippet: string) =>
  signature.includes(snippet) ||
  stripLifetimeAnnotations(signature).includes(snippet);

const missingSignatureSnippetFailures = (
  signature: string,
  snippets: string[],
) =>
  snippets
    .filter((snippet) => !signatureIncludesSnippet(signature, snippet))
    .map((snippet) => failure(snippet, `Missing required snippet: ${snippet}.`));

const forbiddenSnippetFailures = (source: string, snippets: string[]) =>
  snippets
    .filter((snippet) => includesForbiddenSnippet(source, snippet))
    .map((snippet) => failure(snippet, `Remove forbidden snippet: ${snippet}.`));

const getEnumVariantName = (entry: string) => {
  const match = ENUM_VARIANT_IDENTIFIER.exec(entry.trim());

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
    splitTopLevelEntries(body).map(getEnumVariantName).filter(isString),
  );
  const missing = missingVariantFailures(variants, check.requiredVariants);

  return variants.size === 0
    ? [failure(check.enumName, `${check.enumName} enum is empty.`), ...missing]
    : missing;
};

const findTopLevelColon = (entry: string) => {
  let depth = 0;

  for (let index = 0; index < entry.length; index += 1) {
    const char = entry[index];

    if (char === ":" && depth === 0) {
      return index;
    }

    depth = updateDepth(char, depth);
  }

  return -1;
};

const parseStructField = (entry: string) => {
  const colonIndex = findTopLevelColon(entry);

  if (colonIndex < 0) {
    return null;
  }

  const fieldText = entry.slice(0, colonIndex).trim();
  const typeText = normalizeWhitespace(entry.slice(colonIndex + 1).trim());
  const match = /^(?:pub(?:\([^)]*\))?\s+)?([A-Za-z_][A-Za-z0-9_]*)$/.exec(
    fieldText,
  );

  return match && typeText ? { name: match[1], typeText } : null;
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
  new RegExp(`\\bfn\\s+${escapeRegex(functionName)}\\b`, "g");

const signatureStartIndex = (source: string, fnIndex: number) => {
  const lineStart = source.lastIndexOf("\n", fnIndex - 1) + 1;

  return skipWhitespace(source, lineStart);
};

const isTopLevelSignatureEnd = (char: string, depth: number) =>
  (char === "{" || char === ";") && depth === 0;

const findSignatureTerminator = (source: string, startIndex: number) => {
  let depth = 0;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (isTopLevelSignatureEnd(char, depth)) {
      return index;
    }

    depth = updateDepth(char, depth);
  }

  return -1;
};

const functionMatchIndex = (match: RegExpMatchArray) => match.index ?? -1;

const skipFunctionGenerics = (source: string, cursor: number) => {
  if (source[cursor] !== "<") {
    return cursor;
  }

  const genericEnd = findMatchingDelimiter(source, cursor, "<", ">");

  return genericEnd < 0 ? -1 : skipWhitespace(source, genericEnd + 1);
};

const hasFunctionParams = (source: string, cursor: number) =>
  cursor >= 0 && source[cursor] === "(";

const getFunctionParamsEnd = (source: string, cursor: number) =>
  hasFunctionParams(source, cursor)
    ? findMatchingDelimiter(source, cursor, "(", ")")
    : -1;

const getSignatureEnd = (source: string, cursor: number) => {
  const paramsEnd = getFunctionParamsEnd(source, cursor);

  return paramsEnd < 0 ? -1 : findSignatureTerminator(source, paramsEnd + 1);
};

const normalizedFunctionSignatureAt = (
  source: string,
  functionName: string,
  fnIndex: number,
  matchText: string,
) => {
  const nameEnd = fnIndex + matchText.length;
  let cursor = skipWhitespace(source, nameEnd);

  cursor = skipFunctionGenerics(source, cursor);
  const signatureEnd = getSignatureEnd(source, cursor);
  if (signatureEnd < 0) {
    return null;
  }

  return normalizeWhitespace(
    source.slice(signatureStartIndex(source, fnIndex), signatureEnd),
  );
};

const findFunctionSignature = (source: string, functionName: string) => {
  const matches = source.matchAll(functionPattern(functionName));

  for (const match of matches) {
    const fnIndex = functionMatchIndex(match);

    if (fnIndex < 0) {
      continue;
    }

    const signature = normalizedFunctionSignatureAt(
      source,
      functionName,
      fnIndex,
      match[0],
    );

    if (signature) {
      return signature;
    }
  }

  return null;
};

const methodSignatureFailures = (
  signature: string | null,
  methodName: string,
  requiredIncludes: string[],
) => {
  if (signature === null) {
    return [failure(methodName, `${methodName} method was not found.`)];
  }

  return missingSignatureSnippetFailures(signature, requiredIncludes);
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

const declarationWithAttributesPattern = (typeName: string) =>
  new RegExp(
    `((?:\\s*#\\[[\\s\\S]*?\\]\\s*)*)\\b(?:pub(?:\\([^)]*\\))?\\s+)?(?:struct|enum)\\s+${escapeRegex(typeName)}\\b`,
  );

const traitLeafName = (traitName: string) => {
  const parts = traitName.split("::");

  return parts[parts.length - 1] || traitName;
};

const hasDerivedTrait = (
  attributes: string,
  traitName: string,
) =>
  new RegExp(
    `#\\[\\s*derive\\s*\\([^)]*\\b${escapeRegex(traitLeafName(traitName))}\\b[^)]*\\)\\s*\\]`,
  ).test(attributes);

const runDerivedTraitForTypeCheck = (
  source: string,
  check: DerivedTraitForTypeCheck,
) => {
  const declaration = declarationWithAttributesPattern(check.typeName).exec(source);

  return declaration && hasDerivedTrait(declaration[1], check.traitName)
    ? []
    : [
        failure(
          check.traitName,
          `${check.typeName} should derive ${check.traitName}.`,
        ),
      ];
};

const runSourceIncludesCheck = (source: string, check: SourceIncludesCheck) => [
  ...missingSnippetFailures(source, check.requiredSnippets),
  ...forbiddenSnippetFailures(source, check.forbiddenSnippets ?? []),
];

const checkRunners = {
  derived_trait_for_type: runDerivedTraitForTypeCheck,
  enum_unit_variants: runEnumUnitVariantsCheck,
  function_signature: runFunctionSignatureCheck,
  impl_method: runImplMethodCheck,
  impl_trait_for_type: runImplTraitForTypeCheck,
  source_includes: runSourceIncludesCheck,
  struct_fields: runStructFieldsCheck,
  tuple_struct_fields: runTupleStructFieldsCheck,
};

const runStructuralCheck = (
  cleanSource: string,
  rawSource: string,
  check: StructuralCheck,
) =>
  check.type === "source_includes"
    ? runSourceIncludesCheck(rawSource, check)
    : checkRunners[check.type](cleanSource, check as never);

/** Runs authored source-shape checks against learner code. */
export const runStructuralChecks = (
  source: string,
  checks: StructuralCheck[],
) => {
  const cleanSource = stripRustComments(source);

  return checks.flatMap((check) => runStructuralCheck(cleanSource, source, check));
};
