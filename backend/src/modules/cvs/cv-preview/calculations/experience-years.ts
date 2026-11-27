import type { PreviewProject } from "./preview-project";

/**
 * The years of experience with a skill: whole completed years from the earliest start date among
 * the CV projects that use the skill, up to `now` (CV preview page, Experience in Years).
 * `null` when no project uses the skill. A start date in the future gives 0, never a negative number.
 */
export function experienceYears(
  skillId: string,
  projects: PreviewProject[],
  now: Date,
): number | null {
  const starts = projects
    .filter((project) => project.skillIds.includes(skillId))
    .map((project) => project.startDate);
  if (starts.length === 0) return null;

  const earliest = new Date(Math.min(...starts.map((start) => start.getTime())));
  let years = now.getUTCFullYear() - earliest.getUTCFullYear();
  // The last year is not complete until the month and day of the start date have passed.
  const anniversaryPending =
    now.getUTCMonth() < earliest.getUTCMonth() ||
    (now.getUTCMonth() === earliest.getUTCMonth() && now.getUTCDate() < earliest.getUTCDate());
  if (anniversaryPending) years -= 1;

  return Math.max(years, 0);
}
