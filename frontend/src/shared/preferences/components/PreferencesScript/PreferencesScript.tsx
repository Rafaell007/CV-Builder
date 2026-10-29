import { LANGUAGE_COOKIE, LANGUAGES, THEME_COOKIE, THEMES } from "../../preferences.constants";

const forcedThemes = THEMES.filter((theme) => theme !== "system");

// Runs in <head> before the first paint, so a saved theme shows without a flash.
// Plain JS (no imports); keep in sync with readCookie, applyTheme and applyLanguage.
const script = `(function () {
  try {
    var read = function (name) {
      var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    };
    var root = document.documentElement;
    var theme = read(${JSON.stringify(THEME_COOKIE)});
    if (${JSON.stringify(forcedThemes)}.indexOf(theme) !== -1) root.setAttribute("data-theme", theme);
    var language = read(${JSON.stringify(LANGUAGE_COOKIE)});
    if (${JSON.stringify(LANGUAGES)}.indexOf(language) !== -1) root.lang = language;
  } catch (error) {}
})();`;

export function PreferencesScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
