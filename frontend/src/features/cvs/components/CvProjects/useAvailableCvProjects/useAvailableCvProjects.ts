"use client";

import { useQuery } from "@apollo/client/react";
import { AvailableCvProjectsDocument } from "@/shared/graphql";
import type { CatalogProject } from "../cvProjects.types";

export type UseAvailableCvProjectsResult = {
  /** The projects that are not yet in the CV, by name. `undefined` until the answer and after a failure. */
  options: CatalogProject[] | undefined;
  loading: boolean;
  /** True when the request failed. */
  failed: boolean;
  /** Sends the failed request again. */
  retry: () => void;
};

/**
 * The options of the Add project modal. It sends nothing while `enabled` is false (the modal is closed), and asks the
 * backend again each time the modal opens: the answer depends on the projects the CV holds now, so an old answer could
 * offer a project that is already in the CV (AC-31), and a project that an admin added a minute ago is there. The
 * backend decides what is available; the page never filters.
 */
export function useAvailableCvProjects(
  cvId: string,
  enabled: boolean,
): UseAvailableCvProjectsResult {
  const { data, loading, error, refetch } = useQuery(AvailableCvProjectsDocument, {
    variables: { cvId },
    skip: !enabled,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  return {
    options: data?.availableCvProjects,
    loading,
    failed: error !== undefined,
    retry: () => void refetch().catch(() => undefined),
  };
}
