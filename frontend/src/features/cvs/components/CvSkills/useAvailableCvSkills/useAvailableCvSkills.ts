"use client";

import { useQuery } from "@apollo/client/react";
import { AvailableCvSkillsDocument } from "@/shared/graphql";
import type { AvailableCvSkillItem } from "../cvSkills.types";

export type UseAvailableCvSkillsResult = {
  /** The skills of the CV owner that are not yet in the CV. `undefined` until the answer and after a failure. */
  options: AvailableCvSkillItem[] | undefined;
  loading: boolean;
  /** True when the request failed. */
  failed: boolean;
  /** Sends the failed request again. */
  retry: () => void;
};

/**
 * The options of the Add skill modal. It sends nothing while `enabled` is false (the modal is closed), and asks the
 * backend again each time the modal opens: the answer depends on the skills the CV holds now, so an old answer
 * could offer a skill that is already in the CV. The backend decides what is available; the page never filters.
 */
export function useAvailableCvSkills(cvId: string, enabled: boolean): UseAvailableCvSkillsResult {
  const { data, loading, error, refetch } = useQuery(AvailableCvSkillsDocument, {
    variables: { cvId },
    skip: !enabled,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  return {
    options: data?.availableCvSkills,
    loading,
    failed: error !== undefined,
    retry: () => void refetch().catch(() => undefined),
  };
}
