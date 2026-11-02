import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Environment } from "../../config";
import { ACCESS_TOKEN_TTL_SECONDS, TokenService } from "./token.service";

const SECRETS = {
  JWT_ACCESS_SECRET: "unit-test-access-secret-0123456789abc",
  JWT_REFRESH_SECRET: "unit-test-refresh-secret-0123456789ab",
};

function createService(secrets: Partial<typeof SECRETS> = {}): TokenService {
  const config = new ConfigService<Environment, true>({ ...SECRETS, ...secrets });
  return new TokenService(new JwtService(), config);
}

describe("TokenService", () => {
  describe("access token", () => {
    it("carries the user id and lasts 15 minutes", async () => {
      const service = createService();
      const token = await service.signAccessToken("user-1");

      const payload = new JwtService().decode<{ sub: string; iat: number; exp: number }>(token);
      expect(payload.sub).toBe("user-1");
      expect(payload.exp - payload.iat).toBe(ACCESS_TOKEN_TTL_SECONDS);
      await expect(service.verifyAccessToken(token)).resolves.toBe("user-1");
    });

    it("rejects a token signed with another secret", async () => {
      const token = await createService({ JWT_ACCESS_SECRET: "x".repeat(32) }).signAccessToken("u");

      await expect(createService().verifyAccessToken(token)).resolves.toBeUndefined();
    });

    it("rejects an expired token", async () => {
      const token = await new JwtService().signAsync(
        {},
        { subject: "user-1", secret: SECRETS.JWT_ACCESS_SECRET, expiresIn: -10 },
      );

      await expect(createService().verifyAccessToken(token)).resolves.toBeUndefined();
    });

    it("rejects a token that has no signature", async () => {
      const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
      const body = Buffer.from(JSON.stringify({ sub: "user-1" })).toString("base64url");

      await expect(
        createService().verifyAccessToken(`${header}.${body}.`),
      ).resolves.toBeUndefined();
    });

    it("rejects a token without a user id", async () => {
      const token = await new JwtService().signAsync(
        {},
        { secret: SECRETS.JWT_ACCESS_SECRET, expiresIn: 60 },
      );

      await expect(createService().verifyAccessToken(token)).resolves.toBeUndefined();
    });

    it("rejects text that is not a token", async () => {
      await expect(createService().verifyAccessToken("garbage")).resolves.toBeUndefined();
    });
  });

  describe("refresh token", () => {
    it("creates a different long random token every time", () => {
      const service = createService();
      const first = service.createRefreshToken();

      expect(first.length).toBeGreaterThanOrEqual(43); // 32 bytes in base64url
      expect(first).not.toBe(service.createRefreshToken());
    });

    it("hashes the same token to the same value, which is not the token", () => {
      const service = createService();
      const token = service.createRefreshToken();

      expect(service.hashRefreshToken(token)).toBe(service.hashRefreshToken(token));
      expect(service.hashRefreshToken(token)).not.toContain(token);
    });

    it("hashes differently with another refresh secret", () => {
      const other = createService({ JWT_REFRESH_SECRET: "y".repeat(32) });

      expect(other.hashRefreshToken("t")).not.toBe(createService().hashRefreshToken("t"));
    });
  });
});
