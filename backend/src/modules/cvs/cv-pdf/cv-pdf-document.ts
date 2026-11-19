import type { Content, ContentText, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import type { CvPreview } from "../cv-preview/models/cv-preview";
import { formatPeriod } from "../cv-preview/calculations";
import type { CvPreviewSkillGroup } from "../cv-preview/models/cv-preview-skill-group";
import { DEFAULT_PDF_LOCALE, pdfLabels } from "./cv-pdf-labels";
import type { PdfLabels, PdfLocale } from "./cv-pdf-labels";

const EN_DASH = "–";
const FONT = "Roboto";
const COLOR_MUTED = "#555555";
const COLOR_LINE = "#bbbbbb";

const SECTION_TITLE: Omit<ContentText, "text"> = {
  fontSize: 13,
  bold: true,
  margin: [0, 14, 0, 4],
};
const PART_TITLE: Omit<ContentText, "text"> = {
  fontSize: 10,
  bold: true,
  color: COLOR_MUTED,
  margin: [0, 6, 0, 2],
};

/** `NATIVE` is the only level that is a word. The levels A1 to C2 are printed as they are. */
function proficiencyLabel(proficiency: string, labels: PdfLabels): string {
  return proficiency === "NATIVE" ? labels.levelNative : proficiency;
}

function yearCell(value: number | null): string {
  return value === null ? EN_DASH : String(value);
}

/** A titled part is left out when it has no lines, like the preview page does. */
function part(title: string, lines: string[]): Content[] {
  if (lines.length === 0) return [];
  return [{ text: title, ...PART_TITLE }, { ul: lines }];
}

function header(preview: CvPreview): Content[] {
  const content: Content[] = [];
  if (preview.fullName !== null) content.push({ text: preview.fullName, fontSize: 20, bold: true });
  if (preview.position !== null) {
    content.push({ text: preview.position, fontSize: 12, color: COLOR_MUTED });
  }
  return content;
}

function general(preview: CvPreview, labels: PdfLabels): Content[] {
  const education = preview.education === "" ? [] : [preview.education];
  const languages = preview.languages.map(
    ({ name, proficiency }) => `${name} — ${proficiencyLabel(proficiency, labels)}`,
  );
  const parts = [
    ...part(labels.education, education),
    ...part(labels.languages, languages),
    ...part(labels.domains, preview.domains),
  ];
  if (parts.length === 0) return [];
  return [{ text: labels.generalInformation, ...SECTION_TITLE }, ...parts];
}

function summary(preview: CvPreview, labels: PdfLabels): Content[] {
  return [
    { text: labels.summary, ...SECTION_TITLE },
    { text: preview.name, bold: true },
    ...(preview.description === "" ? [] : [{ text: preview.description, margin: [0, 2, 0, 0] }]),
  ] as Content[];
}

/** Skill names per category. A category without skills is left out. */
function skills(groups: CvPreviewSkillGroup[], labels: PdfLabels): Content[] {
  const filled = groups.filter((group) => group.skills.length > 0);
  if (filled.length === 0) return [];
  return [
    { text: labels.skills, ...SECTION_TITLE },
    ...filled.map(({ category, skills: list }): Content => ({
      text: [{ text: `${category}: `, bold: true }, list.map((skill) => skill.name).join(", ")],
      margin: [0, 0, 0, 2],
    })),
  ];
}

function projects(preview: CvPreview, labels: PdfLabels): Content[] {
  if (preview.projects.length === 0) return [];
  const blocks = preview.projects.map((project): Content => {
    const lines: Content[] = [
      { text: project.name, bold: true, fontSize: 11 },
      { text: project.description, margin: [0, 1, 0, 0] },
    ];
    if (project.roles.length > 0) {
      lines.push({ text: [{ text: `${labels.role}: `, bold: true }, project.roles.join(", ")] });
    }
    // The period is built here from the dates, so "Till now" is in the language of the PDF.
    const period = formatPeriod(project.startDate, project.endDate, labels.present);
    lines.push({ text: [{ text: `${labels.period}: `, bold: true }, period] });
    if (project.responsibilities !== null && project.responsibilities !== "") {
      lines.push({
        text: [{ text: `${labels.responsibilities}: `, bold: true }, project.responsibilities],
      });
    }
    if (project.environment.length > 0) {
      lines.push({
        text: [{ text: `${labels.environment}: `, bold: true }, project.environment.join(", ")],
      });
    }
    return { stack: lines, margin: [0, 0, 0, 8], unbreakable: true };
  });
  return [{ text: labels.projects, ...SECTION_TITLE }, ...blocks];
}

/** One header row, then the rows of each category. The category cell spans the rows of its skills. */
function skillsTable(groups: CvPreviewSkillGroup[], labels: PdfLabels): Content[] {
  const filled = groups.filter((group) => group.skills.length > 0);
  if (filled.length === 0) return [];
  const head: TableCell[] = [
    labels.columnCategory,
    labels.columnSkill,
    labels.columnExperience,
    labels.columnLastUsed,
  ].map((text) => ({ text, bold: true, fillColor: "#eeeeee" }));
  const body: TableCell[][] = [head];
  for (const { category, skills: list } of filled) {
    list.forEach((skill, index) => {
      body.push([
        index === 0 ? { text: category, rowSpan: list.length, bold: true } : {},
        skill.name,
        { text: yearCell(skill.experienceYears), alignment: "right" },
        { text: yearCell(skill.lastUsedYear), alignment: "right" },
      ]);
    });
  }
  return [
    { text: labels.professionalSkills, ...SECTION_TITLE },
    {
      table: { headerRows: 1, widths: ["*", "*", "auto", "auto"], body },
      layout: {
        hLineColor: () => COLOR_LINE,
        vLineColor: () => COLOR_LINE,
      },
    },
  ];
}

/**
 * The PDF of a CV as a pdfmake document. It takes the same `CvPreview` object as the preview page,
 * so the years, the periods and the domains are the values of the backend calculation and are
 * not calculated again here (AC-21). The fixed texts (section titles, column names, "Till now") are in
 * the given language, English by default. The content of the CV is printed as it was written.
 */
export function buildCvPdfDefinition(
  preview: CvPreview,
  locale: PdfLocale = DEFAULT_PDF_LOCALE,
): TDocumentDefinitions {
  const labels = pdfLabels(locale);
  return {
    info: { title: preview.name },
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    defaultStyle: { font: FONT, fontSize: 10 },
    content: [
      ...header(preview),
      ...general(preview, labels),
      ...summary(preview, labels),
      ...skills(preview.skillGroups, labels),
      ...projects(preview, labels),
      ...skillsTable(preview.skillGroups, labels),
    ],
  };
}
