import { CombinedGraphQLErrors } from "@apollo/client";

/**
 * The message to show when `deleteProject` fails. A business-rule error (`CONFLICT`, for example "used in a CV")
 * carries a message written for the user, so it is shown as it is. Any other failure (network, server, permission)
 * returns `undefined`, and the caller shows its own friendly text.
 */
export function toDeleteProjectFailure(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  return error.errors.find((item) => item.extensions?.["code"] === "CONFLICT")?.message;
}
