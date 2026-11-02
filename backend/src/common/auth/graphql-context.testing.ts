import type { ExecutionContext, Type } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import type { AuthUser } from "./auth-user";

/** Test helper: the execution context Nest builds for a GraphQL resolver call. */
export function graphqlContext(
  resolverClass: Type<unknown>,
  handler: () => unknown,
  user?: AuthUser,
): ExecutionContext {
  const args = [{}, {}, { req: { user } }, {}]; // GraphQL resolver args: root, args, context, info
  return new ExecutionContextHost(args, resolverClass, handler);
}
