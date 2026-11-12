"use client";

import { useQuery } from "@apollo/client/react";
import { ProjectsDocument, type ProjectsQueryVariables } from "@/shared/graphql";
import type { ProjectListItem } from "../projects.types";

export type UseProjectsResult = {
  /** The rows of the current page, as the backend returned them. */
  projects: readonly ProjectListItem[];
  /** Number of projects that match the search, on all pages. It keeps the last value while a new page loads. */
  total: number;
  loading: boolean;
  /** True when the request failed. The list is then not shown, so a failure never looks like an empty list. */
  failed: boolean;
  /** Sends the failed request again, with the same search, sort and page. */
  retry: () => void;
};

/** Loads one page of projects with the `Projects` query. The backend searches, sorts and cuts the page. */
export function useProjects(variables: ProjectsQueryVariables): UseProjectsResult {
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, previousData, loading, error, refetch } = useQuery(ProjectsDocument, {
    variables,
    notifyOnNetworkStatusChange: true,
  });

  return {
    projects: data?.projects.items ?? [],
    // While the next page loads, the page buttons stay (no jump); they use the total of the previous result.
    total: (data ?? previousData)?.projects.total ?? 0,
    loading,
    failed: error !== undefined,
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
