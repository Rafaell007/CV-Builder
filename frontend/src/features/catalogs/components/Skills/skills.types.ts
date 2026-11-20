import type { SkillCatalogQuery, SkillCategoriesQuery } from "@/shared/graphql";

/** One row of the skills list, as the `SkillCatalog` query returns it: the name and the category with its type. */
export type SkillListItem = SkillCatalogQuery["skillCatalog"]["items"][number];

/** One option of the Category select, as the `SkillCategories` query returns it. */
export type SkillCategoryItem = SkillCategoriesQuery["skillCategories"][number];

/** What the Create and Update skill form holds while the user types. An empty `categoryId` means no category is chosen yet. */
export interface SkillFormValues {
  name: string;
  categoryId: string;
}

/** What the Create and Update skill requests send. The type is not sent: the backend takes it from the category. */
export interface SkillInput {
  name: string;
  categoryId: string;
}
