"use client";

import { useMutation } from "@apollo/client/react";
import { DeleteSkillDocument, SkillCatalogDocument } from "@/shared/graphql";

export type UseDeleteSkillResult = {
  /** Sends `deleteSkill`. Rejects with the request's error (`CONFLICT` = the skill is in use). */
  remove: (id: string) => Promise<void>;
};

/**
 * The `deleteSkill` request. On success the skill leaves the cache (its row disappears at once) and the open list
 * loads again with the same search, sort and page, for the new total.
 */
export function useDeleteSkill(): UseDeleteSkillResult {
  const [deleteSkill] = useMutation(DeleteSkillDocument);

  async function remove(id: string): Promise<void> {
    await deleteSkill({
      variables: { id },
      update: (cache) => {
        // The Environment field of the project forms keeps every skill (`skills`); the next form loads them again.
        cache.evict({ id: "ROOT_QUERY", fieldName: "skills" });
        const cacheId = cache.identify({ __typename: "Skill", id });
        if (cacheId !== undefined) cache.evict({ id: cacheId });
        cache.gc();
      },
      refetchQueries: [SkillCatalogDocument],
    });
  }

  return { remove };
}
