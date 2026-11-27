import { Role } from "../../generated/prisma/enums";
import type { AuthUser } from "./auth-user";
import { graphqlContext, httpContext } from "./execution-context.testing";
import { getRequest, getResponse } from "./request-context";

class SampleHandlers {
  run(): void {}
}

const user: AuthUser = { id: "1", role: Role.USER, isVerified: true };
const response = { header: jest.fn() };

describe("getRequest / getResponse", () => {
  it("read the request and response from the GraphQL context of a resolver", () => {
    const context = graphqlContext(SampleHandlers, SampleHandlers.prototype.run, user, response);

    expect(getRequest(context)).toEqual({ user });
    expect(getResponse(context)).toBe(response);
  });

  it("read the Express request and response of a REST controller", () => {
    const context = httpContext(SampleHandlers, SampleHandlers.prototype.run, user, response);

    expect(getRequest(context)).toEqual({ user });
    expect(getResponse(context)).toBe(response);
  });
});
