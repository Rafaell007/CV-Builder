import { CombinedGraphQLErrors } from "@apollo/client";
import type { ApolloLink } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { from, mergeMap, NEVER, of, throwError } from "rxjs";
import { SESSION_OPERATIONS, type RefreshOutcome } from "@/shared/session";

export type SessionLinkOptions = {
  refresh: () => Promise<RefreshOutcome>;
  /** Starts the redirect to sign-in. Returns `true` when it is under way, `false` when there is nowhere to go. */
  onSessionEnded: () => boolean;
};

type GraphQLError = { extensions?: Record<string, unknown> };

function hasUnauthenticated(errors: readonly GraphQLError[] | undefined): boolean {
  return errors?.some((error) => error.extensions?.["code"] === "UNAUTHENTICATED") ?? false;
}

/**
 * Keeps the user signed in while the access token expires (PLAN D9). A request that fails with
 * `UNAUTHENTICATED` triggers a session refresh and then runs once more. If the refresh is refused, or the
 * second run fails the same way, the session is over and `onSessionEnded` runs (redirect to sign-in).
 * While the redirect is under way the request stays pending, so the page keeps its loading state and does not
 * flash an error screen before the browser leaves. If there is nowhere to redirect to, the error reaches the caller.
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
            mergeMap((result: ApolloLink.Result) =>
              hasUnauthenticated(result.errors) && onSessionEnded() ? NEVER : of(result),
            ),
          );
        }
        if (outcome === "rejected" && onSessionEnded()) return NEVER;
        return throwError(() => error);
      }),
    );
  });
}
