import { CombinedGraphQLErrors } from "@apollo/client";

/** Why `deleteCv` failed, when the reason is one the user can act on. */
export type DeleteCvFailure = "notFound" | "forbidden";

/**
 * Reads the reason of a failed `deleteCv` request.
 * `NOT_FOUND` means the CV is already deleted, or it belongs to another user (the backend gives the same answer, so
 * a user cannot learn which ids exist). `FORBIDDEN` means the role does not allow the delete.
 * Any other failure (network, server) returns `undefined`, and the caller shows its own friendly text.
 * The backend message is not shown: the caller picks a translated text for each reason.
 */
export function toDeleteCvFailure(error: unknown): DeleteCvFailure | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const codes = error.errors.map((item) => item.extensions?.["code"]);
  if (codes.includes("NOT_FOUND")) return "notFound";
  if (codes.includes("FORBIDDEN")) return "forbidden";
  return undefined;
}
