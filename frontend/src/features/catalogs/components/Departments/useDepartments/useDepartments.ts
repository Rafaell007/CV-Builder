"use client";

import { DepartmentsDocument, type DepartmentsQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { DepartmentListItem } from "../departments.types";

export type UseDepartmentsResult = Omit<UsePagedListResult<DepartmentListItem>, "items"> & {
  /** The rows of the current page, as the backend returned them. */
  departments: readonly DepartmentListItem[];
};

/** Loads one page of departments with the `Departments` query (the shared `usePagedList`). The backend searches, sorts and cuts the page. */
export function useDepartments(variables: DepartmentsQueryVariables): UseDepartmentsResult {
  const { items, ...list } = usePagedList(
    DepartmentsDocument,
    variables,
    (data) => data.departments,
  );
  return { departments: items, ...list };
}
