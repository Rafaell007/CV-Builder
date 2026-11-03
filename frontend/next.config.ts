import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { routing } from "./src/shared/i18n/routing";

// Read here and not in src/server/env.ts: this config runs outside the app (PLAN §5.5).
// Rewrites are resolved at build time, so `next build` needs it too.
const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) throw new Error("Missing env variable: BACKEND_URL");

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  // The main page after sign-in is the employees list (PLAN D17). Not permanent: browsers would cache it.
  // `/` without a language is sent to `/{locale}` by the proxy first (next-intl), then here.
  redirects: async () => [
    {
      source: `/:locale(${routing.locales.join("|")})`,
      destination: "/:locale/users",
      permanent: false,
    },
  ],
  // The browser calls the backend through the frontend's own origin, so auth cookies stay first-party (PLAN D8).
  rewrites: async () => [
    { source: "/graphql", destination: `${backendUrl}/graphql` },
    { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
  ],
};

// Connects src/i18n/request.ts (its default path) to next-intl. https://next-intl.dev/docs/usage/configuration
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
