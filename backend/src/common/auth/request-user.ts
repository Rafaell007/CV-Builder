import type { ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { AuthUser } from "./auth-user";

interface GraphQLRequestContext {
  req: { user?: AuthUser };
}

/** The signed-in user of the current GraphQL request, or `undefined` when nobody is signed in. */
export function getRequestUser(context: ExecutionContext): AuthUser | undefined {
  return GqlExecutionContext.create(context).getContext<GraphQLRequestContext>().req.user;
}
