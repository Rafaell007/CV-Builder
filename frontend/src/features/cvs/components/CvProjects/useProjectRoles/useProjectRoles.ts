"use client";

import { useQuery } from "@apollo/client/react";
import { ProjectRolesDocument } from "@/shared/graphql";
import type { ProjectRoleItem } from "../cvProjects.types";

export type UseProjectRolesResult = {
  /** The roles of the backend. `undefined` until the answer and after a failure. */
  roles: ProjectRoleItem[] | undefined;
  loading: boolean;
  /** True when the request failed. */
  failed: boolean;
  /** Sends the failed request again. */
  retry: () => void;
};

/**
 * The options of the Roles field (Add and Update project modals). It sends nothing while `enabled` is false (the
 * modal is closed). The backend has no "active" flag on a role, so every role it returns counts as active.
 */
export function useProjectRoles(enabled: boolean): UseProjectRolesResult {
  const { data, loading, error, refetch } = useQuery(ProjectRolesDocument, {
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
  });

  return {
    roles: data?.projectRoles,
    loading,
    failed: error !== undefined,
    retry: () => void refetch().catch(() => undefined),
  };
}
