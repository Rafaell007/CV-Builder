import type { CvSkillGroup, CvSkillItem } from "../cvSkills.types";
import styles from "./SkillGroups.module.css";
import { SkillItem } from "./SkillItem/SkillItem";

export interface SkillGroupsProps {
  groups: readonly CvSkillGroup[];
  /** Selection mode: a press on a skill chooses it instead of opening the Update skill modal. */
  selecting: boolean;
  selectedIds: readonly string[];
  onOpen: (skill: CvSkillItem) => void;
  onToggle: (id: string) => void;
}

/** The skills under the names of their categories. Only categories that hold a skill are in `groups`. */
export function SkillGroups({
  groups,
  selecting,
  selectedIds,
  onOpen,
  onToggle,
}: SkillGroupsProps) {
  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section
          key={group.categoryId}
          className={styles.group}
          aria-labelledby={`category-${group.categoryId}`}
        >
          <h2 id={`category-${group.categoryId}`} className={styles.category}>
            {group.categoryName}
          </h2>
          <ul className={styles.skills}>
            {group.skills.map((skill) => (
              <li key={skill.id}>
                <SkillItem
                  skill={skill}
                  selecting={selecting}
                  selected={selectedIds.includes(skill.id)}
                  onOpen={onOpen}
                  onToggle={onToggle}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
