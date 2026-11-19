import { Mastery, Proficiency } from "../../../generated/prisma/enums";
import type { CvPreview } from "../cv-preview/models/cv-preview";
import { buildCvPdfDefinition } from "./cv-pdf-document";

function preview(overrides: Partial<CvPreview> = {}): CvPreview {
  return {
    cvId: "cv-1",
    name: "Main CV",
    education: "MSc Computer Science",
    description: "Frontend developer",
    fullName: "Anna Nowak",
    position: "Developer",
    languages: [
      { name: "English", proficiency: Proficiency.C1 },
      { name: "Polish", proficiency: Proficiency.NATIVE },
    ],
    domains: ["Retail"],
    skillGroups: [
      {
        category: "Frontend",
        skills: [
          { name: "React", mastery: Mastery.ADVANCED, experienceYears: 4, lastUsedYear: 2025 },
          { name: "Angular", mastery: Mastery.BEGINNER, experienceYears: null, lastUsedYear: null },
        ],
      },
    ],
    projects: [
      {
        name: "Shop",
        description: "A shop",
        domain: "Retail",
        environment: ["React"],
        roles: ["Developer", "Tester"],
        period: "01.2023 – Till now",
        startDate: new Date("2023-01-01T00:00:00.000Z"),
        endDate: null,
        responsibilities: "Built the UI",
      },
    ],
    ...overrides,
  };
}

/** All text of the document in one string, so a test can look for a value. */
function textOf(preview: CvPreview): string {
  return JSON.stringify(buildCvPdfDefinition(preview, "en").content);
}

describe("buildCvPdfDefinition", () => {
  it("uses the CV name as the title of the file and Roboto as the font", () => {
    const definition = buildCvPdfDefinition(preview(), "en");

    expect(definition.info?.title).toBe("Main CV");
    expect(definition.defaultStyle).toMatchObject({ font: "Roboto" });
  });

  it("prints the values of the preview (AC-21)", () => {
    const text = textOf(preview());

    for (const value of [
      "Anna Nowak",
      "Developer",
      "MSc Computer Science",
      "English — C1",
      "Polish — Native",
      "Retail",
      "Main CV",
      "Frontend developer",
      "Shop",
      "A shop",
      "Developer, Tester",
      "01.2023 – Till now",
      "Built the UI",
    ]) {
      expect(text).toContain(value);
    }
  });

  it("prints the fixed texts in English by default", () => {
    const text = textOf(preview());

    for (const label of [
      "General information",
      "Summary",
      "Projects",
      "Professional skills",
      "Experience in Years",
      "Period: ",
    ]) {
      expect(text).toContain(label);
    }
  });

  it("prints the fixed texts in Polish and keeps the content of the CV as written", () => {
    // The period text comes from the preview, which the service asks for in the same language.
    const polish = preview({
      projects: [{ ...preview().projects[0]!, period: "01.2023 – obecnie" }],
    });
    const text = JSON.stringify(buildCvPdfDefinition(polish, "pl").content);

    for (const label of [
      "Informacje ogólne",
      "Wykształcenie",
      "Znajomość języków",
      "Branże",
      "Podsumowanie",
      "Umiejętności",
      "Projekty",
      "Okres: ",
      "Obowiązki: ",
      "Środowisko: ",
      "Umiejętności zawodowe",
      "Doświadczenie w latach",
      "Ostatnio używana",
      "Polish — Ojczysty",
      "01.2023 – obecnie",
    ]) {
      expect(text).toContain(label);
    }
    // The content is not translated.
    for (const content of ["Anna Nowak", "MSc Computer Science", "Built the UI", "English — C1"]) {
      expect(text).toContain(content);
    }
    expect(text).not.toContain("Till now");
    expect(text).not.toContain("General information");
  });

  it("builds the skills table with the years and an en dash for a missing value", () => {
    const definition = buildCvPdfDefinition(preview(), "en");

    const table = (definition.content as { table?: { body: unknown[][] } }[]).find(
      (item) => item.table !== undefined,
    )?.table;
    expect(table?.body).toEqual([
      expect.any(Array),
      [
        { text: "Frontend", rowSpan: 2, bold: true },
        "React",
        { text: "4", alignment: "right" },
        { text: "2025", alignment: "right" },
      ],
      [{}, "Angular", { text: "–", alignment: "right" }, { text: "–", alignment: "right" }],
    ]);
  });

  it("leaves out the empty parts, like the preview page", () => {
    const text = textOf(
      preview({
        fullName: null,
        position: null,
        education: "",
        languages: [],
        domains: [],
        skillGroups: [{ category: "Empty", skills: [] }],
        projects: [
          {
            ...preview().projects[0]!,
            roles: [],
            responsibilities: null,
            environment: [],
          },
        ],
      }),
    );

    for (const hidden of [
      "General information",
      "Education",
      "Empty",
      "Skills",
      "Professional skills",
      "Role: ",
      "Responsibilities: ",
      "Environment: ",
    ]) {
      expect(text).not.toContain(hidden);
    }
    expect(text).toContain("Projects");
  });

  it("works for a CV with no data at all", () => {
    expect(() =>
      buildCvPdfDefinition(
        preview({ languages: [], domains: [], skillGroups: [], projects: [], description: "" }),
        "en",
      ),
    ).not.toThrow();
  });
});
