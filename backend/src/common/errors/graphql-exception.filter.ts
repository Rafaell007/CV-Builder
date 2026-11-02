import { Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { GqlExceptionFilter } from "@nestjs/graphql";
import { GraphQLError } from "graphql";
import { ErrorCode } from "./error-code";
import { ValidationFailedException } from "./validation-failed.exception";

const CODE_BY_STATUS: ReadonlyMap<number, ErrorCode> = new Map([
  [HttpStatus.BAD_REQUEST, ErrorCode.BadUserInput],
  [HttpStatus.UNAUTHORIZED, ErrorCode.Unauthenticated],
  [HttpStatus.FORBIDDEN, ErrorCode.Forbidden],
  [HttpStatus.NOT_FOUND, ErrorCode.NotFound],
  [HttpStatus.CONFLICT, ErrorCode.Conflict],
]);

/** Maps every error thrown while resolving a request to a GraphQL error with `extensions.code` (D7). */
@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: unknown): GraphQLError {
    if (exception instanceof GraphQLError) return exception;

    if (exception instanceof ValidationFailedException) {
      return new GraphQLError(exception.message, {
        extensions: { code: ErrorCode.BadUserInput, fieldErrors: exception.fieldErrors },
      });
    }

    if (exception instanceof HttpException) {
      const code = CODE_BY_STATUS.get(exception.getStatus());
      if (code !== undefined) {
        // `reason` refines a code, e.g. FORBIDDEN with EMAIL_NOT_VERIFIED (D16).
        const reason = readReason(exception.getResponse());
        return new GraphQLError(exception.message, {
          extensions: reason === undefined ? { code } : { code, reason },
        });
      }
    }

    // Unknown errors are logged and returned without details (PLAN.md §3).
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return new GraphQLError("Internal server error", {
      extensions: { code: ErrorCode.InternalServerError },
    });
  }
}

function readReason(response: string | object): string | undefined {
  if (typeof response !== "object" || !("reason" in response)) return undefined;
  return typeof response.reason === "string" ? response.reason : undefined;
}
