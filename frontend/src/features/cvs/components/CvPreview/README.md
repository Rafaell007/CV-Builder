# CvPreview components

Presentational parts of the CV document on the Preview tab. Props in, JSX out. No data fetching. The container (KAN-160) passes the `CvPreviewData` of `useCvPreview` to them. Spec: [docs/pages/24-cv-preview-page.md](../../../../../../docs/pages/24-cv-preview-page.md).

## Document sections (KAN-158)

Each component is a folder with its own `index.ts`. Import from the component folder, for example `./CvPreview/CvPreviewHeader`.

- `CvPreviewHeader` (`fullName`, `position`, both can be `null`): full name as `h2`, position below. A missing value is not shown.
- `CvPreviewGeneral` (`education`, `languages`, `domains`): education, languages as `Name — C1`, domains. A part with no value is hidden.
- `CvPreviewSummary` (`name`, `description`): the CV name and description.
- `CvPreviewSkills` (`skillGroups`): category with skill names. A category without skills is hidden.
- `CvPreviewProjects` (`projects`): name, description, roles, period, responsibilities, environment. Roles and responsibilities are hidden when empty. `period` is the text of the backend.

Heading levels: each section is an `h2` with `h3` parts inside. Texts are in `cvs.preview.sections` (`messages/*.json`).
