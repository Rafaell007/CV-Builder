# Preferences

Theme (`light` / `dark` / `system`), saved in the `theme` cookie for 1 year (PLAN D5, D26). The language is not a preference here: it lives in the URL (`/en/...`, `/pl/...`), see [`shared/i18n`](../i18n/README.md).

- `PreferencesScript`: inline `<head>` script; applies the saved theme to `<html data-theme>` before the first paint, so there is no flash. The server never reads the cookie, which keeps pages static under Cache Components.
- `PreferencesProvider` + `usePreferences()`: `{ theme, setTheme }`. State comes from `store/` through `useSyncExternalStore`: the server and hydration use the default, then the saved value, so components that display the theme never cause a hydration mismatch. The saved value reaches the context through `useDeferredValue` (KAN-172): a blocking context update right after hydration made React render again every streamed part of the page that was not hydrated yet, so the lists rendered on the server (PLAN D6) dropped their rows for the loading state for a moment whenever a theme cookie was set. `setTheme` saves the cookie and updates `<html>`.
- `THEMES`, `Theme`: options and type for the theme selector.

Used by: `app/[locale]/layout.tsx` (script + provider), the Settings page (S4.4). Colours per theme: `shared/styles/themes.css`. Pattern: [Next.js, preventing flash before hydration](https://nextjs.org/docs/app/guides/preventing-flash-before-hydration), [React, useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).
