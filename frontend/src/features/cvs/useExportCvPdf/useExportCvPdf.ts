"use client";

import { useApolloClient } from "@apollo/client/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { readFailure } from "@/shared/failures";
import { ExportCvPdfDocument } from "@/shared/graphql";
import { useSaveFile } from "../useSaveFile";
import { base64ToPdfBlob } from "../utils";

export type UseExportCvPdfResult = {
  /** The PDF is being made. The button shows its spinner and a second request cannot start. */
  exporting: boolean;
  /** Asks the backend for the PDF and starts the download. A failure shows a toast and the page stays where it is. */
  exportPdf: () => Promise<void>;
};

/**
 * The EXPORT PDF flow of the CV Preview page (S7.6): the `exportCvPdf` request, then the browser download of the file
 * the backend made. The backend checks access and builds the PDF from the same data as the preview, so the page does
 * not build the file itself. Only one request runs at a time (AC-28). The download starts only after the backend
 * answered, so the page never shows an export that did not succeed. On failure a toast shows the reason and the
 * preview stays on the page (AC-47). The base64 text is not cached: it is large and not needed again.
 */
export function useExportCvPdf(cvId: string): UseExportCvPdfResult {
  const t = useTranslations("cvs.preview.export");
  const toast = useToast();
  const client = useApolloClient();
  const saveFile = useSaveFile();
  // The PDF has its fixed texts (section titles, column names) in the language of the page.
  const locale = useLocale();
  const [exporting, setExporting] = useState(false);

  // `exporting` is for the screen and changes after the next render. This ref changes at once, so two clicks in
  // the same tick cannot both start a request.
  const inFlight = useRef(false);

  async function exportPdf(): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setExporting(true);
    try {
      const { data } = await client.query({
        query: ExportCvPdfDocument,
        variables: { cvId, locale },
        fetchPolicy: "no-cache",
      });
      if (!data) throw new Error("The answer has no PDF");
      saveFile(base64ToPdfBlob(data.exportCvPdf.base64), data.exportCvPdf.fileName);
    } catch (failure) {
      const { kind } = readFailure(failure);
      toast.error({
        title: t("failedTitle"),
        description: kind === "notFound" || kind === "forbidden" ? t(kind) : t("failedText"),
      });
    } finally {
      inFlight.current = false;
      setExporting(false);
    }
  }

  return { exporting, exportPdf };
}
