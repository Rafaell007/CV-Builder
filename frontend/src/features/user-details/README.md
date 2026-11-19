# User Details

The shell of the pages `/users/{userId}/...` and the CVs tab of a user (PLAN S7.7, KAN-120).

- Exports: `UserLayout` (header, breadcrumbs and tabs; used by `app/[locale]/(app)/users/[userId]/layout.tsx`) and `UserCvs` (content of the CVs tab; used by `.../[userId]/cvs/page.tsx`).
- `UserLayout`: the shared `PageHeader` and `Tabs`. Tabs: Profile, Skills, Languages and CVs (`USER_TABS`). The CVs tab is shown to an Admin only (`getUserTabs`). The header and the breadcrumbs `Employees › {tab}` follow the route, not the visible tabs, so an admin does not see another tab name while the signed-in user loads. Each tab is a link, so the URL keeps the employee and the tab after a refresh.
- `UserCvs`: `RequireAdmin` around `Cvs` with `userId` from the route. The list, search, sort, pages, Create CV, Update CV and Delete CV are the ones of `features/cvs`. The owner of a new CV is the `userId` of the route (`useCreateCvForm(userId)`); the form has no owner field.
- Texts: `messages/` (`userDetails` namespace, `en` and `pl`).
- Access, two layers: the proxy treats `/users/{id}/cvs` as admin-only and redirects anyone else to `/users` (`shared/session/utils/session.utils.ts`); `RequireAdmin` is the message behind it. The backend decides: `cvs` and `createCv` with a `userId` are for an Admin only.
- Docs: [docs/pages/14-user-cvs-page.md](../../../../docs/pages/14-user-cvs-page.md).

## Things to note

- **This shell is minimal on purpose (KAN-105 not done).** The ticket S6.2/S6.3a (User Details shell and Profile tab) is not built. `UserLayout` was added here so the CVs tab has a place. When KAN-105 lands, merge it with this layout (one `layout.tsx` for `/users/[userId]`), do not add a second one. The Profile, Skills and Languages pages are empty placeholders now (they showed only a header before; the layout draws it).
- **No user name in the breadcrumbs.** There is no query for one user yet (the `Profile` tab owns it). Add the name as `Employees › {name} › {tab}` when that query exists.
- **The employee is sent with every change.** `Cvs` sends the `userId` of the route with `createCv` (the owner), `updateCv` (`input.userId`) and `deleteCv` (`userId`). The last two are only a scope: the backend answers `NOT_FOUND` for a CV of another employee (KAN-120, agreed with Rafal; see the backend CVs README). The value comes from the route, never from the row.
- **Search also matches the owner email.** For an Admin the backend searches the name and the owner email (S7.1). The page document of this tab says name only. On this tab all rows have one owner, so a search by that email returns every row. Decide with the team before changing the backend.
- **View leaves the employee context.** `View` opens `/cvs/{id}/preview`, and the breadcrumb of that page leads to `/cvs`, not back to this tab. The page document wants the employee context preserved when returning. Needs a decision on the route of CV Details for an admin.
- **Search, sort and page are not in the URL** (same as the CVs page), so a refresh keeps the employee and the tab, but not the search.
- **No Storybook story and no Polish E2E.** The component tests and `e2e/user-cvs/user-cvs.spec.ts` cover English only.
