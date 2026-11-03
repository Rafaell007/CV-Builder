import type { NextRequest } from "next/server";
import { serverEnv } from "@/server/env";
import { handleRequest } from "@/server/session";

// Next.js needs this file at this path. The logic and its tests live in `server/session/handleRequest`.
export function proxy(request: NextRequest) {
  return handleRequest(request, serverEnv.backendUrl);
}

// Static: Next.js reads it at build time. Skips the backend rewrites, Next.js internals and files with an
// extension (favicon.ico, robots.txt), which must not get a language prefix. https://next-intl.dev/docs/routing/middleware
export const config = {
  matcher: ["/((?!api/|graphql/|graphql$|_next/static|_next/image|.*\\..*).*)"],
};
