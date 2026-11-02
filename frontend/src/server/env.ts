// Server-only env. Importing this file from a Client Component fails the build.
import "server-only";
import { required } from "@/env";

export const serverEnv = {
  // Backend origin, e.g. http://localhost:4000; Server Components call it directly (PLAN D6).
  backendUrl: required("BACKEND_URL", process.env.BACKEND_URL),
} as const;
