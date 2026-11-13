"use client";

import { useQuery } from "@apollo/client/react";
import { CvDocument } from "@/shared/graphql";
import type { CvDetailsData } from "../cvs.types";
import { toCvLoadFailure, type CvLoadFailure } from "../utils";

export type UseCvResult = {
  /** The CV as the backend returned it. `undefined` while it loads and after a failure. */
  cv: CvDetailsData | undefined;
  loading: boolean;
  /** Why the request failed, or `undefined` when it did not. The page shows a different screen for each reason. */
  failure: CvLoadFailure | undefined;
  /** Sends the failed request again for the same CV id. */
  retry: () => void;
};

/** Loads one CV with the `Cv` query. The backend decides who may see it, so the page never checks the owner itself. */
export function useCv(id: string): UseCvResult {
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, loading, error, refetch } = useQuery(CvDocument, {
    variables: { id },
    notifyOnNetworkStatusChange: true,
  });

  return {
    cv: data?.cv,
    loading,
    failure: error === undefined ? undefined : toCvLoadFailure(error),
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
