import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHmac, randomBytes } from "node:crypto";
import type { Environment } from "../../../config";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ALGORITHM = "HS256";

/** Creates and checks the two tokens of a session (D9). Knows nothing about cookies or the database. */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  /** A signed JWT that holds the user id and the user's token version. Role and verification are read fresh on every request. */
  signAccessToken(userId: string, tokenVersion: number): Promise<string> {
    return this.jwt.signAsync(
      { tokenVersion },
      {
        subject: userId,
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        algorithm: ALGORITHM,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      },
    );
  }

  /** The user id and token version inside a valid, unexpired access token. `undefined` for anything else. */
  async verifyAccessToken(
    token: string,
  ): Promise<{ userId: string; tokenVersion: number } | undefined> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown; tokenVersion?: unknown }>(token, {
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        algorithms: [ALGORITHM], // never trust the algorithm named in the token itself
      });
      if (typeof payload.sub !== "string" || typeof payload.tokenVersion !== "number") {
        return undefined;
      }
      return { userId: payload.sub, tokenVersion: payload.tokenVersion };
    } catch {
      return undefined; // bad signature, expired or malformed
    }
  }

  /** A random opaque token. It is useless without the matching hash in the database. */
  createRefreshToken(): string {
    return randomBytes(32).toString("base64url");
  }

  /** The value stored in the database. Keyed with the refresh secret, so a leaked table cannot be used to sign in. */
  hashRefreshToken(token: string): string {
    return createHmac("sha256", this.config.get("JWT_REFRESH_SECRET", { infer: true }))
      .update(token)
      .digest("hex");
  }
}
