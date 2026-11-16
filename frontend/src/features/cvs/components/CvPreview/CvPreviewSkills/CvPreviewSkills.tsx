import { useTranslations } from "next-intl";
import type { CvPreviewData } from "../../../cvs.types";
import styles from "./CvPreviewSkills.module.css";

export interface CvPreviewSkillsProps {
  skillGroups: CvPreviewData["skillGroups"];
}

/** The skills of the CV document: every category with the names of its skills. A category without skills is hidden, and the whole section is hidden when no category has skills. */
export function CvPreviewSkills({ skillGroups }: CvPreviewSkillsProps) {
  const t = useTranslations("cvs.preview.sections.skills");
  const groups = skillGroups.filter((group) => group.skills.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="cv-preview-skills-title">
      <h2 id="cv-preview-skills-title" className={styles.title}>
        {t("title")}
      </h2>
      {groups.map((group) => (
        <div key={group.category} className={styles.group}>
          <h3 className={styles.category}>{group.category}</h3>
          <ul className={styles.list}>
            {group.skills.map((skill) => (
              <li key={skill.name}>{skill.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
