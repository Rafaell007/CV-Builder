import { NotFoundScreen } from "@/features/not-found";
import { PreferencesScript } from "@/shared/preferences";
import { roboto } from "@/shared/styles";
import "@/shared/styles/global.css";

// Requests the proxy does not give a language (e.g. /unknown.txt) have no [locale] layout, so this page
// brings its own <html>, the global styles and the font, and stays in the default language: no language
// means no messages to load. The texts are English, because there is no language here.
// https://next-intl.dev/docs/environments/error-files
export default function GlobalNotFound() {
  return (
    // suppressHydrationWarning: PreferencesScript changes data-theme before React hydrates
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <head>
        <PreferencesScript />
      </head>
      <body>
        <main>
          <NotFoundScreen
            title="Hmm..."
            messageLine1="This doesn’t seem to be the page you were looking for."
            messageLine2="Let’s get you back on track."
            goBackLabel="Go back"
          />
        </main>
      </body>
    </html>
  );
}
