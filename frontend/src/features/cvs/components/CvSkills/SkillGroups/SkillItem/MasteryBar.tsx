import { MASTERY_LEVELS } from "../../cvSkills.constants";
import type { CvSkillMastery } from "../../cvSkills.types";
import styles from "./MasteryBar.module.css";

export interface MasteryBarProps {
  level: CvSkillMastery;
}

/**
 * The bar left of a skill name. It only draws: the level is also written for screen readers by the skill item,
 * so the bar is hidden from them. The level `NONE` (No mastery) is not in `MASTERY_LEVELS` on purpose: it shows the
 * empty grey bar. An unknown level (a new backend value) looks the same, not a broken page.
 */
export function MasteryBar({ level }: MasteryBarProps) {
  const found = MASTERY_LEVELS.find((item) => item.level === level);

  return (
    <span className={`${styles.bar} ${found ? styles[found.tone] : ""}`} aria-hidden="true">
      <span className={styles.fill} style={{ width: `${found?.percent ?? 0}%` }} />
    </span>
  );
}
