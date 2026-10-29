# Preferences

Theme (`light` / `dark` / `system`) and language (`en` / `pl`), saved in the `theme` and `locale` cookies for 1 year (PLAN D5, D26, D27).

- `PreferencesScript`: inline `<head>` script; applies the saved values to `<html data-theme lang>` before the first paint, so there is no flash. The server never reads the cookies, which keeps pages static under Cache Components.
- `PreferencesProvider` + `usePreferences()`: `{ theme, language, setTheme, setLanguage }`. State comes from `store/` through `useSyncExternalStore`: the server and hydration use the defaults, then the saved values, so components that display a preference never cause a hydration mismatch. Setters save the cookie and update `<html>`.
- `THEMES`, `LANGUAGES`, `Theme`, `Language`: options and types for selectors.

Used by: `app/layout.tsx` (script + provider), the Settings page (S4.4). Colours per theme: `shared/styles/themes.css`. Pattern: [Next.js, preventing flash before hydration](https://nextjs.org/docs/app/guides/preventing-flash-before-hydration), [React, useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).
