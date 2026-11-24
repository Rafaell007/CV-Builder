import type {
  Content,
  ContentText,
  ContentTable,
  TableCell,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import type { CvLocale } from "../cv-locale";
import type { CvPreview } from "../cv-preview/models/cv-preview";
import { Proficiency } from "../cv-preview/models/proficiency.enum";
import type { CvPreviewSkillGroup } from "../cv-preview/models/cv-preview-skill-group";
import { pdfLabels } from "./cv-pdf-labels";
import type { PdfLabels } from "./cv-pdf-labels";

const EN_DASH = "–";
const FONT = "Roboto";
// The colours of the design tokens (`--color-primary`, `--color-text`, `--color-cv-divider`). The PDF is
// always on white paper, so there is only the light theme.
const COLOR_ACCENT = "#c63031";
const COLOR_TEXT = "#2e2e2e";
const COLOR_DIVIDER = "#aeaeae";

// The page is 515 pt wide inside the margins. The preview is 852 px wide, so one pixel is about 0.6 pt.
const SIDE_COLUMN_WIDTH = 160;
const COLUMN_GAP = 14;
const LINE_WIDTH = 0.75;

const BODY_FONT_SIZE = 10;
const LABEL: Omit<ContentText, "text"> = { bold: true, margin: [0, 0, 0, 3] };
const SECTION_TITLE: Omit<ContentText, "text"> = {
  fontSize: 20,
  margin: [0, 22, 0, 12],
};

/** `NATIVE` is the only level that is a word. The levels A1 to C2 are printed as they are. */
function proficiencyLabel(proficiency: Proficiency, labels: PdfLabels): string {
  return proficiency === Proficiency.NATIVE ? labels.levelNative : proficiency;
}

function yearCell(value: number | null): string {
  return value === null ? EN_DASH : String(value);
}

/** A bold label with its content under it. The block is left out when the content is empty, like on the preview page. */
function block(label: string, content: Content[]): Content[] {
  if (content.length === 0) return [];
  return [{ stack: [{ text: label, ...LABEL }, ...content], margin: [0, 0, 0, 10] }];
}

/** A table of one row with two columns and a red vertical line between them (the layout of the preview page). */
function twoColumns(left: Content[], right: Content[], sideWidth: number): ContentTable {
  return {
    unbreakable: true,
    table: { widths: [sideWidth, "*"], body: [[{ stack: left }, { stack: right }]] },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: (index) => (index === 1 ? LINE_WIDTH : 0),
      vLineColor: () => COLOR_ACCENT,
      paddingLeft: (index) => (index === 1 ? COLUMN_GAP : 0),
      // The text of the left column stops before the red line.
      paddingRight: (index) => (index === 0 ? COLUMN_GAP : 0),
      paddingTop: () => 10,
      paddingBottom: () => 0,
    },
  };
}

function header(preview: CvPreview): Content[] {
  const content: Content[] = [];
  if (preview.fullName !== null) content.push({ text: preview.fullName, fontSize: 24 });
  if (preview.position !== null) {
    content.push({ text: preview.position.toUpperCase(), fontSize: 11, margin: [0, 2, 0, 0] });
  }
  return content;
}

function general(preview: CvPreview, labels: PdfLabels): Content[] {
  const education: Content[] = preview.education === "" ? [] : [{ text: preview.education }];
  const languages: Content[] = preview.languages.map(({ name, proficiency }) => ({
    text: `${name} — ${proficiencyLabel(proficiency, labels)}`,
  }));
  const domains: Content[] = preview.domains.map((domain) => ({ text: domain }));
  return [
    ...block(labels.education, education),
    ...block(labels.languages, languages),
    ...block(labels.domains, domains),
  ];
}

function summary(preview: CvPreview): Content[] {
  return [
    { text: preview.name, bold: true, margin: [0, 0, 0, 3] },
    ...(preview.description === "" ? [] : [{ text: preview.description, margin: [0, 0, 0, 10] }]),
  ] as Content[];
}

/** Skill names per category, as one sentence: `React, Redux.` A category without skills is left out. */
function skills(groups: CvPreviewSkillGroup[]): Content[] {
  return groups
    .filter((group) => group.skills.length > 0)
    .flatMap(({ category, skills: list }) =>
      block(category, [{ text: `${list.map((skill) => skill.name).join(", ")}.` }]),
    );
}

