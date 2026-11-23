import type { MockLink } from "@apollo/client/testing";
import {
  CreateLanguageDocument,
  DeleteLanguageDocument,
  LanguagesDocument,
  type LanguagesQuery,
  UpdateLanguageDocument,
} from "@/shared/graphql";
import { createCatalogMocks } from "../../catalogs.mocks";
import { LANGUAGE_SORT_FIELDS } from "./languages.constants";
import type { LanguageInput, LanguageListItem } from "./languages.types";

const language = (id: string, name: string, iso: string, nativeName: string): LanguageListItem => ({
  __typename: "Language",
  id,
  name,
  iso,
  nativeName,
});

/** Two letters from the number in a generated id (`gen-01` → "AB"), so generated rows have different ISO codes. */
function generatedIso(id: string): string {
  const number = Number(id.replace(/\D/g, ""));
  const letter = (index: number) => String.fromCharCode(65 + (index % 26));
  return letter(Math.floor(number / 26)) + letter(number);
}

// The shared factory gives the list, delete and stand-in backend mocks. Its create and update mocks send only a name,
// so the language ones (name + ISO code + native name) are below.
const mocks = createCatalogMocks({
  noun: "Language",
  generatedName: "Language",
  listDocument: LanguagesDocument,
  createDocument: CreateLanguageDocument,
  updateDocument: UpdateLanguageDocument,
  deleteDocument: DeleteLanguageDocument,
  item: (id, name) => language(id, name, generatedIso(id), name),
  listData: (items, total): LanguagesQuery => ({
    languages: { __typename: "LanguagePage", items, total },
  }),
  createData: (created) => ({ createLanguage: created }),
  updateData: (saved) => ({ updateLanguage: saved }),
  deleteData: () => ({ deleteLanguage: true }),
  sortValue: (row, field) => (field === LANGUAGE_SORT_FIELDS.iso ? row.iso : row.name),
});

export const english = language("1", "English", "EN", "English");
export const german = language("2", "German", "DE", "Deutsch");
export const polish = language("3", "Polish", "PL", "Polski");

export const defaultVariables = mocks.defaultVariables;
export const variablesFor = mocks.variablesFor;
export const fakeBackendMock = mocks.fakeBackendMock;
export const languagesMock = mocks.listMock;
export const languagesErrorMock = mocks.listErrorMock;
export const manyLanguages = mocks.many;
export const deleteLanguageMock = mocks.deleteMock;
export const deleteLanguageRefusedMock = mocks.deleteRefusedMock;
export const deleteLanguageNetworkErrorMock = mocks.deleteNetworkErrorMock;

interface RefusalOptions {
  code?: string;
  message?: string;
  /** Refines the code, as the backend does for a taken ISO code (`ISO_TAKEN`, D16). */
  reason?: string;
}

/** A GraphQL error as the backend sends it (PLAN D7), with the optional `reason`. */
const refused = ({
  code = "CONFLICT",
  message = "Language already exists",
  reason,
}: RefusalOptions) => ({
  errors: [{ message, extensions: reason ? { code, reason } : { code } }],
});

/** The refusal of a taken ISO code, as the backend sends it. */
export const ISO_TAKEN: RefusalOptions = {
  code: "CONFLICT",
  message: "ISO code already exists",
  reason: "ISO_TAKEN",
};

const createRequest = (input: LanguageInput) => ({
  query: CreateLanguageDocument,
  variables: { input },
});

/** The create mutation: the backend returns the new language with an id. */
export const createLanguageMock = (
  input: LanguageInput,
  id = "new-1",
): MockLink.MockedResponse => ({
  request: createRequest(input),
  result: { data: { createLanguage: language(id, input.name, input.iso, input.nativeName) } },
});

/** The create mutation refused: by default `CONFLICT`, the name is taken (`ISO_TAKEN`: the ISO code is taken). */
export const createLanguageRefusedMock = (
  input: LanguageInput,
  options: RefusalOptions = {},
): MockLink.MockedResponse => ({
  request: createRequest(input),
  result: refused(options),
});

/** The create mutation that fails before the backend answers (no network). */
export const createLanguageNetworkErrorMock = (input: LanguageInput): MockLink.MockedResponse => ({
  request: createRequest(input),
  error: new Error("Failed to fetch"),
});

const updateRequest = (id: string, input: LanguageInput) => ({
  query: UpdateLanguageDocument,
  variables: { input: { id, ...input } },
});

/** The update mutation: the backend returns the saved language. */
export const updateLanguageMock = (id: string, input: LanguageInput): MockLink.MockedResponse => ({
  request: updateRequest(id, input),
  result: { data: { updateLanguage: language(id, input.name, input.iso, input.nativeName) } },
});

/** The update mutation refused: by default `CONFLICT`, another language has the name. */
export const updateLanguageRefusedMock = (
  id: string,
  input: LanguageInput,
  options: RefusalOptions = {},
): MockLink.MockedResponse => ({
  request: updateRequest(id, input),
  result: refused(options),
});
