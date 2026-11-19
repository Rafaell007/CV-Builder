import type { MockLink } from "@apollo/client/testing";
import { ExportCvPdfDocument } from "@/shared/graphql";

// Mock data for tests and stories. The page itself never uses it: the PDF always comes from the backend.

/** The text `%PDF-1.7 mock` as base64. It is not a real PDF, only bytes that a test can compare. */
export const exportCvPdfSample = {
  __typename: "CvPdf" as const,
  fileName: "frontend-developer.pdf",
  base64: btoa("%PDF-1.7 mock"),
};

/** MockedProvider response of the `ExportCvPdf` query for the CV with this id. */
export const exportCvPdfMock = (
  cvId: string,
  pdf: typeof exportCvPdfSample = exportCvPdfSample,
): MockLink.MockedResponse => ({
  request: { query: ExportCvPdfDocument, variables: { cvId } },
  result: { data: { exportCvPdf: pdf } },
});

/** The backend answers the `ExportCvPdf` query with a GraphQL error code, e.g. `NOT_FOUND` or `INTERNAL_SERVER_ERROR`. */
export const exportCvPdfCodeErrorMock = (cvId: string, code: string): MockLink.MockedResponse => ({
  request: { query: ExportCvPdfDocument, variables: { cvId } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** The `ExportCvPdf` query fails like a network error (no GraphQL error code). */
export const exportCvPdfErrorMock = (cvId: string): MockLink.MockedResponse => ({
  request: { query: ExportCvPdfDocument, variables: { cvId } },
  error: new Error("Failed to fetch"),
});
