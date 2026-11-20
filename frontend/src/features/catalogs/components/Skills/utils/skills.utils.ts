import { z } from "zod";
import { catalogNameRule, type CatalogNameMessages } from "../../../utils";
import type { SkillFormValues } from "../skills.types";

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
