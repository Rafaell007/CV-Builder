import type { ExecutionContext, Type } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import type { AuthUser } from "./auth-user";

/** Test helper: the execution context Nest builds for a GraphQL resolver call. */
export function graphqlContext(
  resolverClass: Type<unknown>,
  handler: () => unknown,
  user?: AuthUser,
  res: object = {},
): ExecutionContext {
  const args = [{}, {}, { req: { user }, res }, {}]; // GraphQL resolver args: root, args, context, info
  const context = new ExecutionContextHost(args, resolverClass, handler);
  context.setType("graphql");
  return context;
}

/** Test helper: the execution context Nest builds for a REST controller call. */
export function httpContext(
  controllerClass: Type<unknown>,
  handler: () => unknown,
  user?: AuthUser,
  res: object = {},
  params?: Record<string, string>,
): ExecutionContext {
  const args = [{ user, ...(params && { params }) }, res, () => undefined]; // Express handler args: request, response, next
  const context = new ExecutionContextHost(args, controllerClass, handler);
  context.setType("http");
  return context;
}
