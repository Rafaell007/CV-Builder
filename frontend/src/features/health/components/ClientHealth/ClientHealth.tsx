"use client";

import { HealthStatus } from "../../HealthStatus";
import { useHealthStatus } from "../../useHealthStatus";

export function ClientHealth() {
  return <HealthStatus source="client" status={useHealthStatus()} />;
}
