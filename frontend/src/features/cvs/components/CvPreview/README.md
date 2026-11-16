# CvPreview components

The parts of the CV Preview page (S7.5). Each part is a folder with its own test. Spec: [docs/pages/24-cv-preview-page.md](../../../../../../docs/pages/24-cv-preview-page.md).

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
