import type { ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext, type GqlContextType } from "@nestjs/graphql";

interface RequestPair<TRequest, TResponse> {
  req: TRequest;
  res: TResponse;
}

function isGraphql(context: ExecutionContext): boolean {
  return context.getType<GqlContextType>() === "graphql";
}

/**
 * The Express request of the current call, for a GraphQL resolver and a REST controller alike.
 * A resolver has no HTTP arguments of its own; its request lives in the GraphQL context (`AppModule`).
 */
export function getRequest<TRequest>(context: ExecutionContext): TRequest {
  return isGraphql(context)
    ? GqlExecutionContext.create(context).getContext<RequestPair<TRequest, unknown>>().req
    : context.switchToHttp().getRequest<TRequest>();
}

/** The Express response of the current call, for a GraphQL resolver and a REST controller alike. */
export function getResponse<TResponse>(context: ExecutionContext): TResponse {
  return isGraphql(context)
    ? GqlExecutionContext.create(context).getContext<RequestPair<unknown, TResponse>>().res
    : context.switchToHttp().getResponse<TResponse>();
}
