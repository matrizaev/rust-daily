export const PLACEHOLDER_MARKER = "TODO(author):";

export const placeholder = (text) => `${PLACEHOLDER_MARKER} ${text}`;

const unique = (values) => [...new Set(values)];

const allDependencySets = ["std", "advanced"];

const defaultStarterTemplate = () => `pub fn todo_lesson() {
    todo!("${placeholder("replace starter code")}");
}
`;

const defaultSolutionTemplate = () => `pub fn todo_lesson() {
    todo!("${placeholder("replace solution code")}");
}
`;

const defaultTestTemplate = () => `#[test]
fn public_behavior_is_authored() {
    panic!("${placeholder("replace this test")}");
}
`;

const defaultCompileFailCaseTemplate = () => `compile_error!("${placeholder("replace compile-fail case")}");
`;

const ownedApiTemplate = () => `#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ApiRequest {
    path: String,
    body: String,
}

impl ApiRequest {
    pub fn new(path: String, body: String) -> Self {
        todo!("${placeholder("validate and store owned request data")}");
    }

    pub fn into_parts(self) -> (String, String) {
        todo!("${placeholder("consume self and return owned parts without extra clones")}");
    }
}
`;

const ownedApiTestTemplate = () => `use rust_daily_lesson::ApiRequest;

#[test]
fn public_api_makes_ownership_explicit() {
    let request = ApiRequest::new(String::from("/users"), String::from("{}"));
    let (_path, _body) = request.into_parts();

    panic!("${placeholder("assert owned values move out through the public API")}");
}
`;

const borrowedApiTemplate = () => `#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigDocument {
    source: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ConfigView<'a> {
    pub name: &'a str,
    pub source: &'a str,
}

impl ConfigDocument {
    pub fn new(source: String) -> Self {
        Self { source }
    }

    pub fn view(&self) -> ConfigView<'_> {
        todo!("${placeholder("return borrowed data tied to self")}");
    }

    pub fn lines(&self) -> impl Iterator<Item = &str> + '_ {
        todo!("${placeholder("iterate over borrowed lines without allocating")}");
    }
}
`;

const borrowedApiTestTemplate = () => `use rust_daily_lesson::ConfigDocument;

#[test]
fn public_api_borrows_from_the_document() {
    let document = ConfigDocument::new(String::from("name=demo\\nmode=test"));
    let _view = document.view();
    let _lines: Vec<&str> = document.lines().collect();

    panic!("${placeholder("assert borrowed output remains usable while document lives")}");
}
`;

const asyncPortTemplate = () => `#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterCommand {
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserId(pub String);

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum RegisterError {
    #[error("invalid command")]
    InvalidCommand,
    #[error("repository failed")]
    Repository,
}

pub trait UserRepository {
    async fn save(&self, command: RegisterCommand) -> Result<UserId, RegisterError>;
}

pub async fn register_user(
    repository: &impl UserRepository,
    command: RegisterCommand,
) -> Result<UserId, RegisterError> {
    todo!("${placeholder("call the async port without hiding ownership or failure")}");
}
`;

const asyncPortTestTemplate = () => `use rust_daily_lesson::{register_user, RegisterCommand, RegisterError, UserId, UserRepository};

struct FakeRepository;

impl UserRepository for FakeRepository {
    async fn save(&self, _command: RegisterCommand) -> Result<UserId, RegisterError> {
        Ok(UserId(String::from("user-1")))
    }
}

#[tokio::test]
async fn public_behavior_is_authored() {
    let repository = FakeRepository;
    let command = RegisterCommand {
        email: String::from("a@example.com"),
    };

    let _result = register_user(&repository, command).await;
    panic!("${placeholder("assert async success and one authored failure path")}");
}
`;

