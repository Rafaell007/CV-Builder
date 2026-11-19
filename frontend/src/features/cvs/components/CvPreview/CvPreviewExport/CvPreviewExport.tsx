"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components";
import { useExportCvPdf } from "../../../useExportCvPdf";
import styles from "./CvPreviewExport.module.css";

export interface CvPreviewExportProps {
  cvId: string;
  /** True while the preview data is missing (loading, failed, no access): no PDF is made from incomplete data. */
  disabled: boolean;
}

/**
 * The EXPORT PDF action of the Preview tab (S7.6, AC-20, AC-26 to AC-28). The button is disabled without preview
 * data and shows a spinner while the PDF is made. A hidden status text tells screen readers about the running export.
 */
export function CvPreviewExport({ cvId, disabled }: CvPreviewExportProps) {
  const t = useTranslations("cvs.preview.export");
  const { exporting, exportPdf } = useExportCvPdf(cvId);

  return (
    <div className={styles.toolbar}>
      <Button
        variant="primary"
        loading={exporting}
        disabled={disabled}
        onClick={() => void exportPdf()}
      >
        {t("label")}
      </Button>
      <span role="status" className={styles.status}>
        {exporting ? t("generating") : ""}
      </span>
    </div>
  );
}
