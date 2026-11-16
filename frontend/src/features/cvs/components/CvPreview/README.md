# CvPreview components

Presentational parts of the CV document on the Preview tab. Props in, JSX out. No data fetching. The container (KAN-160) passes the `CvPreviewData` of `useCvPreview` to them. Spec: [docs/pages/24-cv-preview-page.md](../../../../../../docs/pages/24-cv-preview-page.md).

## Document sections (KAN-158)

Each component is a folder with its own `index.ts`. Import from the component folder, for example `./CvPreview/CvPreviewHeader`.

- `CvPreviewHeader` (`fullName`, `position`, both can be `null`): full name as `h2`, position below. A missing value is not shown.
- `CvPreviewGeneral` (`education`, `languages`, `domains`): education, languages as `Name — C1`, domains. A part with no value is hidden. The levels A1 to C2 are shown as the backend sends them; `NATIVE` is translated (`levelNative`). Check the level labels against Figma.
- `CvPreviewSummary` (`name`, `description`): the CV name and description.
- `CvPreviewSkills` (`skillGroups`): category with skill names. A category without skills is hidden.
- `CvPreviewProjects` (`projects`): name, description, roles, period, responsibilities, environment. Roles and responsibilities are hidden when empty. `period` is the text of the backend.

Heading levels: each section is an `h2` with `h3` parts inside. Texts are in `cvs.preview.sections` (`messages/*.json`).

## Notes for the next developer

- **The page `h1` is missing on purpose.** `CvPreviewHeader` uses an `h2` for the name. The container (KAN-160) must render the page `h1`. Without it, the heading order of the page is wrong.
- **No `index.ts` in `components/CvPreview/`.** It was left out to avoid a merge conflict with KAN-159. KAN-160 adds it. Until then, import from the component folder, for example `./CvPreview/CvPreviewHeader`.
- **Open checks:** the layout was not compared with Figma, and the dark theme was not tested. See the Jira ticket for these checks.
