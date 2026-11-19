import type { MockLink } from "@apollo/client/testing";
import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import {
  CreateDepartmentDocument,
  DeleteDepartmentDocument,
  DepartmentsDocument,
  type DepartmentsQuery,
  type DepartmentsQueryVariables,
  UpdateDepartmentDocument,
} from "@/shared/graphql";
import { DEFAULT_CATALOG_SORT } from "../../catalogs.constants";
import type { DepartmentListItem } from "./departments.types";

const department = (id: string, name: string): DepartmentListItem => ({
  __typename: "Department",
  id,
  name,
});

export const engineering = department("1", "Engineering");
export const finance = department("2", "Finance");
export const marketing = department("3", "Marketing");

/** The variables of the first request of the page: page 1 of 10 rows, sorted by name ascending. No search: it is left out. */
export const defaultVariables: DepartmentsQueryVariables = {
  page: { number: 1, size: 10 },
  sort: DEFAULT_CATALOG_SORT,
};

/** Variables for a search, a sort or a page. A MockedProvider answers only a request with the same variables. */
export const variablesFor = (
  changes: Partial<DepartmentsQueryVariables> = {},
): DepartmentsQueryVariables => ({ ...defaultVariables, ...changes });

export const departmentsData = (
  items: DepartmentListItem[],
  total = items.length,
): DepartmentsQuery => ({
  departments: { __typename: "DepartmentPage", items, total },
});

interface MockOptions {
  variables?: DepartmentsQueryVariables;
  /** Number of departments on all pages (default: the number of items). */
  total?: number;
}

/** MockedProvider response of the `Departments` query. */
export const departmentsMock = (
  items: DepartmentListItem[],
  { variables = defaultVariables, total }: MockOptions = {},
): MockLink.MockedResponse => ({
  request: { query: DepartmentsDocument, variables },
  result: { data: departmentsData(items, total) },
});

/** MockedProvider response of a failed `Departments` query (a network error). */
export const departmentsErrorMock = (
  variables: DepartmentsQueryVariables = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: DepartmentsDocument, variables },
  error: new Error("Failed to fetch"),
});

/** Departments named `Department 01` … for a list of more than one page. */
export const manyDepartments = (count: number): DepartmentListItem[] =>
  Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return department(`gen-${number}`, `Department ${number}`);
  });

/**
 * A stand-in for the backend, for stories: it answers every request, whatever the search, the sort or the page, with
 * the rules of the real backend (search in the name without regard to case, sort by name, ascending by default, 10 rows
 * on a page). It lives here, in the mocks, so a story works when the user types or clicks. The page never filters,
 * sorts or cuts pages itself.
 */
export const fakeBackendMock = (all: DepartmentListItem[]): MockLink.MockedResponse => ({
  // A function for `variables` matches every request (Apollo Client 4); the mock is reused without a limit.
  request: { query: DepartmentsDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: DepartmentsQueryVariables) => {
    const search = variables.search?.trim().toLowerCase();
    const matching = search ? all.filter((item) => item.name.toLowerCase().includes(search)) : all;
    const direction = variables.sort?.direction === "DESC" ? -1 : 1;
    const sorted = [...matching].sort((a, b) => a.name.localeCompare(b.name) * direction);
    const number = variables.page.number ?? 1;
    const size = variables.page.size ?? DEFAULT_PAGE_SIZE;
    return {
      data: departmentsData(sorted.slice((number - 1) * size, number * size), matching.length),
    };
  },
});

/** A GraphQL error as the backend sends it, for example `CONFLICT` for a taken name or a department in use. */
const refused = (code: string, message: string) => ({
  errors: [{ message, extensions: { code } }],
});

/** MockedProvider response of `createDepartment`: the backend returns the new department with an id. */
export const createDepartmentMock = (name: string, id = "new-1"): MockLink.MockedResponse => ({
  request: { query: CreateDepartmentDocument, variables: { input: { name } } },
  result: { data: { createDepartment: department(id, name) } },
});

/** `createDepartment` refused: by default `CONFLICT`, the name is taken. */
export const createDepartmentRefusedMock = (
  name: string,
  { code = "CONFLICT", message = "Department already exists" } = {},
): MockLink.MockedResponse => ({
  request: { query: CreateDepartmentDocument, variables: { input: { name } } },
  result: refused(code, message),
});

/** `createDepartment` that fails before the backend answers (no network). */
export const createDepartmentNetworkErrorMock = (name: string): MockLink.MockedResponse => ({
  request: { query: CreateDepartmentDocument, variables: { input: { name } } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `updateDepartment`: the backend returns the saved department. */
export const updateDepartmentMock = (id: string, name: string): MockLink.MockedResponse => ({
  request: { query: UpdateDepartmentDocument, variables: { input: { id, name } } },
  result: { data: { updateDepartment: department(id, name) } },
});

/** `updateDepartment` refused: by default `CONFLICT`, another department has the name. */
export const updateDepartmentRefusedMock = (
  id: string,
  name: string,
  { code = "CONFLICT", message = "Department already exists" } = {},
): MockLink.MockedResponse => ({
  request: { query: UpdateDepartmentDocument, variables: { input: { id, name } } },
  result: refused(code, message),
});

/** MockedProvider response of `deleteDepartment` for the department with this id. */
export const deleteDepartmentMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteDepartmentDocument, variables: { id } },
  result: { data: { deleteDepartment: true } },
});

/** `deleteDepartment` refused: by default `CONFLICT`, a user still has the department. */
export const deleteDepartmentRefusedMock = (
  id: string,
  {
    code = "CONFLICT",
    message = "Department cannot be deleted because it is currently in use",
  } = {},
): MockLink.MockedResponse => ({
  request: { query: DeleteDepartmentDocument, variables: { id } },
  result: refused(code, message),
});

/** `deleteDepartment` that fails before the backend answers (no network). */
export const deleteDepartmentNetworkErrorMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteDepartmentDocument, variables: { id } },
  error: new Error("Failed to fetch"),
});
