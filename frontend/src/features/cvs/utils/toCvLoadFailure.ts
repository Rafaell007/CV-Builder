import { CombinedGraphQLErrors } from "@apollo/client";

/** Why the `cv` query failed: a CV that is not there, a CV the user may not open, or any other problem. */
export type CvLoadFailure = "notFound" | "forbidden" | "failed";

/**
 * Reads the reason of a failed `cv` request, so the page can show a different screen for each reason.
 * `NOT_FOUND` also covers a CV of another user (the backend gives the same answer, so a user cannot learn which
 * ids exist). `FORBIDDEN` means the role does not allow the request. Network and server errors are `failed`:
 * they are the only ones where Retry can help.
 */
export function toCvLoadFailure(error: unknown): CvLoadFailure {
  if (!CombinedGraphQLErrors.is(error)) return "failed";
  const codes = error.errors.map((item) => item.extensions?.["code"]);
  if (codes.includes("NOT_FOUND")) return "notFound";
  if (codes.includes("FORBIDDEN")) return "forbidden";
  return "failed";
}
