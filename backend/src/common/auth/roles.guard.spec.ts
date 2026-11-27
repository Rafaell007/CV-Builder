import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../generated/prisma/enums";
import type { AuthUser } from "./auth-user";
import { Roles } from "./decorators";
import { graphqlContext, httpContext } from "./execution-context.testing";
import { RolesGuard } from "./roles.guard";

class SampleResolver {
  open(): void {}

  @Roles(Role.ADMIN)
  adminOnly(): void {}
}

@Roles(Role.ADMIN)
class AdminResolver {
  anything(): void {}
}

const admin: AuthUser = { id: "1", role: Role.ADMIN, isVerified: true };
const user: AuthUser = { id: "2", role: Role.USER, isVerified: true };

describe("RolesGuard", () => {
  const guard = new RolesGuard(new Reflector());

  it("lets anyone through a resolver without @Roles, even when nobody is signed in", () => {
    expect(guard.canActivate(graphqlContext(SampleResolver, SampleResolver.prototype.open))).toBe(
      true,
    );
  });

  it("lets a user with an allowed role through", () => {
    const context = graphqlContext(SampleResolver, SampleResolver.prototype.adminOnly, admin);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects a user with another role as FORBIDDEN", () => {
    const context = graphqlContext(SampleResolver, SampleResolver.prototype.adminOnly, user);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("rejects a request without a user as UNAUTHENTICATED", () => {
    const context = graphqlContext(SampleResolver, SampleResolver.prototype.adminOnly);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("reads @Roles from the resolver class too", () => {
    const handler = AdminResolver.prototype.anything;

    expect(guard.canActivate(graphqlContext(AdminResolver, handler, admin))).toBe(true);
    expect(() => guard.canActivate(graphqlContext(AdminResolver, handler, user))).toThrow(
      ForbiddenException,
    );
  });

  it("reads the user of a REST request too", () => {
    const handler = SampleResolver.prototype.adminOnly;

    expect(guard.canActivate(httpContext(SampleResolver, handler, admin))).toBe(true);
    expect(() => guard.canActivate(httpContext(SampleResolver, handler, user))).toThrow(
      ForbiddenException,
    );
  });
});
