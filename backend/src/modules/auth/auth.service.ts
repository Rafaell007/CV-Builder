import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { AuthUser } from "../../common/auth";
import { Clock } from "../../common/clock";
import { PrismaService } from "../../prisma/prisma.service";
import type { SignInInput } from "./dto/sign-in.input";
import type { SessionUser } from "./models/session-user";
import { hashPassword, verifyPassword } from "./password";
import { REFRESH_TOKEN_TTL_MS, TokenService } from "./token.service";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SignedInSession extends SessionTokens {
  user: SessionUser;
}

/** How long a replaced refresh token still works, so that parallel requests do not sign the user out (D21). */
export const REFRESH_GRACE_WINDOW_MS = 30 * 1000;

const SESSION_ENDED = "Session ended, sign in again";

export const SESSION_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  isVerified: true,
  firstName: true,
  lastName: true,
} as const;

@Injectable()
export class AuthService {
  // Checked when the email is unknown, so that "no such user" takes as long as "wrong password".
  private unknownUserHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
  ) {}

  /** Checks the credentials and opens a session. The error never says which of the two was wrong. */
  async signIn({ email, password }: SignInInput): Promise<SignedInSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { ...SESSION_USER_SELECT, passwordHash: true },
    });

    const passwordMatches = await verifyPassword(
      user?.passwordHash ?? (await this.getUnknownUserHash()),
      password,
    );
    if (user === null || !passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Built field by field, so the password hash can never leave this method.
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    // a new sign-in starts a new family of refresh tokens (D21)
    const tokens = await this.issueTokens(user.id, randomUUID());

    return { user: sessionUser, ...tokens };
  }

  /**
   * Swaps a refresh token for a new pair of tokens (D21).
   * - A token that was never used is marked as replaced.
   * - A replaced token works once more inside `REFRESH_GRACE_WINDOW_MS`, for a parallel request.
   * - A replaced token used after that window, or a second time inside it, means the token may be
   *   stolen: the whole family is deleted.
   */
  async refresh(refreshToken: string | undefined): Promise<SessionTokens> {
    if (refreshToken === undefined) throw new UnauthorizedException(SESSION_ENDED);

    const now = this.clock.now();
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.tokens.hashRefreshToken(refreshToken) },
      select: { id: true, userId: true, familyId: true, expiresAt: true, replacedAt: true },
    });
    if (stored === null || stored.expiresAt <= now) throw new UnauthorizedException(SESSION_ENDED);

    if (stored.replacedAt === null) {
      // Only one of two parallel requests can change the row; the other one gets `count: 0`
      // and is the grace use below.
      const { count } = await this.prisma.refreshToken.updateMany({
        where: { id: stored.id, replacedAt: null },
        data: { replacedAt: now },
      });
      if (count === 1) return this.issueTokens(stored.userId, stored.familyId);
    } else if (now.getTime() - stored.replacedAt.getTime() > REFRESH_GRACE_WINDOW_MS) {
      return this.revokeFamily(stored.familyId);
    }

    // The grace use: allowed once per token, and the same race rule decides which request gets it.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, graceUsedAt: null },
      data: { graceUsedAt: now },
    });
    if (count === 0) return this.revokeFamily(stored.familyId);
    return this.issueTokens(stored.userId, stored.familyId);
  }

  /** Ends the session of this refresh token on this server. An unknown or missing token is not an error. */
  async signOut(refreshToken: string | undefined): Promise<void> {
    if (refreshToken === undefined) return;

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.tokens.hashRefreshToken(refreshToken) },
      select: { familyId: true },
    });
    if (stored !== null) {
      await this.prisma.refreshToken.deleteMany({ where: { familyId: stored.familyId } });
    }
  }

  /** What the guards need, read fresh so a changed role or a deleted user takes effect at once. */
  async findAuthUser(userId: string): Promise<AuthUser | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isVerified: true },
    });
    return user ?? undefined;
  }

  async findSessionUser(userId: string): Promise<SessionUser | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, select: SESSION_USER_SELECT });
  }

  private async revokeFamily(familyId: string): Promise<never> {
    await this.prisma.refreshToken.deleteMany({ where: { familyId } });
    throw new UnauthorizedException(SESSION_ENDED);
  }

  private async issueTokens(userId: string, familyId: string): Promise<SessionTokens> {
    const refreshToken = this.tokens.createRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.tokens.hashRefreshToken(refreshToken),
        familyId,
        expiresAt: new Date(this.clock.now().getTime() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return { accessToken: await this.tokens.signAccessToken(userId), refreshToken };
  }

  private getUnknownUserHash(): Promise<string> {
    this.unknownUserHash ??= hashPassword(randomUUID());
    return this.unknownUserHash;
  }
}
