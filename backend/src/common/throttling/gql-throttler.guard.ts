import { ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { getRequest, getResponse } from "../auth";

/**
 * `ThrottlerGuard` for GraphQL (D23), which also works on a REST controller. The stock guard reads
 * the request from the HTTP context, which does not exist for a resolver. Use it with
 * `@UseGuards(GqlThrottlerGuard)` on a resolver or controller method.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected override getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    return {
      req: getRequest<Record<string, unknown>>(context),
      res: getResponse<Record<string, unknown>>(context),
    };
  }

  protected override throwThrottlingException(): Promise<void> {
    throw new HttpException("Too many attempts, try again later", HttpStatus.TOO_MANY_REQUESTS);
  }
}
