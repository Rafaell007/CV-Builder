# Network

Network status for the No Internet screen (`docs/pages/07-no-internet-page.md`): `"online"`, `"offline"` or `"queryFailed"`.

- `store/`: external store for `useSyncExternalStore`. `"offline"` comes from the browser (`navigator.onLine` and the `online` / `offline` events); `"queryFailed"` is a flag set by `markQueryFailed()` and cleared by `clearQueryFailed()`. Offline wins over a failed query. The server snapshot is always `"online"`.
- `NetworkStatus`: the type of the three values.

It lives in `shared/` because `shared/apollo` (the network error link) marks failed queries and `features/no-internet` reads the status (`useNetworkStatus`) and clears it on RETRY. Pattern: [React, useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).
