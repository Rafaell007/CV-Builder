"use client";

import { useQuery } from "@apollo/client/react";
import { ProjectCatalogDocument } from "@/shared/graphql";
import { CATALOG_PAGE } from "../cvProjects.constants";
import type { CatalogProject } from "../cvProjects.types";

export type UseProjectCatalogResult = {
  /** The catalog projects, by name. `undefined` until the answer and after a failure. */
  projects: CatalogProject[] | undefined;
  loading: boolean;
  /** True when the request failed. For a user who is not an admin the backend answers FORBIDDEN (open point KAN-115). */
  failed: boolean;
  /** Sends the failed request again. */
  retry: () => void;
};

/**
 * The project catalog for the Add project modal. It sends nothing while `enabled` is false (the modal is closed)
 * and asks the backend again each time the modal opens, so a project that an admin added a minute ago is there.
 * The page never filters the catalog: the projects that the CV already holds are marked by the modal.
 */
export function useProjectCatalog(enabled: boolean): UseProjectCatalogResult {
  const { data, loading, error, refetch } = useQuery(ProjectCatalogDocument, {
    variables: { page: CATALOG_PAGE },
    skip: !enabled,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  return {
    projects: data?.projects.items,
    loading,
    failed: error !== undefined,
    retry: () => void refetch().catch(() => undefined),
  };
}
