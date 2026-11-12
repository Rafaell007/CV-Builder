# Device error

Replaces every page with an "Oops" screen when the viewport is narrower than 768px (S1.4, KAN-82). CSS only: one media query swaps the page and the gate, so it works without JS and in Server Components.

- Exports: `DeviceErrorGate` (wraps `children`); its content is the shared [ErrorScreen](../../shared/components/ErrorScreen/README.md).
- Texts: `messages/` (`deviceError` namespace).
- Used by: the root layout `app/[locale]/layout.tsx`, so it covers the app, auth and not-found pages.
- Docs: [docs/pages/09-device-error-page.md](../../../../docs/pages/09-device-error-page.md); values in `docs/design-tokens.md` › Device error.