function detail(label: string, value: string | null): Content[] {
  if (value === null || value === "") return [];
  return block(label, [{ text: value }]);
}

function projects(preview: CvPreview, labels: PdfLabels): Content[] {
  if (preview.projects.length === 0) return [];
  const rows = preview.projects.map((project): Content => {
    const left: Content[] = [
      { text: project.name.toUpperCase(), bold: true, color: COLOR_ACCENT, margin: [0, 0, 0, 3] },
      ...(project.description === "" ? [] : [{ text: project.description }]),
    ];
    const right: Content[] = [
      ...detail(labels.roles, project.roles.join(", ")),
      ...detail(labels.period, project.period),
      ...detail(labels.responsibilities, project.responsibilities),
      ...detail(labels.environment, project.environment.join(", ")),
    ];
    return twoColumns(left, right, SIDE_COLUMN_WIDTH);
  });
  return [{ text: labels.projects, ...SECTION_TITLE }, ...rows];
}

/**
 * The Professional skills table: a header with a red line under it, then the rows of each category. The category cell
 * spans the rows of its skills, and a grey line closes each category.
 */
function skillsTable(groups: CvPreviewSkillGroup[], labels: PdfLabels): Content[] {
  const filled = groups.filter((group) => group.skills.length > 0);
  if (filled.length === 0) return [];
  const headerCell = (text: string, alignment: "left" | "center" = "center"): TableCell => ({
    text: text.toUpperCase(),
    fontSize: 8,
    alignment,
    bold: true,
  });
  const body: TableCell[][] = [
    [
      headerCell(labels.columnSkills, "left"),
      {},
      headerCell(labels.columnExperience),
      headerCell(labels.columnLastUsed),
    ],
  ];
  // Index in `body` where a category ends (the line is drawn under that row).
  const categoryEnds = new Set<number>();
  for (const { category, skills: list } of filled) {
    list.forEach((skill, index) => {
      body.push([
        index === 0 ? { text: category, rowSpan: list.length, color: COLOR_ACCENT } : {},
        { text: skill.name, bold: true },
        { text: yearCell(skill.experienceYears), alignment: "center" },
        { text: yearCell(skill.lastUsedYear), alignment: "center" },
      ]);
    });
    categoryEnds.add(body.length);
  }
  return [
    { text: labels.professionalSkills, ...SECTION_TITLE },
    {
      table: { headerRows: 1, widths: [130, "*", 70, 60], body },
      layout: {
        // Line index `i` is above row `i`. 1 is under the header, `n` is under the last row of a category.
        hLineWidth: (index) => (index === 1 || categoryEnds.has(index) ? LINE_WIDTH : 0),
        hLineColor: (index) => (index === 1 ? COLOR_ACCENT : COLOR_DIVIDER),
        vLineWidth: () => 0,
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 4,
        paddingBottom: (index) => (categoryEnds.has(index + 1) ? 12 : 3),
      },
    },
  ];
}

/** The page marker in the bottom right corner: `1/3`. It sits in the bottom margin, so it never moves the content. */
export function pageMarker(currentPage: number, pageCount: number): Content {
  return {
    text: `${currentPage}/${pageCount}`,
    alignment: "right",
    fontSize: 8,
    margin: [40, 0, 40, 0],
  };
}

/**
 * The PDF of a CV as a pdfmake document. It takes the same `CvPreview` object as the preview page,
 * so the years, the periods and the domains are the values of the backend calculation and are
 * not calculated again here (AC-21). The layout follows the preview page: the name and the position, the general
 * information on the left and the summary and the skills on the right, the projects with the details on the right,
 * and the Professional skills table. The fixed texts (section titles, column names, "Till now") are in the given
 * language, English by default. The content of the CV is printed as it was written.
 */
export function buildCvPdfDefinition(preview: CvPreview, locale: CvLocale): TDocumentDefinitions {
  const labels = pdfLabels(locale);
  return {
    info: { title: preview.name },
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    footer: pageMarker,
    defaultStyle: { font: FONT, fontSize: BODY_FONT_SIZE, color: COLOR_TEXT, lineHeight: 1.25 },
    content: [
      ...header(preview),
      { text: "", margin: [0, 0, 0, 14] },
      twoColumns(
        general(preview, labels),
        [...summary(preview), ...skills(preview.skillGroups)],
        SIDE_COLUMN_WIDTH,
      ),
      ...projects(preview, labels),
      ...skillsTable(preview.skillGroups, labels),
    ],
  };
}
