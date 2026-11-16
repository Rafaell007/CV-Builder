import { CombinedGraphQLErrors } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";

/** Answers that the pages turn into a screen of their own (not found, no access). They are not failures of the app. */
const EXPECTED_CODES = new Set(["NOT_FOUND", "FORBIDDEN"]);

/**
 * Logs every failed operation. An expected answer is a warning, so the Next.js dev overlay does not show
 * it as a crash. The session refresh on `UNAUTHENTICATED` and the redirect to sign-in
 * are added here by the authentication steps (PLAN D9, S3).
 */
export const errorLink = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    for (const { message, extensions } of error.errors) {
      const code = extensions?.["code"];
      const log =
        typeof code === "string" && EXPECTED_CODES.has(code) ? console.warn : console.error;
      log(`[GraphQL] ${operation.operationName}: ${message}`, code);
    }
    return;
  }
  console.error(`[Network] ${operation.operationName}:`, error);
});
