# CvPreview components

The parts of the CV Preview page (S7.5). Each part is a folder with its own test. Spec: [docs/pages/24-cv-preview-page.md](../../../../../../docs/pages/24-cv-preview-page.md).

The document sections (KAN-158) are presentational: props in, JSX out. No data fetching. The container (KAN-160) passes the `CvPreviewData` of `useCvPreview` to them.

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
- Not done: layout check against Figma. The component is not used by a page yet.

## Document sections (KAN-158)

Each component is a folder with its own `index.ts`. Import from the component folder, for example `./CvPreview/CvPreviewHeader`.

- `CvPreviewHeader` (`fullName`, `position`, both can be `null`): full name as `h2`, position below. A missing value is not shown.
- `CvPreviewGeneral` (`education`, `languages`, `domains`): education, languages as `Name — C1`, domains. A part with no value is hidden, and the whole section is hidden when all three are empty. The levels A1 to C2 are shown as the backend sends them; `NATIVE` is translated (`levelNative`). Check the level labels against Figma.
- `CvPreviewSummary` (`name`, `description`): the CV name and description.
- `CvPreviewSkills` (`skillGroups`): category with skill names. A category without skills is hidden, and the whole section is hidden when no category has skills.
- `CvPreviewProjects` (`projects`): name, description, roles, period, responsibilities, environment. The description, roles, responsibilities and environment are hidden when empty. `period` is the text of the backend.

Heading levels: each section is an `h2` with `h3` parts inside. Texts are in `cvs.preview.sections` (`messages/*.json`).

## Notes for the next developer

- **The page `h1` is missing on purpose.** `CvPreviewHeader` uses an `h2` for the name. The container (KAN-160) must render the page `h1`. Without it, the heading order of the page is wrong.
- **No `index.ts` in `components/CvPreview/`.** It was left out to avoid a merge conflict between KAN-158 and KAN-159. KAN-160 adds it. Until then, import from the component folder, for example `./CvPreview/CvPreviewHeader`.
- **Open checks:** the layout of the document sections was not compared with Figma, and their dark theme was not tested. See KAN-161 for these checks.
