import { roboto } from "@/shared/styles";
import "@/shared/styles/global.css";

// Requests the proxy does not give a language (e.g. /unknown.txt) have no [locale] layout, so this page
// brings its own <html>, the global styles and the font, and stays in the default language: no language
// means no messages to load. The real page comes with the system pages step (PLAN §6).
// https://next-intl.dev/docs/environments/error-files
export default function GlobalNotFound() {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <main>
          <h1>Page not found</h1>
        </main>
      </body>
    </html>
  );
}
