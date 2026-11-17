"use client";

import { useTranslations } from "next-intl";
import { PageState, type PageStateLabels } from "@/shared/components";
import { useCvPreview } from "../../useCvPreview";
import styles from "./CvPreview.module.css";
import { CvPreviewGeneral } from "./CvPreviewGeneral";
import { CvPreviewHeader } from "./CvPreviewHeader";
import { CvPreviewProjects } from "./CvPreviewProjects";
import { CvPreviewSkills } from "./CvPreviewSkills";
import { CvPreviewSkillsTable } from "./CvPreviewSkillsTable";
import { CvPreviewSummary } from "./CvPreviewSummary";

export interface CvPreviewProps {
  cvId: string;
}

/**
 * The content of the Preview tab (PLAN S7.5, KAN-160): the CV as a printable document, with the loading, error
 * (Retry), and unauthorized states. All data comes from the backend, which also decides who may see the CV.
 * The page `h1` (the CV name) is in `CvLayout`, so the document starts with `h2` headings. EXPORT PDF is S7.6.
 */
export function CvPreview({ cvId }: CvPreviewProps) {
  const t = useTranslations("cvs.preview");
  const { preview, loading, failed, unauthorized, retry } = useCvPreview(cvId);

  const stateLabels: Partial<PageStateLabels> = {
    loading: t("states.loading"),
    error: t("states.error"),
    retry: t("states.retry"),
  };

  if (loading && !preview) return <PageState kind="loading" labels={stateLabels} />;
  // No Retry here: the CV is missing or not allowed, and asking again gives the same answer. No CV data is shown.
  if (unauthorized) {
    return <PageState kind="error" labels={{ error: t("states.unauthorized") }} />;
  }
  if (failed) return <PageState kind="error" labels={stateLabels} onRetry={retry} />;
  // `cvPreview` is non-null in the schema, so after loading and without a failure the data is there.
  if (!preview) return null;

  return (
    <article className={styles.document} aria-label={t("document")}>
      <CvPreviewHeader fullName={preview.fullName} position={preview.position} />
      <CvPreviewGeneral
        education={preview.education}
        languages={preview.languages}
        domains={preview.domains}
      />
      <CvPreviewSummary name={preview.name} description={preview.description} />
      <CvPreviewSkills skillGroups={preview.skillGroups} />
      <CvPreviewProjects projects={preview.projects} />
      <section className={styles.section} aria-labelledby="cv-preview-professional-skills-title">
        <h2 id="cv-preview-professional-skills-title" className={styles.title}>
          {t("sections.professionalSkills.title")}
        </h2>
        <CvPreviewSkillsTable skillGroups={preview.skillGroups} />
      </section>
    </article>
  );
}
