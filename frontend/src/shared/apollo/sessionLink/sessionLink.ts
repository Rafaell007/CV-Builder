import { CombinedGraphQLErrors } from "@apollo/client";
import type { ApolloLink } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { from, mergeMap, tap, throwError } from "rxjs";
import { SESSION_OPERATIONS, type RefreshOutcome } from "@/shared/session";

export type SessionLinkOptions = {
  refresh: () => Promise<RefreshOutcome>;
  onSessionEnded: () => void;
};

type GraphQLError = { extensions?: Record<string, unknown> };

function hasUnauthenticated(errors: readonly GraphQLError[] | undefined): boolean {
  return errors?.some((error) => error.extensions?.["code"] === "UNAUTHENTICATED") ?? false;
}

/**
 * Keeps the user signed in while the access token expires (PLAN D9). A request that fails with
 * `UNAUTHENTICATED` triggers a session refresh and then runs once more. If the refresh is refused, or the
 * second run fails the same way, the session is over and `onSessionEnded` runs (redirect to sign-in).
 * A network error during the refresh does not end the session; the original error reaches the caller.
 * Browser only: on the server, the proxy has refreshed the session before the page renders.
 */
export function createSessionLink({ refresh, onSessionEnded }: SessionLinkOptions): ErrorLink {
  return new ErrorLink(({ error, operation, forward }) => {
    if (!CombinedGraphQLErrors.is(error) || !hasUnauthenticated(error.errors)) return;
    // The answer of these is the result, not a sign of an expired session (wrong password, nothing to end).
    if (SESSION_OPERATIONS.has(operation.operationName ?? "")) return;

    return from(refresh()).pipe(
      mergeMap((outcome): ReturnType<typeof forward> => {
        if (outcome === "refreshed") {
          return forward(operation).pipe(
            tap((result: ApolloLink.Result) => {
              if (hasUnauthenticated(result.errors)) onSessionEnded();
            }),
          );
        }
        if (outcome === "rejected") onSessionEnded();
        return throwError(() => error);
      }),
    );
  });
}
