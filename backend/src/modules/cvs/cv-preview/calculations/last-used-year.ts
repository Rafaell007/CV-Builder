import type { PreviewProject } from "./preview-project";

/**
 * The year a skill was last used: the end year of the most recent CV project that uses the skill
 * (CV preview page, Last Used). An active project (no end date) counts as the most recent one
 * and gives the year of `now`. `null` when no project uses the skill.
 */
export function lastUsedYear(
  skillId: string,
  projects: PreviewProject[],
  now: Date,
): number | null {
  const matching = projects.filter((project) => project.skillIds.includes(skillId));
  if (matching.length === 0) return null;
  if (matching.some((project) => project.endDate === null)) return now.getUTCFullYear();

  const ends: number[] = [];
  for (const project of matching) {
    if (project.endDate !== null) ends.push(project.endDate.getTime());
  }
  return new Date(Math.max(...ends)).getUTCFullYear();
}
