import type { NextRequest } from "next/server";
import { serverEnv } from "@/server/env";
import { handleRequest } from "@/server/session";

// Next.js needs this file at this path. The logic and its tests live in `server/session/handleRequest`.
export function proxy(request: NextRequest) {
  return handleRequest(request, serverEnv.backendUrl);
}

// Static: Next.js reads it at build time. Skips the backend rewrites and Next.js internals.
export const config = {
  matcher: ["/((?!api|graphql|_next/static|_next/image|favicon.ico).*)"],
};
