import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Clock } from "../../common/clock";
import type { Environment } from "../../config";
import { Role } from "../../generated/prisma/enums";
import type { PrismaService } from "../../prisma/prisma.service";
import { AuthService, REFRESH_GRACE_WINDOW_MS } from "./auth.service";
import { hashPassword } from "./password";
import { REFRESH_TOKEN_TTL_MS, TokenService } from "./token.service";

const NOW = new Date("2026-07-12T10:00:00.000Z");
const PASSWORD = "Password123!";

const prisma = {
  user: { findUnique: jest.fn() },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const config = new ConfigService<Environment, true>({
  JWT_ACCESS_SECRET: "unit-test-access-secret-0123456789abc",
  JWT_REFRESH_SECRET: "unit-test-refresh-secret-0123456789ab",
});
const tokens = new TokenService(new JwtService(), config);
const clock: Clock = { now: () => NOW };

function createService(): AuthService {
  return new AuthService(prisma as unknown as PrismaService, tokens, clock);
}

describe("AuthService", () => {
  beforeEach(() => jest.resetAllMocks());

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
      await expect(tokens.verifyAccessToken(session.accessToken)).resolves.toBe("user-1");

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
          expiresAt: new Date(NOW.getTime() + REFRESH_TOKEN_TTL_MS),
        },
      });
      expect(result.refreshToken).not.toBe("old-token");
      await expect(tokens.verifyAccessToken(result.accessToken)).resolves.toBe("user-1");
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

  describe("findAuthUser", () => {
    it("returns the id, role and verification of an existing user", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "u", role: Role.ADMIN, isVerified: false });

      await expect(createService().findAuthUser("u")).resolves.toEqual({
        id: "u",
        role: Role.ADMIN,
        isVerified: false,
      });
    });

    it("returns undefined when the user no longer exists", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(createService().findAuthUser("gone")).resolves.toBeUndefined();
    });
  });

  describe("findSessionUser", () => {
    it("returns null when the user no longer exists", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(createService().findSessionUser("gone")).resolves.toBeNull();
    });
  });
});
