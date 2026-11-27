"use client";

import { readFailure } from "@/shared/failures";
import { CvsDocument, type CvsQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { CvListItem } from "../cvs.types";

export type UseCvsResult = Omit<UsePagedListResult<CvListItem>, "items" | "error"> & {
  /** The rows of the current page, as the backend returned them. */
  cvs: readonly CvListItem[];
  /** True when the backend refused the request with `FORBIDDEN`: Retry cannot help, so the page shows no Retry button. */
  forbidden: boolean;
};

/** Loads one page of CVs with the `Cvs` query (the shared `usePagedList`). The backend searches, sorts and cuts the page, and limits the rows by role. */
export function useCvs(variables: CvsQueryVariables): UseCvsResult {
  const { items, error, ...list } = usePagedList(CvsDocument, variables, (data) => data.cvs);
  return {
    cvs: items,
    ...list,
    forbidden: error !== undefined && readFailure(error).kind === "forbidden",
  };
}
