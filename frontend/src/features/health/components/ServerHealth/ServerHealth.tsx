import { getTranslations } from "next-intl/server";
import { query } from "@/shared/apollo/server";
import { HealthDocument } from "@/shared/graphql";
import { HealthStatus } from "../../HealthStatus";

export async function ServerHealth() {
  const [{ data }, t] = await Promise.all([
    query({ query: HealthDocument }),
    getTranslations("health"),
  ]);
  return <HealthStatus source="server" status={data?.health.status ?? t("unavailable")} />;
}
