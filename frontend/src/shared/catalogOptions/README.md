# Catalog options

The Department and Position options of the user forms (KAN-105). They come from the `departmentOptions` and `positionOptions` queries: every item, sorted by name, without pages, for every signed-in user (the catalog pages themselves are admin-only, PLAN §8). Client Components only.

- Two ways to read them. Both return `{ options, loading, failed, retry }` (`UseCatalogOptionsResult`), so a select shows the options, a loading state, or an error with Retry the same way.
  - `useDepartmentOptions(enabled)` / `usePositionOptions(enabled)`: for a modal that loads its options when it opens (Create and Update user). `useQuery` with `skip` while closed and `network-only`, so each opening asks the server again. A click on a modal is not first-load page data, so this is fine with PLAN D6.
  - `useSuspenseDepartmentOptions()` / `useSuspensePositionOptions()`: for a page that preloads the query on the server with `PreloadQuery` (PLAN D6; the Profile tab). `useSuspenseQuery` reads the preloaded result, so the first HTML has the options and the browser sends no request. The nearest `<Suspense>` shows its fallback until then, so `loading` is always false. `errorPolicy: "all"`: a failure is `failed` (error and Retry next to the select), not the error page.
- `CatalogSelect`: a required `Select` for one of these results. Disabled with a helper text while loading; on a failure it shows the load error and a Retry button. Texts via props (`label`, `loadingText`, `failedText`, `retryLabel`); `readOnly` for another employee's profile.
- Tests: `catalogOptions.mocks.ts` (made-up items and `MockedResponse`s). A test of the Suspense hooks renders inside `<Suspense>` and an awaited `act()`.
- Used by: `features/users` (Create and Update user modals), `features/user-details` (Profile tab).
- Docs: [docs/pages/11-user-profile-page.md](../../../../docs/pages/11-user-profile-page.md).
