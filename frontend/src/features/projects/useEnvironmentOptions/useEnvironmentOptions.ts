"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { SelectOption } from "@/shared/components";
import { EnvironmentOptionsDocument } from "@/shared/graphql";

export type UseEnvironmentOptionsResult = {
  /** The skills of the catalog as options of the Environment field, in the order of the backend (by name). */
  options: readonly SelectOption[];
  loading: boolean;
  /** True when the request failed. The field then shows an error and the form can still be saved without technologies. */
  failed: boolean;
  /** Sends the failed request again. */
  retry: () => void;
};

/** Loads the skills catalog with the `EnvironmentOptions` query: the choices of the Environment field. */
export function useEnvironmentOptions(): UseEnvironmentOptionsResult {
  const { data, loading, error, refetch } = useQuery(EnvironmentOptionsDocument, {
    notifyOnNetworkStatusChange: true,
  });

  const options = useMemo(
    () => (data?.skills ?? []).map((skill) => ({ value: skill.id, label: skill.name })),
    [data],
  );

  return {
    options,
    loading,
    failed: error !== undefined,
    retry: () => void refetch().catch(() => undefined),
  };
}
