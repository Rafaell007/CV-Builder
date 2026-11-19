"use client";

import { useQuery } from "@apollo/client/react";
import { useLocale } from "next-intl";
import { CvPreviewDocument } from "@/shared/graphql";
import type { CvPreviewData } from "../cvs.types";
import { toCvLoadFailure } from "../utils";

export type UseCvPreviewResult = {
  /** The whole CV as the backend put it together. `undefined` while it loads and after a failure. */
  preview: CvPreviewData | undefined;
  loading: boolean;
  /** The request failed in a way where Retry can help (network or server error). */
  failed: boolean;
  /** The CV is missing or the user may not open it (`NOT_FOUND` or `FORBIDDEN`). Retry cannot help. */
  unauthorized: boolean;
  /** Sends the failed request again for the same CV id. */
  retry: () => void;
};

/** Loads the CV preview with the `CvPreview` query. The backend decides who may see it, so the page never checks the owner itself. */
export function useCvPreview(cvId: string): UseCvPreviewResult {
  // The backend writes the open period (`Till now` / `obecnie`) in the language of the page. A new language is a new request.
  const locale = useLocale();
  // network-only: the backend builds the preview from the details, skills and projects, so a copy in the cache is
  // old after any change on the other tabs. The page always asks again when it opens.
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, loading, error, refetch } = useQuery(CvPreviewDocument, {
    variables: { cvId, locale },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const failure = error === undefined ? undefined : toCvLoadFailure(error);

  return {
    preview: data?.cvPreview,
    loading,
    failed: failure === "failed",
    unauthorized: failure === "notFound" || failure === "forbidden",
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
