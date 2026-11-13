"use client";

import { useTranslations } from "next-intl";
import type { CvSkillMastery } from "./cvSkills.types";

/** The translated name of a mastery level ("Advanced"). The levels come from the backend; the texts come from `cvs.skills.mastery`. */
export function useMasteryLabel(): (level: CvSkillMastery) => string {
  const t = useTranslations("cvs.skills.mastery");
  return (level) => t(level);
}
