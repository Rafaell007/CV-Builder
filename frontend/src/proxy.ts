import type { NextRequest } from "next/server";
import { serverEnv } from "@/server/env";
import { handleRequest } from "@/server/session";

// Next.js needs this file at this path. The logic and its tests live in `server/session/handleRequest`.
export function proxy(request: NextRequest) {
  return handleRequest(request, serverEnv.backendUrl);
}

// Static: Next.js reads it at build time. Skips the backend rewrites, Next.js internals and static asset files
// (favicon.ico, robots.txt), which must not get a language prefix. Only known asset extensions are skipped: a dot
// in a page path (/en/users/john.doe) must still reach the session check. https://next-intl.dev/docs/routing/middleware
export const config = {
  matcher: [
    "/((?!api/|graphql/|graphql$|_next/static|_next/image|.*\\.(?:ico|png|jpe?g|gif|svg|webp|avif|txt|xml|webmanifest|css|js|map|woff2?)$).*)",
  ],
};
