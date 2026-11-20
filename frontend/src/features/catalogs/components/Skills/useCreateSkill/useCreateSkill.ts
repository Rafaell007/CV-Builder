"use client";

import { useMutation } from "@apollo/client/react";
import { CreateSkillDocument, SkillCatalogDocument } from "@/shared/graphql";
import type { SkillInput, SkillListItem } from "../skills.types";

export type UseCreateSkillResult = {
  /**
   * Sends `createSkill`. Resolves with the new skill. Rejects with the request's error (`CONFLICT` = the name is taken,
   * `BAD_USER_INPUT` on `categoryId` = the category does not exist).
   */
  create: (input: SkillInput) => Promise<SkillListItem>;
};

/**
 * The `createSkill` request. On success the open `SkillCatalog` list loads again: the new skill belongs in the sorted,
 * searched and cut list at a place only the backend knows, and the total changes.
 */
export function useCreateSkill(): UseCreateSkillResult {
  const [createSkill] = useMutation(CreateSkillDocument);

  async function create(input: SkillInput): Promise<SkillListItem> {
    const { data } = await createSkill({
      variables: { input },
      // The Environment field of the project forms keeps every skill (`skills`); the next form loads them again.
      update: (cache) => void cache.evict({ id: "ROOT_QUERY", fieldName: "skills" }),
      refetchQueries: [SkillCatalogDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("createSkill returned no skill");
    return data.createSkill;
  }

  return { create };
}
