"use client";

import { useQuery } from "@apollo/client/react";
import { ProjectsDocument } from "@/shared/graphql";
import type { ProjectListItem } from "../projects.types";

export type UseProjectsResult = {
  projects: readonly ProjectListItem[];
  loading: boolean;
  /** True when the request failed. The list is then not shown, so a failure never looks like an empty list. */
  failed: boolean;
  /** Sends the failed request again. */
  retry: () => void;
};

/** Loads the projects from the backend with the `Projects` query. */
export function useProjects(): UseProjectsResult {
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, loading, error, refetch } = useQuery(ProjectsDocument, {
    notifyOnNetworkStatusChange: true,
  });

  return {
    projects: data?.projects.items ?? [],
    loading,
    failed: error !== undefined,
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
