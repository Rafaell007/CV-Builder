# Network

One flag: is the app cut off from the server? It is true when the browser fires `offline` or when a request fails before the server answers (a `TypeError` from `fetch`, reported by the Apollo [error link](../apollo/errorLink/errorLink.ts)).

- `useNetworkFailure()`: the flag, through `useSyncExternalStore`; false on the server and during hydration.
- `reportRequestFailure()`: sets the flag. It stays until the page is reloaded (the RETRY button). It does nothing on the server, because server module state is shared by all requests.
- The browser flag follows `online` / `offline` events; coming back online hides the screen only when no request failed.

Used by: [NoInternetGate](../../features/no-internet/README.md). Docs: [docs/pages/07-no-internet-page.md](../../../../docs/pages/07-no-internet-page.md).
