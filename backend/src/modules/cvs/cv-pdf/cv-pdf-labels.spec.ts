import { PDF_LOCALES, pdfLabels } from "./cv-pdf-labels";

describe("pdfLabels", () => {
  it("has the same texts in every language, none of them empty", () => {
    const [first, ...others] = PDF_LOCALES;
    const keys = Object.keys(pdfLabels(first)).sort();

    for (const locale of [first, ...others]) {
      const labels = pdfLabels(locale);
      expect(Object.keys(labels).sort()).toEqual(keys);
      for (const value of Object.values(labels)) expect(value.trim()).not.toBe("");
    }
  });

  it("has English and Polish, the languages of the frontend", () => {
    expect([...PDF_LOCALES]).toEqual(["en", "pl"]);
  });
});
