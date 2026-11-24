import type {
  Content,
  ContentText,
  ContentTable,
  Node,
  NodeQueries,
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
// `headlineLevel` marks a section title for `keepBlocksTogether`.
const SECTION_TITLE: Omit<ContentText, "text"> = {
  fontSize: 20,
  margin: [0, 22, 0, 12],
  headlineLevel: 1,
};

// Every top-level block has an `id`, so `keepBlocksTogether` can tell the blocks from the text inside them.
const PROJECT_ID_PREFIX = "project-";

// pdfmake reads `id` on every node and passes it to `pageBreakBefore`, but its types list it only for some nodes.
type TableBlock = ContentTable & { id: string };

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

/**
 * A table of one row with two columns and a red vertical line between them (the layout of the preview page).
 * The row may break across pages, so a block taller than the rest of the page continues on the next one and no
 * text is cut. `keepBlocksTogether` moves a project that would break to the next page when it can.
 */
function twoColumns(id: string, left: Content[], right: Content[], sideWidth: number): TableBlock {
  return {
    id,
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
  if (preview.fullName !== null) {
    content.push({ id: "full-name", text: preview.fullName, fontSize: 24 });
  }
  if (preview.position !== null) {
    content.push({
      id: "position",
      text: preview.position.toUpperCase(),
      fontSize: 11,
      margin: [0, 2, 0, 0],
    });
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
  const rows = preview.projects.map((project, index): Content => {
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
    return twoColumns(`${PROJECT_ID_PREFIX}${index}`, left, right, SIDE_COLUMN_WIDTH);
  });
  return [{ id: "projects-title", text: labels.projects, ...SECTION_TITLE }, ...rows];
}

/**
 * The most skills in one row of the Professional skills table. Even with skill names of 100 characters (the input
 * limit, about three lines each) such a row is shorter than a page, so a row never has to break.
 */
export const MAX_SKILLS_PER_ROW = 12;

const CELL_PADDING_X = 6;
const CELL_PADDING_TOP = 4;
const CELL_PADDING_BOTTOM = 3;
// The space under the last skill of a category, above its grey line.
const CATEGORY_END_SPACE = 9;

/** The skill, experience and last used columns, as a table inside the right cell of a row. */
function skillColumns(body: TableCell[][]): ContentTable {
  return {
    table: { widths: ["*", 70, 60], body },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => CELL_PADDING_X,
      paddingRight: () => CELL_PADDING_X,
      paddingTop: () => CELL_PADDING_TOP,
      paddingBottom: () => CELL_PADDING_BOTTOM,
    },
  };
}

function chunks<T>(list: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(list.length / size) }, (_, index) =>
    list.slice(index * size, (index + 1) * size),
  );
}

/**
 * The Professional skills table: a header with a red line under it, then one row for each category, with the category
 * name on the left and its skills on the right. A row never breaks across pages (`dontBreakRows`), so the name is
 * always next to its skills. A category with more than `MAX_SKILLS_PER_ROW` skills gets more rows, each with the name,
 * so no row is taller than a page. A grey line closes each category. The header repeats on each page.
 */
function skillsTable(groups: CvPreviewSkillGroup[], labels: PdfLabels): Content[] {
  const filled = groups.filter((group) => group.skills.length > 0);
  if (filled.length === 0) return [];
  const headerCell = (text: string, alignment: "left" | "center" = "center"): ContentText => ({
    text: text.toUpperCase(),
    fontSize: 8,
    alignment,
    bold: true,
  });
  const body: TableCell[][] = [
    [
      { ...headerCell(labels.columnSkills, "left"), margin: [0, CELL_PADDING_TOP, 0, 0] },
      skillColumns([[{}, headerCell(labels.columnExperience), headerCell(labels.columnLastUsed)]]),
    ],
  ];
  // Index in `body` where a category ends (the line is drawn under that row).
  const categoryEnds = new Set<number>();
  for (const { category, skills: list } of filled) {
    for (const part of chunks(list, MAX_SKILLS_PER_ROW)) {
      body.push([
        { text: category, color: COLOR_ACCENT, margin: [0, CELL_PADDING_TOP, 0, 0] },
        skillColumns(
          part.map((skill) => [
            { text: skill.name, bold: true },
            { text: yearCell(skill.experienceYears), alignment: "center" },
            { text: yearCell(skill.lastUsedYear), alignment: "center" },
          ]),
        ),
      ]);
    }
    categoryEnds.add(body.length);
  }
  const table: TableBlock = {
    id: "skills-table",
    // The header row never stays alone at the bottom of a page, and a category row never breaks.
    table: {
      headerRows: 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      widths: [130, "*"],
      body,
    },
    layout: {
      // Line index `i` is above row `i`. 1 is under the header, `n` is under the last row of a category.
      hLineWidth: (index) => (index === 1 || categoryEnds.has(index) ? LINE_WIDTH : 0),
      hLineColor: (index) => (index === 1 ? COLOR_ACCENT : COLOR_DIVIDER),
      vLineWidth: () => 0,
      // The right cell holds the inner table, which has its own padding.
      paddingLeft: (column) => (column === 0 ? CELL_PADDING_X : 0),
      paddingRight: (column) => (column === 0 ? CELL_PADDING_X : 0),
      paddingTop: () => 0,
      paddingBottom: (row) => (categoryEnds.has(row + 1) ? CATEGORY_END_SPACE : 0),
    },
  };
  return [{ id: "skills-title", text: labels.professionalSkills, ...SECTION_TITLE }, table];
}

const isBlock = (node: Node) => node.id !== undefined;
const isSectionTitle = (node: Node) => node.headlineLevel === 1;
const isProject = (node: Node) => node.id?.startsWith(PROJECT_ID_PREFIX) === true;
const breaksAcrossPages = (node: Node) => node.pageNumbers.length > 1;

/**
 * The `pageBreakBefore` rule of the PDF. pdfmake calls it for each node after the layout, and `true` moves the node
 * to the next page.
 * - A project that would break across pages moves to the next page, unless it is already at the top of a page (only
 *   a section title above it). A project taller than one page then starts on a new page and continues on the next.
 * - A section title never stays alone at the bottom of a page: it moves when its block does not start on the page,
 *   or when its first project moves.
 */
export function keepBlocksTogether(node: Node, queries: NodeQueries): boolean {
  const blocksAbove = queries
    .getPreviousNodesOnPage()
    .filter((other) => isBlock(other) && !isSectionTitle(other));
  if (isProject(node)) return breaksAcrossPages(node) && blocksAbove.length > 0;
  if (isSectionTitle(node)) {
    const next = queries.getFollowingNodesOnPage().find(isBlock);
    if (next === undefined) return true;
    return isProject(next) && breaksAcrossPages(next) && blocksAbove.length > 0;
  }
  return false;
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
    pageBreakBefore: keepBlocksTogether,
    defaultStyle: { font: FONT, fontSize: BODY_FONT_SIZE, color: COLOR_TEXT, lineHeight: 1.25 },
    content: [
      ...header(preview),
      { text: "", margin: [0, 0, 0, 14] },
      twoColumns(
        "summary",
        general(preview, labels),
        [...summary(preview), ...skills(preview.skillGroups)],
        SIDE_COLUMN_WIDTH,
      ),
      ...projects(preview, labels),
      ...skillsTable(preview.skillGroups, labels),
    ],
  };
}
