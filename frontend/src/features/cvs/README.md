# CVs

The `/cvs` page (PLAN S7.1b, KAN-112): the list of CVs. An Employee sees own CVs, an Admin sees all CVs. The backend decides which rows each role gets.

- Exports: `Cvs` (the whole page content; the route only renders it). Optional props: `userId` (the CVs of one user, for the User CVs tab) and `onView(cv)`. `Cvs` owns the Create, Update and Delete modals (see below).
- `useCvsListState`: holds the choices of the user: `search`, `sort` and `page`. A new search or sort goes back to page 1. Nothing is filtered or sorted in the frontend.
- `utils/toCvsVariables`: turns that state (and an optional `userId`) into the query variables. It always sends `page: { number, size: 10 }` and the sort, trims the search, and leaves out an empty search. `utils/toCvDetailsPath` gives `/cvs/{id}/details`.
- `useCvs`: sends the `Cvs` query (`useCvs/cvs.graphql`) with those variables and returns `cvs`, `total`, `loading`, `failed` and `retry`. `failed` hides the list, so a failed request never looks like an empty list. `retry` repeats the same request, so search, sort and page stay. It has the same shape as `useProjects`; see the note in the projects README about one shared hook.
- `components/CvsTable`: the shared `DataTable` with the columns Name (sortable), Education and Employee (the owner email, for both roles). The description sits in the detail line under each row, in the secondary colour (Figma), drawn by `components/CvsTable/CvDescription`. Each row has the shared `Menu` with `View`, `Edit` and `Delete` (Delete in the error colour); the button is named `Actions for {CV name}`. A click on a row calls `onView`, like `View`. `Edit` opens the Update CV modal and `Delete` opens the Delete CV modal.
- `components/CvsTable/CvDescription`: the description of a CV, copied from `ProjectDescription` of the projects feature. On a tablet (up to 1023px) it is cut after three lines with an ellipsis. When it is cut, a click (or Enter, Space) shows all of it and the next click cuts it again (`role="button"`, `aria-expanded`). When nothing is cut (a short text, or a desktop, which shows the full text as in Figma), it is plain text with the normal cursor. `useClampedText` measures the text, also on a resize. The line is a separate table row, so a click on it never opens the CV. A click on the menu button or on a menu item does not open the CV either (only View does); tests cover both.
- View: without an `onView` prop, `Cvs` opens `/cvs/{id}/details` with the locale-aware router (`useRouter` of `@/shared/i18n`).
- Search: the shared `SearchField` (debounced 300 ms, Enter at once, 100 characters at most). The backend matches the name, and for an Admin also the owner email, without regard to case. The field sits outside the error state, so an error does not remove the typed text.
- Sort: only Name sorts (the backend accepts no other field). The page starts sorted by Name ascending (`DEFAULT_CVS_SORT`).
- Pagination: the shared `Pagination`, 10 CVs on a page. It shows only for more than 10 CVs and uses the `total` of the backend.
- States: loading (skeleton inside the table, headers stay), empty (`You have no CVs yet`, only for a signed-in non-admin without a search and without `userId`; an admin and a list of one user show `No CVs found`, read with `useCurrentUser`; while the current user loads, the table shows the loading state, so the wrong text never flashes), no results for a search (`No CVs found`), error (`Failed to load CVs` and `Retry`). All use the shared `PageState`.
- `cvs.mocks.ts` and `cvForm.mocks.ts` (the form), `useDeleteCv/deleteCv.mocks.ts`: sample CVs, mocks of the `Cvs` query and `fakeBackendMock` (a stand-in backend for stories). For tests and stories only.
- Texts: `messages/` (`cvs` namespace, `en` and `pl`).
- Storybook: `Cvs.stories.tsx` (`Features/CVs/Cvs`): Desktop (1440px), Tablet (768px), ManyPages, SearchAndSort, NoResults, OfOneUser, Loading, Empty, LoadFailed and Polish.
- Used by: `app/[locale]/(app)/cvs/page.tsx`. Backend: `cvs` query (`backend/src/modules/cvs/README.md`).
- Docs: [docs/pages/20-cvs-page.md](../../../../docs/pages/20-cvs-page.md).

## Create CV and Update CV

Spec: [docs/pages/20-cvs-page.md](../../../../docs/pages/20-cvs-page.md), sections Create CV and Update CV.

`Cvs.tsx` owns one hook per modal and passes it to the modal: `CREATE CV` calls `creation.open()`, the `Edit` row action calls `editing.open(cv)`.

| Export                        | Purpose                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `useCreateCvForm()`           | Open state, form, submit and general error of Create CV. Returns `{ form, isOpen, open, setOpen, submit, failed }`. |
| `useUpdateCvForm()`           | The same shape. `open(cv: CvListItem)` fills the form with the CV.                                                  |
| `CreateCvModal({ creation })` | Title Create CV, buttons CANCEL and CREATE.                                                                         |
| `UpdateCvModal({ update })`   | Title Update CV, buttons CANCEL and SAVE. The fields hold the data of the CV.                                       |

