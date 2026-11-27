import { Reflector } from "@nestjs/core";
import { Role } from "../../generated/prisma/enums";
import type { AuthUser } from "./auth-user";
import { IS_PUBLIC_KEY, Public, ROLES_KEY, Roles, VERIFIED_KEY, Verified } from "./decorators";
import { graphqlContext, httpContext } from "./execution-context.testing";
import { getRequestUser } from "./request-user";

class SampleResolver {
  @Public()
  open(): void {}

  @Roles(Role.ADMIN, Role.USER)
  restricted(): void {}

  @Verified()
  verifiedOnly(): void {}
}

describe("auth decorators", () => {
  const reflector = new Reflector();

  it("@Public marks the resolver as public", () => {
    expect(reflector.get(IS_PUBLIC_KEY, SampleResolver.prototype.open)).toBe(true);
  });

  it("@Roles stores the allowed roles", () => {
    expect(reflector.get(ROLES_KEY, SampleResolver.prototype.restricted)).toEqual([
      Role.ADMIN,
      Role.USER,
    ]);
  });

  it("@Verified marks the resolver as verified-only", () => {
    expect(reflector.get(VERIFIED_KEY, SampleResolver.prototype.verifiedOnly)).toBe(true);
  });
});

describe("getRequestUser (behind @CurrentUser)", () => {
  const signedIn: AuthUser = { id: "1", role: Role.USER, isVerified: true };

  it("returns the user the auth guard put on the request", () => {
    const context = graphqlContext(SampleResolver, SampleResolver.prototype.open, signedIn);

    expect(getRequestUser(context)).toBe(signedIn);
  });

  it("returns undefined when nobody is signed in", () => {
    const context = graphqlContext(SampleResolver, SampleResolver.prototype.open);

    expect(getRequestUser(context)).toBeUndefined();
  });

  it("returns the user of a REST request too", () => {
    const context = httpContext(SampleResolver, SampleResolver.prototype.open, signedIn);

    expect(getRequestUser(context)).toBe(signedIn);
  });
});
