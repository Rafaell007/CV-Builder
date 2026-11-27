import type { ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "./auth-user";
import { getRequest } from "./request-context";

/** The signed-in user of the current GraphQL or REST request, or `undefined` when nobody is signed in. */
export function getRequestUser(context: ExecutionContext): AuthUser | undefined {
  return getRequest<{ user?: AuthUser }>(context).user;
}
