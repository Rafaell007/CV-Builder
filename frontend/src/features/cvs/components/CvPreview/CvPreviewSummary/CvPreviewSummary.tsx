import { useTranslations } from "next-intl";
import styles from "./CvPreviewSummary.module.css";

export interface CvPreviewSummaryProps {
  name: string;
  description: string;
}

/** The summary of the CV document: the CV name and its description. An empty description is hidden. */
export function CvPreviewSummary({ name, description }: CvPreviewSummaryProps) {
  const t = useTranslations("cvs.preview.sections.summary");

  return (
    <section className={styles.section} aria-labelledby="cv-preview-summary-title">
      <h2 id="cv-preview-summary-title" className={styles.title}>
        {t("title")}
      </h2>
      <h3 className={styles.name}>{name}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
    </section>
  );
}
