import type { CvSkillMastery } from "./cvSkills.types";

/** The colour of the bar (a theme token, so Light and Dark both work). Figma: grey, blue, green, yellow, red. */
export type MasteryTone = "neutral" | "info" | "success" | "warning" | "error";

/**
 * The mastery levels from the lowest to the highest, with how the bar shows them. The levels come from the backend
 * (the `Mastery` enum); the fill is the level's place in this list, so the bar grows with the level.
 */
export const MASTERY_LEVELS: ReadonlyArray<{
  level: CvSkillMastery;
  percent: number;
  tone: MasteryTone;
}> = [
  { level: "BEGINNER", percent: 20, tone: "neutral" },
  { level: "ELEMENTARY", percent: 40, tone: "info" },
  { level: "INTERMEDIATE", percent: 60, tone: "success" },
  { level: "ADVANCED", percent: 80, tone: "warning" },
  { level: "EXPERT", percent: 100, tone: "error" },
];
