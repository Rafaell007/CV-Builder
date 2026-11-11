# App shell

Layout of the signed-in pages (S1.4, KAN-82): the sidebar with links by role, the collapse button, the profile menu, and the page next to it.

- Exports: `AppShell` (wraps the page in `<main>`).
- Inside: `AppSidebar` fills `Sidebar` for the current user (`useCurrentUser`, `usePathname`); `ProfileMenu` (Profile, Settings, Logout via `useSignOut`); `useSidebarCollapsed` (collapsed below 1024px until the user clicks); nav lists in `navigation.constants.ts`, `getNavItems` / `toSidebarLinks` in `utils/`.
- The sidebar width lives in CSS (`--sidebar-width` in `AppShell.module.css`), so it is right before hydration.
- Texts: `messages/` (`appShell` namespace).
- Used by: `app/[locale]/(app)/layout.tsx`. Pages add their own `PageHeader` (`@/shared/components/PageHeader`).
- Docs: [PLAN.md §6](../../../../PLAN.md); values and predictions in `docs/design-tokens.md` › App shell.
