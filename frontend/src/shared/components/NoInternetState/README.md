# NoInternetState

Full-screen error for when the app cannot reach the server: the sad monitor, "Oops", a message and a RETRY button.

- **Props:** `title`, `message` (a node, so the caller can add Figma's line break), `retryLabel`, `onRetry` (repeats the failed request). All texts come from the caller.
- The heading and message are in a `role="alert"` region, so screen readers announce them when the screen appears.
- For a failed list request inside a page, use [PageState](../PageState/README.md) instead.
- **Exports:** `NoInternetState`, type `NoInternetStateProps`.

Used by: the offline / network-error handling (S4.2). Docs: [docs/pages/07-no-internet-page.md](../../../../../docs/pages/07-no-internet-page.md); values in `docs/design-tokens.md` › No internet.
