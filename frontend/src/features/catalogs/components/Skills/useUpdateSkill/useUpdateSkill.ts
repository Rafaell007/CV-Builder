"use client";

import { useMutation } from "@apollo/client/react";
import { SkillCatalogDocument, UpdateSkillDocument } from "@/shared/graphql";
import type { SkillInput, SkillListItem } from "../skills.types";

export type UseUpdateSkillResult = {
  /**
   * Sends `updateSkill`. Resolves with the saved skill. Rejects with the request's error (`CONFLICT` = the name is
   * taken, `BAD_USER_INPUT` on `categoryId` = the category does not exist).
   */
  update: (id: string, input: SkillInput) => Promise<SkillListItem>;
};

/**
 * The `updateSkill` request. On success the open `SkillCatalog` list loads again: a new name can move the skill in the
 * sorted, searched and cut list, and only the backend knows where.
 */
export function useUpdateSkill(): UseUpdateSkillResult {
  const [updateSkill] = useMutation(UpdateSkillDocument);

  async function update(id: string, input: SkillInput): Promise<SkillListItem> {
    const { data } = await updateSkill({
      variables: { input: { id, ...input } },
      refetchQueries: [SkillCatalogDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("updateSkill returned no skill");
    return data.updateSkill;
  }

  return { update };
}
