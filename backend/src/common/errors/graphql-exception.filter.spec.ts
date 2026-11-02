import {
  ConflictException,
  ForbiddenException,
  ImATeapotException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { GraphQLError } from "graphql";
import { GraphQLExceptionFilter } from "./graphql-exception.filter";
import { ValidationFailedException } from "./validation-failed.exception";

describe("GraphQLExceptionFilter", () => {
  const filter = new GraphQLExceptionFilter();

  it.each([
    [new UnauthorizedException("Sign in first"), "UNAUTHENTICATED"],
    [new ForbiddenException("Admins only"), "FORBIDDEN"],
    [new NotFoundException("No such CV"), "NOT_FOUND"],
    [new ConflictException("Email taken"), "CONFLICT"],
  ])("maps %p to %s and keeps the message", (exception, code) => {
    const error = filter.catch(exception);

    expect(error).toBeInstanceOf(GraphQLError);
    expect(error.message).toBe(exception.message);
    expect(error.extensions).toEqual({ code });
  });

  it("maps a validation failure to BAD_USER_INPUT with the field errors", () => {
    const fieldErrors = [{ field: "page.size", messages: ["size must not be greater than 100"] }];

    const error = filter.catch(new ValidationFailedException(fieldErrors));

    expect(error.extensions).toEqual({ code: "BAD_USER_INPUT", fieldErrors });
  });

  it("passes a reason on, so FORBIDDEN can carry EMAIL_NOT_VERIFIED (D16)", () => {
    const exception = new ForbiddenException({
      message: "Verify your email first",
      reason: "EMAIL_NOT_VERIFIED",
    });

    const error = filter.catch(exception);

    expect(error.extensions).toEqual({ code: "FORBIDDEN", reason: "EMAIL_NOT_VERIFIED" });
  });

  it("returns a GraphQLError unchanged", () => {
    const original = new GraphQLError("Already mapped", { extensions: { code: "CUSTOM" } });

    expect(filter.catch(original)).toBe(original);
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
      const error = filter.catch(exception);

      expect(error.message).toBe("Internal server error");
      expect(error.extensions).toEqual({ code: "INTERNAL_SERVER_ERROR" });
    });

    it("logs the original error", () => {
      const logSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();

      filter.catch(new Error("db down"));

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("db down"));
    });
  });
});
