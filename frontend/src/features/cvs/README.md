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

## CV Details: loading one CV

Spec: [docs/pages/21-cv-details-page.md](../../../../docs/pages/21-cv-details-page.md) (PLAN S7.2, KAN-113). The page is built in steps; this is the data part.

- `useCv(id)` sends the `Cv` query (`useCv/cv.graphql`) and returns `cv`, `loading`, `failure` and `retry`. `failure` is `undefined` when the request worked. `retry` repeats the request for the same id.
- `utils/toCvLoadFailure(error)` turns a failed request into `notFound`, `forbidden` or `failed`:
  - `notFound`: the backend code `NOT_FOUND`. It also means the CV belongs to another user (the backend gives the same answer, so a user cannot learn which ids exist). The page must not try to tell the two cases apart.
  - `forbidden`: the backend code `FORBIDDEN`. The `cv` query does not send it today; the page is ready for it.
  - `failed`: any other code, or a network error. Only this kind shows Retry, because a repeat cannot change the answer of the other two.
- `useCv/cv.mocks.ts`: `cvMock`, `cvCodeErrorMock` and `cvNetworkErrorMock`. For tests and stories only.
- `useCvDetailsForm(cv)`: the form of the Details tab. It reuses `useCvForm` (rules, double-submit guard, server errors) and `useUpdateCv`. Returns `{ form, failed, submit, canUpdate, isSubmitting }`. `canUpdate` is true only when the form is valid, differs from the saved CV and no request runs. After a successful save the values of the backend become the new unchanged state (UPDATE is disabled, the values stay). A failed save resets nothing. The success toast reuses the `cvs.update.success` texts.
- `components/CvDetailsForm({ details })`: the Name, Education and Description fields (`CvFormFields`) with the UPDATE button below. The button shows its spinner while the request runs and stays focusable. Text: `cvs.details.update` (`en`, `pl`). The form uses `noValidate`: the messages come from the form hook. A field shows its error after the user leaves it (`useZodForm` validates on touch).

- `components/CvLayout({ cvId, children })`: the shell of all four tabs, used by `app/[locale]/(app)/cvs/[cvId]/layout.tsx`. `useCvLayout` (next to it) loads the CV with `useCv`, reads the route (`usePathname` of `@/shared/i18n`) and builds the tabs and the breadcrumbs `CVs › {CV name} › {tab}` (the name in red, as in Figma). The `view` is one of:
  - `ready`: the tab page (`children`) shows. This is the only view that shows it, so a direct link to `/cvs/{id}/skills` of another user's CV cannot get around the access check.
  - `loading`: the skeleton, with the tabs. Data wins over `loading`: a refresh in the background does not replace a page that is shown.
  - `failed`: `Failed to load CV details` with Retry. `notFound` and `forbidden`: the shared `ErrorScreen` (`CV not found` or `No access`) with a link back to `/cvs`, without Retry, the tabs and the CV name.
- `components/CvDetails({ cvId })`: the Details tab. It reads the CV with `useCv` (the cache has it, so no second request) and shows `CvDetailsForm`. It shows nothing when there is no CV.
- Routes: `cvs/[cvId]/layout.tsx` (the shell), `details/page.tsx` (`CvDetails`). `skills`, `projects` and `preview` are placeholders that return `null` until S7.3, S7.4 and S7.5; the shell already gives them the breadcrumbs and the tabs.
- Texts: `cvs.tabs` (the four tab names and the navigation label) and `cvs.details` (`update`, `states`, `notFound`, `forbidden`), `en` and `pl`.
- Route and tab helpers: `CV_TABS` (`cvs.constants.ts`), `CvTab` (`cvs.types.ts`) and `utils/toCvTabPath(cvId, tab)`.

## Notes

- **Signed-out users on the CV Details page.** The spec lists authentication errors as a separate case. `toCvLoadFailure` has no kind for it: a code like `UNAUTHENTICATED` becomes `failed`. This is decided: the page relies on the global handler in `shared/apollo/errorLink` (session refresh and redirect to sign-in, planned in PLAN D9 and S3), which is not built yet. Until it is, a signed-out user sees `failed` with Retry. When the handler exists, check that the redirect happens before this page shows an error.
- **The description is a `role="button"` on a `<p>`**, like in projects (the same known issue). A real `<button>` would be cleaner.
- **Two copies of `useClampedText`.** `CvDescription` and `ProjectDescription` have the same hook and nearly the same CSS. Move both to one shared place when a third list needs it. The 1023px limit is written in CSS only (no breakpoint token yet).
- **A click on the description line does nothing for a CV that is not cut.** The row above opens the CV. This is the decided behaviour.
- **The Employee column shows the owner email for both roles.** The page document says the same, so there is no role check in the frontend.
- **Search, sort and page are not in the URL.** They are lost on a refresh and cannot be shared (same as the projects page).
- **Not checked in a browser.** Vitest and Storybook (Chromium) pass; nobody has compared the page with the Figma frame pixel by pixel, or used it with a screen reader or on a touch screen.
- **E2E:** `e2e/cvs/cvs.spec.ts` covers the list (admin and user), sort, search, row click, the menu, create, update, delete and the go-back-one-page rule. It does not cover the Polish texts, the tablet layout or the keyboard (no `cvs.a11y.spec.ts` yet).
- **Dark and light theme of the description line.** It uses `--color-text-secondary`; check the contrast against the Figma frame.
- **The Create form sends no `userId`.** The backend uses the signed-in user, so an admin cannot choose another owner in this form. The User CVs tab (S7.7) needs this: create assigns to that user.
- **The `NOT_FOUND` reload of a delete has no test** (`useDeleteCv.test.tsx` holds an `it.todo` with the steps; the hook needs an active `Cvs` query).
- **The fade-out of the delete modal and the real backend were not checked by hand.**
- **Stale total after a delete (fixed here, check the projects page).** `useDeleteCv` drops every cached `cvs` page when a CV is deleted. Before this, going back one page showed page 1 from the cache with the old total, so a second page button stayed for 10 CVs (found by the E2E test). `useDeleteProject` uses the same refetch of the open query only; it was not checked for the same problem.
- **The shared `Tabs` differ from Figma on the CV Details page.** Figma shows four tabs of the same width (about 150px) with the line under the first one; the shared `Tabs` size each tab by its text with a 24px gap. Not changed here, because the other pages use `Tabs` too (check with the design).
- **The tab pages after Details are placeholders** (`null`). The Skills, Projects and Preview tabs show the shell and an empty area until S7.3 to S7.5.
- **CV Details is not checked in a browser.** Vitest passes; nobody has compared the page with the Figma frame, tried a tablet width, a screen reader or the dark theme. The form is 852px wide and centred, as measured on the 1440px frame.
- **The shell has no E2E spec yet.** The form, the states and the access rules are covered by component tests only.
- **A CV name that is very long** is not cut in the breadcrumbs (no ellipsis rule in Figma). Check how it wraps.
