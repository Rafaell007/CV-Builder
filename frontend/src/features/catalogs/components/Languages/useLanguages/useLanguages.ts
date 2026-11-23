"use client";

import { LanguagesDocument, type LanguagesQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { LanguageListItem } from "../languages.types";

export type UseLanguagesResult = UsePagedListResult<LanguageListItem>;

/** Loads one page of languages with the `Languages` query (the shared `usePagedList`). The backend searches, sorts and cuts the page. */
export function useLanguages(variables: LanguagesQueryVariables): UseLanguagesResult {
  return usePagedList(LanguagesDocument, variables, (data) => data.languages);
}
