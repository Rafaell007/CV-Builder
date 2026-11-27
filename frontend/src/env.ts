// Public env only. Server secrets live in src/server/env/env.ts (PLAN D9).
// Next.js inlines NEXT_PUBLIC_* only when accessed as a literal property.
export const required = (key: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing env variable: ${key}`);
  return value;
};

export const env = {
  appUrl: required("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL),
} as const;
