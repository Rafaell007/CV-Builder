"use client";

import { useQuery } from "@apollo/client/react";
import { CvsDocument, type CvsQueryVariables } from "@/shared/graphql";
import type { CvListItem } from "../cvs.types";
import { toCvLoadFailure } from "../utils";

export type UseCvsResult = {
  /** The rows of the current page, as the backend returned them. */
  cvs: readonly CvListItem[];
  /** Number of CVs that match the search, on all pages. It keeps the last value while a new page loads. */
  total: number;
  loading: boolean;
  /** True when the request failed. The list is then not shown, so a failure never looks like an empty list. */
  failed: boolean;
  /** True when the backend refused the request with `FORBIDDEN`: Retry cannot help, so the page shows no Retry button. */
  forbidden: boolean;
  /** Sends the failed request again, with the same search, sort and page. */
  retry: () => void;
};

/** Loads one page of CVs with the `Cvs` query. The backend searches, sorts and cuts the page, and limits the rows by role. */
export function useCvs(variables: CvsQueryVariables): UseCvsResult {
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, previousData, loading, error, refetch } = useQuery(CvsDocument, {
    variables,
    notifyOnNetworkStatusChange: true,
  });

  return {
    cvs: data?.cvs.items ?? [],
    // While the next page loads, the page buttons stay (no jump); they use the total of the previous result.
    total: (data ?? previousData)?.cvs.total ?? 0,
    loading,
    failed: error !== undefined,
    forbidden: error !== undefined && toCvLoadFailure(error) === "forbidden",
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
