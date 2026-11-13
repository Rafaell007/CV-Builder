"use client";

import { useQuery } from "@apollo/client/react";
import { CvProjectsDocument, type CvProjectsQueryVariables } from "@/shared/graphql";
import type { CvProjectItem } from "../cvProjects.types";

export type UseCvProjectsResult = {
  /** The projects as the backend returned them. `undefined` until the first answer and after a failure. */
  projects: CvProjectItem[] | undefined;
  loading: boolean;
  /** True when the request failed. */
  failed: boolean;
  /** Sends the failed request again, with the same search and sort. */
  retry: () => void;
};

/**
 * Loads the projects of one CV with the `CvProjects` query. The backend decides who may read them, searches
 * (name and domain) and sorts, so the page never checks the owner and never filters or sorts the rows it holds.
 */
export function useCvProjects(variables: CvProjectsQueryVariables): UseCvProjectsResult {
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, loading, error, refetch } = useQuery(CvProjectsDocument, {
    variables,
    notifyOnNetworkStatusChange: true,
  });

  return {
    projects: data?.cvProjects,
    loading,
    failed: error !== undefined,
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
