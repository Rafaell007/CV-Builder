"use client";

import { useMutation } from "@apollo/client/react";
import { CvsDocument, UpdateCvDocument, type UpdateCvInput } from "@/shared/graphql";
import type { CvListItem } from "../cvs.types";

export type UseUpdateCvResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Sends `updateCv`. Resolves with the saved CV. Rejects with the request's error, so the caller can show it and keep the form values. */
  update: (input: UpdateCvInput) => Promise<CvListItem>;
};

/**
 * The `updateCv` request. On success the open `Cvs` list loads again: a changed name can move the CV in the
 * sorted, searched and cut list, and only the backend knows where.
 */
export function useUpdateCv(): UseUpdateCvResult {
  const [updateCv, { loading }] = useMutation(UpdateCvDocument);

  async function update(input: UpdateCvInput): Promise<CvListItem> {
    const { data } = await updateCv({
      variables: { input },
      refetchQueries: [CvsDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("updateCv returned no CV");
    return data.updateCv;
  }

  return { pending: loading, update };
}
