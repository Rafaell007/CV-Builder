import type { Node, NodeQueries } from "pdfmake/interfaces";
import { Mastery, Proficiency } from "../../../generated/prisma/enums";
import type { CvPreview } from "../cv-preview/models/cv-preview";
import { buildCvPdfDefinition, keepBlocksTogether, pageMarker } from "./cv-pdf-document";
import { CvPdfRenderer } from "./cv-pdf-renderer";

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
      "SHOP",
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
      "Education",
      "Language proficiency",
      "Projects",
      "Project roles",
      "Period",
      "Professional skills",
      "SKILLS",
      "EXPERIENCE IN YEARS",
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
      "Wykształcenie",
      "Znajomość języków",
      "Branże",
      "Projekty",
      "Role w projekcie",
      "Okres",
      "Obowiązki",
      "Środowisko",
      "Umiejętności zawodowe",
      "DOŚWIADCZENIE W LATACH",
      "OSTATNIO UŻYWANA",
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
    expect(text).not.toContain("Education");
  });

  it("prints the name and the position like the page, the position in capital letters", () => {
    const text = textOf(preview());

    expect(text).toContain("Anna Nowak");
    expect(text).toContain("DEVELOPER");
  });

  it("has no visible title for General information, Summary and Skills, like the page", () => {
    const text = textOf(preview());

    for (const title of ["General information", "Summary", '"Skills"']) {
      expect(text).not.toContain(title);
    }
  });

  it("lets every block break across pages, so no text is cut, and uses keepBlocksTogether", () => {
    const definition = buildCvPdfDefinition(preview(), "en");
    const blocks = definition.content as { id?: string; unbreakable?: boolean }[];

    expect(blocks.filter((item) => item.unbreakable === true)).toEqual([]);
    expect(blocks.map((item) => item.id).filter((id) => id !== undefined)).toEqual([
      "full-name",
      "position",
      "summary",
      "projects-title",
      "project-0",
      "skills-title",
      "skills-table",
    ]);
    expect(definition.pageBreakBefore).toBe(keepBlocksTogether);
  });

  it("renders the longest CV the inputs allow", async () => {
    const long = (word: string) => `${word} `.repeat(400).slice(0, 2000);
    const longest = preview({
      description: long("summary"),
      skillGroups: Array.from({ length: 12 }, (_, index) => ({
        ...preview().skillGroups[0]!,
        category: `Category ${index}`,
      })),
      projects: Array.from({ length: 9 }, () => ({
        ...preview().projects[0]!,
        description: long("description"),
        responsibilities: long("responsibility"),
      })),
    });

    const bytes = await new CvPdfRenderer().render(buildCvPdfDefinition(longest, "en"));

    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("builds the skills table with the years and an en dash for a missing value", () => {
    const definition = buildCvPdfDefinition(preview(), "en");

    const tables = (definition.content as { table?: { body: unknown[][] } }[]).filter(
      (item) => item.table !== undefined,
    );
    expect(tables.at(-1)?.table?.body).toEqual([
      expect.any(Array),
      [
        { text: "Frontend", rowSpan: 2, color: "#c63031" },
        { text: "React", bold: true },
        { text: "4", alignment: "center" },
        { text: "2025", alignment: "center" },
      ],
      [
        {},
        { text: "Angular", bold: true },
        { text: "–", alignment: "center" },
        { text: "–", alignment: "center" },
      ],
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
      "Education",
      "Empty",
      "Professional skills",
      "Project roles",
      "Responsibilities",
      "Environment",
    ]) {
      expect(text).not.toContain(hidden);
    }
    expect(text).toContain("Projects");
  });

  it("puts the page marker, like 2/3, in the bottom right corner", () => {
    const { footer } = buildCvPdfDefinition(preview(), "en");

    expect(footer).toBe(pageMarker);
    expect(pageMarker(2, 3)).toMatchObject({ text: "2/3", alignment: "right" });
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

describe("keepBlocksTogether", () => {
  // The nodes as pdfmake passes them to `pageBreakBefore`: only the fields that the rule reads.
  function node(id: string | undefined, pageNumbers: number[], headlineLevel?: number): Node {
    return { id, pageNumbers, headlineLevel } as Node;
  }
  function queries(previous: Node[], following: Node[] = []): NodeQueries {
    return {
      getPreviousNodesOnPage: () => previous,
      getFollowingNodesOnPage: () => following,
      getNodesOnNextPage: () => [],
    };
  }
  const title = (pageNumbers = [2]) => node("projects-title", pageNumbers, 1);
  const textInside = node(undefined, [2]);

  it("moves a project that would break across pages to the next page", () => {
    const project = node("project-1", [2, 3]);

    expect(keepBlocksTogether(project, queries([node("project-0", [2]), textInside]))).toBe(true);
  });

  it("keeps a project that fits on its page", () => {
    expect(keepBlocksTogether(node("project-1", [2]), queries([node("project-0", [2])]))).toBe(
      false,
    );
  });

  it("does not move a project at the top of a page, even when it is taller than the page", () => {
    expect(keepBlocksTogether(node("project-0", [3, 4]), queries([]))).toBe(false);
    expect(keepBlocksTogether(node("project-0", [3, 4]), queries([title([3])]))).toBe(false);
  });

  it("moves a section title that is alone at the bottom of a page", () => {
    expect(keepBlocksTogether(title(), queries([node("summary", [1, 2])], [textInside]))).toBe(
      true,
    );
  });

  it("moves a section title together with its first project when the project moves", () => {
    const above = [node("summary", [1, 2])];

    expect(keepBlocksTogether(title(), queries(above, [node("project-0", [2, 3])]))).toBe(true);
    expect(keepBlocksTogether(title(), queries(above, [node("project-0", [2])]))).toBe(false);
  });

  it("keeps a section title at the top of a page", () => {
    expect(keepBlocksTogether(title(), queries([], [node("project-0", [2, 3])]))).toBe(false);
  });

  it("never moves the other blocks", () => {
    expect(keepBlocksTogether(node("summary", [1, 2]), queries([node("position", [1])]))).toBe(
      false,
    );
    expect(keepBlocksTogether(textInside, queries([node("project-0", [2])]))).toBe(false);
  });
});
