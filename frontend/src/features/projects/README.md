# Projects

The `/admin/projects` page (PLAN S5.5b, KAN-102): the global list of projects, for Admin users.

- Exports: `Projects` (the whole page content; the route only renders it).
- `useProjectsListState`: holds the choices of the user: `search`, `sort` and `page`. A new search or sort goes back to page 1. Nothing is filtered or sorted in the frontend.
- `utils/toProjectsVariables`: turns that state into the query variables. It always sends `page: { number, size: 10 }` and the sort, trims the search, and leaves out an empty search. The page size 10 is one rule: the backend default (`DEFAULT_PAGE_SIZE` in `common/pagination`) and the frontend `DEFAULT_PAGE_SIZE` are both 10, and a test checks the size that is sent. (The backend accepts `sort: null` too, since the `resolveSort` fix.)
- `useProjects`: sends the `Projects` query (`useProjects/projects.graphql`) with those variables and returns `projects`, `total`, `loading`, `failed` and `retry`. `failed` hides the list, so a failed request never looks like an empty list. `retry` repeats the same request, so search, sort and page stay.
  - **Note for the next list page** (users, skills, languages): this hook has the same `loading`, `failed` and `retry` shape that every list query needs. Do not copy it a second time. When a second list page needs it, move one shared hook to the nearest common ancestor (`PLAN.md` S5.9) and let `useProjects` call it.
- `components/ProjectsTable`: the shared `DataTable` with the columns Name, Domain, Start Date and End Date. `EnvironmentTags` draws the technologies as tags. `utils/formatProjectDate` formats a date with `Intl` and the language of the page (`MM/DD/YYYY` in English, `DD.MM.YYYY` in Polish, no code for a new language). A date that cannot be read shows a dash with the screen reader text `Date not available`, never an empty cell.
- `components/ProjectsTable/ProjectDescription`: the description of a project. On a tablet (up to 1023px) it is cut after three lines with an ellipsis. When it is cut, a click (or Enter, Space) shows all of it, and the next click cuts it again. When nothing is cut, it is plain text with the normal cursor. `useClampedText` measures the text, also on a resize.
- Search (KAN-128): the shared `SearchField` (debounced 300 ms, Enter at once, 100 characters at most) sends the text to the backend, which matches name and domain without regard to case. The field sits outside the error state, so an error does not remove the typed text.
- Sort (KAN-128): Name, Start Date and End Date sort on the backend; the arrow in the header shows the direction. The page starts sorted by Name ascending (`DEFAULT_PROJECTS_SORT`), and the Name header shows it at once. A click cycles ascending, descending, ascending. There is no "no sort" state, so the order is always visible.
- Pagination (KAN-128): the shared `Pagination`, 10 projects on a page. It shows only for more than 10 projects, and uses the `total` of the backend. While a page loads, it keeps the last `total`.
- States: loading (skeleton inside the table, headers stay), empty (`No projects found`), no results for a search (`No projects found`), error (message and `Retry`). All use the shared `PageState`.
- Texts: `messages/` (`projects` namespace, `en` and `pl`).
- Storybook: `Projects.stories.tsx` (`Features/Projects/Projects`) shows the page on a 1440px desktop and a 768px tablet viewport, with a project that has the longest allowed texts (name 100, domain 100, description 2000 characters, `maxLengthProject` in `projects.mocks.ts`), and the ManyPages, SearchAndSort, NoResults, Loading, Empty, LoadFailed and Polish versions.
- Contract: the backend `Project` has `environment { id name }`. The page document calls the same data `technologies`; the schema wins.
- Used by: `app/[locale]/(app)/admin/projects/page.tsx`. Backend: `projects` query, Admin only (KAN-101).
- Done: list, tags, three states (KAN-127); search, sort and pagination (KAN-128). To do: create, update and delete (modals).
- Docs: [docs/pages/27-projects-page.md](../../../../docs/pages/27-projects-page.md).

## Known issues

- **Description and tags sit in the Name cell.** The Figma list draws them on a full-width line under each project row. `DataTable` draws one line for each row, so they stack under the name and wrap inside the Name column. To match the design, give `DataTable` an optional detail line for each row (a change to the shared component).
- **Differences from the Figma list** (`docs/images/figma/desktop-1440/{light,dark}/frame-58.png`, `tablet-768/light/frame-53.png`, `tablet-768/dark/frame-51.png`; compared with the `Desktop` and `Tablet` stories, which use the same two projects):
  - Tablet: done. The Domain column is hidden and the description is cut after three lines (it opens on a click). The 1023px limit is our own choice: the repo has no breakpoint rule yet. The Domain column is hidden by its position in `ProjectsTable.module.css` (`nth-child(2)`), because `DataTable` cannot hide a column. It breaks if a column is added before Domain. Replace it when the `DataTable` ticket (a column option to hide below a width, and the detail line above) is done.
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
