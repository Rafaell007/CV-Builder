"use client";

import { useMutation } from "@apollo/client/react";
import { CreateCvDocument, CvsDocument, type CreateCvInput } from "@/shared/graphql";
import type { CvListItem } from "../cvs.types";

export type UseCreateCvResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Sends `createCv`. Resolves with the new CV. Rejects with the request's error, so the caller can show it and keep the form values. */
  create: (input: CreateCvInput) => Promise<CvListItem>;
};

/**
 * The `createCv` request. On success the open `Cvs` list loads again: the new CV belongs in the sorted,
 * searched and cut list at a place only the backend knows, and the total changes.
 */
export function useCreateCv(): UseCreateCvResult {
  const [createCv, { loading }] = useMutation(CreateCvDocument);

  async function create(input: CreateCvInput): Promise<CvListItem> {
    const { data } = await createCv({
      variables: { input },
      refetchQueries: [CvsDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("createCv returned no CV");
    return data.createCv;
  }

  return { pending: loading, create };
}
