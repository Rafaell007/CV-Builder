import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/shared/session";

export type CookieUpdate = { name: string; value: string };

/**
 * The cookies of `Set-Cookie` headers with all their attributes, for `response.cookies.set`. A proxy must hand cookies
 * to the browser that way: Next.js drops `Set-Cookie` headers added by hand when the page is streamed after its static
 * shell (Partial Prerendering, PLAN D6), and keeps `response.cookies` (seen with Next.js 16.4, KAN-172).
 */
export function toResponseCookies(headers: readonly string[]) {
  // NextResponse parses its own Set-Cookie headers into `cookies`; Next.js does not export that parser by itself.
  const init = headers.map((header): [string, string] => ["set-cookie", header]);
  // An empty value means the cookie was cleared. The parser drops `Max-Age=0` (a falsy value), so the deletion is
  // made explicit with an expiry in the past.
  return new NextResponse(null, { headers: init }).cookies
    .getAll()
    .map((cookie) => (cookie.value ? cookie : { ...cookie, value: "", expires: new Date(0) }));
}

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

/** `Set-Cookie` headers that delete both session cookies. The attributes match the ones the backend sets (D9). */
export function clearSessionCookies(secure: boolean): string[] {
  return [ACCESS_COOKIE, REFRESH_COOKIE].map(
    (name) => `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`,
  );
}
