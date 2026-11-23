"use client";

import { useQuery } from "@apollo/client/react";
import { readFailure } from "@/shared/failures";
import { CvDocument } from "@/shared/graphql";
import type { CvDetailsData } from "../cvs.types";

/** Why the `cv` query failed: a CV that is not there, a CV the user may not open, or any other problem. */
export type CvLoadFailure = "notFound" | "forbidden" | "failed";

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

  const kind = error === undefined ? undefined : readFailure(error).kind;

  return {
    cv: data?.cv,
    loading,
    // Network and server errors are the only ones where Retry can help, so the page gets `failed` for them.
    failure:
      kind === undefined
        ? undefined
        : kind === "notFound" || kind === "forbidden"
          ? kind
          : "failed",
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
