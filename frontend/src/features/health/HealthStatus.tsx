import { useTranslations } from "next-intl";

export type HealthSource = "server" | "client";

// Not async, so it can translate both as a Server Component (ServerHealth) and a Client Component (ClientHealth).
export function HealthStatus({ source, status }: { source: HealthSource; status: string }) {
  const t = useTranslations("health");
  return <p>{t("status", { source, status })}</p>;
}
