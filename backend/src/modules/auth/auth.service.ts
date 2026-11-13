import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { AuthUser } from "../../common/auth";
import { Clock } from "../../common/clock";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { SignInInput } from "./dto/sign-in.input";
import type { SignUpInput } from "./dto/sign-up.input";
import type { SessionUser } from "./models/session-user";
import { SESSION_USER_SELECT } from "./models/session-user.select";
import { hashPassword, verifyPassword } from "./password";
import { REFRESH_TOKEN_TTL_MS, TokenService } from "./sessions/token.service";
import { VerificationService } from "./verification/verification.service";

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

/** `extensions.reason` of the `CONFLICT` error of `signUp`. The frontend shows its own message for it. */
export const EMAIL_TAKEN_REASON = "EMAIL_TAKEN";

@Injectable()
export class AuthService {
  // Checked when the email is unknown, so that "no such user" takes as long as "wrong password".
  private unknownUserHash?: Promise<string>;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
    private readonly verification: VerificationService,
  ) {}

  /**
   * Creates an unverified user with the default role, mails the first verification code and opens a session.
   * The unique index on `email` decides between two parallel requests; the loser gets `CONFLICT`.
   */
  async signUp({ email, password }: SignUpInput): Promise<SignedInSession> {
    const passwordHash = await hashPassword(password);

    let user: SessionUser;
    try {
      // `role` and `isVerified` are not passed: the database defaults are `USER` and `false`.
      user = await this.prisma.user.create({
        data: { email: email.trim().toLowerCase(), passwordHash },
        select: SESSION_USER_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException({
          message: "An account with this email already exists",
          reason: EMAIL_TAKEN_REASON,
        });
      }
      throw error;
    }

    try {
      await this.verification.issueCode(user);
    } catch (error) {
      // The account exists, so sign-up still works. The user can ask for a new code on the verification page.
      this.logger.warn(
        `Could not send the first verification code to user ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return { user, ...(await this.issueTokens(user.id, randomUUID())) };
  }

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
