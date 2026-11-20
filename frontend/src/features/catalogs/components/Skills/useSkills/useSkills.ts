"use client";

import { SkillCatalogDocument, type SkillCatalogQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { SkillListItem } from "../skills.types";

export type UseSkillsResult = UsePagedListResult<SkillListItem>;

/** Loads one page of skills with the `SkillCatalog` query (the shared `usePagedList`). The backend searches, sorts and cuts the page. */
export function useSkills(variables: SkillCatalogQueryVariables): UseSkillsResult {
  return usePagedList(SkillCatalogDocument, variables, (data) => data.skillCatalog);
}
