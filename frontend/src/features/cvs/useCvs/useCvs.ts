"use client";

import { CvsDocument, type CvsQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { CvListItem } from "../cvs.types";

export type UseCvsResult = Omit<UsePagedListResult<CvListItem>, "items"> & {
  /** The rows of the current page, as the backend returned them. */
  cvs: readonly CvListItem[];
};

/** Loads one page of CVs with the `Cvs` query (the shared `usePagedList`). The backend searches, sorts and cuts the page, and limits the rows by role. */
export function useCvs(variables: CvsQueryVariables): UseCvsResult {
  const { items, ...list } = usePagedList(CvsDocument, variables, (data) => data.cvs);
  return { cvs: items, ...list };
}
