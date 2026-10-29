import type { Language, Theme } from "./preferences";

// Browser only. "system" removes the attribute, so themes.css follows the OS.
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
};

export const applyLanguage = (language: Language): void => {
  document.documentElement.lang = language;
};
