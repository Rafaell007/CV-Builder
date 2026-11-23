"use client";

import { useMutation } from "@apollo/client/react";
import { DeleteLanguageDocument, LanguagesDocument } from "@/shared/graphql";

export type UseDeleteLanguageResult = {
  /** Sends `deleteLanguage`. Rejects with the request's error (`CONFLICT` = a user has the language). */
  remove: (id: string) => Promise<void>;
};

/**
 * The `deleteLanguage` request. On success the language leaves the cache (its row disappears at once) and the open
 * list loads again with the same search, sort and page, for the new total.
 */
export function useDeleteLanguage(): UseDeleteLanguageResult {
  const [deleteLanguage] = useMutation(DeleteLanguageDocument);

  async function remove(id: string): Promise<void> {
    await deleteLanguage({
      variables: { id },
      update: (cache) => {
        const cacheId = cache.identify({ __typename: "Language", id });
        if (cacheId !== undefined) cache.evict({ id: cacheId });
        cache.gc();
      },
      refetchQueries: [LanguagesDocument],
    });
  }

  return { remove };
}
