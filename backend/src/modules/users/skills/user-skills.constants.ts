import { Mastery } from "../../skills/models/mastery.enum";

/**
 * The levels a user may give their own skill (user skills page: Beginner to Expert). `NONE` exists
 * only for the skills of a CV, so it is not one of them.
 */
export const USER_SKILL_MASTERY_LEVELS: readonly Mastery[] = [
  Mastery.BEGINNER,
  Mastery.ELEMENTARY,
  Mastery.INTERMEDIATE,
  Mastery.ADVANCED,
  Mastery.EXPERT,
];

export const MASTERY_NOT_SUPPORTED_MESSAGE = "Skill mastery must be a supported level";

export const MAX_REMOVED_USER_SKILLS = 100;
