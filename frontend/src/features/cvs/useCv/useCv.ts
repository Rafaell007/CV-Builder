"use client";

import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { readFailure } from "@/shared/failures";
import { CvDocument } from "@/shared/graphql";
import type { CvDetailsData } from "../cvs.types";
import { toCvReturnPath, toScopeUserId, withScope } from "../utils";

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

/**
 * Loads one CV with the `Cv` query. The backend decides who may see it, so the page never checks the owner itself.
 * When the CV was opened from the User CVs tab (`?from=/users/{id}/cvs`), the employee of the tab is sent as
 * `userId`, so a CV of another employee answers NOT_FOUND (AC-12). The hook reads it itself, so every caller on
 * one page sends the same variables and shares one cache entry.
 */
export function useCv(id: string): UseCvResult {
  const userId = toScopeUserId(toCvReturnPath(useSearchParams()?.get("from")));
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, loading, error, refetch } = useQuery(CvDocument, {
    variables: { id, ...withScope(userId) },
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
