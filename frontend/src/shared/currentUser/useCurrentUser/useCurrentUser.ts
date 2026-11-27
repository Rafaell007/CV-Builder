"use client";

import { useQuery } from "@apollo/client/react";
import { MeDocument, type MeQuery } from "@/shared/graphql";

export type CurrentUser = NonNullable<MeQuery["me"]>;

export type UseCurrentUserResult = {
  // The signed-in user, or `null` while loading and when nobody is signed in.
  user: CurrentUser | null;
  loading: boolean;
  // The `me` request failed (network or server). Not the same as "nobody is signed in".
  failed: boolean;
  // Sends the `me` request again.
  retry: () => void;
  isAdmin: boolean;
};

/**
 * The signed-in user from the backend's `me` query, for the layout and for permission checks. The UI
 * only hides what the user may not do; the backend decides (PLAN D10).
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { data, loading, error, refetch } = useQuery(MeDocument);
  const user = data?.me ?? null;
  return {
    user,
    loading,
    failed: Boolean(error) && !data,
    retry: () => void refetch().catch(() => undefined),
    isAdmin: user?.role === "ADMIN",
  };
}
