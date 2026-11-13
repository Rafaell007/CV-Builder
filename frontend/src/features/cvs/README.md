# CVs

The `/cvs` page (PLAN S7.1b, KAN-112): the list of CVs. An Employee sees own CVs, an Admin sees all CVs. The backend decides which rows each role gets.

- Exports: `Cvs` (the whole page content; the route only renders it). Optional props: `userId` (the CVs of one user, for the User CVs tab), `onView(cv)`, `onEdit(cv)`, `onDelete(cv)` and `onCreate()`. The create, update and delete modals plug in through these props.
- `useCvsListState`: holds the choices of the user: `search`, `sort` and `page`. A new search or sort goes back to page 1. Nothing is filtered or sorted in the frontend.
- `utils/toCvsVariables`: turns that state (and an optional `userId`) into the query variables. It always sends `page: { number, size: 10 }` and the sort, trims the search, and leaves out an empty search. `utils/toCvDetailsPath` gives `/cvs/{id}/details`.
- `useCvs`: sends the `Cvs` query (`useCvs/cvs.graphql`) with those variables and returns `cvs`, `total`, `loading`, `failed` and `retry`. `failed` hides the list, so a failed request never looks like an empty list. `retry` repeats the same request, so search, sort and page stay. It has the same shape as `useProjects`; see the note in the projects README about one shared hook.
- `components/CvsTable`: the shared `DataTable` with the columns Name (sortable), Education and Employee (the owner email, for both roles). The description sits in the detail line under each row, in the secondary colour (Figma), drawn by `components/CvsTable/CvDescription`. Each row has the shared `Menu` with `View`, `Edit` and `Delete` (Delete in the error colour); the button is named `Actions for {CV name}`. A click on a row calls `onView`, like `View`.
- `components/CvsTable/CvDescription`: the description of a CV, copied from `ProjectDescription` of the projects feature. On a tablet (up to 1023px) it is cut after three lines with an ellipsis. When it is cut, a click (or Enter, Space) shows all of it and the next click cuts it again (`role="button"`, `aria-expanded`). When nothing is cut (a short text, or a desktop, which shows the full text as in Figma), it is plain text with the normal cursor. `useClampedText` measures the text, also on a resize. The line is a separate table row, so a click on it never opens the CV. A click on the menu button or on a menu item does not open the CV either (only View does); tests cover both.
- View: without an `onView` prop, `Cvs` opens `/cvs/{id}/details` with the locale-aware router (`useRouter` of `@/shared/i18n`).
- Search: the shared `SearchField` (debounced 300 ms, Enter at once, 100 characters at most). The backend matches the name, and for an Admin also the owner email, without regard to case. The field sits outside the error state, so an error does not remove the typed text.
- Sort: only Name sorts (the backend accepts no other field). The page starts sorted by Name ascending (`DEFAULT_CVS_SORT`).
- Pagination: the shared `Pagination`, 10 CVs on a page. It shows only for more than 10 CVs and uses the `total` of the backend.
- States: loading (skeleton inside the table, headers stay), empty (`You have no CVs yet`, only for a signed-in non-admin without a search and without `userId`; an admin and a list of one user show `No CVs found`, read with `useCurrentUser`), no results for a search (`No CVs found`), error (`Failed to load CVs` and `Retry`). All use the shared `PageState`.
- `cvs.mocks.ts`: sample CVs, mocks of the `Cvs` query and `fakeBackendMock` (a stand-in backend for stories). For tests and stories only.
- Texts: `messages/` (`cvs` namespace, `en` and `pl`).
- Storybook: `Cvs.stories.tsx` (`Features/CVs/Cvs`): Desktop (1440px), Tablet (768px), ManyPages, SearchAndSort, NoResults, OfOneUser, Loading, Empty, LoadFailed and Polish.
- Used by: `app/[locale]/(app)/cvs/page.tsx`. Backend: `cvs` query (`backend/src/modules/cvs/README.md`).
- Done in this slice: the list (read side). The create, update and delete modals and hooks come with the next slices of KAN-112.
- Docs: [docs/pages/20-cvs-page.md](../../../../docs/pages/20-cvs-page.md).

## Notes

- **The empty text waits for the current user.** While the `me` query loads (or fails), the user is unknown and an empty list shows `No CVs found`, not `You have no CVs yet`. The text can flash for a moment on a slow `me` request. Wait for `useCurrentUser().loading` if it matters.
- **The description is a `role="button"` on a `<p>`**, like in projects (the same known issue). A real `<button>` would be cleaner.
- **Two copies of `useClampedText`.** `CvDescription` and `ProjectDescription` have the same hook and nearly the same CSS. Move both to one shared place when a third list needs it. The 1023px limit is written in CSS only (no breakpoint token yet).
- **A click on the description line does nothing for a CV that is not cut.** The row above opens the CV. This is the decided behaviour.
- **The Employee column shows the owner email for both roles.** The page document says the same, so there is no role check in the frontend.
- **Search, sort and page are not in the URL.** They are lost on a refresh and cannot be shared (same as the projects page).
- **Not checked in a browser.** Vitest and Storybook (Chromium) pass; nobody has compared the page with the Figma frame pixel by pixel, or used it with a screen reader or on a touch screen.
- **E2E is not written.** No Playwright spec covers the CVs list yet.
- **Dark and light theme of the description line.** It uses `--color-text-secondary`; check the contrast against the Figma frame.
