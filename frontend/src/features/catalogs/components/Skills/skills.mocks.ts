import type { MockLink } from "@apollo/client/testing";
import {
  CreateSkillDocument,
  DeleteSkillDocument,
  SkillCatalogDocument,
  type SkillCatalogQuery,
  SkillCategoriesDocument,
  UpdateSkillDocument,
} from "@/shared/graphql";
import { createCatalogMocks } from "../../catalogs.mocks";
import type { SkillCategoryItem, SkillInput, SkillListItem } from "./skills.types";

const category = (id: string, name: string, type: string): SkillCategoryItem => ({
  __typename: "SkillCategory",
  id,
  name,
  type,
});

export const frontendCategory = category("c1", "Frontend", "Technology");
export const databasesCategory = category("c2", "Databases", "Technology");
export const toolsCategory = category("c3", "Tools", "Tool");
export const sampleCategories = [databasesCategory, frontendCategory, toolsCategory];

const skill = (
  id: string,
  name: string,
  skillCategory: SkillCategoryItem = frontendCategory,
): SkillListItem => ({ __typename: "Skill", id, name, category: skillCategory });

// The shared factory gives the list, delete and stand-in backend mocks. Its create and update mocks send only a name,
// so the skill ones (name + category) are below.
const mocks = createCatalogMocks({
  noun: "Skill",
  generatedName: "Skill",
  listDocument: SkillCatalogDocument,
  createDocument: CreateSkillDocument,
  updateDocument: UpdateSkillDocument,
  deleteDocument: DeleteSkillDocument,
  item: (id, name) => skill(id, name),
  listData: (items, total): SkillCatalogQuery => ({
    skillCatalog: { __typename: "SkillPage", items, total },
  }),
  createData: (created) => ({ createSkill: created }),
  updateData: (saved) => ({ updateSkill: saved }),
  deleteData: () => ({ deleteSkill: true }),
});

export const react = skill("1", "React", frontendCategory);
export const postgres = skill("2", "PostgreSQL", databasesCategory);
export const git = skill("3", "Git", toolsCategory);

export const defaultVariables = mocks.defaultVariables;
export const variablesFor = mocks.variablesFor;
export const fakeBackendMock = mocks.fakeBackendMock;
export const skillsMock = mocks.listMock;
export const skillsErrorMock = mocks.listErrorMock;
export const manySkills = mocks.many;
export const deleteSkillMock = mocks.deleteMock;
export const deleteSkillRefusedMock = mocks.deleteRefusedMock;
export const deleteSkillNetworkErrorMock = mocks.deleteNetworkErrorMock;

/** A GraphQL error as the backend sends it. `field` adds the field error of a `BAD_USER_INPUT` error (PLAN D7). */
const refused = (code: string, message: string, field?: string) => ({
  errors: [
    {
      message,
      extensions: field ? { code, fieldErrors: [{ field, messages: [message] }] } : { code },
    },
  ],
});

interface RefusalOptions {
  code?: string;
  message?: string;
  /** The input field the backend names in a `BAD_USER_INPUT` error, for example `categoryId`. */
  field?: string;
}

const categoryById = (id: string) =>
  sampleCategories.find((option) => option.id === id) ?? frontendCategory;

/** MockedProvider response of the Category options. */
export const skillCategoriesMock = (
  categories: SkillCategoryItem[] = sampleCategories,
): MockLink.MockedResponse => ({
  request: { query: SkillCategoriesDocument },
  result: { data: { skillCategories: categories } },
});

/** The Category options request that fails before the backend answers (no network). */
export const skillCategoriesNetworkErrorMock = (): MockLink.MockedResponse => ({
  request: { query: SkillCategoriesDocument },
  error: new Error("Failed to fetch"),
});

const createRequest = (input: SkillInput) => ({
  query: CreateSkillDocument,
  variables: { input },
});

/** The create mutation: the backend returns the new skill with an id and the chosen category. */
export const createSkillMock = (input: SkillInput, id = "new-1"): MockLink.MockedResponse => ({
  request: createRequest(input),
  result: { data: { createSkill: skill(id, input.name, categoryById(input.categoryId)) } },
});

/** The create mutation refused: by default `CONFLICT`, the name is taken. */
export const createSkillRefusedMock = (
  input: SkillInput,
  { code = "CONFLICT", message = "Skill already exists", field }: RefusalOptions = {},
): MockLink.MockedResponse => ({
  request: createRequest(input),
  result: refused(code, message, field),
});

/** The create mutation that fails before the backend answers (no network). */
export const createSkillNetworkErrorMock = (input: SkillInput): MockLink.MockedResponse => ({
  request: createRequest(input),
  error: new Error("Failed to fetch"),
});

const updateRequest = (id: string, input: SkillInput) => ({
  query: UpdateSkillDocument,
  variables: { input: { id, ...input } },
});

/** The update mutation: the backend returns the saved skill with its category. */
export const updateSkillMock = (id: string, input: SkillInput): MockLink.MockedResponse => ({
  request: updateRequest(id, input),
  result: { data: { updateSkill: skill(id, input.name, categoryById(input.categoryId)) } },
});

/** The update mutation refused: by default `CONFLICT`, another skill has the name. */
export const updateSkillRefusedMock = (
  id: string,
  input: SkillInput,
  { code = "CONFLICT", message = "Skill already exists", field }: RefusalOptions = {},
): MockLink.MockedResponse => ({
  request: updateRequest(id, input),
  result: refused(code, message, field),
});
