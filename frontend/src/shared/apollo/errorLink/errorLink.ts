import { CombinedGraphQLErrors } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";

/**
 * Logs every failed operation. The session refresh on `UNAUTHENTICATED` and the redirect to sign-in
 * are added here by the authentication steps (PLAN D9, S3).
 */
export const errorLink = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    for (const { message, extensions } of error.errors) {
      console.error(`[GraphQL] ${operation.operationName}: ${message}`, extensions?.["code"]);
    }
    return;
  }
  console.error(`[Network] ${operation.operationName}:`, error);
});
