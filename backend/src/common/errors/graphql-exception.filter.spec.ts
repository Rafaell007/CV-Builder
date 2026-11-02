import {
  ConflictException,
  ForbiddenException,
  ImATeapotException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { GraphQLError } from "graphql";
import { Prisma } from "../../generated/prisma/client";
import { GraphQLExceptionFilter } from "./graphql-exception.filter";
import { ValidationFailedException } from "./validation-failed.exception";

function hostOfType(type: string): ExecutionContextHost {
  const host = new ExecutionContextHost([]);
  host.setType(type);
  return host;
}

describe("GraphQLExceptionFilter", () => {
  const filter = new GraphQLExceptionFilter();
  const graphqlHost = hostOfType("graphql");

  function catchGraphQL(exception: unknown): GraphQLError {
    const error = filter.catch(exception, graphqlHost);
    if (!(error instanceof GraphQLError)) throw new Error("Expected a GraphQLError");
    return error;
  }

  it.each([
    [new UnauthorizedException("Sign in first"), "UNAUTHENTICATED"],
    [new ForbiddenException("Admins only"), "FORBIDDEN"],
    [new NotFoundException("No such CV"), "NOT_FOUND"],
    [new ConflictException("Email taken"), "CONFLICT"],
  ])("maps %p to %s and keeps the message", (exception, code) => {
    const error = catchGraphQL(exception);

    expect(error).toBeInstanceOf(GraphQLError);
    expect(error.message).toBe(exception.message);
    expect(error.extensions).toEqual({ code });
  });

  it("maps a validation failure to BAD_USER_INPUT with the field errors", () => {
    const fieldErrors = [{ field: "page.size", messages: ["size must not be greater than 100"] }];

    const error = catchGraphQL(new ValidationFailedException(fieldErrors));

    expect(error.extensions).toEqual({ code: "BAD_USER_INPUT", fieldErrors });
  });

  it("passes a reason on, so FORBIDDEN can carry EMAIL_NOT_VERIFIED (D16)", () => {
    const exception = new ForbiddenException({
      message: "Verify your email first",
      reason: "EMAIL_NOT_VERIFIED",
    });

    const error = catchGraphQL(exception);

    expect(error.extensions).toEqual({ code: "FORBIDDEN", reason: "EMAIL_NOT_VERIFIED" });
  });

  it("returns a GraphQLError unchanged", () => {
    const original = new GraphQLError("Already mapped", { extensions: { code: "CUSTOM" } });

    expect(catchGraphQL(original)).toBe(original);
  });

  describe("Prisma errors", () => {
    function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
      return new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on User_email_key",
        {
          code,
          clientVersion: "test",
        },
      );
    }

    it.each([
      ["P2002", "CONFLICT", "Already exists"],
      ["P2025", "NOT_FOUND", "Not found"],
    ])("maps %s to %s without the Prisma message", (prismaCode, code, message) => {
      const error = catchGraphQL(prismaError(prismaCode));

      expect(error.message).toBe(message);
      expect(error.extensions).toEqual({ code });
    });
  });

  describe("non-GraphQL requests", () => {
    it("hands an HTTP error to the default Nest handler instead of returning a GraphQLError", () => {
      const parentCatch = jest.spyOn(BaseExceptionFilter.prototype, "catch").mockImplementation();
      const exception = new NotFoundException("No such route");
      const host = hostOfType("http");

      const result = filter.catch(exception, host);

      expect(result).toBeUndefined();
      expect(parentCatch).toHaveBeenCalledWith(exception, host);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe("unknown errors", () => {
    beforeEach(() => {
      jest.spyOn(Logger.prototype, "error").mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it.each([
      ["an Error", new Error("connection refused: db.internal:5432")],
      ["an HTTP error without a mapped code", new ImATeapotException()],
      ["a 500 HTTP error", new InternalServerErrorException("secret detail")],
      ["a thrown string", "boom"],
    ])("returns %s as INTERNAL_SERVER_ERROR without details", (_label, exception) => {
      const error = catchGraphQL(exception);

      expect(error.message).toBe("Internal server error");
      expect(error.extensions).toEqual({ code: "INTERNAL_SERVER_ERROR" });
    });

    it("logs the original error", () => {
      const logSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();

      catchGraphQL(new Error("db down"));

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("db down"));
    });
  });
});