const actixBoundaryTemplate = () => `use actix_web::{web, HttpResponse, Responder};

#[derive(Debug, Clone)]
pub struct AppState {
    pub service_name: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct RegisterUserDto {
    pub email: String,
}

#[derive(Debug, serde::Serialize)]
pub struct RegisterUserResponse {
    pub id: String,
}

pub async fn register_user_handler(
    state: web::Data<AppState>,
    payload: web::Json<RegisterUserDto>,
) -> impl Responder {
    let _ = (state, payload);

    HttpResponse::Created().json(RegisterUserResponse {
        id: todo!("${placeholder("map use-case result into an HTTP response body")}"),
    })
}
`;

const actixBoundaryTestTemplate = () => `use actix_web::{test, web, App};
use rust_daily_lesson::{register_user_handler, AppState};

#[actix_rt::test]
async fn public_behavior_is_authored() {
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(AppState {
                service_name: String::from("users"),
            }))
            .route("/users", web::post().to(register_user_handler)),
    )
    .await;

    let _ = app;
    panic!("${placeholder("assert status code and response mapping")}");
}
`;

const errorMappingTemplate = () => `#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("invalid email")]
    InvalidEmail,
}

#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("duplicate key")]
    Duplicate,
    #[error("storage unavailable")]
    Unavailable,
}

#[derive(Debug, thiserror::Error)]
pub enum BoundaryError {
    #[error("bad request")]
    BadRequest(#[source] DomainError),
    #[error("dependency failed")]
    Dependency(#[source] RepositoryError),
}

impl From<DomainError> for BoundaryError {
    fn from(error: DomainError) -> Self {
        todo!("${placeholder("map domain errors without losing their source")}");
    }
}

impl From<RepositoryError> for BoundaryError {
    fn from(error: RepositoryError) -> Self {
        todo!("${placeholder("map repository errors into public boundary categories")}");
    }
}
`;

const errorMappingTestTemplate = () => `use rust_daily_lesson::{BoundaryError, DomainError, RepositoryError};

#[test]
fn public_behavior_is_authored() {
    let _domain: BoundaryError = DomainError::InvalidEmail.into();
    let _repository: BoundaryError = RepositoryError::Unavailable.into();

    panic!("${placeholder("assert variants, sources, and public classification")}");
}
`;

const propertyTestTemplate = () => `#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PercentageError;

impl Percentage {
    pub fn new(value: u8) -> Result<Self, PercentageError> {
        todo!("${placeholder("enforce the percentage invariant")}");
    }

    pub fn get(self) -> u8 {
        self.0
    }
}
`;

const propertyPublicTestTemplate = () => `use proptest::prelude::*;
use rust_daily_lesson::Percentage;

#[test]
fn accepts_named_boundary_examples() {
    panic!("${placeholder("assert named examples before relying on properties")}");
}

proptest! {
    #[test]
    fn accepted_values_stay_inside_the_public_invariant(value in 0u8..=100) {
        let percentage = Percentage::new(value).expect("valid percentage");

        prop_assert_eq!(percentage.get(), value);
    }
}
`;

const compileFailTemplate = () => `#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Token(String);

impl Token {
    pub fn parse(raw: String) -> Self {
        todo!("${placeholder("validate and store token data")}");
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}
`;

const compileFailPublicTestTemplate = () => `use rust_daily_lesson::Token;

#[test]
fn valid_public_use_still_compiles_and_runs() {
    let token = Token::parse(String::from("secret"));
    let _borrowed = token.as_str();

    panic!("${placeholder("assert valid API use while invalid use is compile-fail tested")}");
}
`;

const compileFailCaseTemplate = () => `use rust_daily_lesson::Token;

fn main() {
    let token = Token::parse(String::from("secret"));
    let leaked: &'static str = token.as_str();
    let _ = leaked;
}
`;

