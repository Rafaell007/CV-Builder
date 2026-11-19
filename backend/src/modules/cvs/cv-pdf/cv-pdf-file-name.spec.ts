import { toPdfFileName } from "./cv-pdf-file-name";

describe("toPdfFileName", () => {
  it("joins the words of the CV name with hyphens (AC-22)", () => {
    expect(toPdfFileName("Software Engineer with 5 years of experience")).toBe(
      "software-engineer-with-5-years-of-experience.pdf",
    );
  });

  it("removes punctuation and repeated separators", () => {
    expect(toPdfFileName("  Ann's CV -- (final)!  ")).toBe("ann-s-cv-final.pdf");
  });

  it("removes accents from Latin letters", () => {
    expect(toPdfFileName("Łukasz Żółć – Café")).toBe("łukasz-zołc-cafe.pdf");
  });

  it("keeps Cyrillic letters", () => {
    expect(toPdfFileName("Разработчик Frontend")).toBe("разработчик-frontend.pdf");
  });

  it("gives cv.pdf when the name has no letter or digit", () => {
    expect(toPdfFileName("!!! ---")).toBe("cv.pdf");
  });

  it("cuts a very long name and leaves no hyphen at the end", () => {
    const name = `${"a".repeat(99)} b`;

    const result = toPdfFileName(name);

    expect(result).toBe(`${"a".repeat(99)}.pdf`);
  });
});
