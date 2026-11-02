import { ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * `ThrottlerGuard` for GraphQL (D23). The stock guard reads the request from the HTTP context,
 * which does not exist for a resolver. Use it with `@UseGuards(GqlThrottlerGuard)` on a resolver method.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected override getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const { req, res } = GqlExecutionContext.create(context).getContext<{
      req: Record<string, unknown>;
      res: Record<string, unknown>;
    }>();
    return { req, res };
  }

  protected override throwThrottlingException(): Promise<void> {
    throw new HttpException("Too many attempts, try again later", HttpStatus.TOO_MANY_REQUESTS);
  }
}
