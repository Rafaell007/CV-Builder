"use client";

import { useTranslations } from "next-intl";
import { PageState, type PageStateLabels } from "@/shared/components";
import { useCvPreview } from "../../useCvPreview";
import styles from "./CvPreview.module.css";
import { CvPreviewExport } from "./CvPreviewExport";
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
 * The page `h1` (the CV name) is in `CvLayout`, so the document starts with `h2` headings. Above the document is the
 * EXPORT PDF action (S7.6, KAN-119), disabled while there is no preview data.
 */
export function CvPreview({ cvId }: CvPreviewProps) {
  const t = useTranslations("cvs.preview");
  const { preview, loading, failed, unauthorized, retry } = useCvPreview(cvId);

  const stateLabels: Partial<PageStateLabels> = {
    loading: t("states.loading"),
    error: t("states.error"),
    retry: t("states.retry"),
  };

  // EXPORT PDF is on the page in every state, and disabled until the preview data is there (AC-26, AC-48).
  const exportAction = <CvPreviewExport cvId={cvId} disabled={!preview} />;

  if (loading && !preview) {
    return (
      <>
        {exportAction}
        <PageState kind="loading" labels={stateLabels} />
      </>
    );
  }
  // No Retry here: the CV is missing or not allowed, and asking again gives the same answer. No CV data is shown.
  if (unauthorized) {
    return (
      <>
        {exportAction}
        <PageState kind="error" labels={{ error: t("states.unauthorized") }} />
      </>
    );
  }
  if (failed) {
    return (
      <>
        {exportAction}
        <PageState kind="error" labels={stateLabels} onRetry={retry} />
      </>
    );
  }
  // `cvPreview` is non-null in the schema, so after loading and without a failure the data is there.
  if (!preview) return null;

  return (
    <>
      {exportAction}
      <article className={styles.document} aria-label={t("document")}>
        <CvPreviewHeader fullName={preview.fullName} position={preview.position} />
        <div className={styles.overview}>
          <div className={styles.aside}>
            <CvPreviewGeneral
              education={preview.education}
              languages={preview.languages}
              domains={preview.domains}
            />
          </div>
          <div className={styles.main}>
            <CvPreviewSummary name={preview.name} description={preview.description} />
            <CvPreviewSkills skillGroups={preview.skillGroups} />
          </div>
        </div>
        <CvPreviewProjects projects={preview.projects} />
        <section className={styles.section} aria-labelledby="cv-preview-professional-skills-title">
          <h2 id="cv-preview-professional-skills-title" className={styles.title}>
            {t("sections.professionalSkills.title")}
          </h2>
          <CvPreviewSkillsTable skillGroups={preview.skillGroups} />
        </section>
      </article>
    </>
  );
}
