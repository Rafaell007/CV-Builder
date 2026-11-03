import type { THEMES } from "./preferences.constants";

export type Theme = (typeof THEMES)[number];

export type Preferences = {
  theme: Theme;
};
