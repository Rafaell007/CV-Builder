# CvPreview components

The parts of the CV Preview page (S7.5). Each part is a folder with its own test. Spec: [docs/pages/24-cv-preview-page.md](../../../../../../docs/pages/24-cv-preview-page.md).

The document sections (KAN-158) are presentational: props in, JSX out. No data fetching. The container `CvPreview` (KAN-160) passes the `CvPreviewData` of `useCvPreview` to them.

## CvPreview (KAN-160)

`CvPreview({ cvId })`: the container of the Preview tab (`"use client"`). It calls `useCvPreview(cvId)` and renders the document: Header, General, Summary, Skills, Projects, then the section "Professional skills" with the `CvPreviewSkillsTable`. Import it from `components/CvPreview` (`index.ts`) or from `features/cvs`. The route `cvs/[cvId]/preview/page.tsx` renders it.

- States, all with the shared `PageState`: loading (`role="status"`), error (`role="alert"`) with Retry, and unauthorized. Unauthorized shows `You are not authorized to access this CV` and no CV data, with no Retry, because the answer would be the same. There is no empty state: `cvPreview` is non-null in the schema. Texts: `cvs.preview.states` and `cvs.preview.sections.professionalSkills`.
- Heading order: the page `h1` is the CV name of `CvLayout` (`PageHeader`, visually hidden). The container adds no `h1`; the document starts with `h2`. The `<article>` has the label `CV preview`.
- The document is a sheet with a border and the surface colour, at most 900px wide, in the middle of the page. Colours come from design tokens.
- EXPORT PDF (S7.6, KAN-119): the `CvPreviewExport` button is above the document in every state. It is disabled while the preview data is missing (loading, error, unauthorized). See the section below.
- Stories: `CvPreview.stories.tsx` (Desktop, Tablet, Loading, LoadFailed, Unauthorized, Polish).
- Not done: layout check against Figma, dark theme and keyboard check by a person.

## CvPreviewExport (S7.6, KAN-119)

`CvPreviewExport({ cvId, disabled })`: the EXPORT PDF button. It calls `useExportCvPdf(cvId)`. Import it from `./CvPreviewExport`. Text: `cvs.preview.export` (`en`, `pl`).

- The button shows the shared spinner while the PDF is made (`aria-busy`), stays focusable and ignores a second click (AC-27, AC-28). A hidden `role="status"` text (`Generating the PDF`) tells screen readers about the running export.
- `disabled` is true when `useCvPreview` has no data. No request starts then (AC-26, AC-48).
- The PDF is made by the backend (`exportCvPdf`) from the same data as the preview. The file name comes from the backend (the CV name in lower case with hyphens, AC-22). The download starts when the answer arrives. A failure shows a toast and the preview stays (AC-47).
- **The button is not in the shared `PageHeader`.** The spec says "in the page header", but `PageHeader` has no place for actions and is used by every page. The button is in a bar above the document, at the right edge of the sheet. Move it if `PageHeader` gets an actions slot.
- **The PDF follows the language of the page.** The hook sends `locale`, and the backend prints the section titles and column names in `en` or `pl`. The CV content is not translated. **Open note:** the period of a project on this page still comes from the backend as `Till now` in both languages, while the Polish PDF says `obecnie`. See `backend/src/modules/cvs/README.md`.
- **No print layout.** The first plan said a CSS `@media print` rule would come with S7.6. It was not made, because the PDF is made by the backend and the page is not printed.
- Tests: `CvPreviewExport.test.tsx`, `useExportCvPdf.test.tsx`, `utils/downloadPdf.test.ts`. The download itself needs a real browser, so the unit tests replace `saveFile`. `e2e/cvs/cv-preview-export.spec.ts` checks the real download and its file name.
- Not done: layout check against Figma (the position and the look of the button) and a keyboard check by a person.

## CvPreviewSkillsTable (KAN-159)

`CvPreviewSkillsTable({ skillGroups })`: the Professional Skills table. `skillGroups` is `CvPreviewData["skillGroups"]` from `useCvPreview`.

- Columns: Skills Category, Skill, Experience in Years, Last Used. It is a real `<table>` with a visually hidden `<caption>` and `<th scope>` headers.
- Each category is one `<tbody>`. The category cell (`<th scope="row">`) spans the rows of its skills (`rowSpan`). A thicker line on the cells of the last row separates the categories. The lines are on the cells, not on the `<tbody>`, because collapsed borders on row groups differ between browsers.
- A category without skills is not shown. When no category has skills, the table shows the message `No skills added` under the header row.
- React keys use the position and the name, because a category or a skill name can repeat.
- A skill with no experience or no last used year (`null`) shows an en dash. Screen readers read the column name and `not available` (for example `Last Used: not available`) instead of the dash, so the meaning does not depend on colour.
- On a narrow screen the table scrolls sideways inside its own box. Colours and spacing come from design tokens, so the light and dark themes work.
- The shared `DataTable` is not used. It is made for sortable and clickable lists. This table is read-only and grouped.
- Text: `cvs.preview.skillsTable` (`en`, `pl`).
- Story: `CvPreviewSkillsTable.stories.tsx` (default, missing values, no skills, tablet, dark, Polish). The story tests do not resize the browser, so check the tablet scroll in the Storybook UI.
- Not done: layout check against Figma.

## Document sections (KAN-158)

Each component is a folder with its own `index.ts`. Import from the component folder, for example `./CvPreview/CvPreviewHeader`.

- `CvPreviewHeader` (`fullName`, `position`, both can be `null`): full name as `h2`, position below. A missing value is not shown.
- `CvPreviewGeneral` (`education`, `languages`, `domains`): education, languages as `Name — C1`, domains. A part with no value is hidden, and the whole section is hidden when all three are empty. The levels A1 to C2 are shown as the backend sends them; `NATIVE` is translated (`levelNative`). Check the level labels against Figma.
- `CvPreviewSummary` (`name`, `description`): the CV name and description.
- `CvPreviewSkills` (`skillGroups`): category with skill names. A category without skills is hidden, and the whole section is hidden when no category has skills.
- `CvPreviewProjects` (`projects`): name, description, roles, period, responsibilities, environment. The description, roles, responsibilities and environment are hidden when empty. `period` is the text of the backend.

Heading levels: each section is an `h2` with `h3` parts inside. Texts are in `cvs.preview.sections` (`messages/*.json`).

## Notes for the next developer

- **The page `h1` is in `CvLayout`**, not in the container. `CvPreviewHeader` uses an `h2` for the name. Do not add a second `h1`.
- **Open checks:** the layout of the whole document was not compared with Figma, and the dark theme was not tested. See KAN-161 for these checks.
- **The skills appear twice on purpose:** the section "Skills" (names per category) and the table "Professional skills" (with years), as in the spec.
