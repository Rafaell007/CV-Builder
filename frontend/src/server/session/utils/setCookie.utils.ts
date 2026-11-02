export type CookieUpdate = { name: string; value: string };

/** Reads the name and value of a `Set-Cookie` header; the attributes (Path, Max-Age, ...) are not needed here. */
export function parseSetCookie(header: string): CookieUpdate | null {
  const pair = header.split(";")[0] ?? "";
  const separator = pair.indexOf("=");
  if (separator <= 0) return null;
  return { name: pair.slice(0, separator).trim(), value: pair.slice(separator + 1).trim() };
}

/** Applies `Set-Cookie` headers to a cookie jar. An empty value means the backend cleared the cookie. */
export function applySetCookies(jar: Map<string, string>, headers: readonly string[]): void {
  for (const header of headers) {
    const update = parseSetCookie(header);
    if (!update) continue;
    if (update.value === "") jar.delete(update.name);
    else jar.set(update.name, update.value);
  }
}

export function toCookieHeader(jar: ReadonlyMap<string, string>): string {
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}
