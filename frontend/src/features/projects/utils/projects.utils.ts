import { CombinedGraphQLErrors } from "@apollo/client";

/** Why `deleteProject` failed, when the reason is one the user should read. */
export type DeleteProjectFailure = "inUse";

/**
 * Reads the reason of a failed `deleteProject`. The backend sends `CONFLICT` only when a CV uses the project (PLAN D18).
 * Any other failure (network, server, permission) returns `undefined`, and the caller shows its own friendly text.
 * The backend message is not shown: it is English only, so the caller picks a translated text.
 */
export function toDeleteProjectFailure(error: unknown): DeleteProjectFailure | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const codes = error.errors.map((item) => item.extensions?.["code"]);
  return codes.includes("CONFLICT") ? "inUse" : undefined;
}
