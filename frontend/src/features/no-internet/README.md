# No internet

The "Oops" screen with RETRY when the app cannot reach the server (S4.2, KAN-93). It shows when the browser is offline or a query fails with a network error. It is a state, not a route. Mutations keep their error toast, so a failed save never removes a form.

- Exports: `NoInternetGate` (wraps `children`), `NoInternetScreen` (`onRetry` prop) and `useClearQueryFailed`.
- `NoInternetGate`: reads `useNetworkStatus`. When the status is not `"online"`, the page stays mounted but hidden (typed text survives, and screen readers skip it) and the screen shows. RETRY = `useRetryQueries`: runs the active queries again and clears the failed flag only when they succeed.
- `NoInternetScreen`: the texts (`noInternet` namespace) on the shared [NoInternetState](../../shared/components/NoInternetState/README.md).
- `useClearQueryFailed`: clears the failed flag on mount. `error.tsx` calls it: a `useSuspenseQuery` that fails throws to that error page, so without it the gate's screen would cover the error page's screen and RETRY would need two clicks.
- `useNetworkStatus` (inside the feature): `useSyncExternalStore` over the store in [network](../../shared/network/README.md). Failed queries are reported by `networkErrorLink` in [apollo](../../shared/apollo/README.md).
- Used by: `app/[locale]/layout.tsx` (`NoInternetGate`, inside `DeviceErrorGate`, so below 768px the device error shows instead) and `app/[locale]/error.tsx` (`NoInternetScreen`, a page that failed to render; RETRY = Next.js `retry`).
- Docs: [docs/pages/07-no-internet-page.md](../../../../docs/pages/07-no-internet-page.md); values in `docs/design-tokens.md` › No internet.
