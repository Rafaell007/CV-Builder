import { ConfigService } from "@nestjs/config";
import { Clock } from "../../common/clock";
import type { Environment } from "../../config";
import type { PrismaService } from "../../prisma/prisma.service";
import type { MailService } from "../mail";
import {
  hashVerificationCode,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from "./verification-code";
import { VerificationReason, VerificationService } from "./verification.service";

const NOW = new Date("2026-07-12T10:00:00.000Z");
const SECRET = "unit-test-refresh-secret-0123456789ab";
const CODE = "123456";

let currentTime = NOW;
const clock: Clock = { now: () => currentTime };

const prisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  verificationCode: {
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};
const mail = { sendVerificationCode: jest.fn() };
const config = new ConfigService<Environment, true>({ JWT_REFRESH_SECRET: SECRET });

function createService(): VerificationService {
  return new VerificationService(
    prisma as unknown as PrismaService,
    mail as unknown as MailService,
    clock,
    config,
  );
}

function storedCode(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "code-1",
    codeHash: hashVerificationCode(CODE, SECRET),
    expiresAt: new Date(NOW.getTime() + VERIFICATION_CODE_TTL_MS),
    usedAt: null,
    ...overrides,
  };
}

/** The `{ message, reason }` that a failed call rejects with. */
async function rejection(
  call: Promise<unknown>,
): Promise<{ reason: string | undefined; status: number }> {
  try {
    await call;
  } catch (error) {
    const exception = error as { getResponse: () => unknown; getStatus: () => number };
    const response = exception.getResponse() as { reason?: string };
    return { reason: response.reason, status: exception.getStatus() };
  }
  throw new Error("The call did not fail");
}

