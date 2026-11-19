/**
 * The languages of the texts that the backend builds for the CV preview and the CV PDF. They are the
 * languages of the frontend (`en`, `pl`). The content of a CV is never translated.
 */
export const CV_LOCALES = ["en", "pl"] as const;
export type CvLocale = (typeof CV_LOCALES)[number];
export const DEFAULT_CV_LOCALE: CvLocale = "en";

/**
 * The end of a project period when the project has no end date (`01.2023 – Till now`). Both the preview
 * and the PDF use it, so a page and its PDF in the same language show the same period.
 */
export const OPEN_PERIOD_WORDS: Record<CvLocale, string> = {
  en: "Till now",
  pl: "obecnie",
};
