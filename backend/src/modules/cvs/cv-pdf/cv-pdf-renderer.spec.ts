import { dirname, join } from "node:path";
import pdfmake from "pdfmake";
import { CvPdfRenderer, isInsideFontFolder, MAX_PDF_BYTES } from "./cv-pdf-renderer";

const FONT_FOLDER = join(dirname(require.resolve("pdfmake/package.json")), "fonts", "Roboto");

describe("CvPdfRenderer", () => {
  afterEach(() => jest.restoreAllMocks());

  it("makes a real PDF file from a document with Cyrillic text", async () => {
    const renderer = new CvPdfRenderer();

    const bytes = await renderer.render({
      defaultStyle: { font: "Roboto" },
      content: [{ text: "Разработчик Frontend — Łukasz" }],
    });

    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("can make a second PDF with the same renderer, and with another renderer", async () => {
    const first = new CvPdfRenderer();
    const second = new CvPdfRenderer();

    await first.render({ content: ["one"], defaultStyle: { font: "Roboto" } });
    const again = await first.render({ content: ["two"], defaultStyle: { font: "Roboto" } });
    // The settings of pdfmake are shared by the process, so another renderer must work too.
    const other = await second.render({ content: ["three"], defaultStyle: { font: "Roboto" } });

    expect(again.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(other.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("refuses a file that is larger than the limit", async () => {
    jest.spyOn(pdfmake, "createPdf").mockReturnValue({
      getBuffer: () => Promise.resolve(Buffer.alloc(MAX_PDF_BYTES + 1)),
    } as unknown as ReturnType<typeof pdfmake.createPdf>);

    await expect(new CvPdfRenderer().render({ content: ["x"] })).rejects.toThrow("limit");
  });

  it("accepts a file of exactly the limit", async () => {
    jest.spyOn(pdfmake, "createPdf").mockReturnValue({
      getBuffer: () => Promise.resolve(Buffer.alloc(MAX_PDF_BYTES)),
    } as unknown as ReturnType<typeof pdfmake.createPdf>);

    await expect(new CvPdfRenderer().render({ content: ["x"] })).resolves.toHaveLength(
      MAX_PDF_BYTES,
    );
  });
});

describe("isInsideFontFolder", () => {
  it("allows a font file of the folder", () => {
    expect(isInsideFontFolder(join(FONT_FOLDER, "Roboto-Regular.ttf"))).toBe(true);
  });

  it("refuses a folder next to the font folder that starts with the same text", () => {
    expect(isInsideFontFolder(`${FONT_FOLDER}-evil/x.ttf`)).toBe(false);
  });

  it("refuses a path that leaves the folder with ..", () => {
    expect(isInsideFontFolder(join(FONT_FOLDER, "..", "..", "package.json"))).toBe(false);
  });

  it("refuses a file in a parent folder", () => {
    expect(isInsideFontFolder(join(FONT_FOLDER, "..", "Roboto-Regular.ttf"))).toBe(false);
  });
});
