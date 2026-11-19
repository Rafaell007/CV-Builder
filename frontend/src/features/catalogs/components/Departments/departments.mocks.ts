import type { MockLink } from "@apollo/client/testing";
import {
  DepartmentsDocument,
  type DepartmentsQuery,
  type DepartmentsQueryVariables,
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
