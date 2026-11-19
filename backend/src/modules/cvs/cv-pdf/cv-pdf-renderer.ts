import { Injectable } from "@nestjs/common";
import { dirname, join, resolve } from "node:path";
import pdfmake from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

/**
 * Roboto is the font of pdfmake. It has Latin and Cyrillic letters, so a CV with Cyrillic text
 * prints correctly. The four files come from the `pdfmake` package (folder `fonts/Roboto`), so no
 * font file is kept in this repository.
 */
function fontFolder(): string {
  return join(dirname(require.resolve("pdfmake/package.json")), "fonts", "Roboto");
}

function fontFiles() {
  const folder = fontFolder();
  return {
    Roboto: {
      normal: join(folder, "Roboto-Regular.ttf"),
      bold: join(folder, "Roboto-Medium.ttf"),
      italics: join(folder, "Roboto-Italic.ttf"),
      bolditalics: join(folder, "Roboto-MediumItalic.ttf"),
    },
  };
}

/** Turns a pdfmake document into the bytes of a PDF file. Kept apart from the content, so tests can swap it. */
@Injectable()
export class CvPdfRenderer {
  private fontsAdded = false;

  async render(definition: TDocumentDefinitions): Promise<Buffer> {
    // pdfmake keeps its fonts in one shared object, so they are added once.
    if (!this.fontsAdded) {
      pdfmake.addFonts(fontFiles());
      // pdfmake may read local files named in a document. Only the font folder is allowed, so
      // text from a CV can never make it read another file.
      const allowed = resolve(fontFolder());
      pdfmake.setLocalAccessPolicy((path: string) => resolve(path).startsWith(allowed));
      // The PDF has no remote images or fonts, so no URL is allowed.
      pdfmake.setUrlAccessPolicy(() => false);
      this.fontsAdded = true;
    }
    return pdfmake.createPdf(definition).getBuffer();
  }
}
