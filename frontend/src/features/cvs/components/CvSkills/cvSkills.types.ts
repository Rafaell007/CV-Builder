import type { AvailableCvSkillsQuery, CvSkillsQuery } from "@/shared/graphql";

/** One skill of a CV, as the `CvSkills` query returns it. `id` is the CV-skill link, `skillId` the catalog skill. */
export type CvSkillItem = CvSkillsQuery["cvSkills"][number];

/** One skill the owner of the CV has and the CV does not, as the `AvailableCvSkills` query returns it. */
export type AvailableCvSkillItem = AvailableCvSkillsQuery["availableCvSkills"][number];

/** The mastery levels of the backend, from the lowest to the highest. */
export type CvSkillMastery = CvSkillItem["mastery"];

/** The skills of one category, in the order the backend sent them. */
export interface CvSkillGroup {
  categoryId: string;
  categoryName: string;
  skills: CvSkillItem[];
}
