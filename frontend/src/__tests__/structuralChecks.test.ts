import { describe, expect, it } from "vitest";
import { runStructuralChecks } from "../validation/structuralChecks";
import type { StructuralCheck } from "../types/validation";

const validSource = `
// special marker for source_includes
#[derive(Debug, Clone, PartialEq)]
pub struct User {
    pub id: u64,
    name: Option<String>,
    tags: Vec<Result<String, String>>,
}

pub struct Percentage(pub(crate) u8);

pub enum Role {
    Admin,
    User(String),
    Guest { name: String },
}

impl User {
    pub fn new<'a>(name: &'a str, id: u64) -> Self {
        Self { id, name: Some(name.to_owned()), tags: Vec::new() }
    }
}

impl std::fmt::Display for User {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}", self.id)
    }
}

pub enum Error {
    Invalid,
}

pub fn parse_user(input: &str) -> Result<User, Error> {
    Ok(User::new(input, 1))
}
`;

const passingChecks: StructuralCheck[] = [
  {
    type: "enum_unit_variants",
    enumName: "Role",
    requiredVariants: ["Admin", "User", "Guest"],
  },
  {
    type: "struct_fields",
    structName: "User",
    requiredFields: [
      { name: "id", typeIncludes: ["u64"] },
      { name: "name", typeIncludes: ["Option", "String"] },
      { name: "tags", typeIncludes: ["Vec", "Result<String, String>"] },
    ],
  },
  {
    type: "tuple_struct_fields",
    structName: "Percentage",
    requiredTypes: ["u8"],
  },
  {
    type: "derived_trait_for_type",
    traitName: "std::fmt::Debug",
    typeName: "User",
  },
  {
    type: "impl_trait_for_type",
    traitName: "std::fmt::Display",
    typeName: "User",
  },
  {
    type: "impl_method",
    implFor: "User",
    methodName: "new",
    requiredSignatureIncludes: ["fn new", "&str", "-> Self"],
  },
  {
    type: "function_signature",
    functionName: "parse_user",
    requiredSignatureIncludes: ["fn parse_user", "&str", "Result<User, Error>"],
  },
  {
    type: "source_includes",
    requiredSnippets: ["special marker"],
    forbiddenSnippets: ["todo!"],
  },
];

describe("runStructuralChecks", () => {
  it("accepts all supported structural checks", () => {
    expect(runStructuralChecks(validSource, passingChecks)).toEqual([]);
  });

  it("reports missing items and forbidden snippets", () => {
    const failures = runStructuralChecks(
      "pub enum Empty {}\n// Money should not count as identifier use\n",
      [
        {
          type: "enum_unit_variants",
          enumName: "MissingEnum",
          requiredVariants: ["A"],
        },
        {
          type: "enum_unit_variants",
          enumName: "Empty",
          requiredVariants: ["A"],
        },
        {
          type: "struct_fields",
          structName: "Money",
          requiredFields: [{ name: "amount", typeIncludes: ["u64"] }],
        },
        {
          type: "tuple_struct_fields",
          structName: "Id",
          requiredTypes: ["u64"],
        },
        {
          type: "derived_trait_for_type",
          traitName: "Clone",
          typeName: "Money",
        },
        {
          type: "impl_trait_for_type",
          traitName: "Display",
          typeName: "Money",
        },
        {
          type: "impl_method",
          implFor: "Money",
          methodName: "new",
          requiredSignatureIncludes: ["fn new"],
        },
        {
          type: "function_signature",
          functionName: "parse_money",
          requiredSignatureIncludes: ["Result"],
        },
        {
          type: "source_includes",
          requiredSnippets: ["required text"],
          forbiddenSnippets: ["Money"],
        },
      ],
    );

    expect(failures.map((failure) => failure.name)).toEqual([
      "MissingEnum",
      "Empty",
      "A",
      "Money",
      "Id",
      "Clone",
      "Display",
      "Money",
      "parse_money",
      "required text",
      "Money",
    ]);
  });

  it("handles tuple field count and signature mismatch failures", () => {
    const failures = runStructuralChecks(
      `
      pub struct Id(u64, String);
      impl Id {
          pub fn new(value: u64) -> Self { Self(value, String::new()) }
      }
      `,
      [
        {
          type: "tuple_struct_fields",
          structName: "Id",
          requiredTypes: ["u64"],
        },
        {
          type: "impl_method",
          implFor: "Id",
          methodName: "new",
          requiredSignatureIncludes: ["&str"],
        },
      ],
    );

    expect(failures).toEqual([
      {
        name: "Id",
        message: "Id should have 1 tuple field(s).",
      },
      {
        name: "&str",
        message: "Missing required snippet: &str.",
      },
    ]);
  });

  it("finds methods in later inherent impl blocks", () => {
    const failures = runStructuralChecks(
      `
      pub struct Money;

      impl Money {
          pub fn new() -> Self { Self }
      }

      impl Money {
          pub fn checked_add(self, rhs: Self) -> Result<Self, ()> {
              let _ = rhs;
              Ok(self)
          }
      }
      `,
      [
        {
          type: "impl_method",
          implFor: "Money",
          methodName: "checked_add",
          requiredSignatureIncludes: [
            "pub fn checked_add",
            "rhs: Self",
            "Result<Self, ()>",
          ],
        },
      ],
    );

    expect(failures).toEqual([]);
  });
});
