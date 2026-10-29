# Preferences

Theme (`light` / `dark` / `system`) and language (`en` / `pl`), saved in the `theme` and `locale` cookies for 1 year (PLAN D5, D26, D27).

- `PreferencesScript`: inline `<head>` script; applies the saved values to `<html data-theme lang>` before the first paint, so there is no flash. The server never reads the cookies, which keeps pages static under Cache Components.
- `PreferencesProvider` + `usePreferences()`: `{ theme, language, setTheme, setLanguage }`; setters save the cookie and update `<html>`.
- `THEMES`, `LANGUAGES`, `Theme`, `Language`: options and types for selectors.

Used by: `app/layout.tsx` (script + provider), the Settings page (S4.4). Colours per theme: `shared/styles/themes.css`. Pattern: [Next.js, preventing flash before hydration](https://nextjs.org/docs/app/guides/preventing-flash-before-hydration).

The server renders defaults, so a component that displays the current value (e.g. the Settings select) must avoid a hydration mismatch.