const notesPrompts = {
  conceptBoundary: "name the single concept this lesson teaches.",
  intendedSolution: "describe the idiomatic design move expected.",
  validationStrategy: "explain what structural, Cargo, and compile-fail checks prove.",
  commonWrongSolutions: "list shortcuts or over-generalizations authors should reject.",
  arcContinuity: "state which prior behavior must remain active.",
  reviewChecklist: "confirm task text, starter code, tests, hints, and solution align.",
};

const withNotes = (overrides) => ({
  ...notesPrompts,
  ...overrides,
});

const preset = ({
  id,
  description,
  defaultDependencySet,
  allowedDependencySets = [defaultDependencySet],
  structural = false,
  starterTemplate,
  solutionTemplate = starterTemplate,
  testTemplate = defaultTestTemplate,
  compileFailTemplate: compileFailTemplateFn = defaultCompileFailCaseTemplate,
  compileFailCases = [],
  readonlyDefaults = [],
  notes = {},
}) => ({
  id,
  description,
  defaultDependencySet,
  allowedDependencySets,
  structural,
  starterTemplate,
  solutionTemplate,
  testTemplate,
  compileFailTemplate: compileFailTemplateFn,
  compileFailCases,
  readonlyDefaults,
  notes: withNotes(notes),
});

const DEFAULT_SCAFFOLD_PRESET = preset({
  id: "default",
  description: "Generic lesson scaffold.",
  defaultDependencySet: null,
  allowedDependencySets: allDependencySets,
  starterTemplate: defaultStarterTemplate,
  solutionTemplate: defaultSolutionTemplate,
});

const PRESET_REGISTRY = [
  preset({
    id: "advanced-owned-api",
    description: "Owned-value public API surface with move and clone decisions.",
    defaultDependencySet: "std",
    allowedDependencySets: allDependencySets,
    structural: true,
    starterTemplate: ownedApiTemplate,
    testTemplate: ownedApiTestTemplate,
    notes: {
      conceptBoundary: "name the ownership choice this API lesson isolates.",
      intendedSolution: "explain where values move, where clones are justified, and why.",
    },
  }),
  preset({
    id: "advanced-borrowed-api",
    description: "Borrowed views, slices, lifetimes, or iterator-returning APIs.",
    defaultDependencySet: "std",
    allowedDependencySets: allDependencySets,
    structural: true,
    starterTemplate: borrowedApiTemplate,
    testTemplate: borrowedApiTestTemplate,
    notes: {
      conceptBoundary: "name the borrowed API boundary and lifetime relationship.",
      commonWrongSolutions: "list owned-return or over-generic lifetime shortcuts to reject.",
    },
  }),
  preset({
    id: "advanced-async-port",
    description: "Async application function over explicit ports and fakes.",
    defaultDependencySet: "advanced",
    structural: true,
    starterTemplate: asyncPortTemplate,
    testTemplate: asyncPortTestTemplate,
    notes: {
      intendedSolution: "describe port ownership, async boundary, and failure propagation.",
      validationStrategy: "name deterministic async success and failure checks.",
    },
  }),
  preset({
    id: "advanced-actix-boundary",
    description: "Actix handler, DTO, state, and response-mapping boundary.",
    defaultDependencySet: "advanced",
    structural: true,
    starterTemplate: actixBoundaryTemplate,
    testTemplate: actixBoundaryTestTemplate,
    notes: {
      intendedSolution: "separate handler work from domain or use-case work.",
      validationStrategy: "name status, body, DTO conversion, and state checks.",
    },
  }),
  preset({
    id: "advanced-error-mapping",
    description: "Map domain, repository, use-case, and boundary errors deliberately.",
    defaultDependencySet: "advanced",
    structural: true,
    starterTemplate: errorMappingTemplate,
    testTemplate: errorMappingTestTemplate,
    notes: {
      conceptBoundary: "name the exact boundary where error meaning changes.",
      validationStrategy: "explain variant, source-chain, and public classification checks.",
    },
  }),
  preset({
    id: "advanced-property-test",
    description: "Property tests plus named examples for invariant-bearing public behavior.",
    defaultDependencySet: "advanced",
    starterTemplate: propertyTestTemplate,
    testTemplate: propertyPublicTestTemplate,
    notes: {
      conceptBoundary: "name the invariant that property tests exercise.",
      validationStrategy: "define generators, named cases, and shrinking-friendly limits.",
    },
  }),
  preset({
    id: "advanced-compile-fail",
    description: "Public API contract with valid-use tests and invalid-use compile failure.",
    defaultDependencySet: "std",
    allowedDependencySets: allDependencySets,
    structural: true,
    starterTemplate: compileFailTemplate,
    testTemplate: compileFailPublicTestTemplate,
    compileFailCases: ["public-contract"],
    compileFailTemplate: compileFailCaseTemplate,
    notes: {
      conceptBoundary: "name the compile-time API contract.",
      validationStrategy: "record expected diagnostic snippets and valid-use Cargo tests.",
    },
  }),
];

