import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import type { GqlContextType } from "@nestjs/graphql";
import { GraphQLError } from "graphql";
import { Prisma } from "../../generated/prisma/client";
import { ErrorCode } from "./error-code";
import { ValidationFailedException } from "./validation-failed.exception";

const CODE_BY_STATUS: ReadonlyMap<number, ErrorCode> = new Map([
  [HttpStatus.BAD_REQUEST, ErrorCode.BadUserInput],
  [HttpStatus.UNAUTHORIZED, ErrorCode.Unauthenticated],
  [HttpStatus.FORBIDDEN, ErrorCode.Forbidden],
  [HttpStatus.NOT_FOUND, ErrorCode.NotFound],
  [HttpStatus.CONFLICT, ErrorCode.Conflict],
  [HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TooManyRequests],
]);

const CODE_BY_PRISMA_ERROR: ReadonlyMap<string, ErrorCode> = new Map([
  ["P2002", ErrorCode.Conflict], // unique constraint failed
  ["P2025", ErrorCode.NotFound], // record to update or delete not found
]);

/**
 * Maps every error thrown while resolving a GraphQL request to a GraphQL error with `extensions.code` (D7).
 * Plain HTTP requests (for example an unknown route) keep Nest's default JSON response.
 */
@Catch()
export class GraphQLExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): GraphQLError | void {
    if (host.getType<GqlContextType>() !== "graphql") {
      super.catch(exception, host);
      return;
    }
    return this.toGraphQLError(exception);
  }

  private toGraphQLError(exception: unknown): GraphQLError {
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

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const code = CODE_BY_PRISMA_ERROR.get(exception.code);
      if (code !== undefined) {
        // The Prisma message names tables and columns, so the client gets a fixed text instead.
        const message = code === ErrorCode.Conflict ? "Already exists" : "Not found";
        return new GraphQLError(message, { extensions: { code } });
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
