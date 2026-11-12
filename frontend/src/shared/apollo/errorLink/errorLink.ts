import { CombinedGraphQLErrors } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { reportRequestFailure } from "@/shared/network";

/**
 * Logs every failed operation. The session refresh on `UNAUTHENTICATED` and the redirect to sign-in
 * are added here by the authentication steps (PLAN D9, S3).
 * A `TypeError` is how `fetch` reports that the server could not be reached: it shows the No Internet screen.
 */
export const errorLink = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    for (const { message, extensions } of error.errors) {
      console.error(`[GraphQL] ${operation.operationName}: ${message}`, extensions?.["code"]);
    }
    return;
  }
  console.error(`[Network] ${operation.operationName}:`, error);
  if (error instanceof TypeError) reportRequestFailure();
});
