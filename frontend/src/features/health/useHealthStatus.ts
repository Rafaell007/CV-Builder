"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { HealthDocument } from "@/shared/graphql";

/** The backend's health status, read from the cache that <PreloadQuery> filled on the server. */
export function useHealthStatus(): string {
  const { data } = useSuspenseQuery(HealthDocument);
  return data.health.status;
}
