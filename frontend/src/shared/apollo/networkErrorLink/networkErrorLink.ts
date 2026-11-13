import { ServerError } from "@apollo/client/errors";
import { ErrorLink } from "@apollo/client/link/error";
import { OperationTypeNode } from "graphql";
import { markQueryFailed } from "@/shared/network";

// fetch() itself failed (offline, server unreachable), or the server or proxy answered with a 5xx status.
function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  return ServerError.is(error) && error.statusCode >= 500;
}

/**
 * Shows the No Internet screen when a query cannot reach the server.
 * Mutations keep their error toast: a failed save must not hide the form (KAN-93, decision A).
 * Browser only: the store belongs to one browser tab; on the server it would be shared by all users.
 */
export const networkErrorLink = new ErrorLink(({ error, operation }) => {
  if (operation.operationType !== OperationTypeNode.QUERY) return;
  if (isNetworkFailure(error)) markQueryFailed();
});
