import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../../config";
import type { AuthRequest, CookieResponse } from "../auth-context";
import { readCookie } from "./parse-cookies";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_MS } from "./token.service";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

/** Writes and reads the two httpOnly session cookies (D9). JavaScript in the browser cannot read them. */
@Injectable()
export class SessionCookiesService {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  set(response: CookieResponse, tokens: { accessToken: string; refreshToken: string }): void {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.baseOptions(),
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.baseOptions(),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  clear(response: CookieResponse): void {
    response.clearCookie(ACCESS_COOKIE, this.baseOptions());
    response.clearCookie(REFRESH_COOKIE, this.baseOptions());
  }

  readAccessToken(request: AuthRequest): string | undefined {
    return readCookie(request.headers.cookie, ACCESS_COOKIE);
  }

  readRefreshToken(request: AuthRequest): string | undefined {
    return readCookie(request.headers.cookie, REFRESH_COOKIE);
  }

  private baseOptions(): {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: string;
  } {
    return {
      httpOnly: true,
      secure: this.config.get("NODE_ENV", { infer: true }) === "production",
      sameSite: "lax", // sent on normal navigation, not on cross-site requests (CSRF)
      path: "/",
    };
  }
}
