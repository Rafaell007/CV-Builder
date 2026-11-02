import { UnauthorizedException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GqlThrottlerGuard } from "../../common/throttling";
import { Role } from "../../generated/prisma/enums";
import { VerifyEmailInput } from "./dto/verify-email.input";
import type { SessionUser } from "./models/session-user";
import { VerificationResolver } from "./verification.resolver";
import type { VerificationService } from "./verification.service";

const AUTH_USER = { id: "user-1", role: Role.USER, isVerified: false };
const VERIFIED_USER: SessionUser = {
  id: "user-1",
  email: "user1@example.com",
  role: Role.USER,
  isVerified: true,
  firstName: null,
  lastName: null,
};

function setup() {
  const service = {
    verifyEmail: jest.fn().mockResolvedValue(VERIFIED_USER),
    resendCode: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<VerificationService>;
  return { resolver: new VerificationResolver(service), service };
}

describe("VerificationResolver", () => {
  it("verifyEmail checks the code of the signed-in user and returns the verified user", async () => {
    const { resolver, service } = setup();

    await expect(resolver.verifyEmail(AUTH_USER, { code: "123456" })).resolves.toBe(VERIFIED_USER);

    expect(service.verifyEmail).toHaveBeenCalledWith("user-1", "123456");
  });

  it("resendVerificationCode asks for a new code for the signed-in user", async () => {
    const { resolver, service } = setup();

    await expect(resolver.resendVerificationCode(AUTH_USER)).resolves.toBe(true);

    expect(service.resendCode).toHaveBeenCalledWith("user-1");
  });

  it.each(["verifyEmail", "resendVerificationCode"] as const)(
    "%s is throttled and is not public (D23)",
    (name) => {
      const handler = VerificationResolver.prototype[name];

      expect(Reflect.getMetadata("__guards__", handler)).toEqual([GqlThrottlerGuard]);
      expect(Reflect.getMetadata("auth:isPublic", handler)).toBeUndefined();
    },
  );

  it("refuses both mutations without a user", async () => {
    const { resolver, service } = setup();

    expect(() => resolver.verifyEmail(undefined, { code: "123456" })).toThrow(
      UnauthorizedException,
    );
    await expect(resolver.resendVerificationCode(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(service.verifyEmail).not.toHaveBeenCalled();
  });
});

describe("VerifyEmailInput", () => {
  async function errorsFor(code: unknown): Promise<string[]> {
    const errors = await validate(plainToInstance(VerifyEmailInput, { code }));
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  }

  it.each(["123456", "000000", " 123456 "])("accepts %j", async (code) => {
    await expect(errorsFor(code)).resolves.toEqual([]);
  });

  it.each(["", "12345", "1234567", "12345a", "12 456", "١٢٣٤٥٦", 123456, null])(
    "rejects %j",
    async (code) => {
      await expect(errorsFor(code)).resolves.toEqual(["Please enter a valid 6-digit code"]);
    },
  );
});
