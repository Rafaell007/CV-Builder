"use client";

import { useApolloClient } from "@apollo/client/react";
import { clearQueryFailed } from "@/shared/network";

// RETRY: runs every query on the page again; the page comes back only when they all succeed.
export function useRetryQueries(): () => void {
  const client = useApolloClient();

  async function retry() {
    try {
      await client.refetchQueries({ include: "active" });
      clearQueryFailed();
    } catch {
      // Still failing: networkErrorLink keeps the flag, so the screen stays.
    }
  }

  return () => void retry();
}
