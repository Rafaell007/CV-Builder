import { useTranslations } from "next-intl";
import type { CvSkillItem } from "../../cvSkills.types";
import { useMasteryLabel } from "../../useMasteryLabel";
import { MasteryBar } from "./MasteryBar";
import styles from "./SkillItem.module.css";

export interface SkillItemProps {
  skill: CvSkillItem;
  /** Selection mode: a press chooses the skill (and a second press takes the choice back). */
  selecting: boolean;
  selected: boolean;
  /** A press outside the selection mode: opens the Update skill modal. */
  onOpen: (skill: CvSkillItem) => void;
  /** A press in the selection mode, with the id of the CV-skill link. */
  onToggle: (id: string) => void;
}

/**
 * One skill: the bar, the name, and the level in words for screen readers. It is a button, so the keyboard works.
 * In the selection mode it exposes its chosen state with `aria-pressed`.
 */
export function SkillItem({ skill, selecting, selected, onOpen, onToggle }: SkillItemProps) {
  const t = useTranslations("cvs.skills");
  const masteryLabel = useMasteryLabel();

  return (
    <button
      type="button"
      className={`${styles.item} ${selected ? styles.selected : ""}`}
      aria-pressed={selecting ? selected : undefined}
      onClick={() => (selecting ? onToggle(skill.id) : onOpen(skill))}
    >
      <MasteryBar level={skill.mastery} />
      <span className={styles.name}>{skill.name}</span>
      {/* The space keeps the name and the level apart in the accessible name ("TypeScript Mastery: Advanced"). */}{" "}
      <span className={styles.hidden}>
        {t("masteryLevel", { level: masteryLabel(skill.mastery) })}
      </span>
    </button>
  );
}
