# App shell

Layout of the signed-in pages (S1.4, KAN-82): the sidebar with links by role, the collapse button, the profile menu, and the page next to it.

- Exports: `AppShell` (wraps the page in `<main>`) and `RequireAdmin` (route guard, below).
- `RequireAdmin` (KAN-137): wraps the pages under `/admin` in `app/[locale]/(app)/admin/layout.tsx`. The layout prefetches `me` on the server (`PrefetchQuery`, KAN-172), so `useCurrentUser` has the user already while the page renders on the server, and the server HTML holds the page or the Forbidden screen. If `me` fails on the server, the server HTML shows the loading state and the browser asks again. In the browser it shows a loading state while `useCurrentUser` loads, then the page for an Admin, or a Forbidden screen (`appShell.forbidden`, the shared `ErrorScreen` with a link to `/users`) for anyone else. It is the second layer behind the proxy, which already redirects non-admins from `/admin/*`; it covers the case where the proxy lets the request pass because the backend did not answer. It is a clear message only: the backend decides. If the `me` query fails, it shows an error with a Retry button (`failed` and `retry` of `useCurrentUser`), never Forbidden: Forbidden is only for a loaded user who is not an Admin.
- While the user loads, the sidebar draws 4 grey bars instead of links (`Sidebar` prop `loading`); the empty `Suspense` fallback holds the sidebar column, so the page does not move.
- Inside: `AppSidebar` fills `Sidebar` for the current user (`useCurrentUser`, `usePathname`); `ProfileMenu` (Profile, Settings, Logout via `useSignOut`); `useSidebarCollapsed` (collapsed below 1024px until the user clicks); nav lists in `navigation.constants.ts`, `getNavItems` / `toSidebarLinks` in `utils/`.
- The sidebar width lives in CSS (`--sidebar-width` in `AppShell.module.css`), so it is right before hydration.
- Texts: `messages/` (`appShell` namespace).
- Used by: `app/[locale]/(app)/layout.tsx`, which also puts one `<Suspense>` around every page (the pages that render per request wait in it, KAN-172; see `shared/apollo` › `PrefetchQuery`). Pages add their own `PageHeader` (`@/shared/components/PageHeader`).
- Docs: [PLAN.md §6](../../../../PLAN.md); values and predictions in `docs/design-tokens.md` › App shell.

## Known issues

Found in the KAN-82 review (2026-11-12) and left open on purpose. Pick them up when this feature is next touched.

- **Header is per page.** The `(app)` layout has no header; every page renders its own `PageHeader`, so a new page can forget it. Fix when the pages are built: a lint rule or a layout slot.
- **Admin links.** An admin's Skills and Languages point to `/admin/skills` and `/admin/languages` (PLAN §6 routes table lists `/skills` and `/languages` as user pages). PLAN §6 does not say this in words; confirm with the team.
- **Active item on profile pages.** "Employees" stays active on `/users/{id}/profile`, also for the user's own profile opened from the profile menu. Probably intended.
- **Nav lists.** `USER_NAV_ITEMS` and `ADMIN_NAV_ITEMS` differ only in two hrefs. Merge them if a third role or a third difference appears.
- **`getDisplayName`** works only on user fields; `shared/currentUser` may be a better home when a second place needs it.
- **`ProfileMenu` props.** `settingsHref` is the same for every user; `profileHref` depends on the user. Kept as props so the menu has no routing knowledge.
- **Raw px in CSS.** `Sidebar.module.css` and `ProfileMenu.module.css` keep Figma-exact values with no token: the 14px gaps, `top: 51px`, the 20px collapse-button radius, the avatar initial (`500 20px/20px`, 0.4px). Add tokens if a second component needs the same value.
- **Focus ring.** The 2px inset outline is repeated in `Sidebar.module.css` and `ProfileMenu.module.css`. A shared token for it was not added because the colour comes from the theme.
- **Breakpoint twice.** `1023.98px` is in `useSidebarCollapsed.ts` and `AppShell.module.css` (CSS cannot read the constant). A test fails when they differ.
