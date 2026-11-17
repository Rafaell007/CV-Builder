import { BadRequestException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Clock } from "../../common/clock";
import type { Environment } from "../../config";
import { Prisma } from "../../generated/prisma/client";
import { Role } from "../../generated/prisma/enums";
import type { PrismaService } from "../../prisma/prisma.service";
import {
  AuthService,
  CURRENT_PASSWORD_INCORRECT_REASON,
  EMAIL_TAKEN_REASON,
  NEW_PASSWORD_SAME_REASON,
  REFRESH_GRACE_WINDOW_MS,
} from "./auth.service";
import { hashPassword, verifyPassword } from "./password";
import { REFRESH_TOKEN_TTL_MS, TokenService } from "./sessions/token.service";
import type { VerificationService } from "./verification/verification.service";

const NOW = new Date("2026-07-12T10:00:00.000Z");
const PASSWORD = "Password123!";

const prisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const verification = { issueCode: jest.fn() };

const config = new ConfigService<Environment, true>({
  JWT_ACCESS_SECRET: "unit-test-access-secret-0123456789abc",
  JWT_REFRESH_SECRET: "unit-test-refresh-secret-0123456789ab",
});
const tokens = new TokenService(new JwtService(), config);
const clock: Clock = { now: () => NOW };

function createService(): AuthService {
  return new AuthService(
    prisma as unknown as PrismaService,
    tokens,
    clock,
    verification as unknown as VerificationService,
  );
}

