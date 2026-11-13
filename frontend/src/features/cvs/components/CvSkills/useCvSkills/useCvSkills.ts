"use client";

import { useQuery } from "@apollo/client/react";
import { CvSkillsDocument } from "@/shared/graphql";
import type { CvSkillItem } from "../cvSkills.types";

export type UseCvSkillsResult = {
  /** The skills as the backend returned them. `undefined` until the first answer and after a failure. */
  skills: CvSkillItem[] | undefined;
  loading: boolean;
  /** True when the request failed. */
  failed: boolean;
  /** Sends the failed request again for the same CV. */
  retry: () => void;
};

/**
 * Loads the skills of one CV with the `CvSkills` query. The backend decides who may read them, so the page never
 * checks the owner itself. `skills` stays set while a later request runs, so the list does not blink after a change.
 */
export function useCvSkills(cvId: string): UseCvSkillsResult {
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, loading, error, refetch } = useQuery(CvSkillsDocument, {
    variables: { cvId },
    notifyOnNetworkStatusChange: true,
  });

  return {
    skills: data?.cvSkills,
    loading,
    failed: error !== undefined,
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
