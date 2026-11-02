import type { AuthUser } from "../../common/auth";

/** The part of the Express response that the auth module uses. Express provides it; tests can fake it. */
export interface CookieResponse {
  cookie(
    name: string,
    value: string,
    options: { httpOnly: boolean; secure: boolean; sameSite: "lax"; path: string; maxAge: number },
  ): unknown;
  clearCookie(
    name: string,
    options: { httpOnly: boolean; secure: boolean; sameSite: "lax"; path: string },
  ): unknown;
}

/** The part of the Express request that the auth module uses. `user` is set by `JwtAuthGuard`. */
export interface AuthRequest {
  headers: { cookie?: string };
  user?: AuthUser;
}

/** The GraphQL context built in `AppModule`. */
export interface AuthContext {
  req: AuthRequest;
  res: CookieResponse;
}
