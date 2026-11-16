import { useTranslations } from "next-intl";
import type { CvPreviewData } from "../../../cvs.types";
import styles from "./CvPreviewGeneral.module.css";

export interface CvPreviewGeneralProps {
  education: CvPreviewData["education"];
  languages: CvPreviewData["languages"];
  domains: CvPreviewData["domains"];
}

/** General information of the CV document: education, languages with their level (`English — C1`) and unique domains. An empty list is hidden. The CEFR levels A1 to C2 are shown as they are; `NATIVE` is translated. */
export function CvPreviewGeneral({ education, languages, domains }: CvPreviewGeneralProps) {
  const t = useTranslations("cvs.preview.sections.general");

  return (
    <section className={styles.section} aria-labelledby="cv-preview-general-title">
      <h2 id="cv-preview-general-title" className={styles.title}>
        {t("title")}
      </h2>
      {education ? (
        <div className={styles.block}>
          <h3 className={styles.label}>{t("education")}</h3>
          <p className={styles.text}>{education}</p>
        </div>
      ) : null}
      {languages.length > 0 ? (
        <div className={styles.block}>
          <h3 className={styles.label}>{t("languages")}</h3>
          <ul className={styles.list}>
            {languages.map((language) => (
              <li key={language.name}>
                {`${language.name} — ${language.proficiency === "NATIVE" ? t("levelNative") : language.proficiency}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {domains.length > 0 ? (
        <div className={styles.block}>
          <h3 className={styles.label}>{t("domains")}</h3>
          <ul className={styles.list}>
            {domains.map((domain) => (
              <li key={domain}>{domain}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
