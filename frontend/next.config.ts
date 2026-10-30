import type { NextConfig } from "next";

// Read here and not in src/server/env.ts: this config runs outside the app (PLAN §5.5).
// Rewrites are resolved at build time, so `next build` needs it too.
const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) throw new Error("Missing env variable: BACKEND_URL");

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  // The browser calls the backend through the frontend's own origin, so auth cookies stay first-party (PLAN D8).
  rewrites: async () => [
    { source: "/graphql", destination: `${backendUrl}/graphql` },
    { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
  ],
};

export default nextConfig;
