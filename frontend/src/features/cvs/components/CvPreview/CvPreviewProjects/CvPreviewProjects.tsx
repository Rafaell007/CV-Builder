import { useTranslations } from "next-intl";
import type { CvPreviewData } from "../../../cvs.types";
import styles from "./CvPreviewProjects.module.css";

export interface CvPreviewProjectsProps {
  projects: CvPreviewData["projects"];
}

/**
 * The projects of the CV document. Each project shows its name, description, roles, period (the text of the
 * backend), responsibilities and environment. Roles and responsibilities are hidden when empty.
 */
export function CvPreviewProjects({ projects }: CvPreviewProjectsProps) {
  const t = useTranslations("cvs.preview.sections.projects");

  return (
    <section className={styles.section} aria-labelledby="cv-preview-projects-title">
      <h2 id="cv-preview-projects-title" className={styles.title}>
        {t("title")}
      </h2>
      {projects.map((project, index) => (
        <article key={`${project.name}-${index}`} className={styles.project}>
          <h3 className={styles.name}>{project.name}</h3>
          <p className={styles.text}>{project.description}</p>
          <dl className={styles.details}>
            {project.roles.length > 0 ? (
              <div className={styles.detail}>
                <dt className={styles.label}>{t("roles")}</dt>
                <dd className={styles.value}>{project.roles.join(", ")}</dd>
              </div>
            ) : null}
            <div className={styles.detail}>
              <dt className={styles.label}>{t("period")}</dt>
              <dd className={styles.value}>{project.period}</dd>
            </div>
            {project.responsibilities ? (
              <div className={styles.detail}>
                <dt className={styles.label}>{t("responsibilities")}</dt>
                <dd className={`${styles.value} ${styles.multiline}`}>
                  {project.responsibilities}
                </dd>
              </div>
            ) : null}
            <div className={styles.detail}>
              <dt className={styles.label}>{t("environment")}</dt>
              <dd className={styles.value}>{project.environment.join(", ")}</dd>
            </div>
          </dl>
        </article>
      ))}
    </section>
  );
}
