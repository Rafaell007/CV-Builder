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

  // A missing value shows an en dash. The dash is hidden from screen readers, the words name the column and replace it.
  const missing = (column: string) => (
    <>
      <span aria-hidden="true">–</span>
      <span className={styles.visuallyHidden}>{t("notAvailable", { column })}</span>
    </>
  );

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.visuallyHidden}>{t("caption")}</caption>
        <thead>
          <tr>
            <th scope="col" colSpan={2} className={styles.headCell}>
              {t("columns.skills")}
            </th>
            <th scope="col" className={styles.headCellNumber}>
              {t("columns.experience")}
            </th>
            <th scope="col" className={styles.headCellNumber}>
              {t("columns.lastUsed")}
            </th>
          </tr>
        </thead>
        {groups.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={4} className={styles.empty}>
                {t("empty")}
              </td>
            </tr>
          </tbody>
        )}
        {groups.map((group, groupIndex) => (
          // The category and the skill name can repeat, so the position is part of the key. The list is read-only and never reordered.
          <tbody key={`${groupIndex}-${group.category}`}>
            {group.skills.map((skill, skillIndex) => (
              <tr key={`${skillIndex}-${skill.name}`} className={styles.row}>
                {skillIndex === 0 && (
                  <th scope="row" rowSpan={group.skills.length} className={styles.category}>
                    {group.category}
                  </th>
                )}
                <td className={styles.cell}>{skill.name}</td>
                <td className={styles.cellNumber}>
                  {skill.experienceYears ?? missing(t("columns.experience"))}
                </td>
                <td className={styles.cellNumber}>
                  {skill.lastUsedYear ?? missing(t("columns.lastUsed"))}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
