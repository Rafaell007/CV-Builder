# CvPreview components

The parts of the CV Preview page (S7.5). Each part is a folder with its own test. Spec: [docs/pages/24-cv-preview-page.md](../../../../../../docs/pages/24-cv-preview-page.md).

The document sections (KAN-158) are presentational: props in, JSX out. No data fetching. The container `CvPreview` (KAN-160) passes the `CvPreviewData` of `useCvPreview` to them.

## CvPreview (KAN-160)

`CvPreview({ cvId })`: the container of the Preview tab (`"use client"`). It calls `useCvPreview(cvId)` and renders the document: Header, General, Summary, Skills, Projects, then the section "Professional skills" with the `CvPreviewSkillsTable`. Import it from `components/CvPreview` (`index.ts`) or from `features/cvs`. The route `cvs/[cvId]/preview/page.tsx` renders it.

- States, all with the shared `PageState`: loading (`role="status"`), error (`role="alert"`) with Retry, and unauthorized. Unauthorized shows `You are not authorized to access this CV` and no CV data, with no Retry, because the answer would be the same. There is no empty state: `cvPreview` is non-null in the schema. Texts: `cvs.preview.states` and `cvs.preview.sections.professionalSkills`.
- Heading order: the page `h1` is the CV name of `CvLayout` (`PageHeader`, visually hidden). The container adds no `h1`; the document starts with `h2`. The `<article>` has the label `CV preview`.
- The document is a sheet with a border and the surface colour, at most 900px wide, in the middle of the page. Colours come from design tokens.
- No EXPORT PDF button. It comes with S7.6 (KAN-119). The spec asks for it in the page header, and for a disabled state while the data is missing.
- Stories: `CvPreview.stories.tsx` (Desktop, Tablet, Loading, LoadFailed, Unauthorized, Polish).
- Not done: layout check against Figma, dark theme and keyboard check by a person. The print layout (a CSS `@media print` rule) is not made; it is part of S7.6.

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
