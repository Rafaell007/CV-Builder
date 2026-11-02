import { print } from "graphql";
import { RefreshDocument } from "@/shared/graphql";

export type RefreshOutcome =
  // New cookies were set; the failed request can run again.
  | "refreshed"
  // The backend refused: the session is over and the user must sign in again.
  | "rejected"
  // No usable answer (network, server error). The session may still be fine, so nobody is signed out.
  | "failed";

let inFlight: Promise<RefreshOutcome> | null = null;

async function requestRefresh(): Promise<RefreshOutcome> {
  try {
    // The frontend's own /graphql, rewritten to the backend (PLAN D8): the browser sends the cookies itself.
    const response = await fetch("/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: print(RefreshDocument) }),
    });
    const body = (await response.json()) as {
      data?: { refresh?: boolean } | null;
      errors?: { extensions?: { code?: string } }[];
    };
    if (body.data?.refresh) return "refreshed";
    return body.errors?.some((error) => error.extensions?.code === "UNAUTHENTICATED")
      ? "rejected"
      : "failed";
  } catch {
    return "failed";
  }
}

/**
 * Asks the backend for new session cookies. Single-flight: requests that fail together share one refresh,
 * because the backend treats a refresh token used more than twice as stolen (PLAN D21).
 */
export function refreshSession(): Promise<RefreshOutcome> {
  inFlight ??= requestRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