describe("AuthService", () => {
  beforeEach(() => jest.resetAllMocks());

  describe("signUp", () => {
    const SIGNED_UP = {
      id: "user-2",
      email: "new@example.com",
      role: Role.USER,
      isVerified: false,
      firstName: null,
      lastName: null,
    };

    function uniqueViolation(): Prisma.PrismaClientKnownRequestError {
      return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      });
    }

    it("creates an unverified user with a hashed password, mails a code and opens a session", async () => {
      prisma.user.create.mockResolvedValue(SIGNED_UP);

      const session = await createService().signUp({
        email: "  New@Example.com ",
        password: PASSWORD,
      });

      const [{ data }] = prisma.user.create.mock.calls[0] as [{ data: Record<string, string> }];
      expect(data["email"]).toBe("new@example.com");
      expect(data["passwordHash"]).not.toBe(PASSWORD);
      expect(data["passwordHash"]).toMatch(/^\$argon2id\$/);
      expect(data).not.toHaveProperty("role");
      expect(data).not.toHaveProperty("isVerified");
      expect(verification.issueCode).toHaveBeenCalledWith(SIGNED_UP);
      expect(session.user).toEqual(SIGNED_UP);
      await expect(tokens.verifyAccessToken(session.accessToken)).resolves.toEqual({
        userId: "user-2",
        tokenVersion: 0,
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it("answers CONFLICT with the reason EMAIL_TAKEN when the email exists", async () => {
      prisma.user.create.mockRejectedValue(uniqueViolation());

      const result = createService().signUp({ email: "new@example.com", password: PASSWORD });

      await expect(result).rejects.toBeInstanceOf(ConflictException);
      await expect(result).rejects.toMatchObject({
        response: {
          message: "An account with this email already exists",
          reason: EMAIL_TAKEN_REASON,
        },
      });
      expect(verification.issueCode).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("passes other database errors on unchanged", async () => {
      const failure = new Error("connection lost");
      prisma.user.create.mockRejectedValue(failure);

      await expect(
        createService().signUp({ email: "new@example.com", password: PASSWORD }),
      ).rejects.toBe(failure);
    });

    it("still opens the session when the mail cannot be sent", async () => {
      prisma.user.create.mockResolvedValue(SIGNED_UP);
      verification.issueCode.mockRejectedValue(new Error("SMTP down"));

      const session = await createService().signUp({
        email: "new@example.com",
        password: PASSWORD,
      });

      expect(session.user).toEqual(SIGNED_UP);
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("signIn", () => {
    async function storedUser(): Promise<Record<string, unknown>> {
      return {
        id: "user-1",
        email: "user1@example.com",
        role: Role.USER,
        isVerified: true,
        firstName: "Una",
        lastName: "User",
        passwordHash: await hashPassword(PASSWORD),
        tokenVersion: 4,
      };
    }

    it("returns the user and both tokens, and stores only the hash of the refresh token", async () => {
      prisma.user.findUnique.mockResolvedValue(await storedUser());

      const session = await createService().signIn({
        email: "user1@example.com",
        password: PASSWORD,
      });

      expect(session.user).toEqual({
        id: "user-1",
        email: "user1@example.com",
        role: Role.USER,
        isVerified: true,
        firstName: "Una",
        lastName: "User",
      });
      await expect(tokens.verifyAccessToken(session.accessToken)).resolves.toEqual({
        userId: "user-1",
        tokenVersion: 4,
      });

      const [{ data }] = prisma.refreshToken.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(data["tokenHash"]).toBe(tokens.hashRefreshToken(session.refreshToken));
      expect(data["tokenHash"]).not.toBe(session.refreshToken);
      expect(data["userId"]).toBe("user-1");
      expect(data["expiresAt"]).toEqual(new Date(NOW.getTime() + REFRESH_TOKEN_TTL_MS));
      expect(data["familyId"]).toEqual(expect.any(String));
    });

    it("never returns the password hash", async () => {
      prisma.user.findUnique.mockResolvedValue(await storedUser());

      const { user } = await createService().signIn({
        email: "user1@example.com",
        password: PASSWORD,
      });

      expect(user).not.toHaveProperty("passwordHash");
    });

    it("finds the user by trimmed, lower-case email", async () => {
      prisma.user.findUnique.mockResolvedValue(await storedUser());

      await createService().signIn({ email: " User1@Example.COM ", password: PASSWORD });

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: "user1@example.com" } }),
      );
    });

    it("gives the same error for a wrong password and for an unknown email", async () => {
      const service = createService();
      prisma.user.findUnique.mockResolvedValueOnce(await storedUser());
      const wrongPassword = await service
        .signIn({ email: "user1@example.com", password: "Wrong-password1" })
        .catch((error: unknown) => error);

      prisma.user.findUnique.mockResolvedValueOnce(null);
      const unknownEmail = await service
        .signIn({ email: "nobody@example.com", password: PASSWORD })
        .catch((error: unknown) => error);

      expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
      expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
      expect((wrongPassword as Error).message).toBe("Invalid email or password");
      expect((unknownEmail as Error).message).toBe("Invalid email or password");
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    const hour = 60 * 60 * 1000;
    function stored(overrides: Record<string, unknown> = {}) {
      return {
        id: "token-1",
        userId: "user-1",
        familyId: "family-1",
        expiresAt: new Date(NOW.getTime() + hour),
        replacedAt: null,
        tokenVersion: 2,
        user: { tokenVersion: 2 },
        ...overrides,
      };
    }

    it("marks a fresh token as replaced and issues a new one in the same family", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(stored());
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await createService().refresh("old-token");

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: "token-1", replacedAt: null },
        data: { replacedAt: NOW },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          tokenHash: tokens.hashRefreshToken(result.refreshToken),
          familyId: "family-1",
          tokenVersion: 2,
          expiresAt: new Date(NOW.getTime() + REFRESH_TOKEN_TTL_MS),
        },
      });
      expect(result.refreshToken).not.toBe("old-token");
      await expect(tokens.verifyAccessToken(result.accessToken)).resolves.toEqual({
        userId: "user-1",
        tokenVersion: 2,
      });
    });

    it("lets a replaced token be used once inside the grace window", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        stored({ replacedAt: new Date(NOW.getTime() - REFRESH_GRACE_WINDOW_MS) }),
      );
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await createService().refresh("old-token");

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: "token-1", graceUsedAt: null },
        data: { graceUsedAt: NOW },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it("counts the loser of two parallel first uses as the grace use", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(stored());
      prisma.refreshToken.updateMany
        .mockResolvedValueOnce({ count: 0 }) // the other request replaced the token first
        .mockResolvedValueOnce({ count: 1 }); // the grace use is still free

      await createService().refresh("old-token");

      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it("deletes the whole family on a second use inside the grace window", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        stored({ replacedAt: new Date(NOW.getTime() - 1000) }),
      );
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 }); // the grace use is taken

      await expect(createService().refresh("old-token")).rejects.toThrow(UnauthorizedException);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { familyId: "family-1" },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("deletes the whole family of a token made before the last password change", async () => {
      // A refresh that ran during changePassword can create such a token after the change deleted the others.
      prisma.refreshToken.findUnique.mockResolvedValue(stored({ tokenVersion: 1 }));

      await expect(createService().refresh("old-token")).rejects.toThrow(UnauthorizedException);

      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { familyId: "family-1" },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("deletes the whole family when a replaced token is used after the grace window", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        stored({ replacedAt: new Date(NOW.getTime() - REFRESH_GRACE_WINDOW_MS - 1) }),
      );

      await expect(createService().refresh("old-token")).rejects.toThrow(UnauthorizedException);

      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { familyId: "family-1" },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it.each([
      ["without a token", undefined, null],
      ["for an unknown token", "unknown", null],
      ["for an expired token", "old-token", stored({ expiresAt: NOW })],
    ])("rejects %s", async (_name, token, row) => {
      prisma.refreshToken.findUnique.mockResolvedValue(row);

      await expect(createService().refresh(token)).rejects.toThrow(UnauthorizedException);

      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe("signOut", () => {
    it("revokes the whole family of the refresh token", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({ familyId: "family-1" });

      await createService().signOut("refresh-token");

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tokenHash: tokens.hashRefreshToken("refresh-token") } }),
      );
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { familyId: "family-1" },
      });
    });

    it("does nothing for an unknown token", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await createService().signOut("unknown");

      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it("does nothing without a token", async () => {
      await createService().signOut(undefined);

      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    const NEW_PASSWORD = "NewPassword456!";

    beforeEach(async () => {
      prisma.user.findUnique.mockResolvedValue({ passwordHash: await hashPassword(PASSWORD) });
      prisma.user.update.mockResolvedValue({ tokenVersion: 3 });
      // The transaction client is the same mock, so the calls inside it can be checked as usual.
      prisma.$transaction.mockImplementation((work: (tx: typeof prisma) => unknown) =>
        work(prisma),
      );
    });

    it("saves a hash of the new password and raises the token version in one transaction", async () => {
      await createService().changePassword("user-1", {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const [{ where, data }] = prisma.user.update.mock.calls[0] as [
        { where: unknown; data: { passwordHash: string; tokenVersion: unknown } },
      ];
      expect(where).toEqual({ id: "user-1" });
      expect(data.passwordHash).not.toContain(NEW_PASSWORD);
      expect(await verifyPassword(data.passwordHash, NEW_PASSWORD)).toBe(true);
      expect(data.tokenVersion).toEqual({ increment: 1 });
    });

    it("deletes every refresh token of the user and opens a new session with the new version", async () => {
      const session = await createService().changePassword("user-1", {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
      expect(prisma.refreshToken.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
        prisma.refreshToken.create.mock.invocationCallOrder[0] ?? 0,
      );
      const [{ data }] = prisma.refreshToken.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(data["tokenHash"]).toBe(tokens.hashRefreshToken(session.refreshToken));
      expect(data["familyId"]).toEqual(expect.any(String));
      await expect(tokens.verifyAccessToken(session.accessToken)).resolves.toEqual({
        userId: "user-1",
        tokenVersion: 3,
      });
    });

    it("answers BAD_USER_INPUT with the reason CURRENT_PASSWORD_INCORRECT and changes nothing", async () => {
      const result = createService().changePassword("user-1", {
        currentPassword: "Wrong-password1",
        newPassword: NEW_PASSWORD,
      });

      await expect(result).rejects.toBeInstanceOf(BadRequestException);
      await expect(result).rejects.toMatchObject({
        response: { reason: CURRENT_PASSWORD_INCORRECT_REASON },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it("answers BAD_USER_INPUT with the reason NEW_PASSWORD_SAME when nothing would change", async () => {
      const result = createService().changePassword("user-1", {
        currentPassword: PASSWORD,
        newPassword: PASSWORD,
      });

      await expect(result).rejects.toBeInstanceOf(BadRequestException);
      await expect(result).rejects.toMatchObject({
        response: { reason: NEW_PASSWORD_SAME_REASON },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("checks the current password before comparing it with the new one", async () => {
      // A wrong guess typed twice must not get a different answer than any other wrong guess.
      const result = createService().changePassword("user-1", {
        currentPassword: "Wrong-password1",
        newPassword: "Wrong-password1",
      });

      await expect(result).rejects.toMatchObject({
        response: { reason: CURRENT_PASSWORD_INCORRECT_REASON },
      });
    });

    it("ends the session when the user no longer exists", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        createService().changePassword("gone", {
          currentPassword: PASSWORD,
          newPassword: NEW_PASSWORD,
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("findAuthUser", () => {
    it("returns the id, role and verification of an existing user", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "u", role: Role.ADMIN, isVerified: false });

      await expect(createService().findAuthUser("u", 0)).resolves.toEqual({
        id: "u",
        role: Role.ADMIN,
        isVerified: false,
      });
    });

    it("matches the token version too, so a token from before a password change finds no one", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(createService().findAuthUser("u", 1)).resolves.toBeUndefined();
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u", tokenVersion: 1 } }),
      );
    });

    it("returns undefined when the user no longer exists", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(createService().findAuthUser("gone", 0)).resolves.toBeUndefined();
    });
  });

  describe("findSessionUser", () => {
    it("returns null when the user no longer exists", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(createService().findSessionUser("gone")).resolves.toBeNull();
    });
  });
});
