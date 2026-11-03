// Public entry for the theme preference. The language lives in the URL: see `@/shared/i18n`.
export { PreferencesProvider } from "./components/PreferencesProvider";
export { PreferencesScript } from "./components/PreferencesScript";
export { THEMES } from "./preferences.constants";
export type { Theme } from "./preferences.types";
export { usePreferences } from "./usePreferences";
