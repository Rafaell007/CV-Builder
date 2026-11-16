import { useTranslations } from "next-intl";
import type { CvPreviewData } from "../../../cvs.types";
import styles from "./CvPreviewSkillsTable.module.css";

export interface CvPreviewSkillsTableProps {
  skillGroups: CvPreviewData["skillGroups"];
}

/** The Professional Skills table of the CV Preview: one block per category, the category cell spans its skills. */
export function CvPreviewSkillsTable({ skillGroups }: CvPreviewSkillsTableProps) {
  const t = useTranslations("cvs.preview.skillsTable");
  const groups = skillGroups.filter((group) => group.skills.length > 0);

  // A missing value shows an en dash. The dash is hidden from screen readers, the words replace it.
  const missing = (
    <>
      <span aria-hidden="true">–</span>
      <span className={styles.visuallyHidden}>{t("notAvailable")}</span>
    </>
  );

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.visuallyHidden}>{t("caption")}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.headCell}>
              {t("columns.category")}
            </th>
            <th scope="col" className={styles.headCell}>
              {t("columns.skill")}
            </th>
            <th scope="col" className={styles.headCell}>
              {t("columns.experience")}
            </th>
            <th scope="col" className={styles.headCell}>
              {t("columns.lastUsed")}
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.category} className={styles.group}>
            {group.skills.map((skill, index) => (
              <tr key={skill.name} className={styles.row}>
                {index === 0 && (
                  <th scope="rowgroup" rowSpan={group.skills.length} className={styles.category}>
                    {group.category}
                  </th>
                )}
                <td className={styles.cell}>{skill.name}</td>
                <td className={styles.cell}>{skill.experienceYears ?? missing}</td>
                <td className={styles.cell}>{skill.lastUsedYear ?? missing}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
