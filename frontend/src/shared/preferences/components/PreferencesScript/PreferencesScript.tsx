import { THEME_COOKIE, THEMES } from "../../preferences.constants";

const forcedThemes = THEMES.filter((theme) => theme !== "system");

// Runs in <head> before the first paint, so a saved theme shows without a flash.
// Plain JS (no imports); keep in sync with readCookie and applyTheme.
const script = `(function () {
  try {
    var match = document.cookie.match(new RegExp("(?:^|; )" + ${JSON.stringify(THEME_COOKIE)} + "=([^;]*)"));
    var theme = match ? decodeURIComponent(match[1]) : null;
    if (${JSON.stringify(forcedThemes)}.indexOf(theme) !== -1) document.documentElement.setAttribute("data-theme", theme);
  } catch (error) {}
})();`;

export function PreferencesScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
