"use client";

import { DepartmentsDocument, type DepartmentsQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { DepartmentListItem } from "../departments.types";

export type UseDepartmentsResult = UsePagedListResult<DepartmentListItem>;

/** Loads one page of departments with the `Departments` query (the shared `usePagedList`). The backend searches, sorts and cuts the page. */
export function useDepartments(variables: DepartmentsQueryVariables): UseDepartmentsResult {
  return usePagedList(DepartmentsDocument, variables, (data) => data.departments);
}
