import { query } from "@/shared/apollo/server";
import { HealthDocument } from "@/shared/graphql";
import { HealthStatus } from "../HealthStatus";

export async function ServerHealth() {
  const { data } = await query({ query: HealthDocument });
  return <HealthStatus source="server" status={data?.health.status ?? "unavailable"} />;
}
