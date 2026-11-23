import type { MockLink } from "@apollo/client/testing";
import {
  AddCvProjectDocument,
  type AddCvProjectInput,
  AvailableCvProjectsDocument,
  CvProjectsDocument,
  ProjectRolesDocument,
  RemoveCvProjectsDocument,
  UpdateCvProjectDocument,
  type UpdateCvProjectInput,
} from "@/shared/graphql";
import { DEFAULT_CV_PROJECTS_SORT } from "./cvProjects.constants";
import type { CatalogProject, CvProjectItem, ProjectRoleItem } from "./cvProjects.types";
import { toCvProjectsVariables } from "./utils";

// Mock data for tests and stories. The page itself never uses it: all CV projects come from the backend.

export const CV_ID = "cv-1";

const skill = (id: string, name: string) => ({
  __typename: "EnvironmentSkill" as const,
  id,
  name,
});

/** A catalog project; pass the fields that matter for the test. */
export function catalogProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    __typename: "Project",
    id: "project-1",
    name: "Blog",
    domain: "Blogging",
    startDate: "2025-01-01T00:00:00.000Z",
    endDate: "2026-12-31T00:00:00.000Z",
    description: "A blogging website.",
    environment: [skill("skill-1", "HTML5"), skill("skill-2", "CSS3")],
    ...overrides,
  };
}

export const blog = catalogProject();
export const bank = catalogProject({
  id: "project-2",
  name: "Online Bank",
  domain: "Finance",
  startDate: "2024-03-01T00:00:00.000Z",
  endDate: "2025-06-30T00:00:00.000Z",
  description: "An online banking application.",
  environment: [skill("skill-3", "React")],
});

/** A role of the catalog. */
export const role = (id: string, name: string): ProjectRoleItem => ({
  __typename: "ProjectRole",
  id,
  name,
});

export const developer = role("role-1", "Developer");
export const designer = role("role-2", "Designer");
export const sampleRoles: ProjectRoleItem[] = [developer, designer, role("role-3", "Tester")];

/** One project of the CV; pass the fields that matter for the test. */
export function cvProject(overrides: Partial<CvProjectItem> = {}): CvProjectItem {
  return {
    __typename: "CvProject",
    id: "link-1",
    cvId: CV_ID,
    startDate: "2025-02-01T00:00:00.000Z",
    endDate: "2025-11-30T00:00:00.000Z",
    responsibilities: "Built the pages.",
    roles: [developer],
    project: blog,
    ...overrides,
  };
}

/** A CV with two projects, in the order the backend sends them (name ascending). */
export const sampleCvProjects: CvProjectItem[] = [
  cvProject({
    id: "link-1",
    project: blog,
    responsibilities: "Built the pages.",
  }),
  cvProject({
    id: "link-2",
    project: bank,
    startDate: "2024-04-01T00:00:00.000Z",
    endDate: null,
    responsibilities: null,
    roles: [developer, designer],
  }),
];

const defaultVariables = toCvProjectsVariables(CV_ID, {
  search: "",
  sort: DEFAULT_CV_PROJECTS_SORT,
});

/** MockedProvider response of the `CvProjects` query. Without `variables` it answers the opening request. */
export const cvProjectsMock = (
  projects: CvProjectItem[] = sampleCvProjects,
  variables: object = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: CvProjectsDocument, variables },
  result: { data: { cvProjects: projects } },
});

/** The `CvProjects` query fails like a network error. */
export const cvProjectsNetworkErrorMock = (
  variables: object = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: CvProjectsDocument, variables },
  error: new Error("Failed to fetch"),
});

/**
 * MockedProvider response of the `AvailableCvProjects` query: the projects that the CV does not hold. The default is
 * the bank project, because the sample CV holds the blog project.
 */
export const availableCvProjectsMock = (
  projects: CatalogProject[] = [bank],
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: AvailableCvProjectsDocument, variables: { cvId } },
  result: { data: { availableCvProjects: projects } },
});

