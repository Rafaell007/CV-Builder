import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Clock } from "../../common/clock";
import type { Environment } from "../../config";
import type { PrismaService } from "../../prisma/prisma.service";
import type { MailService } from "../mail";
import { verifyPassword } from "./password";
import { hashPasswordResetToken, PASSWORD_RESET_TOKEN_TTL_MS } from "./password-reset-token";
import { PasswordResetReason, PasswordResetService } from "./password-reset.service";

const NOW = new Date("2026-07-12T10:00:00.000Z");
const SECRET = "unit-test-refresh-secret-0123456789ab";
const TOKEN = "token-from-the-mail";

const clock: Clock = { now: () => NOW };

const tx = {
  passwordResetToken: { updateMany: jest.fn(), deleteMany: jest.fn() },
  user: { update: jest.fn() },
  refreshToken: { deleteMany: jest.fn() },
};
const prisma = {
  user: { findUnique: jest.fn() },
  passwordResetToken: { findUnique: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  $transaction: jest.fn(),
};
const mail = { sendPasswordReset: jest.fn() };
const config = new ConfigService<Environment, true>({ JWT_REFRESH_SECRET: SECRET });

function createService(): PasswordResetService {
  return new PasswordResetService(
    prisma as unknown as PrismaService,
    mail as unknown as MailService,
    clock,
    config,
  );
}

function storedToken(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "token-1",
    userId: "user-1",
    expiresAt: new Date(NOW.getTime() + PASSWORD_RESET_TOKEN_TTL_MS),
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

describe("PasswordResetService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((work: unknown) =>
      typeof work === "function"
        ? (work as (client: typeof tx) => Promise<unknown>)(tx)
        : Promise.all(work as Promise<unknown>[]),
    );
    tx.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
  });

  describe("requestReset", () => {
    it("does nothing and does not fail for an unknown email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(createService().requestReset("nobody@example.com")).resolves.toBeUndefined();

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it("looks the user up by the trimmed, lower-case email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await createService().requestReset("  Ada@Example.com ");

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: "ada@example.com" } }),
      );
    });

    it("replaces the old tokens, stores only the hash for 1 hour and mails the token", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "ada@example.com" });

      await createService().requestReset("ada@example.com");

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
      const [to, token] = mail.sendPasswordReset.mock.calls[0] as [string, string];
      expect(to).toBe("ada@example.com");
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          tokenHash: hashPasswordResetToken(token, SECRET),
          createdAt: NOW,
          expiresAt: new Date(NOW.getTime() + 60 * 60 * 1000),
        },
      });
    });

    it("creates the token before the mail, so a mailed token always exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "ada@example.com" });
      const order: string[] = [];
      prisma.$transaction.mockImplementation(() => {
        order.push("stored");
        return Promise.resolve([]);
      });
      mail.sendPasswordReset.mockImplementation(() => {
        order.push("mailed");
        return Promise.resolve();
      });

      await createService().requestReset("ada@example.com");

      expect(order).toEqual(["stored", "mailed"]);
    });

    it("does not fail when the mail fails, and does not log the token", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "ada@example.com" });
      mail.sendPasswordReset.mockRejectedValue(new Error("SMTP down"));
      const logged = jest.spyOn(Logger.prototype, "error").mockImplementation();

      await expect(createService().requestReset("ada@example.com")).resolves.toBeUndefined();

      const [, token] = mail.sendPasswordReset.mock.calls[0] as [string, string];
      expect(logged).toHaveBeenCalledTimes(1);
      expect(String(logged.mock.calls[0]?.[0])).toContain("SMTP down");
      expect(String(logged.mock.calls[0]?.[0])).not.toContain(token);
      logged.mockRestore();
    });
  });

  describe("resetPassword", () => {
    it("rejects an unknown token", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      expect(await rejection(createService().resetPassword(TOKEN, "new-password-1"))).toEqual({
        reason: PasswordResetReason.TokenInvalid,
        status: 400,
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("looks the token up by its hash, never by the token itself", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await rejection(createService().resetPassword(TOKEN, "new-password-1"));

      expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tokenHash: hashPasswordResetToken(TOKEN, SECRET) } }),
      );
    });

    it("rejects a used token", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(storedToken({ usedAt: NOW }));

      expect(await rejection(createService().resetPassword(TOKEN, "new-password-1"))).toEqual({
        reason: PasswordResetReason.TokenUsed,
        status: 400,
      });
    });

    it("rejects an expired token, also at the exact moment of expiry", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(storedToken({ expiresAt: NOW }));

      expect(await rejection(createService().resetPassword(TOKEN, "new-password-1"))).toEqual({
        reason: PasswordResetReason.TokenExpired,
        status: 400,
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("saves a hash of the new password, uses the token and ends every session", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(storedToken());

      await createService().resetPassword(TOKEN, "new-password-1");

      expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { id: "token-1", usedAt: null },
        data: { usedAt: NOW },
      });
      const { data } = tx.user.update.mock.calls[0]?.[0] as { data: { passwordHash: string } };
      expect(data.passwordHash).not.toContain("new-password-1");
      expect(await verifyPassword(data.passwordHash, "new-password-1")).toBe(true);
      expect(tx.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1", id: { not: "token-1" } },
      });
      expect(tx.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    });

    it("rejects the token and changes nothing when a parallel request used it first", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(storedToken());
      tx.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

      expect(await rejection(createService().resetPassword(TOKEN, "new-password-1"))).toEqual({
        reason: PasswordResetReason.TokenUsed,
        status: 400,
      });
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(tx.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });
});
