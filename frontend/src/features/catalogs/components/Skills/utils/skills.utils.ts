import { z } from "zod";
import type { SelectOption } from "@/shared/components";
import { catalogNameRule, type CatalogNameMessages } from "../../../utils";
import type { SkillCategoryItem, SkillFormValues } from "../skills.types";

/** The category a skill has now (Update modal): its id and the name to show. */
export type CurrentSkillCategory = Pick<SkillCategoryItem, "id" | "name">;

/**
 * The options of the Category select. `current` is added when the loaded categories do not have it (they still load,
 * they failed, or the modal fades out): the Select shows only the label of an option it has, so without it the field
 * of a skill with a category would look empty.
 */
export function categoryOptions(
  categories: readonly SkillCategoryItem[] | undefined,
  current?: CurrentSkillCategory,
): SelectOption[] {
  const options = (categories ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }));
  if (current && !options.some((option) => option.value === current.id)) {
    options.push({ value: current.id, label: current.name });
  }
  return options;
}

/** The translated texts of the skill form rules. */
export interface SkillFormMessages extends CatalogNameMessages {
  categoryRequired: string;
}

/**
 * The rules of the skill form (Create and Update): the catalog name rule and a chosen category.
 * The backend checks everything again, and it alone knows whether the name is taken or the category still exists.
 */
export function skillFormSchema(
  messages: SkillFormMessages,
): z.ZodType<SkillFormValues, SkillFormValues> {
  return z.object({
    name: catalogNameRule(messages),
    categoryId: z.string().min(1, messages.categoryRequired),
  });
}
