import { Injectable } from "@nestjs/common";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import pdfmake from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

/**
 * The largest PDF the backend sends. The file goes to the client as base64 text inside a GraphQL answer
 * (about one third larger), so it is kept in memory twice. A CV PDF of text is far below this size.
 */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

/**
 * Roboto is the font of pdfmake. It has Latin and Cyrillic letters, so a CV with Cyrillic text
 * prints correctly. The four files come from the `pdfmake` package (folder `fonts/Roboto`), so no
 * font file is kept in this repository.
 */
const FONT_FOLDER = join(dirname(require.resolve("pdfmake/package.json")), "fonts", "Roboto");

/** True when the path is the font folder or a file inside it. Compares path parts, not text prefixes, so a folder `Roboto-evil` does not pass. */
export function isInsideFontFolder(path: string): boolean {
  const fromFolder = relative(FONT_FOLDER, resolve(path));
  return fromFolder !== ".." && !fromFolder.startsWith(`..${sep}`) && !isAbsolute(fromFolder);
}

/**
 * pdfmake keeps its fonts and its access policies in one object that the whole process shares, so they
 * can only be set once per process, not once per renderer. This runs on the first PDF and not again.
 */
let pdfmakeConfigured = false;
function configurePdfmake(): void {
  if (pdfmakeConfigured) return;
  pdfmake.addFonts({
    Roboto: {
      normal: join(FONT_FOLDER, "Roboto-Regular.ttf"),
      bold: join(FONT_FOLDER, "Roboto-Medium.ttf"),
      italics: join(FONT_FOLDER, "Roboto-Italic.ttf"),
      bolditalics: join(FONT_FOLDER, "Roboto-MediumItalic.ttf"),
    },
  });
  // pdfmake may read local files named in a document. Only the font folder is allowed, so text from
  // a CV can never make it read another file.
  pdfmake.setLocalAccessPolicy(isInsideFontFolder);
  // The PDF has no remote images or fonts, so no URL is allowed.
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmakeConfigured = true;
}

/** Turns a pdfmake document into the bytes of a PDF file. Kept apart from the content, so tests can swap it. */
@Injectable()
export class CvPdfRenderer {
  /** @throws Error when the file is larger than `MAX_PDF_BYTES`. */
  async render(definition: TDocumentDefinitions): Promise<Buffer> {
    configurePdfmake();
    const bytes = await pdfmake.createPdf(definition).getBuffer();
    if (bytes.length > MAX_PDF_BYTES) {
      throw new Error(`The PDF has ${bytes.length} bytes, the limit is ${MAX_PDF_BYTES}`);
    }
    return bytes;
  }
}
