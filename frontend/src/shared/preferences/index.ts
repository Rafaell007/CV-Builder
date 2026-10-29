// Public entry for theme and language preferences.
export { PreferencesProvider } from "./components/PreferencesProvider";
export { PreferencesScript } from "./components/PreferencesScript";
export { DEFAULT_LANGUAGE, LANGUAGES, THEMES } from "./preferences.constants";
export type { Language, Theme } from "./preferences.types";
export { usePreferences } from "./usePreferences";
