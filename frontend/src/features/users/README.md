# Users

The `/users` page, titled Employees (PLAN S6.1, KAN-104): the list of all users. Every signed-in user sees it; only an Admin can create, update and delete users.

- Exports: `Users` (the page content under the `PageHeader`; the route `app/[locale]/(app)/users/page.tsx` renders both) and `USERS_FIRST_PAGE` (below). It uses the shared `ListPage` (sticky toolbar with search and CREATE USER, page buttons).
- List state and variables: the shared `useListState(DEFAULT_USERS_SORT)` and `toListVariables` (`@/shared/lists`), as on the Projects page. A new search or sort goes back to page 1. Nothing is filtered or sorted in the frontend.
- `useUsers`: the `Users` query (`useUsers/users.graphql`) through the shared `usePagedList`; returns `users`, `total`, `loading`, `failed`, `retry`.
- **Server render (PLAN D6, KAN-172).** The route prefetches `me` and the first page (`USERS_FIRST_PAGE`, exported: `firstPageVariables(DEFAULT_USERS_SORT)` of `@/shared/lists`) with `PrefetchQuery` (`@/shared/apollo/server`), then renders `Users`. `useCurrentUser` and `useUsers` find both in the Apollo cache, so the server HTML already has the rows, CREATE USER and the row actions of the role, and the browser does not ask again. Search, sort and page changes go to the backend from the browser. The rows still wait for the current user (`loading || userLoading`), so an admin never sees the employee arrows first. E2E: `e2e/users/users.spec.ts`, "as the server renders it".
- `components/UsersTable`: the shared `DataTable`. Columns: avatar (initials from the shared `Avatar`; the header text "Avatar" is for screen readers only, `hideHeader`), First Name, Last Name, Email, Department, Position. Email and Position are hidden below 1024px (Figma tablet). An empty value (a user who signed up and never filled the profile) shows a dash with the screen reader text `Not filled`. `getUserDisplayName` (`@/shared/utils`) falls back to the email when a user has no name.
- Search: the shared `SearchField` (100 characters). The backend matches each word in the first name, last name or email, without regard to case.
- Sort: First Name, Last Name, Department and Position sort on the backend. The page starts by First Name ascending (`DEFAULT_USERS_SORT`). Empty names come last in ascending and first in descending order (PostgreSQL default).
- Pagination: the shared `Pagination`, 10 users on a page (PLAN D19).
- Row actions:
  - A click on a row opens the profile (`/users/{id}/profile`, `toUserProfilePath`) for both roles.
  - Employee: an arrow on each row, a real `<Link>` named `Open profile of {name}`.
  - Admin: the shared `Menu` named `Actions for {name}` with View, Update and Delete.
- Own account (D24): on the admin's own row, Delete is disabled, and in Update the Role field is disabled with the helper text `You cannot change your own role`. The backend refuses both too (`SELF_DELETE`, `OWN_ROLE`).
- Changed at the same time (`CONFLICT`, `reason: "CONCURRENT_CHANGE"`, nothing saved): Create and Update show "Someone changed this user at the same time. Try again." in the modal and keep the values; Delete shows it in the error toast.
- Create (CREATE USER, admin only): `components/CreateUserModal` (shared `FormModal`, `size="wide"`: 860px from 1024px, 620px below). Fields (`components/UserFormFields`, two per row on desktop, one column below 1024px): Email, Password, First Name, Last Name, Department, Position, Role (starts as Employee). Flow `useCreateUserForm`, form `useUserForm` (shared with Update), request `useCreateUser`.
  - Rules (`utils/userForm.utils.ts`): the shared email rule; password D33 (8–128 characters, a letter and a digit; shared `passwordProblem`), not the 6 of the page document; names, Department and Position from the shared `userProfileRules` (`@/shared/userProfile`: names required, 100 characters at most); Role required.
  - Errors: a taken email (`CONFLICT`, `reason: "EMAIL_TAKEN"`) shows under Email; `BAD_USER_INPUT` field errors under their field; `FORBIDDEN` and anything else as one message in the modal (shared `FormErrorMessage`). The modal stays open and keeps the values.
- Update (admin only): `components/UpdateUserModal`, the same fields filled from the row (`toUserFormValues`). Email and Password are shown disabled; the password is never loaded. `toUpdateUserInput` sends the id and the profile fields only. `NOT_FOUND` (the user was deleted meanwhile) shows `This user no longer exists.` and reloads the list.
- Delete (admin only): `components/DeleteUserModal` (shared `ConfirmModal`): `Are you sure you want to delete user {name}?`, the name in bold. `useDeleteUser` sends `deleteUser`; failures (`toDeleteUserFailure`: own account, not found, forbidden, other) close the modal and show an error toast. Deleting the only row of page 2 or later goes back one page.
- Cache: create, update and delete remove every stored `users` list (`cache.evict({ id: "ROOT_QUERY", fieldName: "users" })`), so a list of another search or page never shows a stale row or total. Each shows a success toast.
- Department and Position options: `useDepartmentOptions(isOpen)` and `usePositionOptions(isOpen)` from [`@/shared/catalogOptions`](../../shared/catalogOptions/README.md). They read the `departmentOptions` / `positionOptions` queries (every item, by name, for every signed-in user) and load again each time a modal opens. The shared `CatalogSelect` shows them: while loading, the field is disabled with `Loading…`; on a failure it shows an error and Retry, and the rest of the form still works.
- There is no `LAST_ADMIN` rule: the backend has none (KAN-103). An admin cannot delete themself or remove their own role, so at least one admin always stays.
- States: loading, empty, no results and error, all with the shared `PageState`.
- Texts: `messages/` (`users` namespace, `en` and `pl`).
- Storybook: `Users.stories.tsx`: Admin, Employee, Tablet, ManyPages, SearchAndSort, NoResults, Loading, LoadFailed, Polish, CreateUserOpen, UpdateUserOpen, DeleteUserOpen. Mocks in `users.mocks.ts`.
- E2E: `e2e/users/users.spec.ts` (see the E2E README).
- Backend: `users`, `createUser`, `updateUser`, `deleteUser` (KAN-103, `backend/src/modules/users`).
- Docs: [docs/pages/10-users-page.md](../../../../docs/pages/10-users-page.md). Figma decisions: `docs/design-tokens.md` › Users list.

## Known issues

- **Avatar shows initials only.** There is no picture field until S6.3.
- **A spaces-only edit enables UPDATE.** `isDirty` compares the untrimmed text. The same on every list page; the shared next ticket fixes it.
- **Three copies of the last-row rule** (Projects, catalogs, Users) and of the delete flow hook: the shared next ticket moves them into shared code.
- **Search, sort and page are not in the URL**, as on the other list pages.
