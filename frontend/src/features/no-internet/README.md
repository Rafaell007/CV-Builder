# No internet

The "Oops" screen with RETRY when the app cannot reach the server (S4.2, KAN-93). It shows when the browser is offline or a query fails with a network error. Mutations keep their error toast, so a failed save never removes a form.

- Exports: `NoInternetGate` (wraps `children`) and `NoInternetScreen` (`onRetry` prop).
- `NoInternetGate`: reads `useNetworkStatus`. When the status is not `"online"`, the page stays mounted but hidden (typed text survives) and the screen shows. RETRY = `useRetryQueries`: runs the active queries again and clears the failed flag only when they succeed.
- `useNetworkStatus` (inside the feature): `useSyncExternalStore` over the store in [network](../../shared/network/README.md). Failed queries are reported by `networkErrorLink` in [apollo](../../shared/apollo/README.md).
- Texts: `messages/` (`noInternet` namespace).
- Used by: `app/[locale]/layout.tsx` (`NoInternetGate`, failed browser queries) and `app/[locale]/error.tsx` (`NoInternetScreen`, a page that failed to render on the server; RETRY = Next.js `retry`).
- Docs: [docs/pages/07-no-internet-page.md](../../../../docs/pages/07-no-internet-page.md); values in `docs/design-tokens.md` › No internet.
