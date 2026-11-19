import { CvPdfRenderer } from "./cv-pdf-renderer";

describe("CvPdfRenderer", () => {
  it("makes a real PDF file from a document with Cyrillic text", async () => {
    const renderer = new CvPdfRenderer();

    const bytes = await renderer.render({
      defaultStyle: { font: "Roboto" },
      content: [{ text: "Разработчик Frontend — Łukasz" }],
    });

    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("can make a second PDF with the same renderer", async () => {
    const renderer = new CvPdfRenderer();

    await renderer.render({ content: ["one"], defaultStyle: { font: "Roboto" } });
    const second = await renderer.render({ content: ["two"], defaultStyle: { font: "Roboto" } });

    expect(second.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
