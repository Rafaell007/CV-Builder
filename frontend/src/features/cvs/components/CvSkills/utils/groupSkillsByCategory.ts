import type { CvSkillGroup, CvSkillItem } from "../cvSkills.types";

/**
 * Groups the skills by category for the page. The backend already orders them by category name, then skill name,
 * so the groups and the skills inside them keep the order of the list. A category without skills never appears,
 * because a group is made only from a skill (AC-11).
 */
export function groupSkillsByCategory(skills: readonly CvSkillItem[]): CvSkillGroup[] {
  const groups = new Map<string, CvSkillGroup>();
  for (const skill of skills) {
    const group = groups.get(skill.category.id);
    if (group) {
      group.skills.push(skill);
    } else {
      groups.set(skill.category.id, {
        categoryId: skill.category.id,
        categoryName: skill.category.name,
        skills: [skill],
      });
    }
  }
  return [...groups.values()];
}
