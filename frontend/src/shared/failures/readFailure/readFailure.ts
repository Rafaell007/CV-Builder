import { CombinedGraphQLErrors } from "@apollo/client";

/** What went wrong with a request, when the backend gave a reason the user can act on. */
export type FailureKind = "notFound" | "forbidden" | "conflict" | "invalid" | "unknown";

/** The outcome of a failed request. `reason` is the backend `extensions.reason` of the error that decided the `kind`. */
export interface Failure {
  kind: FailureKind;
  reason?: string;
}

/** The backend codes in the order they win when one response has more than one: first match decides the kind. */
const KINDS = [
  ["NOT_FOUND", "notFound"],
  ["FORBIDDEN", "forbidden"],
  ["CONFLICT", "conflict"],
  ["BAD_USER_INPUT", "invalid"],
] as const;

/**
 * Reads the reason of a failed GraphQL request. The backend codes:
 * - `NOT_FOUND`: the item is gone, or it belongs to another user (the backend gives the same answer, so a user
 *   cannot learn which ids exist). It wins over every other code for this reason.
 * - `FORBIDDEN`: the role, or an unverified email, does not allow the request.
 * - `CONFLICT`: the item exists already, is in use, or changed at the same moment. The optional `reason` tells which.
 * - `BAD_USER_INPUT`: a value is not valid.
 * Any other failure (network, server) is `unknown`, and the caller shows its own friendly text.
 * The backend message is not returned: the caller picks a translated text for each kind. A feature that supports
 * fewer kinds treats the others as `unknown` at its own call site.
 */
export function readFailure(error: unknown): Failure {
  if (!CombinedGraphQLErrors.is(error)) return { kind: "unknown" };
  for (const [code, kind] of KINDS) {
    const match = error.errors.find((item) => item.extensions?.["code"] === code);
    if (!match) continue;
    const reason = match.extensions?.["reason"];
    return typeof reason === "string" ? { kind, reason } : { kind };
  }
  return { kind: "unknown" };
}
