# Projects

The `/admin/projects` page (PLAN S5.5b, KAN-102): the global list of projects, for Admin users.

- Exports: `Projects` (the whole page content; the route only renders it).
- `Projects/useProjects`: sends the `Projects` query (`projects.graphql`) and returns `projects`, `loading`, `failed` and `retry`. `failed` hides the list, so a failed request never looks like an empty list.
- `Projects/components/ProjectsTable`: the shared `DataTable` with the columns Name, Domain, Start Date and End Date. `EnvironmentTags` draws the technologies as tags. `utils/formatProjectDate` writes `MM/DD/YYYY` in English and `DD.MM.YYYY` in Polish.
- States: loading (skeleton inside the table, headers stay), empty (`No projects found`), error (message and `Retry`). All three use the shared `PageState`.
- Texts: `messages/` (`projects` namespace, `en` and `pl`).
- Contract: the backend `Project` has `environment { id name }`. The page document calls the same data `technologies`; the schema wins.
- Used by: `app/[locale]/(app)/admin/projects/page.tsx`. Backend: `projects` query, Admin only (KAN-101).
- Done: list, tags, three states (KAN-127). To do: search, sort and pagination (KAN-128), then create, update and delete (modals).
- Docs: [docs/pages/27-projects-page.md](../../../../docs/pages/27-projects-page.md).

## Known issues

- **Description and tags sit in the Name cell.** The Figma list draws them on a full-width line under each project row. `DataTable` draws one line for each row, so they stack under the name and wrap inside the Name column. To match the design, give `DataTable` an optional detail line for each row (a change to the shared component).
- **The Projects item is not in the sidebar yet.** The app layout (KAN-82, PR #46) was not merged when this was built. The sidebar link, the Admin-only visibility and the active highlight are part of that layout, not of this feature.
- **No Admin check in the frontend.** A non-admin user who opens the route gets an error state, because the backend rejects the query. The page document (AC-1) asks for access for Admin users only. Add a route guard when the app layout and the role in the session are in place.
