"use client";

import { useMutation } from "@apollo/client/react";
import { CreateLanguageDocument, LanguagesDocument } from "@/shared/graphql";
import type { LanguageInput, LanguageListItem } from "../languages.types";

export type UseCreateLanguageResult = {
  /**
   * Sends `createLanguage`. Resolves with the new language. Rejects with the request's error (`CONFLICT` = the name is
   * taken; `CONFLICT` with reason `ISO_TAKEN` = the ISO code is taken).
   */
  create: (input: LanguageInput) => Promise<LanguageListItem>;
};

/**
 * The `createLanguage` request. On success the open `Languages` list loads again: the new language belongs in the
 * sorted, searched and cut list at a place only the backend knows, and the total changes.
 */
export function useCreateLanguage(): UseCreateLanguageResult {
  const [createLanguage] = useMutation(CreateLanguageDocument);

  async function create(input: LanguageInput): Promise<LanguageListItem> {
    const { data } = await createLanguage({
      variables: { input },
      refetchQueries: [LanguagesDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("createLanguage returned no language");
    return data.createLanguage;
  }

  return { create };
}
