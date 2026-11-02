import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../generated/prisma/enums";
import type { AuthUser } from "./auth-user";
import { Verified } from "./decorators";
import { EmailNotVerifiedException } from "./email-not-verified.exception";
import { graphqlContext } from "./graphql-context.testing";
import { VerifiedGuard } from "./verified.guard";

class SampleResolver {
  open(): void {}

  @Verified()
  verifiedOnly(): void {}
}

const verified: AuthUser = { id: "1", role: Role.USER, isVerified: true };
const unverified: AuthUser = { id: "2", role: Role.USER, isVerified: false };

describe("VerifiedGuard", () => {
  const guard = new VerifiedGuard(new Reflector());

  it("lets an unverified user through a resolver without @Verified", () => {
    const context = graphqlContext(SampleResolver, SampleResolver.prototype.open, unverified);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("lets a verified user through", () => {
    const context = graphqlContext(SampleResolver, SampleResolver.prototype.verifiedOnly, verified);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects an unverified user with EMAIL_NOT_VERIFIED (D16)", () => {
    const context = graphqlContext(
      SampleResolver,
      SampleResolver.prototype.verifiedOnly,
      unverified,
    );

    expect(() => guard.canActivate(context)).toThrow(EmailNotVerifiedException);
  });

  it("rejects a request without a user as UNAUTHENTICATED", () => {
    const context = graphqlContext(SampleResolver, SampleResolver.prototype.verifiedOnly);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
