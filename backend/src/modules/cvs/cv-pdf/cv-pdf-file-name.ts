const FALLBACK_NAME = "cv";
const MAX_LENGTH = 100;

/**
 * The file name of the exported PDF, made from the CV name: lower case, words joined with `-`
 * (`Software Engineer, 5 years` becomes `software-engineer-5-years.pdf`). Accents are removed.
 * Letters of other alphabets (for example Cyrillic) stay. A name with no letter or digit gives `cv.pdf`.
 */
export function toPdfFileName(cvName: string): string {
  const slug = cvName
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, "");
  return `${slug === "" ? FALLBACK_NAME : slug}.pdf`;
}
