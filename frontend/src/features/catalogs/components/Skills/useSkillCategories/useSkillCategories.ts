"use client";

import { useQuery } from "@apollo/client/react";
import { SkillCategoriesDocument } from "@/shared/graphql";
import type { SkillCategoryItem } from "../skills.types";

export type UseSkillCategoriesResult = {
  /** The categories of the backend, sorted by name. `undefined` until the answer and after a failure. */
  categories: SkillCategoryItem[] | undefined;
  loading: boolean;
  /** True when the request failed. */
  failed: boolean;
  /** Sends the failed request again. */
  retry: () => void;
};

/**
 * The options of the Category field (Create and Update skill modals). It sends nothing while `enabled` is false (no
 * modal is open), and Apollo keeps the answer for the next modal.
 */
export function useSkillCategories(enabled: boolean): UseSkillCategoriesResult {
  const { data, loading, error, refetch } = useQuery(SkillCategoriesDocument, {
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
  });

  return {
    categories: data?.skillCategories,
    loading,
    failed: error !== undefined,
    retry: () => void refetch().catch(() => undefined),
  };
}