const presetById = new Map(PRESET_REGISTRY.map((record) => [record.id, record]));

const presetIds = () => PRESET_REGISTRY.map((record) => record.id);

const findPreset = (id) => presetById.get(id) ?? null;

const acceptedPresetList = () => presetIds().join(", ");

export const formatPresetList = () =>
  PRESET_REGISTRY.map((record) => `- ${record.id}: ${record.description}`).join("\n");

const compileFailCasesForPreset = (options, selectedPreset) =>
  options.compileFail.length > 0 ? [] : selectedPreset.compileFailCases;

const validatePresetDependencySet = (options, selectedPreset, errors) => {
  if (options.dependencySet === undefined) {
    return;
  }

  if (selectedPreset.allowedDependencySets.includes(options.dependencySet)) {
    return;
  }

  errors.push(
    `${selectedPreset.id} allows dependency sets: ${selectedPreset.allowedDependencySets.join(", ")}.`,
  );
};

const defaultPresetOptions = (options) => ({
  ...options,
  scaffoldPreset: DEFAULT_SCAFFOLD_PRESET,
  readonly: unique(options.readonly),
  compileFail: unique(options.compileFail),
});

const unknownPresetOptions = (options, errors) => {
  errors.push(`Unknown preset ${options.preset}. Accepted presets: ${acceptedPresetList()}.`);

  return defaultPresetOptions(options);
};

const knownPresetOptions = (options, selectedPreset, errors) => {
  validatePresetDependencySet(options, selectedPreset, errors);

  return {
    ...options,
    dependencySet: options.dependencySet ?? selectedPreset.defaultDependencySet,
    scaffoldPreset: selectedPreset,
    structural: options.structural || selectedPreset.structural,
    readonly: unique([...selectedPreset.readonlyDefaults, ...options.readonly]),
    compileFail: unique([
      ...compileFailCasesForPreset(options, selectedPreset),
      ...options.compileFail,
    ]),
  };
};

export const applyPresetDefaults = (options, errors) => {
  if (!options.preset) {
    return defaultPresetOptions(options);
  }

  const selectedPreset = findPreset(options.preset);

  return selectedPreset
    ? knownPresetOptions(options, selectedPreset, errors)
    : unknownPresetOptions(options, errors);
};

const noteSection = (title, body) => `## ${title}

${placeholder(body)}
`;

export const notesTemplate = (selectedPreset = DEFAULT_SCAFFOLD_PRESET) => `# Author Notes

${noteSection("Concept Boundary", selectedPreset.notes.conceptBoundary)}
${noteSection("Intended Solution", selectedPreset.notes.intendedSolution)}
${noteSection("Validation Strategy", selectedPreset.notes.validationStrategy)}
${noteSection("Common Wrong Solutions", selectedPreset.notes.commonWrongSolutions)}
${noteSection("Arc Continuity", selectedPreset.notes.arcContinuity)}
${noteSection("Review Checklist", selectedPreset.notes.reviewChecklist)}`;
