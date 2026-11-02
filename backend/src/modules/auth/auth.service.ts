import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { AuthUser } from "../../common/auth";
import { Clock } from "../../common/clock";
import { PrismaService } from "../../prisma/prisma.service";
import type { SignInInput } from "./dto/sign-in.input";
import type { SessionUser } from "./models/session-user";
import { hashPassword, verifyPassword } from "./password";
import { REFRESH_TOKEN_TTL_MS, TokenService } from "./token.service";

export interface SignedInSession {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

const SESSION_USER_SELECT = {
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
    const refreshToken = this.tokens.createRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.tokens.hashRefreshToken(refreshToken),
        familyId: randomUUID(), // a new sign-in starts a new family of refresh tokens (D21)
        expiresAt: new Date(this.clock.now().getTime() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      user: sessionUser,
      accessToken: await this.tokens.signAccessToken(user.id),
      refreshToken,
    };
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

  private getUnknownUserHash(): Promise<string> {
    this.unknownUserHash ??= hashPassword(randomUUID());
    return this.unknownUserHash;
  }
}
