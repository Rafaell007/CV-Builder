# Projects

The `/admin/projects` page (PLAN S5.5b, KAN-102): the global list of projects, for Admin users.

- Exports: `Projects` (the whole page content; the route only renders it).
- `Projects/useProjectsListState`: holds the choices of the user: `search`, `sort` and `page`. A new search or sort goes back to page 1. Nothing is filtered or sorted in the frontend.
- `Projects/utils/toProjectsVariables`: turns that state into the query variables. It always sends `page: { number, size: 10 }` (the backend default is 20), trims the search, and leaves out an empty search and no sort. (The backend accepts `null` for them too, since the `resolveSort` fix.)
- `Projects/useProjects`: sends the `Projects` query (`useProjects/projects.graphql`) with those variables and returns `projects`, `total`, `loading`, `failed` and `retry`. `failed` hides the list, so a failed request never looks like an empty list. `retry` repeats the same request, so search, sort and page stay.
- `Projects/components/ProjectsTable`: the shared `DataTable` with the columns Name, Domain, Start Date and End Date. `EnvironmentTags` draws the technologies as tags. `utils/formatProjectDate` writes `MM/DD/YYYY` in English and `DD.MM.YYYY` in Polish.
- Search (KAN-128): the shared `SearchField` (debounced 300 ms, Enter at once, 100 characters at most) sends the text to the backend, which matches name and domain without regard to case. The field sits outside the error state, so an error does not remove the typed text.
- Sort (KAN-128): Name, Start Date and End Date sort on the backend; the arrow in the header shows the direction. A click cycles none, ascending, descending, none. With no sort the backend orders by name.
- Pagination (KAN-128): the shared `Pagination`, 10 projects on a page. It shows only for more than 10 projects, and uses the `total` of the backend. While a page loads, it keeps the last `total`.
- States: loading (skeleton inside the table, headers stay), empty (`No projects found`), no results for a search (`No projects found`), error (message and `Retry`). All use the shared `PageState`.
- Texts: `messages/` (`projects` namespace, `en` and `pl`).
- Storybook: `Projects/Projects.stories.tsx` (`Features/Projects/Projects`) shows the page on a 1440px desktop and a 768px tablet viewport, with a project that has the longest allowed texts (name 100, domain 100, description 2000 characters, `maxLengthProject` in `projects.mocks.ts`), and the ManyPages, SearchAndSort, NoResults, Loading, Empty, LoadFailed and Polish versions.
- Contract: the backend `Project` has `environment { id name }`. The page document calls the same data `technologies`; the schema wins.
- Used by: `app/[locale]/(app)/admin/projects/page.tsx`. Backend: `projects` query, Admin only (KAN-101).
- Done: list, tags, three states (KAN-127); search, sort and pagination (KAN-128). To do: create, update and delete (modals).
- Docs: [docs/pages/27-projects-page.md](../../../../docs/pages/27-projects-page.md).

## Known issues

- **Description and tags sit in the Name cell.** The Figma list draws them on a full-width line under each project row. `DataTable` draws one line for each row, so they stack under the name and wrap inside the Name column. To match the design, give `DataTable` an optional detail line for each row (a change to the shared component).
- **Differences from the Figma list** (`docs/images/figma/desktop-1440/{light,dark}/frame-58.png`, `tablet-768/light/frame-53.png`, `tablet-768/dark/frame-51.png`; compared with the `Desktop` and `Tablet` stories, which use the same two projects):
  - Tablet: Figma hides the Domain column and cuts the description after three lines with an ellipsis. The table shows the Domain column and the whole description.
  - Desktop: Figma gives Domain a wide column (about 400px). The table gives the width to the Name column, so a domain such as `CRM (Customer RM)` wraps into three lines.
  - Dates: Figma writes `4/15/2025` without a leading zero on the Projects list. The table writes `04/15/2025` (the team decided on `MM/DD/YYYY`). The CV projects list in Figma has two digits. Confirm with the designer.
  - Text size: the project name is about 12px in Figma and 14px in the table. The tags are about 16px in Figma and 14px in the table.
  - Page title: Figma shows `Projects` as a small grey title in the top bar. The page shows a 24px heading.
  - Search field: Figma shows it at the left, 320px wide, with the CREATE PROJECT button at the right end. The field matches; the button comes with the create ticket. Figma shows an arrow next to Name, Start Date and End Date at all times; the table shows it faint until the column is sorted.
  - Not built yet: the row menu with three dots and the CREATE PROJECT button (create, update and delete tickets).
- **The Projects item is not in the sidebar yet.** The app layout (KAN-82, PR #46) was not merged when this was built. The sidebar link, the Admin-only visibility and the active highlight are part of that layout, not of this feature.
- **No Admin check in the frontend.** A non-admin user who opens the route gets an error state, because the backend rejects the query. The page document (AC-1) asks for access for Admin users only. Add a route guard when the app layout and the role in the session are in place.
- **Search, sort and page are not in the URL.** They are lost on a refresh and cannot be shared. `SearchField` already takes a `defaultValue`, so the state can move to the URL later (the page document asks for no URL state).
- **The page shows no page buttons with the seed data.** The seed has 6 projects and the page holds 10. Pagination is covered by tests and by the `ManyPages` story; to see it in the app, add more than 10 projects.
- **No end-to-end test yet** for search, sort and pages of this page (`e2e/`).
