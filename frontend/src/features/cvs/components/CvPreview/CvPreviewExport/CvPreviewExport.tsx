"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components";
import styles from "./CvPreviewExport.module.css";

export interface CvPreviewExportProps {
  /** True while the preview data is missing (loading, failed, no access): no PDF is made from incomplete data. */
  disabled: boolean;
  /** The PDF is being made. The button shows its spinner. */
  exporting: boolean;
  /** Called on a click. The container (`CvPreview`) starts the export. */
  onExport: () => void;
}

/**
 * The EXPORT PDF action of the Preview tab (S7.6, AC-20, AC-26 to AC-28). The button is disabled without preview
 * data and shows a spinner while the PDF is made. A hidden status text tells screen readers about the running export.
 * The export itself (`useExportCvPdf`) runs in `CvPreview`; this component only shows its state.
 */
export function CvPreviewExport({ disabled, exporting, onExport }: CvPreviewExportProps) {
  const t = useTranslations("cvs.preview.export");

  return (
    <div className={styles.toolbar}>
      <Button variant="primary" loading={exporting} disabled={disabled} onClick={onExport}>
        {t("label")}
      </Button>
      <span role="status" className={styles.status}>
        {exporting ? t("generating") : ""}
      </span>
    </div>
  );
}
