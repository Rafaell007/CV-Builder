import type { LANGUAGES, THEMES } from "./preferences.constants";

export type Theme = (typeof THEMES)[number];
export type Language = (typeof LANGUAGES)[number];