describe("VerificationService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    currentTime = NOW;
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      isVerified: false,
    });
    // Run the callback with the same mocks, or resolve the array of operations.
    prisma.$transaction.mockImplementation((work: unknown) =>
      typeof work === "function"
        ? (work as (tx: typeof prisma) => unknown)(prisma)
        : Promise.all(work as unknown[]),
    );
  });

  describe("issueCode", () => {
    it("replaces the old codes, stores only a hash, and mails the code", async () => {
      await createService().issueCode({ id: "user-1", email: "user1@example.com" });

      expect(prisma.verificationCode.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
      const [{ data }] = prisma.verificationCode.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      const [to, code] = mail.sendVerificationCode.mock.calls[0] as [string, string];
      expect(to).toBe("user1@example.com");
      expect(code).toMatch(/^\d{6}$/);
      expect(data["codeHash"]).toBe(hashVerificationCode(code, SECRET));
      expect(data["codeHash"]).not.toBe(code);
      expect(data["userId"]).toBe("user-1");
      expect(data["createdAt"]).toEqual(NOW);
      expect(data["expiresAt"]).toEqual(new Date(NOW.getTime() + VERIFICATION_CODE_TTL_MS));
    });

    it("does not mail a code that could not be stored", async () => {
      prisma.$transaction.mockRejectedValue(new Error("database down"));

      await expect(
        createService().issueCode({ id: "user-1", email: "user1@example.com" }),
      ).rejects.toThrow("database down");
      expect(mail.sendVerificationCode).not.toHaveBeenCalled();
    });
  });

  describe("resendCode", () => {
    it("issues a new code when there is no earlier code", async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(null);

      await createService().resendCode("user-1");

      expect(mail.sendVerificationCode).toHaveBeenCalledTimes(1);
    });

    it("refuses inside the cooldown", async () => {
      prisma.verificationCode.findFirst.mockResolvedValue({
        createdAt: new Date(NOW.getTime() - VERIFICATION_RESEND_COOLDOWN_MS + 1),
      });

      const failure = await rejection(createService().resendCode("user-1"));

      expect(failure).toEqual({ reason: VerificationReason.ResendCooldown, status: 429 });
      expect(mail.sendVerificationCode).not.toHaveBeenCalled();
    });

    it("allows a new code when the cooldown has passed", async () => {
      prisma.verificationCode.findFirst.mockResolvedValue({
        createdAt: new Date(NOW.getTime() - VERIFICATION_RESEND_COOLDOWN_MS),
      });

      await createService().resendCode("user-1");

      expect(mail.sendVerificationCode).toHaveBeenCalledTimes(1);
    });

    it("refuses a user who is already verified", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "a@b.c", isVerified: true });

      const failure = await rejection(createService().resendCode("user-1"));

      expect(failure).toEqual({ reason: VerificationReason.AlreadyVerified, status: 409 });
      expect(mail.sendVerificationCode).not.toHaveBeenCalled();
    });
  });

  describe("verifyEmail", () => {
    beforeEach(() => {
      prisma.verificationCode.findFirst.mockResolvedValue(storedCode());
      prisma.verificationCode.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({ id: "user-1", isVerified: true });
    });

    it("marks the user as verified and the code as used", async () => {
      const user = await createService().verifyEmail("user-1", CODE);

      expect(user).toEqual({ id: "user-1", isVerified: true });
      expect(prisma.verificationCode.updateMany).toHaveBeenLastCalledWith({
        where: { id: "code-1", usedAt: null },
        data: { usedAt: NOW },
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-1" }, data: { isVerified: true } }),
      );
    });

    it("accepts the code until the moment it expires, and rejects it from then on", async () => {
      currentTime = new Date(NOW.getTime() + VERIFICATION_CODE_TTL_MS - 1);
      await expect(createService().verifyEmail("user-1", CODE)).resolves.toBeDefined();

      currentTime = new Date(NOW.getTime() + VERIFICATION_CODE_TTL_MS);
      const failure = await rejection(createService().verifyEmail("user-1", CODE));

      expect(failure).toEqual({ reason: VerificationReason.CodeExpired, status: 400 });
    });

    it("rejects a wrong code, counts the try, and does not verify", async () => {
      const failure = await rejection(createService().verifyEmail("user-1", "654321"));

      expect(failure).toEqual({ reason: VerificationReason.CodeInvalid, status: 400 });
      expect(prisma.verificationCode.updateMany).toHaveBeenCalledWith({
        where: { id: "code-1", usedAt: null, attempts: { lt: VERIFICATION_MAX_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("rejects a user who has no code", async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(null);

      const failure = await rejection(createService().verifyEmail("user-1", CODE));

      expect(failure.reason).toBe(VerificationReason.CodeInvalid);
    });

    it("rejects a code that was used already", async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(storedCode({ usedAt: NOW }));

      const failure = await rejection(createService().verifyEmail("user-1", CODE));

      expect(failure).toEqual({ reason: VerificationReason.CodeUsed, status: 400 });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("rejects the correct code after the tries are used up", async () => {
      prisma.verificationCode.updateMany.mockResolvedValue({ count: 0 });

      const failure = await rejection(createService().verifyEmail("user-1", CODE));

      expect(failure).toEqual({ reason: VerificationReason.TooManyAttempts, status: 429 });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("rejects the second of two parallel requests with the correct code", async () => {
      prisma.verificationCode.updateMany
        .mockResolvedValueOnce({ count: 1 }) // the try is counted
        .mockResolvedValueOnce({ count: 0 }); // the other request used the code first

      const failure = await rejection(createService().verifyEmail("user-1", CODE));

      expect(failure.reason).toBe(VerificationReason.CodeUsed);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("refuses a user who is already verified, before it looks at the code", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "a@b.c", isVerified: true });

      const failure = await rejection(createService().verifyEmail("user-1", CODE));

      expect(failure).toEqual({ reason: VerificationReason.AlreadyVerified, status: 409 });
      expect(prisma.verificationCode.findFirst).not.toHaveBeenCalled();
    });

    it("fails with not found for a deleted user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const failure = await rejection(createService().verifyEmail("user-1", CODE));

      expect(failure.status).toBe(404);
    });
  });
});