/** The `AvailableCvProjects` query is refused, like for a CV the user may not use (NOT_FOUND). */
export const availableCvProjectsRefusedMock = (
  code = "NOT_FOUND",
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: AvailableCvProjectsDocument, variables: { cvId } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** The `AvailableCvProjects` query fails like a network error. */
export const availableCvProjectsNetworkErrorMock = (cvId = CV_ID): MockLink.MockedResponse => ({
  request: { query: AvailableCvProjectsDocument, variables: { cvId } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of the `ProjectRoles` query. */
export const projectRolesMock = (
  roles: ProjectRoleItem[] = sampleRoles,
): MockLink.MockedResponse => ({
  request: { query: ProjectRolesDocument },
  result: { data: { projectRoles: roles } },
});

/** The `ProjectRoles` query fails like a network error. */
export const projectRolesNetworkErrorMock = (): MockLink.MockedResponse => ({
  request: { query: ProjectRolesDocument },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `addCvProject`: the new CV project, built from the input. */
export const addCvProjectMock = (
  input: AddCvProjectInput,
  added: CvProjectItem,
): MockLink.MockedResponse => ({
  request: { query: AddCvProjectDocument, variables: { input } },
  result: { data: { addCvProject: added } },
});

/** The extensions of a refused request: the code and, for `BAD_USER_INPUT`, the fields the backend rejected. */
const refusal = (code: string, fields: string[] = []) => ({
  code,
  ...(fields.length > 0
    ? { fieldErrors: fields.map((field) => ({ field, messages: [`${field} is invalid`] })) }
    : {}),
});

/** `addCvProject` refused with a GraphQL error code, for example `CONFLICT` or `BAD_USER_INPUT` with `fields`. */
export const addCvProjectRefusedMock = (
  input: AddCvProjectInput,
  code: string,
  fields?: string[],
): MockLink.MockedResponse => ({
  request: { query: AddCvProjectDocument, variables: { input } },
  result: { errors: [{ message: code, extensions: refusal(code, fields) }] },
});

/** `addCvProject` that fails before the backend answers. */
export const addCvProjectNetworkErrorMock = (
  input: AddCvProjectInput,
): MockLink.MockedResponse => ({
  request: { query: AddCvProjectDocument, variables: { input } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `updateCvProject`: the CV project as it is after the change. */
export const updateCvProjectMock = (
  input: UpdateCvProjectInput,
  updated: CvProjectItem,
): MockLink.MockedResponse => ({
  request: { query: UpdateCvProjectDocument, variables: { input } },
  result: { data: { updateCvProject: updated } },
});

/** `updateCvProject` refused with a GraphQL error code, with the rejected `fields` for `BAD_USER_INPUT`. */
export const updateCvProjectRefusedMock = (
  input: UpdateCvProjectInput,
  code: string,
  fields?: string[],
): MockLink.MockedResponse => ({
  request: { query: UpdateCvProjectDocument, variables: { input } },
  result: { errors: [{ message: code, extensions: refusal(code, fields) }] },
});

/** `updateCvProject` that fails before the backend answers. */
export const updateCvProjectNetworkErrorMock = (
  input: UpdateCvProjectInput,
): MockLink.MockedResponse => ({
  request: { query: UpdateCvProjectDocument, variables: { input } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `removeCvProjects` for these link ids. */
export const removeCvProjectsMock = (ids: string[], cvId = CV_ID): MockLink.MockedResponse => ({
  request: { query: RemoveCvProjectsDocument, variables: { input: { cvId, ids } } },
  result: { data: { removeCvProjects: true } },
});

/** `removeCvProjects` refused with a GraphQL error code. */
export const removeCvProjectsRefusedMock = (
  ids: string[],
  code: string,
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: RemoveCvProjectsDocument, variables: { input: { cvId, ids } } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** `removeCvProjects` that fails before the backend answers. */
export const removeCvProjectsNetworkErrorMock = (
  ids: string[],
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: RemoveCvProjectsDocument, variables: { input: { cvId, ids } } },
  error: new Error("Failed to fetch"),
});
