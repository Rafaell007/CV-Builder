# No internet

Shows the No Internet screen over any page while the app cannot reach the server (S1.4, KAN-82). It is a state, not a route.

- Exports: `NoInternetGate` (wraps `children`).
- When: the browser goes offline, or a request fails before the server answers (`@/shared/network`, set by the Apollo error link). The screen stays after the connection returns until the user presses RETRY, which reloads the page.
- The page below is `inert` while the screen shows.
- Texts: `messages/` (`noInternet` namespace); the screen itself is `NoInternetState` in `@/shared/components`.
- Used by: the root layout `app/[locale]/layout.tsx`, inside `DeviceErrorGate`, so below 768px the device error shows instead.
- Docs: [docs/pages/07-no-internet-page.md](../../../../docs/pages/07-no-internet-page.md); values in `docs/design-tokens.md` › No internet.

## Known issues

- Only a `TypeError` from `fetch` counts as "cannot reach the server". HTTP 5xx answers and a failed session refresh (`shared/session/refreshSession`, which calls `fetch` itself) do not show the screen.
- RETRY reloads the whole page, so unsaved form input is lost. Repeating only the failed request needs a retry hook in the error link.
- No Playwright test yet: the screen is covered by unit and story tests. Add one in `e2e/` with `context.setOffline(true)`.
