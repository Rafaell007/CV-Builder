"use client";

import { useMutation } from "@apollo/client/react";
import { LanguagesDocument, UpdateLanguageDocument } from "@/shared/graphql";
import type { LanguageInput, LanguageListItem } from "../languages.types";

export type UseUpdateLanguageResult = {
  /**
   * Sends `updateLanguage`. Resolves with the saved language. Rejects with the request's error (`CONFLICT` = the name
   * is taken; `CONFLICT` with reason `ISO_TAKEN` = the ISO code is taken; `NOT_FOUND` = the language is gone).
   */
  update: (id: string, input: LanguageInput) => Promise<LanguageListItem>;
};

/**
 * The `updateLanguage` request. On success the open `Languages` list loads again: a new name or ISO code can move the
 * language in the sorted, searched and cut list, and only the backend knows where.
 */
export function useUpdateLanguage(): UseUpdateLanguageResult {
  const [updateLanguage] = useMutation(UpdateLanguageDocument);

  async function update(id: string, input: LanguageInput): Promise<LanguageListItem> {
    const { data } = await updateLanguage({
      variables: { input: { id, ...input } },
      refetchQueries: [LanguagesDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("updateLanguage returned no language");
    return data.updateLanguage;
  }

  return { update };
}
