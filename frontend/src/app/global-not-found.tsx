// Requests the proxy does not give a language (e.g. /unknown.txt) have no [locale] layout, so this page
// brings its own <html> and stays in the default language. https://next-intl.dev/docs/environments/error-files
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Page not found</h1>
        </main>
      </body>
    </html>
  );
}