Internal parts:

- `useCreateCv` and `useUpdateCv`: the `createCv` and `updateCv` requests. After success they load the open `Cvs` query again.
- `useCvForm`: React Hook Form with Zod. It holds the rules, blocks a double submit and shows server errors.
- `utils/cvForm.utils.ts`: `cvFormSchema` and the functions that make the request inputs.
- `components/CvFormFields`: Name, Education and Description fields. The modals do not repeat them.
- `cvForm.mocks.ts`: Apollo mocks and sample data for the tests.
- `messages/`: keys `cvs.form`, `cvs.create` and `cvs.update`.

Rules (the same in the backend):

- Name: required, 255 characters at most. Education: required, 255 characters at most. Description: required, 2000 characters at most. Text is trimmed.
- CREATE and SAVE are enabled only when the form is valid and the user changed it.
- A failed request keeps all values. A `BAD_USER_INPUT` error shows under its field. Other errors show one message in the modal.
- Success: the modal closes and a toast shows.

## Delete CV

- Delete: `Delete` in the row menu opens `components/DeleteCvModal` (the shared `ConfirmModal`): `Are you sure you want to delete CV {name}?` with the name in bold, `Confirm` and `Cancel`. `useDeleteCv` holds the chosen CV and sends the `deleteCv` mutation (`useDeleteCv/deleteCv.graphql`). Texts: `messages/` (`cvs.delete`, `en` and `pl`). Page document: [docs/pages/20-cvs-page.md](../../../../docs/pages/20-cvs-page.md), section Delete CV (AC-30 to AC-36, AC-39).
- Exports: `useDeleteCv({ page, rowsOnPage, onPageChange })` returns `{ cv, pending, askToDelete(cv), cancel(), confirm() }`; `DeleteCvModal({ cv, pending, onConfirm, onCancel })`; `toDeleteCvFailure(error)` in `utils`.
- While the request runs, CONFIRM shows its loading state and a second press sends nothing (the hook and `ConfirmModal` both block it).
- Success: the CV leaves the Apollo cache (the row goes at once), the `Cvs` query loads again for the new total, the modal closes. `confirm` resolves `true` after a successful delete, `false` otherwise. The hook goes back one page when the user deletes the only CV on page 2 or later: it calls `onPageChange(page - 1)` after the delete succeeds (as `Projects.tsx` does in `handleConfirmDelete`). The page passes the current `page`, the number of rows it shows (`rowsOnPage`) and its `setPage`; nothing else is needed.
- The modal keeps the last CV name while it fades out. Vitest cannot see the fade (jsdom has no animation).
- Failure: the modal closes and an error toast shows the reason. The toast stays behind an open modal where a keyboard user cannot reach it, so the modal closes first.
  - `NOT_FOUND` (the CV is deleted, or it belongs to another user; the backend gives the same answer): the text `This CV does not exist any more. The list was updated.` The hook also loads the `Cvs` query again.
  - `FORBIDDEN`: the text `You are not allowed to delete this CV.`
  - Any other failure (network, server): `Something went wrong. Please try again.`
  - The backend message is never shown. `utils/toDeleteCvFailure` returns `notFound`, `forbidden` or `undefined`, and the hook picks the translated text.
- Who may delete (AC-32, AC-33, AC-34): the backend decides. A user deletes only their own CVs, an admin any CV. The frontend shows `Delete` for every row it receives, because the list already holds only rows the user may see.

## Notes

- **The description is a `role="button"` on a `<p>`**, like in projects (the same known issue). A real `<button>` would be cleaner.
- **Two copies of `useClampedText`.** `CvDescription` and `ProjectDescription` have the same hook and nearly the same CSS. Move both to one shared place when a third list needs it. The 1023px limit is written in CSS only (no breakpoint token yet).
- **A click on the description line does nothing for a CV that is not cut.** The row above opens the CV. This is the decided behaviour.
- **The Employee column shows the owner email for both roles.** The page document says the same, so there is no role check in the frontend.
- **Search, sort and page are not in the URL.** They are lost on a refresh and cannot be shared (same as the projects page).
- **Not checked in a browser.** Vitest and Storybook (Chromium) pass; nobody has compared the page with the Figma frame pixel by pixel, or used it with a screen reader or on a touch screen.
- **E2E is not written.** No Playwright spec covers the CVs list yet.
- **Dark and light theme of the description line.** It uses `--color-text-secondary`; check the contrast against the Figma frame.
- **The Create form sends no `userId`.** The backend uses the signed-in user, so an admin cannot choose another owner in this form. The User CVs tab (S7.7) needs this: create assigns to that user.
- **The `NOT_FOUND` reload of a delete has no test** (`useDeleteCv.test.tsx` holds an `it.todo` with the steps; the hook needs an active `Cvs` query).
- **The fade-out of the delete modal and the real backend were not checked by hand.**
